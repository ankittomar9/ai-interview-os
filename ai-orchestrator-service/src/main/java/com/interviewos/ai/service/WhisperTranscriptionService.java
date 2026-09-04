package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.SessionTranscriptClient;
import com.interviewos.ai.dto.TranscriptTurnDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhisperTranscriptionService {

    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;
    private final EgressTracker egressTracker;
    private final SessionTranscriptClient sessionTranscriptClient;

    @Value("${ai.providers.groq.api-key:${GROQ_API_KEY:}}")
    private String defaultGroqApiKey;

    @Value("${ai.whisper.local-endpoint:${WHISPER_ENDPOINT:http://localhost:8178/inference}}")
    private String localWhisperEndpoint;

    @Value("${ai.providers.groq.stt-model:${GROQ_MODEL_STT:whisper-large-v3-turbo}}")
    private String configuredGroqSttModel;

    private static final String GROQ_WHISPER_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String DEFAULT_WHISPER_MODEL = "whisper-large-v3-turbo";

    public String assemblePrompt(String promptContext, Long sessionId) {
        StringBuilder sb = new StringBuilder();
        if (promptContext != null && !promptContext.isBlank()) {
            sb.append(promptContext.trim());
        }
        if (sessionId != null && sessionTranscriptClient != null) {
            try {
                List<TranscriptTurnDto> turns = sessionTranscriptClient.fetchSessionTranscript(sessionId);
                if (turns != null && !turns.isEmpty()) {
                    int start = Math.max(0, turns.size() - 2);
                    for (int i = start; i < turns.size(); i++) {
                        TranscriptTurnDto turn = turns.get(i);
                        String content = turn.content();
                        if (content != null && !content.isBlank()) {
                            String clean = content.replaceAll("[\\r\\n]+", " ")
                                                  .replaceAll("[*_#`]", "")
                                                  .replaceAll("\\s+", " ")
                                                  .trim();
                            if (!clean.isEmpty()) {
                                if (sb.length() > 0) sb.append("; ");
                                sb.append(clean);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("⚠️ Failed to fetch session transcript for prompt biasing (sessionId={}): {}", sessionId, e.getMessage());
            }
        }
        String fullPrompt = sb.toString().trim();
        if (fullPrompt.length() > 400) {
            fullPrompt = fullPrompt.substring(0, 400);
        }
        return fullPrompt;
    }

    /**
     * Transcribes candidate audio using local Whisper.cpp if available, falling back to Groq Whisper LPU.
     */
    public Map<String, String> transcribeAudio(MultipartFile audioFile, String customApiKey, String customModel) {
        return transcribeAudio(audioFile, customApiKey, customModel, null, null, "en");
    }

    public Map<String, String> transcribeAudio(MultipartFile audioFile, String customApiKey, String customModel,
                                              String promptContext, Long sessionId, String lang) {
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang.trim() : "en";
        String prompt = assemblePrompt(promptContext, sessionId);

        if (isWhisperSidecarRunning()) {
            log.info("🔒 Transcribing speech via 100% Local Whisper.cpp sidecar at {} (promptLength={}, lang={})",
                    localWhisperEndpoint, prompt.length(), effectiveLang);
            return transcribeLocal(audioFile, prompt, effectiveLang);
        }

        String apiKey = (customApiKey != null && !customApiKey.isBlank()) ? customApiKey : defaultGroqApiKey;
        if (apiKey == null || apiKey.isBlank()) {
            String envKey = System.getenv("GROQ_API_KEY");
            if (envKey != null && !envKey.isBlank()) {
                apiKey = envKey.trim();
            }
        }
        String fallbackModel = (configuredGroqSttModel != null && !configuredGroqSttModel.isBlank())
                ? configuredGroqSttModel : DEFAULT_WHISPER_MODEL;
        String model = (customModel != null && !customModel.isBlank()) ? customModel : fallbackModel;

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("⚠️ No local Whisper.cpp running and no Groq API Key provided for Whisper transcription.");
            return Map.of("text", "", "status", "MISSING_API_KEY", "message", "No STT provider available. Start Whisper sidecar or provide GROQ_API_KEY.");
        }

        egressTracker.recordCloudCall("GROQ_WHISPER");

        try {
            long startTime = System.currentTimeMillis();
            String fileName = (audioFile.getOriginalFilename() != null && !audioFile.getOriginalFilename().isBlank())
                    ? audioFile.getOriginalFilename() : "candidate_speech.webm";

            ByteArrayResource audioResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", audioResource);
            body.add("model", model);
            body.add("language", effectiveLang);
            body.add("response_format", "json");
            if (!prompt.isBlank()) {
                body.add("prompt", prompt);
            }

            RestClient restClient = restClientBuilder.build();

            String rawResponse = restClient.post()
                    .uri(GROQ_WHISPER_ENDPOINT)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawResponse);
            String transcript = root.path("text").asText("");
            long duration = System.currentTimeMillis() - startTime;

            log.info("🎙️ Groq Whisper Transcribed using model '{}' ({}ms): \"{}\"", model, duration, transcript);
            return Map.of(
                    "text", transcript,
                    "status", "SUCCESS",
                    "latencyMs", String.valueOf(duration),
                    "model", model,
                    "provider", "GROQ",
                    "promptUsed", String.valueOf(!prompt.isBlank())
            );

        } catch (Exception e) {
            log.error("⚠️ Groq Whisper transcription error: {}", e.getMessage(), e);
            return Map.of("text", "", "status", "ERROR", "message", e.getMessage());
        }
    }

    public boolean isWhisperSidecarRunning() {
        if (localWhisperEndpoint == null || localWhisperEndpoint.isBlank()) {
            return false;
        }
        try {
            String healthUrl = localWhisperEndpoint.replace("/inference", "") + "/health";
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) java.net.URI.create(healthUrl).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(800);
            conn.setReadTimeout(800);
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, String> transcribeLocal(MultipartFile audioFile, String prompt, String lang) {
        long startTime = System.currentTimeMillis();
        try {
            String originalName = audioFile.getOriginalFilename();
            String uploadName = (originalName != null && originalName.endsWith(".wav")) ? "speech.wav" : "candidate_speech.webm";

            ByteArrayResource audioResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return uploadName;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", audioResource);
            if (prompt != null && !prompt.isBlank()) {
                body.add("prompt", prompt);
            }
            body.add("language", (lang != null && !lang.isBlank()) ? lang : "en");
            body.add("temperature", "0");
            body.add("response_format", "json");

            RestClient restClient = restClientBuilder.build();
            String rawResponse = restClient.post()
                    .uri(localWhisperEndpoint)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawResponse);
            String text = root.has("text") ? root.path("text").asText("") : "";
            long duration = System.currentTimeMillis() - startTime;

            log.info("🔒 Local Whisper.cpp Transcribed ({}ms): \"{}\"", duration, text);
            return Map.of(
                    "text", text,
                    "status", "SUCCESS",
                    "latencyMs", String.valueOf(duration),
                    "provider", "WHISPER_CPP_LOCAL",
                    "promptUsed", String.valueOf(prompt != null && !prompt.isBlank())
            );
        } catch (Exception e) {
            log.error("⚠️ Local Whisper.cpp transcription error: {}", e.getMessage(), e);
            return Map.of("text", "", "status", "LOCAL_STT_ERROR", "message", e.getMessage());
        }
    }
}
