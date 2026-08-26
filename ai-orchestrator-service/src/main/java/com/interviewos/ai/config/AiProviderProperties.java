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
            String apiKey
    ) {
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
            return defaultModel;
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