package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.dto.ProviderStatusDto;
import com.interviewos.ai.model.ModelProvider;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Honest provider availability probe and status tracker for GET /api/v1/ai/providers/status.
 * Zero inference tokens spent: relies on Tier-0 config, Tier-1 free /models list probes, and Tier-2 memory.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProviderStatusService {

    private final AiProviderProperties providerProperties;
    private final ObjectMapper objectMapper;
    private static final long CACHE_TTL_MS = 60_000L;
    private final Map<String, ProviderStatusDto> cache = new ConcurrentHashMap<>();
    private final Map<String, ProviderStatusDto.LastKnownResult> lastKnownMap = new ConcurrentHashMap<>();
    private RestClient restClient;

    @PostConstruct
    public void init() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(4));
        factory.setReadTimeout(Duration.ofSeconds(6));
        this.restClient = RestClient.builder().requestFactory(factory).build();
        try { refresh(); } catch (Exception e) { log.debug("Initial providers/status probe notice: {}", e.getMessage()); }
    }

    public void setRestClient(RestClient client) { this.restClient = client; }

    public List<ProviderStatusDto> getProvidersStatus(String byokKey, String targetProvider) {
        long now = System.currentTimeMillis();
        List<ProviderStatusDto> result = new ArrayList<>();
        for (String p : List.of("GEMINI", "GROQ", "OPENAI", "OLLAMA")) {
            if (p.equalsIgnoreCase(targetProvider) && byokKey != null && !byokKey.isBlank()) {
                result.add(probeProvider(p, byokKey.trim(), "BYOK", now));
            } else {
                ProviderStatusDto cached = cache.get(p);
                if (cached != null && (now - cached.checkedAt()) < CACHE_TTL_MS) {
                    result.add(attachLastKnown(cached));
                } else {
                    ProviderStatusDto fresh = probeProvider(p, null, null, now);
                    cache.put(p, fresh);
                    result.add(attachLastKnown(fresh));
                }
            }
        }
        return result;
    }

    public List<ProviderStatusDto> refresh() {
        long now = System.currentTimeMillis();
        cache.clear();
        List<ProviderStatusDto> result = new ArrayList<>();
        for (String p : List.of("GEMINI", "GROQ", "OPENAI", "OLLAMA")) {
            ProviderStatusDto fresh = probeProvider(p, null, null, now);
            cache.put(p, fresh);
            result.add(attachLastKnown(fresh));
        }
        return result;
    }

    public void recordOutcome(ModelProvider provider, String outcome, Integer httpStatus) {
        if (provider == null) return;
        String key = provider.name().toUpperCase();
        lastKnownMap.put(key, new ProviderStatusDto.LastKnownResult(outcome, httpStatus, System.currentTimeMillis()));
        if ("ERROR".equalsIgnoreCase(outcome)) cache.remove(key);
    }

    private ProviderStatusDto attachLastKnown(ProviderStatusDto dto) {
        ProviderStatusDto.LastKnownResult last = lastKnownMap.get(dto.provider());
        return last == null ? dto : new ProviderStatusDto(
                dto.provider(), dto.configPresent(), dto.keySource(), dto.state(),
                dto.configuredModel(), dto.modelListed(), dto.reason(), last, dto.checkedAt());
    }

    public ProviderStatusDto probeProvider(String provider, String overrideKey, String overrideSource, long now) {
        ModelProvider mp;
        try { mp = ModelProvider.valueOf(provider.toUpperCase()); } catch (Exception e) { mp = null; }
        AiProviderProperties.ProviderConfig cfg = mp != null ? providerProperties.getConfigFor(mp) : null;

        if ("OLLAMA".equalsIgnoreCase(provider)) {
            boolean running = isOllamaRunning();
            String model = cfg != null && cfg.defaultModel() != null ? cfg.defaultModel() : "qwen2.5-coder:7b";
            return running ? new ProviderStatusDto("OLLAMA", true, "NONE", "READY", model, true, null, null, now)
                    : new ProviderStatusDto("OLLAMA", true, "NONE", "UNREACHABLE", model, null, "Provider unreachable from host", null, now);
        }

        String key = overrideKey;
        String source = overrideSource;
        if (key == null || key.isBlank()) {
            if (cfg != null && cfg.apiKey() != null && !cfg.apiKey().isBlank()) {
                key = cfg.apiKey().trim(); source = "ENV";
            } else {
                String envVal = System.getenv(provider.toUpperCase() + "_API_KEY");
                if (envVal == null && "GEMINI".equalsIgnoreCase(provider)) envVal = System.getenv("GEMINI_KEY");
                if (envVal != null && !envVal.isBlank()) { key = envVal.trim(); source = "ENV"; }
            }
        }

        String model = cfg != null && cfg.defaultModel() != null ? cfg.defaultModel() : defaultFallbackModel(provider);
        if (key == null || key.isBlank()) {
            return new ProviderStatusDto(provider, cfg != null, "NONE", "NOT_CONFIGURED", model, null,
                    "NOT_CONFIGURED — paste key or set " + provider.toUpperCase() + "_API_KEY env", null, now);
        }

        try {
            Set<String> models = fetchModelList(provider, key);
            boolean listed = models.contains(model) || models.contains("models/" + model);
            if (listed) {
                return new ProviderStatusDto(provider, true, source, "READY", model, true, null, null, now);
            }
            if ("GEMINI".equalsIgnoreCase(provider)) {
                log.warn("Configured Gemini model {} not offered by models.list — sessions on GEMINI will fail", model);
            }
            return new ProviderStatusDto(provider, true, source, "ERROR", model, false,
                    "Model retired — set AI_PROVIDERS_" + provider.toUpperCase() + "_DEFAULT-MODEL to an available model", null, now);
        } catch (RestClientResponseException rce) {
            int st = rce.getStatusCode().value();
            String reason = switch (st) {
                case 401 -> "Key invalid or expired — paste a new key";
                case 403 -> "Key lacks permission / billing not active on this project";
                case 429 -> "Quota or rate limit exhausted — upgrade billing plan or retry later";
                default -> (rce.getResponseBodyAsString() != null && rce.getResponseBodyAsString().contains("API_KEY_INVALID"))
                        ? "Key invalid or expired — paste a new key" : "Key invalid or expired — paste a new key";
            };
            return new ProviderStatusDto(provider, true, source, "ERROR", model, null, reason, null, now);
        } catch (ResourceAccessException rae) {
            return new ProviderStatusDto(provider, true, source, "UNREACHABLE", model, null, "Provider unreachable from host", null, now);
        } catch (Exception ex) {
            return new ProviderStatusDto(provider, true, source, "ERROR", model, null, ex.getMessage(), null, now);
        }
    }

    private boolean isOllamaRunning() {
        try {
            var cfg = providerProperties.getConfigFor(ModelProvider.OLLAMA);
            String endpoint = (cfg != null && cfg.endpoint() != null) ? cfg.endpoint() : "http://host.docker.internal:11434/api/generate";
            String base = endpoint.replace("/api/generate", "");
            if (base.contains("host.docker.internal") && !new java.io.File("/.dockerenv").exists()) base = base.replace("host.docker.internal", "localhost");
            HttpURLConnection conn = (HttpURLConnection) URI.create(base + "/api/tags").toURL().openConnection();
            conn.setRequestMethod("GET"); conn.setConnectTimeout(800); conn.setReadTimeout(800);
            return conn.getResponseCode() == 200;
        } catch (Exception e) { return false; }
    }

    private Set<String> fetchModelList(String provider, String key) throws Exception {
        Set<String> set = new HashSet<>();
        String url = "GEMINI".equalsIgnoreCase(provider) ? "https://generativelanguage.googleapis.com/v1beta/models?key=" + key
                : ("GROQ".equalsIgnoreCase(provider) ? "https://api.groq.com/openai/v1/models" : "https://api.openai.com/v1/models");
        var spec = restClient.get().uri(url);
        if (!"GEMINI".equalsIgnoreCase(provider)) spec.header(HttpHeaders.AUTHORIZATION, "Bearer " + key);
        JsonNode root = objectMapper.readTree(spec.retrieve().body(String.class));
        JsonNode arr = root.path("GEMINI".equalsIgnoreCase(provider) ? "models" : "data");
        if (arr.isArray()) {
            for (JsonNode item : arr) {
                String id = item.path("GEMINI".equalsIgnoreCase(provider) ? "name" : "id").asText("");
                set.add(id);
                if (id.startsWith("models/")) set.add(id.substring(7));
            }
        }
        return set;
    }

    private String defaultFallbackModel(String provider) {
        if ("GEMINI".equalsIgnoreCase(provider)) return "gemini-3.5-flash";
        if ("GROQ".equalsIgnoreCase(provider)) return "openai/gpt-oss-120b";
        return "gpt-4o-mini";
    }
}
