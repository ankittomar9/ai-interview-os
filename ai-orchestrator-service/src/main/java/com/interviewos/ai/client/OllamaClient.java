package com.interviewos.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.model.ModelProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Adapter for Local Ollama instances. Zero cloud cost, zero API keys.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OllamaClient implements AiClient {

    private final RestClient.Builder restClientBuilder;
    private final AiProviderProperties providerProperties;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(ModelProvider provider) {
        return provider == ModelProvider.OLLAMA;
    }

    @Override
    public String generateCompletion(
            ModelProvider provider,
            String systemInstruction,
            String userPrompt,
            String apiKey,
            String customModel
    ) {
        AiProviderProperties.ProviderConfig config = providerProperties.getConfigFor(ModelProvider.OLLAMA);
        String endpoint = config.endpoint();
        String model = (customModel != null && !customModel.isBlank()) ? customModel : config.defaultModel();

        log.info("Dispatching prompt to Local Ollama at {} using model: {}", endpoint, model);

        Map<String, Object> requestPayload = Map.of(
                "model", model,
                "system", systemInstruction,
                "prompt", userPrompt,
                "stream", false
        );

        RestClient restClient = restClientBuilder.build();

        String rawResponse = restClient.post()
                .uri(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("response").asText();
        } catch (Exception e) {
            log.error("Failed to parse Ollama response: {}", rawResponse, e);
            throw new RuntimeException("Error communicating with local Ollama instance at " + endpoint, e);
        }
    }
}