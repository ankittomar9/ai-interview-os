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
            String defaultModel
    ) {}

    public ProviderConfig getConfigFor(ModelProvider provider) {
        String key = provider.name().toLowerCase();
        if (providers == null || !providers.containsKey(key)) {
            throw new IllegalArgumentException("No configuration found for provider: " + provider);
        }
        return providers.get(key);
    }
}