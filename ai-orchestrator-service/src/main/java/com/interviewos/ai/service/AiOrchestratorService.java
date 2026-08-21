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
     * Generates a tailored interview question driven by the verified Problem Catalog.
     */
    public GenerateQuestionResponse generateQuestion(GenerateQuestionRequest request) {
        String trackStr = request.track() != null ? request.track().name() : "";
        String diffStr = request.difficulty() != null ? request.difficulty().name() : "";

        // 1. Fetch Verified Problems from Catalog
        List<ProblemCatalogClient.ProblemCatalogItem> catalog = problemCatalogClient.fetchProblems(trackStr, diffStr);

        ProblemCatalogClient.ProblemCatalogItem selectedItem = null;
        if (!catalog.isEmpty()) {
            List<String> previous = request.previousQuestions() != null ? request.previousQuestions() : List.of();
            selectedItem = catalog.stream()
                    .filter(p -> !previous.contains(p.problemSlug()) && !previous.contains(p.title()))
                    .findFirst()
                    .orElse(catalog.get(0));
        }

        if (selectedItem == null) {
            // Default resilient fallback catalog item with standard I/O contract
            selectedItem = new ProblemCatalogClient.ProblemCatalogItem(
                    "lru-cache",
                    "LRU Cache Implementation",
                    request.track() != null ? request.track().name() : "ALGORITHMS_DATA_STRUCTURES",
                    request.difficulty() != null ? request.difficulty().name() : "SENIOR",
                    "Implement an LRU Cache with standard I/O operations (Line 1: capacity, followed by put k v / get k).",
                    Map.of("java", "import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        // LRU Cache Standard I/O\n    }\n}"),
                    List.of(new GenerateQuestionResponse.TestCaseView("Sample 1", "2\nput 1 1\nget 1", "1"))
            );
        }

        // 2. Personalize Problem Statement using LLM (Grounding in Resume / Candidate Profile)
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
            log.info("Using canonical catalog problem statement: {}", e.getMessage());
        }

        String primaryStarter = selectedItem.starterCode() != null
                ? selectedItem.starterCode().getOrDefault("java", selectedItem.starterCode().values().stream().findFirst().orElse(""))
                : "";

        return GenerateQuestionResponse.builder()
                .problemSlug(selectedItem.problemSlug())
                .title(selectedItem.title())
                .track(request.track())
                .difficulty(request.difficulty())
                .problemStatement(finalStatement)
                .starterCode(primaryStarter)
                .starterCodeMap(selectedItem.starterCode())
                .sampleTests(selectedItem.sampleTests())
                .hints(List.of(
                        "Think about the core data structure trade-offs for constant-time lookup and ordering.",
                        "Verify boundary conditions such as capacity eviction, duplicate keys, and empty inputs."
                ))
                .evaluationCriteria(List.of(
                        "O(1) Time Complexity on core operations",
                        "Correct standard I/O execution with zero compiler warnings",
                        "Clean exception and capacity handling"
                ))
                .build();
    }

    /**
     * Handles live conversational dialogue, probing follow-up questions, and code review.
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
}