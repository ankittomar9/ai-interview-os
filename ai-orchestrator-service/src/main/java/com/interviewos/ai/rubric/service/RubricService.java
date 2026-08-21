package com.interviewos.ai.rubric.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.rubric.dto.DimensionScore;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class RubricService {

    private final AiClientFactory clientFactory;
    private final ObjectMapper objectMapper;

    @Value("${rubric.provider:ollama}")
    private String configuredProvider;

    @Value("${rubric.api-key:${RUBRIC_API_KEY:}}")
    private String configuredApiKey;

    public RubricResponse evaluateRubric(RubricEvaluationRequest request) {
        log.info("Starting qualitative rubric evaluation for problem: '{}', track: '{}', difficulty: '{}'",
                request.problemSlug(), request.track(), request.difficulty());

        ModelProvider provider = resolveProvider(configuredProvider);
        AiClient client;
        try {
            client = clientFactory.getClient(provider);
        } catch (Exception e) {
            log.warn("⚠️ Failed to resolve AI client for rubric provider '{}': {}. Returning deterministic fallback signal.",
                    provider, e.getMessage());
            return RubricResponse.emptyFallback();
        }

        String systemInstruction = """
                You are a Principal Software Engineer and Bar Raiser conducting a comprehensive, objective technical assessment evaluation.
                You must evaluate the candidate across EXACTLY these 5 dimensions in strict order:
                1. REQUIREMENTS_CLARIFICATION — Did the candidate ask clarifying questions and confirm assumptions before coding?
                2. ALGORITHMIC_REASONING — Did they accurately analyze Big-O time/space complexity and choose appropriate data structures?
                3. EDGE_CASE_THOROUGHNESS — Did they identify and handle null, empty, boundary, overflow, or concurrency edge cases?
                4. COMMUNICATION_CLARITY — Were explanations structured, concise, and professional, or unstructured and rambling?
                5. CODE_QUALITY — Independent of execution, is the code clean, well-factored, idiomatic, and readable?
                
                SCORING ANCHORS:
                - 0–40 (Weak): Missing, incorrect, or counter-productive.
                - 40–70 (Adequate): Partially correct or standard with minor gaps.
                - 70–100 (Strong): Thorough, idiomatic, and rigorously justified.
                
                CRITICAL RULES:
                1. Every dimension score MUST carry an "evidence" field with a VERBATIM quote from the candidate transcript.
                2. If no observable evidence exists in the transcript for a dimension, the score MUST be <= 50 and evidence MUST be exactly "No observable evidence in transcript.".
                3. "studyPlan" MUST contain exactly 7 high-impact, actionable daily drills specifically addressing the TWO WEAKEST scored dimensions.
                4. Return ONLY a valid, raw JSON object matching the schema below with NO conversational preamble or markdown backticks:
                
                {
                  "dimensions": [
                    { "dimension": "REQUIREMENTS_CLARIFICATION", "score": 85, "rationale": "Detailed justification...", "evidence": "verbatim quote..." },
                    { "dimension": "ALGORITHMIC_REASONING", "score": 75, "rationale": "...", "evidence": "..." },
                    { "dimension": "EDGE_CASE_THOROUGHNESS", "score": 60, "rationale": "...", "evidence": "..." },
                    { "dimension": "COMMUNICATION_CLARITY", "score": 90, "rationale": "...", "evidence": "..." },
                    { "dimension": "CODE_QUALITY", "score": 80, "rationale": "...", "evidence": "..." }
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
                  "executiveSummary": "Comprehensive summary highlighting candidate engineering maturity, algorithmic approach, and final hiring recommendation rationale."
                }
                """;

        String userPrompt = buildSanitizedUserPrompt(request);

        try {
            String rawResponse = client.generateCompletion(
                    provider,
                    systemInstruction,
                    userPrompt,
                    configuredApiKey,
                    null
            );

            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            LlmRubricPayload parsed = objectMapper.readValue(cleanJson, LlmRubricPayload.class);

            if (parsed == null || parsed.dimensions == null || parsed.dimensions.isEmpty()) {
                log.warn("⚠️ LLM rubric response parsed to empty structure. Returning deterministic fallback.");
                return RubricResponse.emptyFallback();
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
            return RubricResponse.emptyFallback();
        }
    }

    private String buildSanitizedUserPrompt(RubricEvaluationRequest req) {
        StringBuilder sb = new StringBuilder();
        sb.append("Challenge: ").append(req.problemSlug()).append("\n");
        sb.append("Track: ").append(req.track()).append(" | Difficulty: ").append(req.difficulty()).append("\n\n");
        sb.append("Canonical Problem Statement:\n").append(req.problemStatement()).append("\n\n");

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
