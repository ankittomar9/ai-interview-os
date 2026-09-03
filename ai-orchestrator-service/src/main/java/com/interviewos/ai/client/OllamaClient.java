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
        String model = (config != null) ? config.getEffectiveModelFor(customModel) : ((customModel != null && !customModel.isBlank()) ? customModel : "qwen2.5-coder:7b");

        log.info("Connecting to Local Ollama at: {} | Model: {} | Prompt length: {} chars",
                endpoint, model, (systemInstruction.length() + userPrompt.length()));

        Map<String, Object> requestPayload = Map.of(
                "model", model,
                "system", systemInstruction,
                "prompt", userPrompt,
                "stream", false
        );

        RestClient restClient = restClientBuilder.build();
        long start = System.currentTimeMillis();

        try {
            String rawResponse = restClient.post()
                    .uri(endpoint)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestPayload)
                    .retrieve()
                    .body(String.class);

            long duration = System.currentTimeMillis() - start;
            JsonNode root = objectMapper.readTree(rawResponse);
            String output = root.path("response").asText();

            log.info("Ollama inference completed in {}ms (Output: {} chars)", duration, output.length());
            return output;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - start;
            log.error("Failed communicating with Ollama at '{}' after {}ms. Error: {}", endpoint, duration, e.getMessage(), e);
            throw new RuntimeException("Error communicating with local Ollama instance at " + endpoint + ": " + e.getMessage(), e);
        }
    }
}