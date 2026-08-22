package com.interviewos.ai.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.model.ModelProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Adapter for all OpenAI-compatible API providers (Groq, OpenAI, Qwen, GLM, Kimi, DeepSeek).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpenAiCompatibleClient implements AiClient {

    private final RestClient.Builder restClientBuilder;
    private final AiProviderProperties providerProperties;
    private final ObjectMapper objectMapper;

    private static final Set<ModelProvider> SUPPORTED_PROVIDERS = Set.of(
            ModelProvider.GROQ,
            ModelProvider.OPENAI,
            ModelProvider.QWEN,
            ModelProvider.GLM,
            ModelProvider.KIMI,
            ModelProvider.DEEPSEEK
    );

    @Override
    public boolean supports(ModelProvider provider) {
        return SUPPORTED_PROVIDERS.contains(provider);
    }

    @Override
    public String generateCompletion(
            ModelProvider provider,
            String systemInstruction,
            String userPrompt,
            String apiKey,
            String customModel
    ) {
        return generateCompletionWithVision(provider, systemInstruction, userPrompt, null, null, apiKey, customModel);
    }

    @Override
    public String generateCompletionWithVision(
            ModelProvider provider,
            String systemInstruction,
            String userPrompt,
            byte[] imageBytes,
            String mimeType,
            String apiKey,
            String customModel
    ) {
        AiProviderProperties.ProviderConfig config = providerProperties.getConfigFor(provider);
        String endpoint = config.endpoint();
        String model = (customModel != null && !customModel.isBlank()) ? customModel : config.defaultModel();

        log.info("Dispatching prompt to OpenAI-compatible provider: {} using model: {} (vision: {})", provider, model, imageBytes != null);

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("API Key is required for provider: " + provider);
        }

        Object userContent;
        if (provider == ModelProvider.OPENAI && imageBytes != null && imageBytes.length > 0) {
            String actualMime = (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/png";
            String base64Data = Base64.getEncoder().encodeToString(imageBytes);
            userContent = List.of(
                    Map.of("type", "text", "text", userPrompt),
                    Map.of("type", "image_url", "image_url", Map.of(
                            "url", "data:" + actualMime + ";base64," + base64Data
                    ))
            );
        } else {
            userContent = userPrompt;
        }

        // Build standard chat completions payload
        Map<String, Object> requestPayload = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemInstruction),
                        Map.of("role", "user", "content", userContent)
                ),
                "temperature", 0.3
        );

        RestClient restClient = restClientBuilder.build();

        String rawResponse = restClient.post()
                .uri(endpoint)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(String.class);

        // Parse choices[0].message.content
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            log.error("Failed to parse OpenAI-compatible response from {}: {}", provider, rawResponse, e);
            throw new RuntimeException("Error parsing AI response from " + provider, e);
        }
    }
}