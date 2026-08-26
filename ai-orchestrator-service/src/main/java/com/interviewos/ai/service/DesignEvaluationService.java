package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.SessionAttachmentClient;
import com.interviewos.ai.dto.DesignEvaluationRequest;
import com.interviewos.ai.dto.DesignEvaluationResponse;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.util.JsonCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DesignEvaluationService {

    private final AiClientFactory clientFactory;
    private final SessionAttachmentClient attachmentClient;
    private final ObjectMapper objectMapper;

    @Value("${rubric.provider:ollama}")
    private String configuredProvider;

    @Value("${rubric.api-key:${RUBRIC_API_KEY:}}")
    private String configuredApiKey;

    public DesignEvaluationResponse evaluateDesign(DesignEvaluationRequest request) {
        log.info("Starting System Design Architecture evaluation for sessionId: {}", request.sessionId());

        // Resolve provider and API key (request BYOK overrides server-configured default)
        ModelProvider provider = request.modelProvider() != null
                ? request.modelProvider()
                : resolveProvider(configuredProvider);

        String apiKey = (request.apiKey() != null && !request.apiKey().isBlank())
                ? request.apiKey()
                : configuredApiKey;

        AiClient client;
        try {
            client = clientFactory.getClient(provider);
        } catch (Exception e) {
            log.warn("⚠️ Failed to resolve AI client for provider '{}': {}. Returning fallback.", provider, e.getMessage());
            return DesignEvaluationResponse.fallback("AI client resolution failure for provider: " + provider);
        }

        // Fetch attachments from interview-session-service
        String canvasJson = null;
        if (request.canvasJsonAttachmentId() != null) {
            canvasJson = attachmentClient.fetchAttachmentText(request.sessionId(), request.canvasJsonAttachmentId());
        }

        byte[] pngBytes = null;
        if (request.pngAttachmentId() != null) {
            pngBytes = attachmentClient.fetchAttachmentBytes(request.sessionId(), request.pngAttachmentId());
        }

        String dau = request.requirements() != null && request.requirements().dau() != null
                ? request.requirements().dau() : "10M DAU";
        String peakFactor = request.requirements() != null && request.requirements().peakFactor() != null
                ? request.requirements().peakFactor() : "3x Peak Factor";
        String readWriteRatio = request.requirements() != null && request.requirements().readWriteRatio() != null
                ? request.requirements().readWriteRatio() : "10:1 Read/Write";

        String systemInstruction = """
                You are a Principal Staff Architect and Bar Raiser conducting a rigorous System Design Evaluation.
                You are evaluating a candidate's high-level architecture diagram and capacity estimates.

                EVALUATION CRITERIA:
                1. Single Points of Failure (SPOF) & Bottlenecks: Are services redundant, load-balanced, and resilient?
                2. Caching Strategy: Is cache (e.g. Redis/Memcached) placed properly before databases with clear eviction/invalidation policies?
                3. Asynchronous Write Decoupling: Are message queues / stream brokers (e.g. Kafka, RabbitMQ) utilized for high write bursts?
                4. Data Tier & Sharding: Are databases partitioned, sharded, or replicated to handle throughput?
                5. Capacity Math Alignment: Does the architecture scale comfortably to the specified requirements?

                CRITICAL INSTRUCTION:
                Reference the ACTUAL component and node names from the candidate's diagram in your feedback bullets.

                Return ONLY a valid JSON object matching this schema:
                {
                  "score": 85,
                  "feedback": [
                    "Point 1 referencing specific components...",
                    "Point 2 referencing specific components...",
                    "Point 3 referencing specific components..."
                  ],
                  "evidence": "Observed nodes: Gateway -> App Service -> Redis -> DB"
                }
                """;

        StringBuilder userPromptBuilder = new StringBuilder();
        userPromptBuilder.append("System Design Assessment Requirements:\n");
        userPromptBuilder.append("- Daily Active Users (DAU): ").append(dau).append("\n");
        userPromptBuilder.append("- Peak Factor: ").append(peakFactor).append("\n");
        userPromptBuilder.append("- Read / Write Ratio: ").append(readWriteRatio).append("\n\n");

        if (canvasJson != null && !canvasJson.isBlank()) {
            userPromptBuilder.append("Candidate Architecture Graph (JSON Snapshot):\n");
            userPromptBuilder.append(canvasJson).append("\n\n");
        } else {
            userPromptBuilder.append("Architecture components submitted visually in the diagram canvas.\n\n");
        }

        userPromptBuilder.append("Evaluate this architecture diagram and output the structured JSON evaluation.");

        String userPrompt = userPromptBuilder.toString();
        boolean hasVisionSupport = (provider == ModelProvider.GEMINI || provider == ModelProvider.OPENAI)
                && pngBytes != null && pngBytes.length > 0;

        try {
            String rawResponse;
            if (hasVisionSupport) {
                log.info("Executing multimodal vision inference for session {} with image ({} bytes)", request.sessionId(), pngBytes.length);
                rawResponse = client.generateCompletionWithVision(
                        provider,
                        systemInstruction,
                        userPrompt,
                        pngBytes,
                        "image/png",
                        apiKey,
                        "eval"
                );
            } else {
                log.info("Executing text-only architecture inference for session {}", request.sessionId());
                rawResponse = client.generateCompletion(
                        provider,
                        systemInstruction,
                        userPrompt,
                        apiKey,
                        "eval"
                );
            }

            String cleanedJson = JsonCleaner.extractPureJson(rawResponse);
            JsonNode root = objectMapper.readTree(cleanedJson);

            int score = root.path("score").asInt(75);
            score = Math.max(0, Math.min(100, score));

            List<String> feedback = new ArrayList<>();
            if (root.has("feedback") && root.path("feedback").isArray()) {
                for (JsonNode fb : root.path("feedback")) {
                    feedback.add(fb.asText());
                }
            }

            if (feedback.isEmpty()) {
                feedback.add("Architecture provides foundational routing and service layers.");
                feedback.add("Consider evaluating cache invalidation strategies and queue decoupling.");
            }

            String evidence = root.path("evidence").asText(
                    hasVisionSupport ? "Evaluated from architecture diagram visual canvas & graph" : "Text-only architectural graph evaluation"
            );

            return new DesignEvaluationResponse(
                    feedback,
                    score,
                    evidence,
                    true,
                    hasVisionSupport ? "VISION" : "TEXT"
            );

        } catch (Exception e) {
            log.error("⚠️ Error generating system design evaluation for session {}: {}. Returning fallback.", request.sessionId(), e.getMessage(), e);
            return DesignEvaluationResponse.fallback("Deterministic evaluation fallback: " + e.getMessage());
        }
    }

    private ModelProvider resolveProvider(String providerName) {
        if (providerName == null || providerName.isBlank()) {
            return ModelProvider.OLLAMA;
        }
        try {
            return ModelProvider.valueOf(providerName.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown configured provider '{}', defaulting to OLLAMA", providerName);
            return ModelProvider.OLLAMA;
        }
    }
}
