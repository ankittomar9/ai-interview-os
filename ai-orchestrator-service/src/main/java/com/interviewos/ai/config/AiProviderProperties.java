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
            return (task != null && !task.isBlank() && !isTaskKeyword(task)) ? task : defaultModel;
        }

        private static boolean isTaskKeyword(String s) {
            if (s == null) return false;
            String lower = s.trim().toLowerCase();
            return lower.equals("dialogue") || lower.equals("conversation")
                    || lower.equals("fast") || lower.equals("hints") || lower.equals("intent")
                    || lower.equals("eval") || lower.equals("rubric") || lower.equals("report")
                    || lower.equals("stt") || lower.equals("default");
        }
    }

    public ProviderConfig getConfigFor(ModelProvider provider) {
        if (provider == null) return null;
        String key = provider.name().toLowerCase();
        if (providers != null && providers.containsKey(key)) {
            return providers.get(key);
        }
        return resolveEnvFallbackConfig(provider);
    }

    private static ProviderConfig resolveEnvFallbackConfig(ModelProvider provider) {
        if (provider == ModelProvider.GROQ) {
            String apiKey = System.getenv("GROQ_API_KEY");
            String dialogue = System.getenv("GROQ_MODEL_DIALOGUE") != null ? System.getenv("GROQ_MODEL_DIALOGUE") : "openai/gpt-oss-120b";
            String fast = System.getenv("GROQ_MODEL_FAST") != null ? System.getenv("GROQ_MODEL_FAST") : "openai/gpt-oss-20b";
            String eval = System.getenv("GROQ_MODEL_EVAL") != null ? System.getenv("GROQ_MODEL_EVAL") : "openai/gpt-oss-120b";
            String stt = System.getenv("GROQ_MODEL_STT") != null ? System.getenv("GROQ_MODEL_STT") : "whisper-large-v3-turbo";
            String fallback = System.getenv("GROQ_FALLBACK_MODELS") != null ? System.getenv("GROQ_FALLBACK_MODELS") : "openai/gpt-oss-20b,qwen/qwen3.8-27b";
            java.util.List<String> fallbacks = java.util.Arrays.stream(fallback.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
            return new ProviderConfig(
                    "https://api.groq.com/openai/v1/chat/completions",
                    dialogue,
                    dialogue,
                    fast,
                    eval,
                    stt,
                    apiKey,
                    fallbacks,
                    java.util.List.of()
            );
        }
        if (provider == ModelProvider.OLLAMA) {
            String endpoint = System.getenv("OLLAMA_ENDPOINT") != null ? System.getenv("OLLAMA_ENDPOINT") : "http://host.docker.internal:11434/api/generate";
            String model = System.getenv("OLLAMA_MODEL") != null ? System.getenv("OLLAMA_MODEL") : "qwen2.5-coder:7b";
            return new ProviderConfig(endpoint, model, model, model, model, "", "", java.util.List.of(), java.util.List.of());
        }
        if (provider == ModelProvider.OPENAI) {
            String endpoint = System.getenv("OPENAI_BASE_URL") != null ? System.getenv("OPENAI_BASE_URL") : "https://api.openai.com/v1/chat/completions";
            String apiKey = System.getenv("OPENAI_API_KEY");
            String dialogue = System.getenv("OPENAI_MODEL_DIALOGUE") != null ? System.getenv("OPENAI_MODEL_DIALOGUE") : "gpt-4o";
            String fast = System.getenv("OPENAI_MODEL_FAST") != null ? System.getenv("OPENAI_MODEL_FAST") : "gpt-4o-mini";
            String eval = System.getenv("OPENAI_MODEL_EVAL") != null ? System.getenv("OPENAI_MODEL_EVAL") : "gpt-4o";
            return new ProviderConfig(endpoint, dialogue, dialogue, fast, eval, "", apiKey, java.util.List.of(), java.util.List.of());
        }
        if (provider == ModelProvider.GEMINI) {
            String endpoint = System.getenv("GEMINI_ENDPOINT") != null ? System.getenv("GEMINI_ENDPOINT") : "https://generativelanguage.googleapis.com/v1beta/models/";
            String model = System.getenv("GEMINI_MODEL") != null ? System.getenv("GEMINI_MODEL") : "gemini-3.5-flash";
            String apiKey = System.getenv("GEMINI_API_KEY");
            return new ProviderConfig(endpoint, model, model, model, model, "", apiKey, java.util.List.of(), java.util.List.of());
        }
        return null;
    }
}