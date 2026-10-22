package com.interviewos.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.service.EgressTracker;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GeminiClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("GeminiClient throws IllegalStateException when default-model is blank or unconfigured")
    void testBlankConfigThrowsIllegalStateException() {
        AiProviderProperties props = new AiProviderProperties(Map.of(
                "gemini", new AiProviderProperties.ProviderConfig(
                        "https://generativelanguage.googleapis.com/v1beta/models/",
                        "", null, null, null, null, "fake-key"
                )
        ));
        GeminiClient client = new GeminiClient(
                RestClient.builder(),
                props,
                objectMapper,
                mock(EgressTracker.class)
        );

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                client.generateCompletion(ModelProvider.GEMINI, "system", "user", "fake-key", null)
        );
        assertTrue(ex.getMessage().contains("ai.providers.gemini.default-model not configured"));
    }

    @Test
    @DisplayName("GeminiClient validates configuration without throwing on empty props")
    void testStartupValidation() {
        AiProviderProperties emptyProps = new AiProviderProperties(Map.of());
        GeminiClient client = new GeminiClient(
                RestClient.builder(),
                emptyProps,
                objectMapper,
                mock(EgressTracker.class)
        );
        client.validateConfiguration();
    }

    @Test
    @DisplayName("GA2: generationConfig includes response_mime_type and temperature for both text and vision paths")
    void testGeminiPayloadIncludesStructuredOutput() {
        AtomicReference<JsonNode> textPayload = new AtomicReference<>();
        AtomicReference<JsonNode> visionPayload = new AtomicReference<>();

        ClientHttpRequestInterceptor interceptor = (req, body, execution) -> {
            JsonNode parsed;
            try {
                parsed = objectMapper.readTree(body);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            if (req.getURI().toString().contains("test-text")) {
                textPayload.set(parsed);
            } else {
                visionPayload.set(parsed);
            }
            ClientHttpResponse response = mock(ClientHttpResponse.class);
            when(response.getStatusCode()).thenReturn(HttpStatus.OK);
            when(response.getHeaders()).thenReturn(new HttpHeaders());
            String responseBody = "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"{\\\"interviewerReply\\\":\\\"ok\\\"}\"}]}}]}";
            when(response.getBody()).thenReturn(new ByteArrayInputStream(responseBody.getBytes(StandardCharsets.UTF_8)));
            return response;
        };

        RestClient.Builder builder = RestClient.builder().requestInterceptor(interceptor);
        AiProviderProperties props = new AiProviderProperties(Map.of(
                "gemini", new AiProviderProperties.ProviderConfig(
                        "https://generativelanguage.googleapis.com/v1beta/models/",
                        "gemini-3.5-flash", null, null, null, null, "test-key"
                )
        ));
        GeminiClient client = new GeminiClient(builder, props, objectMapper, mock(EgressTracker.class));

        // 1. Text path
        client.generateCompletion(ModelProvider.GEMINI, "sys text", "user text", "test-key", "test-text");
        assertNotNull(textPayload.get(), "Text payload must be captured");
        assertEquals("application/json", textPayload.get().path("generationConfig").path("response_mime_type").asText());
        assertEquals(0.3, textPayload.get().path("generationConfig").path("temperature").asDouble());

        // 2. Vision path
        client.generateCompletionWithVision(ModelProvider.GEMINI, "sys vision", "user vision", new byte[]{1, 2, 3}, "image/png", "test-key", "test-vision");
        assertNotNull(visionPayload.get(), "Vision payload must be captured");
        assertEquals("application/json", visionPayload.get().path("generationConfig").path("response_mime_type").asText());
        assertEquals(0.3, visionPayload.get().path("generationConfig").path("temperature").asDouble());
    }
}
