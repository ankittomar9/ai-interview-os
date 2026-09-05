package com.interviewos.ai.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.service.EgressTracker;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class GeminiClientTest {

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
                new ObjectMapper(),
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
                new ObjectMapper(),
                mock(EgressTracker.class)
        );
        client.validateConfiguration();
    }
}
