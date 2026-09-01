package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.ProblemCatalogClient;
import com.interviewos.ai.client.SessionTranscriptClient;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.dto.GenerateQuestionRequest;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import com.interviewos.ai.dto.TranscriptTurnDto;
import com.interviewos.ai.model.DifficultyLevel;
import com.interviewos.ai.model.InterviewTrack;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.util.DialogueMemoryBuilder;
import com.interviewos.ai.util.JsonCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestratorService {

    private final AiClientFactory clientFactory;
    private final AiProviderProperties providerProperties;
    private final ProblemCatalogClient problemCatalogClient;
    private final SessionTranscriptClient sessionTranscriptClient;
    private final ObjectMapper objectMapper;

    /**
     * Generates a tailored interview question matched via Question Bank and personalized by LLM.
     */
    public GenerateQuestionResponse generateQuestion(GenerateQuestionRequest request) {
        String trackStr = request.track() != null ? request.track().name() : "ALGORITHMS_DATA_STRUCTURES";
        String diffStr = request.difficulty() != null ? request.difficulty().name() : "JUNIOR";
        String providerStr = request.modelProvider() != null ? request.modelProvider().name() : "";
        List<String> skills = request.resumeSkills() != null ? request.resumeSkills() : List.of();

        // 1. Fetch matched problem from centralized Question Bank
        Optional<ProblemCatalogClient.QuestionMatchResult> matchOpt = problemCatalogClient.matchQuestion(
                trackStr,
                diffStr,
                skills,
                request.jobDescription(),
                providerStr,
                request.apiKey()
        );

        ProblemCatalogClient.QuestionPublicItem selectedItem;
        if (matchOpt.isPresent() && matchOpt.get().question() != null) {
            selectedItem = matchOpt.get().question();
            log.info("Matched Question Bank problem '{}' ({}) - LLM Assisted: {}",
                    selectedItem.slug(), selectedItem.title(), matchOpt.get().llmAssisted());
        } else {
            // Resilient fallback item
            selectedItem = new ProblemCatalogClient.QuestionPublicItem(
                    "lru-cache",
                    "LRU Cache Implementation",
                    trackStr,
                    diffStr,
                    List.of("HashMap", "DoublyLinkedList", "O(1)"),
                    "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.",
                    "// Implement LRU Cache\n",
                    Map.of("java", "// Java starter\n"),
                    Map.of(),
                    List.of(),
                    List.of(),
                    List.of("1 <= capacity <= 3000", "0 <= key <= 10000", "0 <= value <= 10^5", "At most 2 * 10^5 calls to get/put"),
                    List.of("O(1) get and put operations", "Clean eviction mechanics")
            );
        }

        return GenerateQuestionResponse.builder()
                .problemSlug(selectedItem.slug())
                .title(selectedItem.title())
                .track(InterviewTrack.valueOf(selectedItem.track()))
                .difficulty(DifficultyLevel.valueOf(selectedItem.difficulty()))
                .problemStatement(selectedItem.problemStatement())
                .starterCode(selectedItem.starterCode())
                .starterCodeMap(selectedItem.starterCodeMap() != null ? selectedItem.starterCodeMap() : Map.of())
                .starterFiles(selectedItem.starterFiles() != null ? selectedItem.starterFiles() : Map.of())
                .editablePaths(selectedItem.editablePaths() != null ? selectedItem.editablePaths() : List.of())
                .sampleTests(selectedItem.sampleTests() != null ? selectedItem.sampleTests() : List.of())
                .hints(List.of(
                        "Think about core data structure mechanics, operational complexity, and invariant guarantees.",
                        "Verify boundary conditions such as capacity limits, empty collections, and duplicate entries."
                ))
                .constraints(selectedItem.constraints() != null ? selectedItem.constraints() : List.of())
                .evaluationCriteria(selectedItem.evaluationCriteria() != null ? selectedItem.evaluationCriteria() : List.of(
                        "Optimal time and space complexity",
                        "Clean exception and boundary condition handling"
                ))
                .build();
    }

    /**
     * Handles live conversational dialogue, memory construction, adaptive directives, and single-pass intent extraction.
     */
    public AiDialogueResponse processDialogue(AiDialogueRequest request) {
        ModelProvider effectiveProvider = request.modelProvider() != null ? request.modelProvider() : ModelProvider.GROQ;
        String effectiveApiKey = request.apiKey();

        if (effectiveProvider == ModelProvider.GEMINI && (effectiveApiKey == null || effectiveApiKey.isBlank()) && !isGeminiConfigured()) {
            if (isGroqConfigured()) {
                log.info("⚡ Auto-routing dialogue from unconfigured GEMINI to configured GROQ provider");
                effectiveProvider = ModelProvider.GROQ;
            }
        }

        AiClient client = clientFactory.getClient(effectiveProvider);

        // 1. Fetch lightweight session transcript for memory (graceful fallback to empty list)
        List<TranscriptTurnDto> transcript = List.of();
        if (request.sessionId() != null) {
            transcript = sessionTranscriptClient.fetchSessionTranscript(request.sessionId());
        }

        // 2. Fetch full question details for followUpSeeds & coaching hints
        String resolvedSlug = resolveProblemSlug(request);
        String coachingHint = null;
        List<String> followUpSeeds = new ArrayList<>();

        if (resolvedSlug != null && !resolvedSlug.isBlank()) {
            try {
                Optional<ProblemCatalogClient.QuestionFullDetail> detailOpt = problemCatalogClient.getFullQuestionDetail(resolvedSlug);
                if (detailOpt.isPresent()) {
                    var detail = detailOpt.get();
                    if (detail.interviewerNotes() != null && detail.interviewerNotes().followUpSeeds() != null) {
                        followUpSeeds.addAll(detail.interviewerNotes().followUpSeeds());
                    }
                    if (detail.coaching() != null) {
                        List<String> mistakes = detail.coaching().commonMistakes();
                        String outline = detail.coaching().modelAnswerOutline();
                        StringBuilder coachSb = new StringBuilder();
                        if (mistakes != null && !mistakes.isEmpty()) {
                            coachSb.append("Common Mistakes: ").append(String.join("; ", mistakes)).append(". ");
                        }
                        if (outline != null && !outline.isBlank()) {
                            coachSb.append("Model Approach Outline: ").append(outline);
                        }
                        coachingHint = coachSb.toString().trim();
                    }
                }
            } catch (Exception e) {
                log.debug("Notice on fetching question coaching details: {}", e.getMessage());
            }
        }

        // 3. Build Conversation Memory & Adaptive Directives
        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(
                transcript,
                request.candidateExplanation(),
                coachingHint
        );

        boolean isPlayground = "PLAYGROUND".equalsIgnoreCase(request.getEffectiveMode());

        StringBuilder systemInstructionBuilder = new StringBuilder();
        if (isPlayground) {
            systemInstructionBuilder.append("""
                    You are Coach Sam, a FAANG Senior Tech Lead and Code & Architecture Coach helping a software engineer practice.
                    The candidate is practicing in an unproctored playground.
                    Do not state your own name or introduce yourself by name in your responses. The UI displays your persona header separately.
                    Your coaching principles:
                    1. If they're stuck: give progressive Socratic hints (do NOT give away the complete answer immediately).
                    2. If they ask "how do I solve this?": walk through the algorithmic approach and data structure choices step-by-step.
                    3. If they submit wrong code: explain clearly WHY it fails (e.g. edge cases, off-by-one, time complexity) and suggest targeted fixes.
                    4. If they submit correct code: congratulate them and suggest further performance, memory, or idiomatic optimizations.
                    5. Never formally evaluate, pass/fail, or score. Never say "that's incorrect, moving on."
                    6. Use guided Socratic questioning: e.g. "What happens when the input array is empty or has duplicates?"
                    7. If they ask for the solution directly: reveal the approach cleanly and explain key lines.

                    PRACTICE CONVERSATION MEMORY:
                    - Running summary: %s
                    - Recent turns:
                    %s
                    - Intent history: %s

                    CRITICAL INSTRUCTION: You MUST reply ONLY with a valid raw JSON object matching this schema:
                    {
                      "interviewerReply": "Supportive coaching feedback acknowledging their thought process and guidance",
                      "followUpQuestion": "A thought-provoking question to deepen their intuition or next step to implement",
                      "isSolutionComplete": true/false,
                      "codeAnalysis": "Constructive feedback on code structure, time/space complexity, or bug diagnosis",
                      "keyStrengths": ["Strength 1", "Strength 2"],
                      "areasToImprove": ["Tip 1"],
                      "detectedIntent": "CLARIFYING | EXPLAINING_APPROACH | CODING | STUCK | COMPLETE",
                      "turnSummary": "Concise summary of this practice turn in <= 25 words",
                      "recommendedAction": "OFFER_HINT | PROBE_DEEPER | ANSWER_CLARIFICATION | ADVANCE_STAGE"
                    }
                    """.formatted(
                    memory.runningSummary(),
                    memory.recentVerbatim(),
                    memory.intentHistory().isEmpty() ? "[]" : memory.intentHistory().toString()
            ));
        } else {
            systemInstructionBuilder.append("""
                    You are Mickey, a FAANG Principal Software Engineer and Bar Raiser conducting a live, rigorous technical interview assessment.
                    Do not state your own name or introduce yourself by name in your responses. The UI displays your persona header separately.
                    Assess the candidate's explanation and code submission against the problem context with high architectural and engineering standards.
                    
                    CONVERSATION MEMORY:
                    - Running summary: %s
                    - Last turns verbatim:
                    %s
                    - Intent history: %s
                    
                    ADAPTIVE DIRECTIVE (apply exactly this guidance in your response):
                    - %s
                    
                    CRITICAL INSTRUCTION: You MUST reply ONLY with a valid raw JSON object matching this schema:
                    {
                      "interviewerReply": "Direct conversational feedback acknowledging what they said/coded",
                      "followUpQuestion": "A sharp technical follow-up (e.g. edge case, scaling, or complexity optimization)",
                      "isSolutionComplete": true/false,
                      "codeAnalysis": "Short evaluation of time/space complexity or code quality",
                      "keyStrengths": ["Strength 1", "Strength 2"],
                      "areasToImprove": ["Area 1"],
                      "detectedIntent": "CLARIFYING | EXPLAINING_APPROACH | CODING | STUCK | COMPLETE",
                      "turnSummary": "Concise summary of this candidate turn in <= 25 words",
                      "recommendedAction": "PROBE_DEEPER | OFFER_HINT | ADVANCE_STAGE | ANSWER_CLARIFICATION"
                    }
                    """.formatted(
                    memory.runningSummary(),
                    memory.recentVerbatim(),
                    memory.intentHistory().isEmpty() ? "[]" : memory.intentHistory().toString(),
                    memory.adaptiveDirective()
            ));
        }

        if (!followUpSeeds.isEmpty()) {
            systemInstructionBuilder.append("\nSuggested Follow-Up Topics for this challenge (probe candidate on these when appropriate):\n");
            for (String seed : followUpSeeds) {
                systemInstructionBuilder.append("- ").append(seed).append("\n");
            }
        }

        boolean isExecutionAvailable = request.latestExecution() != null && request.latestExecution().totalTests() > 0;
        boolean isAllTestsPassed = isExecutionAvailable &&
                request.latestExecution().passedTests() == request.latestExecution().totalTests() &&
                ("PASSED".equalsIgnoreCase(request.latestExecution().status()) || "ACCEPTED".equalsIgnoreCase(request.latestExecution().status()));
        boolean isExecutionFailed = isExecutionAvailable && !isAllTestsPassed;

        if (isAllTestsPassed) {
            if (isPlayground) {
                systemInstructionBuilder.append(String.format("""
                        
                        CRITICAL - ALL TEST CASES PASSED / SUBMISSION COMPLETE:
                        The candidate's solution ran in the sandbox and PASSED ALL %d/%d test cases cleanly!
                        Your response MUST:
                        1. Start by congratulating the candidate and confirming explicitly: "Your solution is correct and passes all test cases! Excellent work."
                        2. Tell them clearly: "You can now move to the next question using the Question Rail on the left, or finish and submit the practice session."
                        3. Set "isSolutionComplete": true.
                        4. Set "detectedIntent": "COMPLETE".
                        5. Set "recommendedAction": "ADVANCE_STAGE".
                        6. Do NOT ask generic "how would you optimize" filler questions that ignore their passing solution.
                        """,
                        request.latestExecution().passedTests(),
                        request.latestExecution().totalTests()
                ));
            } else {
                systemInstructionBuilder.append(String.format("""
                        
                        CRITICAL - ALL TEST CASES PASSED / CODE SUBMITTED:
                        The candidate's solution PASSED ALL %d/%d test cases in the sandbox!
                        Acknowledge that all test cases passed successfully.
                        Set "isSolutionComplete": true and "recommendedAction": "ADVANCE_STAGE".
                        """,
                        request.latestExecution().passedTests(),
                        request.latestExecution().totalTests()
                ));
            }
        } else if (isExecutionFailed) {
            int passed = request.latestExecution().passedTests();
            int total = request.latestExecution().totalTests();
            String status = request.latestExecution().status() != null ? request.latestExecution().status() : "FAILED";
            systemInstructionBuilder.append(String.format("""
                    
                    CRITICAL - CODE EXECUTION FAILED:
                    The candidate's latest run FAILED (%d/%d test cases passed, status: %s).
                    NEVER claim tests passed or congratulate them on passing.
                    Acknowledge the failure, reference the failing test case or error, and ask one guiding debugging question to help them fix the issue.
                    Set "isSolutionComplete": false and "recommendedAction": "OFFER_HINT".
                    """,
                    passed, total, status
            ));
        } else if (request.latestExecution() != null) {
            systemInstructionBuilder.append(String.format("""
                    
                    Latest sandbox result: %d/%d passed (%s) in %.1fms.
                    """,
                    request.latestExecution().passedTests(),
                    request.latestExecution().totalTests(),
                    request.latestExecution().status(),
                    request.latestExecution().executionTimeMs()));
        }

        String systemInstruction = systemInstructionBuilder.toString();

        String userPrompt = """
                Problem Context:
                %s
                
                Candidate Latest Explanation:
                %s
                
                Candidate Code Snippet:
                %s
                
                Generate realistic, natural interviewer dialogue response in strict JSON format.
                """.formatted(
                request.questionContext(),
                request.candidateExplanation(),
                request.candidateCode() != null ? request.candidateCode() : "No code written yet"
        );

        try {
            String rawResponse = client.generateCompletion(
                    effectiveProvider,
                    systemInstruction,
                    userPrompt,
                    effectiveApiKey,
                    request.modelName() != null ? request.modelName() : "dialogue"
            );

            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            JsonNode root = objectMapper.readTree(cleanJson);

            String reply = root.hasNonNull("interviewerReply") ? root.get("interviewerReply").asText() : "I see your technical direction.";
            String followUp = root.hasNonNull("followUpQuestion") ? root.get("followUpQuestion").asText() : "How would you handle boundary conditions and scale?";
            boolean isComplete = root.hasNonNull("isSolutionComplete") && root.get("isSolutionComplete").asBoolean(false);
            String codeAnalysis = root.hasNonNull("codeAnalysis") ? root.get("codeAnalysis").asText() : "";

            List<String> strengths = new ArrayList<>();
            if (root.has("keyStrengths") && root.get("keyStrengths").isArray()) {
                root.get("keyStrengths").forEach(s -> strengths.add(s.asText()));
            }
            List<String> areas = new ArrayList<>();
            if (root.has("areasToImprove") && root.get("areasToImprove").isArray()) {
                root.get("areasToImprove").forEach(a -> areas.add(a.asText()));
            }

            // Defaults for intent and action fields
            String detectedIntent = root.hasNonNull("detectedIntent") && !root.get("detectedIntent").asText().isBlank()
                    ? root.get("detectedIntent").asText().trim()
                    : "EXPLAINING_APPROACH";

            String turnSummary = root.hasNonNull("turnSummary") && !root.get("turnSummary").asText().isBlank()
                    ? root.get("turnSummary").asText().trim()
                    : "Candidate shared technical explanation.";

            String recommendedAction = root.hasNonNull("recommendedAction") && !root.get("recommendedAction").asText().isBlank()
                    ? root.get("recommendedAction").asText().trim()
                    : "PROBE_DEEPER";

            // POST-GUARD: Never trust the model on verdicts
            if (isExecutionFailed && reply.toLowerCase().matches(".*(all (test cases? )?(passed|pass|correct|solved)|passes all|passed all|passed successfully).*")) {
                reply = String.format(
                    "I see your submission resulted in %d/%d test cases passing. Let's debug this together. " +
                    "Can you walk me through your approach and where you think the logic might be breaking down?",
                    request.latestExecution().passedTests(),
                    request.latestExecution().totalTests()
                );
                followUp = "What edge case or logic error do you think caused the failing test case, and how can we debug it?";
                isComplete = false;
                recommendedAction = "OFFER_HINT";
                log.info("POST-GUARD: Replaced LLM reply that incorrectly claimed tests passed");
            }

            return new AiDialogueResponse(
                    reply,
                    followUp,
                    isComplete,
                    codeAnalysis,
                    strengths,
                    areas,
                    detectedIntent,
                    turnSummary,
                    recommendedAction
            );
        } catch (Exception e) {
            log.warn("⚠️ LLM dialogue extraction notice: {}. Using completion-aware structured fallback dialogue.", e.getMessage());

            if (isAllTestsPassed) {
                int passed = request.latestExecution().passedTests();
                int total = request.latestExecution().totalTests();
                return new AiDialogueResponse(
                        String.format("Your solution is correct and passes all %d/%d test cases! Excellent work.", passed, total),
                        "You can now move to the next question using the Question Rail on the left, or advance to the next stage.",
                        true,
                        "Solution passes all sandbox functional test cases cleanly.",
                        List.of("Passed all test invariants", "Correct boundary and edge case handling"),
                        List.of("Continue practicing multi-track challenges"),
                        "COMPLETE",
                        "Candidate successfully solved and submitted passing solution.",
                        "ADVANCE_STAGE"
                );
            } else if (isExecutionFailed) {
                int passed = request.latestExecution().passedTests();
                int total = request.latestExecution().totalTests();
                String status = request.latestExecution().status() != null ? request.latestExecution().status() : "FAILED";
                return new AiDialogueResponse(
                        String.format("Your latest execution resulted in %s with %d/%d test cases passing.", status, passed, total),
                        "Which test case or edge condition do you think failed, and what adjustments should we make to the code?",
                        false,
                        "The solution encountered test case failures or compilation/runtime errors.",
                        List.of("Active attempt on problem implementation"),
                        List.of("Diagnose failing test case boundary conditions"),
                        "EXPLAINING_APPROACH",
                        "Candidate submitted solution that did not pass all test cases.",
                        "OFFER_HINT"
                );
            }

            return new AiDialogueResponse(
                    "Thank you for sharing your approach. I see your logic taking shape.",
                    "How would you optimize this solution for higher concurrent throughput or handle edge cases where input is empty or scaled to 10M records?",
                    false,
                    "Algorithmic structure looks promising. Focus on time/space trade-offs and boundary condition validation.",
                    List.of("Clear communicative thought process", "Structured problem breakdown"),
                    List.of("Explicit Big-O complexity analysis", "Edge-case error handling"),
                    "EXPLAINING_APPROACH",
                    "Candidate provided technical explanation.",
                    "PROBE_DEEPER"
            );
        }
    }

    private boolean isGroqConfigured() {
        try {
            var cfg = providerProperties.getConfigFor(ModelProvider.GROQ);
            if (cfg != null && cfg.apiKey() != null && !cfg.apiKey().isBlank()) return true;
        } catch (Exception ignored) {}
        String envKey = System.getenv("GROQ_API_KEY");
        return envKey != null && !envKey.isBlank();
    }

    private boolean isGeminiConfigured() {
        try {
            var cfg = providerProperties.getConfigFor(ModelProvider.GEMINI);
            if (cfg != null && cfg.apiKey() != null && !cfg.apiKey().isBlank()) return true;
        } catch (Exception ignored) {}
        String envKey = System.getenv("GEMINI_API_KEY");
        return envKey != null && !envKey.isBlank();
    }

    private String resolveProblemSlug(AiDialogueRequest req) {
        if (req.problemSlug() != null && !req.problemSlug().isBlank()) {
            return req.problemSlug().trim();
        }
        String ctx = req.questionContext() != null ? req.questionContext().toLowerCase() : "";
        if (ctx.contains("lld-order-service") || ctx.contains("order service") || ctx.contains("spring boot order")) {
            return "lld-order-service";
        }
        if (ctx.contains("lru-cache") || ctx.contains("lru cache")) {
            return "lru-cache";
        }
        if (ctx.contains("reverse-a-string") || ctx.contains("reverse a string")) {
            return "reverse-a-string";
        }
        if (ctx.contains("two-sum") || ctx.contains("two sum")) {
            return "two-sum";
        }
        return null;
    }
}