package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.ProblemCatalogClient;
import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.dto.GenerateQuestionRequest;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import com.interviewos.ai.model.DifficultyLevel;
import com.interviewos.ai.model.InterviewTrack;
import com.interviewos.ai.util.JsonCleaner;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestratorService {

    private final AiClientFactory clientFactory;
    private final ProblemCatalogClient problemCatalogClient;
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
                    List.of("data-structures", "caching"),
                    "Implement an LRU Cache with standard I/O operations (Line 1: capacity, followed by put k v / get k).",
                    "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        // LRU Cache\n    }\n}",
                    Map.of("java", "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        // LRU Cache\n    }\n}"),
                    Map.of(),
                    List.of(),
                    List.of(new GenerateQuestionResponse.TestCaseView("Sample 1", "2\nput 1 1\nget 1", "1")),
                    List.of("O(1) Get and Put", "Capacity eviction")
            );
        }

        // 2. Personalize Problem Statement using LLM (Grounding in Candidate Role / JD)
        String finalStatement = selectedItem.problemStatement();
        try {
            AiClient client = clientFactory.getClient(request.modelProvider());
            String systemInstruction = """
                    You are a Principal Software Engineer conducting a high-signal technical assessment.
                    The candidate is applying for: %s (%s).
                    Resume/Job Context: %s
                    
                    Your task: Introduce this technical challenge to the candidate in a realistic, professional interviewer voice, grounding it in their context.
                    CRITICAL: You MUST preserve the EXACT input/output format, constraints, and operational commands intact. Return ONLY the plain text description.
                    """.formatted(
                    request.roleTitle(),
                    request.difficulty(),
                    request.jobDescription() != null ? request.jobDescription() : "Standard Enterprise Tech Profile"
            );

            String userPrompt = "Canonical Challenge:\n" + selectedItem.problemStatement();
            String personalized = client.generateCompletion(
                    request.modelProvider(),
                    systemInstruction,
                    userPrompt,
                    request.apiKey(),
                    request.modelName()
            );

            if (personalized != null && !personalized.isBlank() && !personalized.contains("error")) {
                finalStatement = personalized.trim();
            }
        } catch (Exception e) {
            log.info("Using canonical question statement: {}", e.getMessage());
        }

        String primaryStarter = selectedItem.starterCode();
        if ((primaryStarter == null || primaryStarter.isBlank()) && selectedItem.starterCodeMap() != null) {
            primaryStarter = selectedItem.starterCodeMap().getOrDefault("java",
                    selectedItem.starterCodeMap().values().stream().findFirst().orElse(""));
        }

        return GenerateQuestionResponse.builder()
                .problemSlug(selectedItem.slug())
                .title(selectedItem.title())
                .track(request.track())
                .difficulty(request.difficulty())
                .problemStatement(finalStatement)
                .starterCode(primaryStarter)
                .starterCodeMap(selectedItem.starterCodeMap() != null ? selectedItem.starterCodeMap() : Map.of())
                .starterFiles(selectedItem.starterFiles() != null ? selectedItem.starterFiles() : Map.of())
                .editablePaths(selectedItem.editablePaths() != null ? selectedItem.editablePaths() : List.of())
                .sampleTests(selectedItem.sampleTests() != null ? selectedItem.sampleTests() : List.of())
                .hints(List.of(
                        "Think about core data structure mechanics, operational complexity, and invariant guarantees.",
                        "Verify boundary conditions such as capacity limits, empty collections, and duplicate entries."
                ))
                .evaluationCriteria(selectedItem.evaluationCriteria() != null ? selectedItem.evaluationCriteria() : List.of(
                        "Optimal time and space complexity",
                        "Clean exception and boundary condition handling"
                ))
                .build();
    }

    /**
     * Handles live conversational dialogue, probing follow-up questions grounded in Question Bank seeds, and code review.
     */
    public AiDialogueResponse processDialogue(AiDialogueRequest request) {
        AiClient client = clientFactory.getClient(request.modelProvider());

        StringBuilder systemInstructionBuilder = new StringBuilder("""
                You are an empathetic yet rigorous Senior Technical Interviewer conducting a live interview.
                Assess the candidate's explanation and code submission against the problem context.
                
                CRITICAL INSTRUCTION: You MUST reply ONLY with a valid raw JSON object matching this schema:
                {
                  "interviewerReply": "Direct conversational feedback acknowledging what they said/coded",
                  "followUpQuestion": "A sharp technical follow-up (e.g. edge case, scaling, or complexity optimization)",
                  "isSolutionComplete": true/false,
                  "codeAnalysis": "Short evaluation of time/space complexity or code quality",
                  "keyStrengths": ["Strength 1", "Strength 2"],
                  "areasToImprove": ["Area 1"]
                }
                """);

        // Grounding with Question Bank follow-up seeds
        String resolvedSlug = resolveProblemSlug(request);
        if (resolvedSlug != null && !resolvedSlug.isBlank()) {
            try {
                Optional<ProblemCatalogClient.QuestionFullDetail> detailOpt = problemCatalogClient.getFullQuestionDetail(resolvedSlug);
                if (detailOpt.isPresent()) {
                    var detail = detailOpt.get();
                    if (detail.interviewerNotes() != null && detail.interviewerNotes().followUpSeeds() != null && !detail.interviewerNotes().followUpSeeds().isEmpty()) {
                        systemInstructionBuilder.append("\nSuggested Follow-Up Topics for this challenge (probe candidate on these when appropriate):\n");
                        for (String seed : detail.interviewerNotes().followUpSeeds()) {
                            systemInstructionBuilder.append("- ").append(seed).append("\n");
                        }
                    }
                }
            } catch (Exception e) {
                log.debug("Notice on fetching question followUpSeeds: {}", e.getMessage());
            }
        }

        if (request.latestExecution() != null) {
            systemInstructionBuilder.append(String.format("""
                    
                    Latest sandbox result: %d/%d passed (%s) in %.1fms.
                    If the candidate has already passed all tests, acknowledge it and ask about complexity/edge cases. Do NOT claim the code is incomplete or missing.
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
                    request.modelProvider(),
                    systemInstruction,
                    userPrompt,
                    request.apiKey(),
                    request.modelName()
            );

            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            return objectMapper.readValue(cleanJson, AiDialogueResponse.class);
        } catch (Exception e) {
            log.warn("⚠️ LLM dialogue extraction warning: {}. Using structured fallback dialogue turn.", e.getMessage());
            return new AiDialogueResponse(
                    "Thank you for sharing your approach. I see your logic taking shape.",
                    "How would you optimize this solution for higher concurrent throughput or handle edge cases where input is empty or scaled to 10M records?",
                    false,
                    "Algorithmic structure looks promising. Focus on time/space trade-offs and boundary condition validation.",
                    List.of("Clear communicative thought process", "Structured problem breakdown"),
                    List.of("Explicit Big-O complexity analysis", "Edge-case error handling")
            );
        }
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