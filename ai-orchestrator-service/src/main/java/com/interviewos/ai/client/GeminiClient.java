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

import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Adapter for Google Gemini API (Multimodal & Text).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient implements AiClient {

    private final RestClient.Builder restClientBuilder;
    private final AiProviderProperties providerProperties;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(ModelProvider provider) {
        return provider == ModelProvider.GEMINI;
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
        AiProviderProperties.ProviderConfig config = providerProperties.getConfigFor(ModelProvider.GEMINI);
        String model = (customModel != null && !customModel.isBlank()) ? customModel : config.defaultModel();

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalArgumentException("API Key is required for Google Gemini");
        }

        // Target URL: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
        String requestUrl = config.endpoint() + model + ":generateContent?key=" + apiKey;

        log.info("Dispatching prompt to Google Gemini using model: {} (multimodal: {})", model, imageBytes != null);

        List<Map<String, Object>> parts;
        if (imageBytes != null && imageBytes.length > 0) {
            String actualMime = (mimeType != null && !mimeType.isBlank()) ? mimeType : "image/png";
            String base64Data = Base64.getEncoder().encodeToString(imageBytes);
            parts = List.of(
                    Map.of("text", userPrompt),
                    Map.of("inline_data", Map.of(
                            "mime_type", actualMime,
                            "data", base64Data
                    ))
            );
        } else {
            parts = List.of(Map.of("text", userPrompt));
        }

        Map<String, Object> requestPayload = Map.of(
                "system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemInstruction))
                ),
                "contents", List.of(
                        Map.of("parts", parts)
                ),
                "generationConfig", Map.of(
                        "temperature", 0.3
                )
        );

        RestClient restClient = restClientBuilder.build();

        String rawResponse = restClient.post()
                .uri(requestUrl)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestPayload)
                .retrieve()
                .body(String.class);

        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", rawResponse, e);
            throw new RuntimeException("Error parsing Gemini AI response", e);
        }
    }
}