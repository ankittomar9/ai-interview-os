package com.interviewos.ai.config;

import com.interviewos.ai.model.ModelProvider;
import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.Map;

/**
 * Type-safe configuration properties loaded from application.yaml.
 * Enables zero-code overriding via environment variables (e.g. AI_PROVIDERS_OLLAMA_ENDPOINT).
 */
@ConfigurationProperties(prefix = "ai")
public record AiProviderProperties(Map<String, ProviderConfig> providers) {

    public record ProviderConfig(
            String endpoint,
            String defaultModel,
            String modelDialogue,
            String modelFast,
            String modelEval,
            String modelStt,
            String apiKey,
            java.util.List<String> fallbackModels,
            java.util.List<String> allowedModels
    ) {
        public ProviderConfig {
            if (fallbackModels == null) {
                fallbackModels = java.util.List.of();
            }
            if (allowedModels == null) {
                allowedModels = java.util.List.of();
            }
        }

        public ProviderConfig(
                String endpoint,
                String defaultModel,
                String modelDialogue,
                String modelFast,
                String modelEval,
                String modelStt,
                String apiKey
        ) {
            this(endpoint, defaultModel, modelDialogue, modelFast, modelEval, modelStt, apiKey, java.util.List.of(), java.util.List.of());
        }

        public ProviderConfig(
                String endpoint,
                String defaultModel,
                String modelDialogue,
                String modelFast,
                String modelEval,
                String modelStt,
                String apiKey,
                java.util.List<String> fallbackModels
        ) {
            this(endpoint, defaultModel, modelDialogue, modelFast, modelEval, modelStt, apiKey, fallbackModels, java.util.List.of());
        }
        public String getEffectiveModelFor(String task) {
            if ("dialogue".equalsIgnoreCase(task) || "conversation".equalsIgnoreCase(task)) {
                return (modelDialogue != null && !modelDialogue.isBlank()) ? modelDialogue : defaultModel;
            }
            if ("fast".equalsIgnoreCase(task) || "hints".equalsIgnoreCase(task) || "intent".equalsIgnoreCase(task)) {
                return (modelFast != null && !modelFast.isBlank()) ? modelFast : defaultModel;
            }
            if ("eval".equalsIgnoreCase(task) || "rubric".equalsIgnoreCase(task) || "report".equalsIgnoreCase(task)) {
                return (modelEval != null && !modelEval.isBlank()) ? modelEval : defaultModel;
            }
            return (task != null && !task.isBlank()) ? task : defaultModel;
        }
    }

    public ProviderConfig getConfigFor(ModelProvider provider) {
        if (provider == null) return null;
        String key = provider.name().toLowerCase();
        if (providers == null || !providers.containsKey(key)) {
            return null;
        }
        return providers.get(key);
    }
}