package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.dto.ProviderStatusDto;
import com.interviewos.ai.model.ModelProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ProviderStatusServiceTest {

    private AiProviderProperties props;
    private ObjectMapper objectMapper;
    private ProviderStatusService service;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        props = new AiProviderProperties(Map.of(
                "gemini", new AiProviderProperties.ProviderConfig("https://mock/models/", "gemini-3.5-flash", null, null, null, null, "test-key"),
                "groq", new AiProviderProperties.ProviderConfig("https://mock/models", "openai/gpt-oss-120b", null, null, null, null, "test-key"),
                "openai", new AiProviderProperties.ProviderConfig("https://mock/models", "gpt-4o-mini", null, null, null, null, "")
        ));
        service = new ProviderStatusService(props, objectMapper);
    }

    private RestClient createMockClient(Throwable toThrow, String responseBody) {
        RestClient client = mock(RestClient.class);
        RestClient.RequestHeadersUriSpec uriSpec = mock(RestClient.RequestHeadersUriSpec.class);
        RestClient.RequestHeadersSpec headersSpec = mock(RestClient.RequestHeadersSpec.class);
        RestClient.ResponseSpec responseSpec = mock(RestClient.ResponseSpec.class);

        when(client.get()).thenReturn(uriSpec);
        when(uriSpec.uri(anyString())).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), any(String[].class))).thenReturn(headersSpec);
        when(headersSpec.header(anyString(), anyString())).thenReturn(headersSpec);
        when(headersSpec.retrieve()).thenReturn(responseSpec);

        if (toThrow != null) {
            when(responseSpec.body(String.class)).thenThrow(toThrow);
        } else {
            when(responseSpec.body(String.class)).thenReturn(responseBody);
        }
        return client;
    }

    @Test
    @DisplayName("Maps HTTP 401 to actionable key invalid error")
    void test401Mapping() {
        RestClient mockClient = createMockClient(
                HttpClientErrorException.create(HttpStatusCode.valueOf(401), "Unauthorized", HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8),
                null
        );
        service.setRestClient(mockClient);
        ProviderStatusDto status = service.probeProvider("GEMINI", "bad-key", "BYOK", System.currentTimeMillis());

        assertEquals("ERROR", status.state());
        assertEquals("Key invalid or expired — paste a new key", status.reason());
    }

    @Test
    @DisplayName("Maps HTTP 429 to quota exhausted error")
    void test429Mapping() {
        RestClient mockClient = createMockClient(
                HttpClientErrorException.create(HttpStatusCode.valueOf(429), "Too Many Requests", HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8),
                null
        );
        service.setRestClient(mockClient);
        ProviderStatusDto status = service.probeProvider("GROQ", "test-key", "ENV", System.currentTimeMillis());

        assertEquals("ERROR", status.state());
        assertEquals("Quota or rate limit exhausted — upgrade billing plan or retry later", status.reason());
    }

    @Test
    @DisplayName("Maps HTTP 403 to billing lacks permission error")
    void test403Mapping() {
        RestClient mockClient = createMockClient(
                HttpClientErrorException.create(HttpStatusCode.valueOf(403), "Forbidden", HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8),
                null
        );
        service.setRestClient(mockClient);
        ProviderStatusDto status = service.probeProvider("GEMINI", "test-key", "ENV", System.currentTimeMillis());

        assertEquals("ERROR", status.state());
        assertEquals("Key lacks permission / billing not active on this project", status.reason());
    }

    @Test
    @DisplayName("Detects modelListed=false when configuredModel is not in models list")
    void testModelRetiredPath() {
        RestClient mockClient = createMockClient(null, "{\"models\": [{\"name\": \"models/gemini-old\"}]}");
        service.setRestClient(mockClient);
        ProviderStatusDto status = service.probeProvider("GEMINI", "valid-key", "ENV", System.currentTimeMillis());

        assertEquals("ERROR", status.state());
        assertFalse(status.modelListed());
        assertTrue(status.reason().contains("Model retired — set AI_PROVIDERS_GEMINI_DEFAULT-MODEL to an available model"));
    }

    @Test
    @DisplayName("Reports NOT_CONFIGURED when no key is present in env or BYOK")
    void testNotConfigured() {
        ProviderStatusDto status = service.probeProvider("OPENAI", null, null, System.currentTimeMillis());
        assertEquals("NOT_CONFIGURED", status.state());
        assertTrue(status.reason().contains("NOT_CONFIGURED"));
    }

    @Test
    @DisplayName("Records inference outcome and attaches to status response")
    void testRecordOutcome() {
        service.recordOutcome(ModelProvider.GEMINI, "OK", 200);
        var list = service.getProvidersStatus(null, null);
        var gemini = list.stream().filter(p -> p.provider().equals("GEMINI")).findFirst().orElseThrow();
        assertNotNull(gemini.lastKnown());
        assertEquals("OK", gemini.lastKnown().outcome());
        assertEquals(200, gemini.lastKnown().httpStatus());
    }

    @Test
    @DisplayName("F5.4 (N3): DEGRADED outcome sets state to DEGRADED with honest reason")
    void testRecordDegradedOutcome() {
        service.recordOutcome(ModelProvider.GROQ, "DEGRADED", 400);
        var list = service.getProvidersStatus(null, null);
        var groq = list.stream().filter(p -> p.provider().equals("GROQ")).findFirst().orElseThrow();
        assertNotNull(groq.lastKnown());
        assertEquals("DEGRADED", groq.lastKnown().outcome());
        assertEquals(400, groq.lastKnown().httpStatus());
        assertEquals("DEGRADED", groq.state());
        assertTrue(groq.reason().contains("Provider degraded: HTTP 400"));
    }

    @Test
    @DisplayName("H4: validateGroqConfiguredModels returns zero warnings when all configured models are in LADDER-v2026-09-08")
    void testValidateGroqConfiguredModelsAllValid() {
        AiProviderProperties validProps = new AiProviderProperties(Map.of(
                "groq", new AiProviderProperties.ProviderConfig(
                        "https://api.groq.com/openai/v1/chat/completions",
                        "openai/gpt-oss-120b",
                        "openai/gpt-oss-120b",
                        "openai/gpt-oss-20b",
                        "openai/gpt-oss-120b",
                        "whisper-large-v3-turbo",
                        "test-key",
                        java.util.List.of("openai/gpt-oss-20b", "qwen/qwen3.8-27b"),
                        java.util.List.of("openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b")
                )
        ));
        ProviderStatusService checkService = new ProviderStatusService(validProps, objectMapper);
        java.util.List<String> warnings = checkService.validateGroqConfiguredModels();

        assertNotNull(warnings);
        assertTrue(warnings.isEmpty(), "Expected 0 warnings for valid LADDER-v2026-09-08 models but got: " + warnings);
    }

    @Test
    @DisplayName("H4: validateGroqConfiguredModels logs and returns GROQ_EVAL_MODEL_DEAD warning on retired/unallowed model")
    void testValidateGroqConfiguredModelsDetectsDeadModel() {
        AiProviderProperties deadProps = new AiProviderProperties(Map.of(
                "groq", new AiProviderProperties.ProviderConfig(
                        "https://api.groq.com/openai/v1/chat/completions",
                        "openai/gpt-oss-120b",
                        "openai/gpt-oss-120b",
                        "openai/gpt-oss-20b",
                        "retired/model-eval-legacy", // RETIRED MODEL
                        "whisper-large-v3-turbo",
                        "test-key",
                        java.util.List.of("retired/model-fallback-legacy"), // RETIRED MODEL
                        java.util.List.of("openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b")
                )
        ));
        ProviderStatusService checkService = new ProviderStatusService(deadProps, objectMapper);
        java.util.List<String> warnings = checkService.validateGroqConfiguredModels();

        assertNotNull(warnings);
        assertFalse(warnings.isEmpty(), "Expected warnings for retired Groq models");
        assertEquals(2, warnings.size());
        assertTrue(warnings.get(0).contains("GROQ_EVAL_MODEL_DEAD"));
        assertTrue(warnings.get(0).contains("retired/model-eval-legacy"));
        assertTrue(warnings.get(1).contains("GROQ_EVAL_MODEL_DEAD"));
        assertTrue(warnings.get(1).contains("retired/model-fallback-legacy"));
    }
}
