package com.interviewos.ai.rubric.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.ProblemCatalogClient;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.rubric.dto.DimensionScore;
import com.interviewos.ai.rubric.dto.ExecutionDto;
import com.interviewos.ai.rubric.dto.RubricEvaluationRequest;
import com.interviewos.ai.rubric.dto.RubricResponse;
import com.interviewos.ai.rubric.dto.TurnDto;
import com.interviewos.ai.util.JsonCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RubricService {

    private final AiClientFactory clientFactory;
    private final ProblemCatalogClient problemCatalogClient;
    private final ObjectMapper objectMapper;
    private final com.interviewos.ai.service.EgressTracker egressTracker;

    @Value("${rubric.provider:ollama}")
    private String configuredProvider = "ollama";

    @Value("${rubric.api-key:${RUBRIC_API_KEY:}}")
    private String configuredApiKey = "";

    @Value("${rubric.timeout-seconds:25}")
    private int rubricTimeoutSeconds = 25;

    @Value("${ai.providers.groq.api-key:${GROQ_API_KEY:}}")
    private String groqApiKey = "";

    @Value("${ai.rubric.allow-cloud-fallback:${rubric.allow-cloud-fallback:true}}")
    private boolean allowCloudFallback = true;

    public RubricResponse evaluateRubric(RubricEvaluationRequest request) {
        log.info("Starting qualitative rubric evaluation for problem: '{}', track: '{}', difficulty: '{}'",
                request.problemSlug(), request.track(), request.difficulty());

        ModelProvider provider = resolveProvider(configuredProvider);
        com.interviewos.ai.rubric.model.RubricSchema schema = com.interviewos.ai.rubric.model.RubricSchema.fromTrack(request.track());
        AiClient resolvedClient;
        ModelProvider effectiveProvider = provider;
        try {
            resolvedClient = clientFactory.getClient(provider);
        } catch (Exception e) {
            log.warn("⚠️ Failed to resolve AI client for rubric provider '{}': {}. Checking cloud fallback policy.",
                    provider, e.getMessage());
            if (!allowCloudFallback) {
                log.info("☁️ Cloud fallback disabled (strict-purity mode). Using deterministic scoring.");
                return RubricResponse.emptyFallback(schema);
            }
            try {
                resolvedClient = clientFactory.getClient(ModelProvider.GROQ);
                effectiveProvider = ModelProvider.GROQ;
                egressTracker.recordCloudCall("GROQ_RUBRIC_FALLBACK");
            } catch (Exception groqResolveErr) {
                return RubricResponse.emptyFallback(schema);
            }
        }
        final AiClient client = resolvedClient;
        final ModelProvider activeProvider = effectiveProvider;

        String systemInstruction = buildSystemInstruction(schema);
        String userPrompt = buildSanitizedUserPrompt(request);

        try {
            String rawResponse;
            if (activeProvider == ModelProvider.OLLAMA) {
                try {
                    log.info("Evaluating rubric with Ollama (local, timeout: {}s)...", rubricTimeoutSeconds);
                    rawResponse = CompletableFuture.supplyAsync(() -> client.generateCompletion(
                            ModelProvider.OLLAMA,
                            systemInstruction,
                            userPrompt,
                            configuredApiKey,
                            "eval"
                    )).get(rubricTimeoutSeconds, TimeUnit.SECONDS);
                } catch (Exception e) {
                    log.warn("⚠️ Ollama rubric timeout or failure ({}), checking cloud fallback policy", e.getMessage());
                    if (!allowCloudFallback) {
                        log.info("☁️ Cloud fallback disabled (strict-purity mode). Using deterministic scoring.");
                        return RubricResponse.emptyFallback(schema);
                    }
                    try {
                        log.info("☁️ Rubric degraded to cloud (Groq fallback). Recording egress.");
                        egressTracker.recordCloudCall("GROQ_RUBRIC_FALLBACK");
                        AiClient groqClient = clientFactory.getClient(ModelProvider.GROQ);
                        String effectiveGroqKey = (groqApiKey != null && !groqApiKey.isBlank()) ? groqApiKey : configuredApiKey;
                        rawResponse = groqClient.generateCompletion(
                                ModelProvider.GROQ,
                                systemInstruction,
                                userPrompt,
                                effectiveGroqKey,
                                "eval"
                        );
                    } catch (Exception groqErr) {
                        log.error("Groq fallback also failed: {}", groqErr.getMessage());
                        return RubricResponse.emptyFallback(schema);
                    }
                }
            } else {
                rawResponse = client.generateCompletion(
                        provider,
                        systemInstruction,
                        userPrompt,
                        configuredApiKey,
                        "eval"
                );
            }

            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            LlmRubricPayload parsed = objectMapper.readValue(cleanJson, LlmRubricPayload.class);

            if (parsed == null || parsed.dimensions == null || parsed.dimensions.isEmpty()) {
                log.warn("⚠️ LLM rubric response parsed to empty structure. Returning deterministic fallback.");
                return RubricResponse.emptyFallback(schema);
            }

            return new RubricResponse(
                    parsed.dimensions,
                    parsed.strengths != null ? parsed.strengths : List.of(),
                    parsed.weaknesses != null ? parsed.weaknesses : List.of(),
                    parsed.studyPlan != null ? parsed.studyPlan : List.of(),
                    parsed.executiveSummary != null ? parsed.executiveSummary : "",
                    true
            );
        } catch (Exception e) {
            log.warn("⚠️ Failed to generate/parse LLM rubric with provider '{}': {}. Falling back to deterministic rubric.",
                    provider, e.getMessage());
            return RubricResponse.emptyFallback(schema);
        }
    }

    private String buildSanitizedUserPrompt(RubricEvaluationRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Challenge: ").append(req.problemSlug()).append("\n");
        sb.append("Track: ").append(req.track()).append(" | Difficulty: ").append(req.difficulty()).append("\n\n");
        sb.append("Canonical Problem Statement:\n").append(req.problemStatement()).append("\n\n");

        // Grounding with Question Bank specific rubric checkpoints
        if (req.problemSlug() != null && !req.problemSlug().isBlank()) {
            try {
                Optional<ProblemCatalogClient.QuestionFullDetail> detailOpt = problemCatalogClient.getFullQuestionDetail(req.problemSlug());
                if (detailOpt.isPresent()) {
                    var detail = detailOpt.get();
                    if (detail.interviewerNotes() != null && detail.interviewerNotes().rubricCheckpoints() != null && !detail.interviewerNotes().rubricCheckpoints().isEmpty()) {
                        sb.append("Target Problem Rubric Checkpoints (Observe these specific behaviors):\n");
                        for (String cp : detail.interviewerNotes().rubricCheckpoints()) {
                            sb.append("- ").append(cp).append("\n");
                        }
                        sb.append("\n");
                    }
                }
            } catch (Exception ignored) {}
        }

        // Coaching Signals computed deterministically from transcript metadata
        String coachingSignals = computeCoachingSignals(req.transcript(), req.executions());
        if (coachingSignals != null) {
            sb.append(coachingSignals).append("\n");
        }

        sb.append("Sandbox Execution Summary:\n");
        if (req.executions() != null && !req.executions().isEmpty()) {
            req.executions().forEach(e -> sb.append(String.format("- Run: %d/%d tests passed (%s) in %.1fms (Memory: %.1fMB)\n",
                    e.passedTests(), e.totalTests(), e.status(), e.executionTimeMs(), e.memoryUsedMb())));
        } else {
            sb.append("- No sandbox code executions recorded.\n");
        }
        sb.append("\n");

        sb.append("Candidate Transcript Audit Turns:\n");
        List<TurnDto> transcript = req.transcript() != null ? req.transcript() : List.of();
        List<String> codeSnippets = new ArrayList<>();

        for (int i = 0; i < transcript.size(); i++) {
            TurnDto turn = transcript.get(i);
            String role = turn.role() != null ? turn.role() : "UNKNOWN";
            String content = turn.content() != null ? turn.content() : "";

            // Truncate AI turns to 300 characters
            if ("AI".equalsIgnoreCase(role) && content.length() > 300) {
                content = content.substring(0, 300) + "... [truncated]";
            }

            sb.append(String.format("[Turn #%d | %s | %s]: %s\n", i + 1, role, turn.messageType(), content));

            if (turn.codeSnippet() != null && !turn.codeSnippet().isBlank()) {
                codeSnippets.add(turn.codeSnippet());
            }
        }
        sb.append("\n");

        sb.append("Final Submitted Code (Language: ").append(req.language() != null ? req.language() : "java").append("):\n");
        if (req.finalCode() != null && !req.finalCode().isBlank()) {
            sb.append(req.finalCode()).append("\n");
        } else if (!codeSnippets.isEmpty()) {
            sb.append(codeSnippets.get(codeSnippets.size() - 1)).append("\n");
        } else {
            sb.append("// No code submitted.\n");
        }

        // Hard cap total prompt length to ~12,000 characters to ensure deterministic context processing
        String prompt = sb.toString();
        if (prompt.length() > 12000) {
            prompt = prompt.substring(0, 12000) + "\n... [Remaining transcript truncated for token safety]";
        }
        return prompt;
    }

    String computeCoachingSignals(List<TurnDto> transcript, List<ExecutionDto> executions) {
        if (transcript == null || transcript.isEmpty()) return null;

        List<String> intentSequence = new ArrayList<>();
        int hintEpisodes = 0;
        int stuckEpisodes = 0;

        for (TurnDto turn : transcript) {
            if (turn.metadata() != null) {
                String intent = turn.metadata().get("detectedIntent");
                if (intent != null && !intent.isBlank()) {
                    intentSequence.add(intent.trim());
                    if ("STUCK".equalsIgnoreCase(intent.trim())) {
                        stuckEpisodes++;
                    }
                }
                String action = turn.metadata().get("recommendedAction");
                if ("OFFER_HINT".equalsIgnoreCase(action)) {
                    hintEpisodes++;
                }
            }
        }

        if (intentSequence.isEmpty() && hintEpisodes == 0 && stuckEpisodes == 0) {
            return null; // No metadata recorded
        }

        boolean recovery = false;
        if (stuckEpisodes > 0 && executions != null) {
            recovery = executions.stream().anyMatch(e -> "PASSED".equalsIgnoreCase(e.status()) || (e.totalTests() > 0 && e.passedTests() == e.totalTests()));
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Coaching Signals:\n");
        sb.append("- Intent Sequence: ").append(intentSequence.isEmpty() ? "None recorded" : String.join(" -> ", intentSequence)).append("\n");
        sb.append("- Hint Episodes Count: ").append(hintEpisodes).append("\n");
        sb.append("- Stuck Episodes Count: ").append(stuckEpisodes).append("\n");
        if (stuckEpisodes > 0) {
            sb.append("- Recovery after being stuck (Passed execution later): ").append(recovery ? "true" : "false").append("\n");
        }
        return sb.toString();
    }

    private String buildSystemInstruction(com.interviewos.ai.rubric.model.RubricSchema schema) {
        List<com.interviewos.ai.rubric.model.RubricDimension> dimensions = com.interviewos.ai.rubric.model.RubricDimension.getDimensionsForSchema(schema);
        StringBuilder dimList = new StringBuilder();
        StringBuilder jsonDims = new StringBuilder();

        for (int i = 0; i < dimensions.size(); i++) {
            com.interviewos.ai.rubric.model.RubricDimension d = dimensions.get(i);
            dimList.append(String.format("%d. %s (weight: %.0f%%) — %s\n", (i + 1), d.name(), d.getWeight() * 100, d.getDescription()));
            jsonDims.append(String.format("    { \"dimension\": \"%s\", \"score\": 80, \"rationale\": \"...\", \"evidence\": \"...\" }%s\n",
                    d.name(), (i < dimensions.size() - 1 ? "," : "")));
        }

        return String.format("""
                You are Mickey, a Principal Software Engineer and Bar Raiser conducting a comprehensive, objective technical assessment evaluation.
                You must evaluate the candidate across EXACTLY these 5 dimensions in strict order for track %s:
                %s
                SCORING ANCHORS:
                - 0–40 (Weak): Missing, incorrect, or counter-productive.
                - 40–70 (Adequate): Partially correct or standard with minor gaps.
                - 70–100 (Strong): Thorough, idiomatic, and rigorously justified.

                CRITICAL RULES:
                1. Every dimension score MUST carry an "evidence" field with a VERBATIM quote from the candidate transcript.
                2. If no observable evidence exists in the transcript for a dimension, the score MUST be <= 50 and evidence MUST be exactly "No observable evidence in transcript.".
                3. In communication and problem-solving rationales, consider candidate persistence, responsiveness to hints, and recovery from stuck states if present in Coaching Signals.
                4. "studyPlan" MUST contain exactly 7 high-impact, actionable daily drills specifically addressing the TWO WEAKEST scored dimensions.
                5. Return ONLY a valid, raw JSON object matching the schema below with NO conversational preamble or markdown backticks:

                {
                  "dimensions": [
                %s
                  ],
                  "strengths": ["Strength 1...", "Strength 2...", "Strength 3..."],
                  "weaknesses": ["Improvement Area 1...", "Improvement Area 2...", "Improvement Area 3..."],
                  "studyPlan": [
                    "Day 1: ...",
                    "Day 2: ...",
                    "Day 3: ...",
                    "Day 4: ...",
                    "Day 5: ...",
                    "Day 6: ...",
                    "Day 7: ..."
                  ],
                  "executiveSummary": "Comprehensive summary highlighting candidate engineering maturity, track-specific strengths, and final hiring recommendation rationale."
                }
                """, schema.name(), dimList.toString(), jsonDims.toString());
    }

    private ModelProvider resolveProvider(String providerStr) {
        if (providerStr == null) return ModelProvider.OLLAMA;
        try {
            return ModelProvider.valueOf(providerStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ModelProvider.OLLAMA;
        }
    }

    private record LlmRubricPayload(
            List<DimensionScore> dimensions,
            List<String> strengths,
            List<String> weaknesses,
            List<String> studyPlan,
            String executiveSummary
    ) {}
}
