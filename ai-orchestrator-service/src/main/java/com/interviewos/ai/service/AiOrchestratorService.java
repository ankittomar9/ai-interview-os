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
import com.interviewos.ai.dto.AiHandoffRequest;
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
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestratorService {

    private static final Pattern AFFIRMATIVE_CONSENT_PATTERN = Pattern.compile(
            "(?i)\\b(yes|yeah|yep|yup|sure|ok|okay|ready|let's go|lets go|go ahead|sounds good|move on)\\b"
    );

    private static final Pattern NEGATION_GUARD_PATTERN = Pattern.compile(
            "(?i)\\b(not yet|not ready|don't|dont|do not|later)\\b"
    );

    public static boolean hasAffirmativeConsent(String candidateText) {
        if (candidateText == null || candidateText.isBlank()) {
            return false;
        }
        boolean hasAffirmative = AFFIRMATIVE_CONSENT_PATTERN.matcher(candidateText).find();
        boolean hasNegation = NEGATION_GUARD_PATTERN.matcher(candidateText).find();
        return hasAffirmative && !hasNegation;
    }

    private final AiClientFactory clientFactory;
    private final AiProviderProperties providerProperties;
    private final ProblemCatalogClient problemCatalogClient;
    private final SessionTranscriptClient sessionTranscriptClient;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ProviderStatusService providerStatusService;

    public void setProviderStatusService(ProviderStatusService providerStatusService) {
        this.providerStatusService = providerStatusService;
    }

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
        ModelProvider effectiveProvider = resolveEffectiveProvider(request.modelProvider(), request.apiKey());
        String effectiveApiKey = request.apiKey();

        AiClient client = clientFactory.getClient(effectiveProvider);

        // 1. Fetch lightweight session transcript for memory (graceful fallback to empty list)
        List<TranscriptTurnDto> transcript = List.of();
        if (request.sessionId() != null) {
            transcript = sessionTranscriptClient.fetchSessionTranscript(request.sessionId());
        }

        // SPEC-008: Defense-in-depth echo contamination check against previous interviewer turn
        String lastInterviewerText = null;
        if (transcript != null) {
            for (int i = transcript.size() - 1; i >= 0; i--) {
                String role = transcript.get(i).senderRole();
                if ("INTERVIEWER".equalsIgnoreCase(role) || "AI".equalsIgnoreCase(role)) {
                    lastInterviewerText = transcript.get(i).content();
                    break;
                }
            }
        }
        if (lastInterviewerText == null && request.chatHistory() != null) {
            for (int i = request.chatHistory().size() - 1; i >= 0; i--) {
                var msg = request.chatHistory().get(i);
                if ("interviewer".equalsIgnoreCase(msg.role()) || "ai".equalsIgnoreCase(msg.role())) {
                    lastInterviewerText = msg.content();
                    break;
                }
            }
        }

        if (request.candidateExplanation() != null && lastInterviewerText != null &&
                DialogueMemoryBuilder.isEchoContaminated(request.candidateExplanation(), lastInterviewerText, 8, 0.80)) {
            log.warn("🚨 Echo contamination detected in candidate turn for session {}. Excluding from memory and providing honest prompt.", request.sessionId());
            return new AiDialogueResponse(
                    "My audio may have bled into your mic — please continue from where you stopped.",
                    null,
                    false,
                    null,
                    List.of(),
                    List.of(),
                    "EXPLAINING_APPROACH",
                    "Echo filtered from mic input.",
                    "PROBE_DEEPER"
            );
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
        boolean isPlayground = "PLAYGROUND".equalsIgnoreCase(request.getEffectiveMode());
        boolean isGatedType = isGatedSectionType(request.sectionType());
        boolean isInterviewMode = !isPlayground;

        List<TranscriptTurnDto> currentSectionTurns = extractCurrentSectionTurns(transcript, request.sectionType(), request.sectionIndex());
        int candidateTurnCount = 0;
        for (TranscriptTurnDto t : currentSectionTurns) {
            if ("CANDIDATE".equalsIgnoreCase(t.senderRole())) {
                candidateTurnCount++;
            }
        }
        boolean isGatedSectionLocked = isGatedType && isInterviewMode;

        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(
                transcript,
                request.candidateExplanation(),
                coachingHint,
                isGatedSectionLocked,
                candidateTurnCount
        );

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
                      "recommendedAction": "OFFER_HINT | PROBE_DEEPER | ANSWER_CLARIFICATION | ADVANCE_STAGE",
                      "usedFollowUpSeedIds": []
                    }
                    """.formatted(
                    memory.runningSummary(),
                    memory.recentVerbatim(),
                    memory.intentHistory().isEmpty() ? "[]" : memory.intentHistory().toString()
            ));
        } else {
            systemInstructionBuilder.append("""
                    You are Dr. Anya Chen, AI Principal Bar Raiser conducting a live, rigorous technical interview assessment.
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
                      "recommendedAction": "PROBE_DEEPER | OFFER_HINT | PROPOSE_STAGE_ADVANCE | ADVANCE_STAGE | ANSWER_CLARIFICATION",
                      "approachAssessment": "NOT_APPLICABLE | PROBE_MORE | AGREE",
                      "usedFollowUpSeedIds": []
                    }
                    
                    In gated sections (DSA, LLD, SQL): when the candidate has articulated a workable data structure, algorithmic strategy, and time/space complexity, set approachAssessment: 'AGREE' to unlock the code editor. If their approach is fundamentally flawed or missing key algorithmic structure, set approachAssessment: 'PROBE_MORE' and name the single biggest gap.
                    """.formatted(
                    memory.runningSummary(),
                    memory.recentVerbatim(),
                    memory.intentHistory().isEmpty() ? "[]" : memory.intentHistory().toString(),
                    memory.adaptiveDirective()
            ));
        }

        if (request.candidateName() != null && !request.candidateName().isBlank()) {
            systemInstructionBuilder.append(String.format(
                    "\nThe candidate's name is %s. Address them by their first name when relevant.\n",
                    request.candidateName().trim()
            ));
        }
        systemInstructionBuilder.append(String.format("""
                
                CRITICAL IDENTITY & ANTI-INVERSION RULES:
                - NEVER assume the candidate's name is the same as your persona name.
                - Your persona name is %s. The candidate is interviewing with you.
                - NEVER address the candidate as Mickey or Dr. Anya Chen or Coach Sam.
                - If the candidate addresses you as Mickey or anything else, acknowledge it professionally and address them by their own name (%s).
                """,
                isPlayground ? "Coach Sam" : "Dr. Anya Chen",
                (request.candidateName() != null && !request.candidateName().isBlank()) ? request.candidateName().trim() : "the candidate"
        ));

        if ("INTRODUCTION".equalsIgnoreCase(request.currentStage()) || "INTRODUCTION".equalsIgnoreCase(request.sectionType())) {
            systemInstructionBuilder.append("""
                    
                    STAGE SPECIFICATION - INTRODUCTION:
                    This is the INTRODUCTION stage. Do NOT present, evaluate, or interrogate coding problems yet.
                    Welcome the candidate warmly by their first name, ask about their engineering background,
                    recent systems or projects they have built, and what they are looking for in their next role.
                    Keep the conversation natural, encouraging, and conversational.
                    There is NO time limit on the introduction; slow and accented speakers get as long as they need.
                    Do NOT jump into algorithmic complexity or code interrogation until the introduction is finished.
                    When the candidate has shared their background, politely propose moving on: "Great! Shall we dive into our first coding challenge?" and set "recommendedAction": "PROPOSE_STAGE_ADVANCE".
                    You MUST NOT set "recommendedAction": "ADVANCE_STAGE" during introduction unless the candidate has explicitly agreed or affirmed moving on ("yes", "sure", "let's go", "ready").
                    If the candidate says "not yet", has more to say, or asks a question, acknowledge warmly, keep listening, and do NOT advance stage.
                    """);

            if (isInterviewMode) {
                boolean hasCompany = request.targetCompany() != null && !request.targetCompany().isBlank();
                boolean hasJd = request.jobDescription() != null && !request.jobDescription().isBlank();
                boolean hasResume = request.resumeSummary() != null && !request.resumeSummary().isBlank();

                if (hasCompany || hasJd || hasResume) {
                    systemInstructionBuilder.append("\nCANDIDATE CONTEXT:\n");
                    if (hasCompany) {
                        systemInstructionBuilder.append("- Target Company: ").append(request.targetCompany().trim()).append("\n");
                    }
                    if (hasJd) {
                        String jd = request.jobDescription().trim();
                        if (jd.length() > 800) {
                            jd = jd.substring(0, 800);
                        }
                        systemInstructionBuilder.append("- Job Description: ").append(jd).append("\n");
                    }
                    if (hasResume) {
                        String res = request.resumeSummary().trim();
                        if (res.length() > 800) {
                            res = res.substring(0, 800);
                        }
                        systemInstructionBuilder.append("- Resume Summary: ").append(res).append("\n");
                    }
                }
                systemInstructionBuilder.append("""
                        
                        Open with ONE question grounded in a specific project, technology, or JD requirement from the context. Ask 'tell me about yourself' only if no grounded context exists.
                        """);
            }
        }

        if (request.sectionType() != null && !request.sectionType().isBlank()) {
            systemInstructionBuilder.append(String.format("""
                    
                    SECTION CONTEXT:
                    - Current Section Type: %s
                    - Section Problem: %s
                    - Section Position: %d of %d
                    - Soft Time Budget: %d minutes
                    - Section Guidance: %s
                    - Calibration Policy: Level fixed; do not adjust difficulty from performance.
                    """,
                    request.sectionType(),
                    (request.sectionQuestionTitle() != null && !request.sectionQuestionTitle().isBlank()) ? request.sectionQuestionTitle() : "Current Section Assignment",
                    request.sectionIndex() != null ? request.sectionIndex() + 1 : 1,
                    request.totalSections() != null ? request.totalSections() : 1,
                    request.softTimeBudgetMinutes() != null ? request.softTimeBudgetMinutes() : 15,
                    (request.sectionNote() != null && !request.sectionNote().isBlank()) ? request.sectionNote() : "Execute section objectives"
            ));
        }

        List<DialogueMemoryBuilder.FilteredSeed> filteredSeeds = DialogueMemoryBuilder.filterFollowUpSeeds(followUpSeeds, memory.usedFollowUpSeedIds());
        if (!filteredSeeds.isEmpty()) {
            systemInstructionBuilder.append("\nSuggested Follow-Up Topics for this challenge (probe candidate on these when appropriate):\n");
            for (DialogueMemoryBuilder.FilteredSeed fs : filteredSeeds) {
                systemInstructionBuilder.append(String.format("- [Seed %d]: %s\n", fs.index(), fs.seed()));
            }
        }

        if (!memory.askedQuestions().isEmpty()) {
            systemInstructionBuilder.append("\nALREADY ASKED (never repeat or paraphrase these questions):\n");
            for (String q : memory.askedQuestions()) {
                systemInstructionBuilder.append("- ").append(q).append("\n");
            }
        }

        boolean isExecutionAvailable = request.latestExecution() != null && request.latestExecution().totalTests() > 0;
        boolean isEngineError = request.latestExecution() != null &&
                ("ENGINE_UNAVAILABLE".equalsIgnoreCase(request.latestExecution().status()) ||
                 "ENGINE_ERROR".equalsIgnoreCase(request.latestExecution().status()));
        boolean isAllTestsPassed = !isEngineError && isExecutionAvailable &&
                request.latestExecution().passedTests() == request.latestExecution().totalTests() &&
                ("PASSED".equalsIgnoreCase(request.latestExecution().status()) || "ACCEPTED".equalsIgnoreCase(request.latestExecution().status()));
        boolean isExecutionFailed = !isEngineError && isExecutionAvailable && !isAllTestsPassed;

        if (isEngineError) {
            systemInstructionBuilder.append("""
                    
                    CRITICAL - CODE EXECUTION ENGINE OFFLINE (ENGINE_UNAVAILABLE / ENGINE_ERROR):
                    The platform could not verify this run; do not penalize the candidate for it.
                    The code execution engine is temporarily unavailable.
                    NEVER claim tests failed, and NEVER claim tests passed. Do NOT criticize the candidate's implementation for an infrastructure outage.
                    Reassure the candidate that their code is not marked wrong. Encourage them to explain their logic, approach, or time complexity while the sandbox connects.
                    Set "isSolutionComplete": false and "recommendedAction": "PROBE_DEEPER".
                    """);
        } else if (isAllTestsPassed) {
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

        String userPrompt;
        if ("INTRODUCTION".equalsIgnoreCase(request.currentStage()) || "INTRODUCTION".equalsIgnoreCase(request.sectionType())) {
            userPrompt = String.format("""
                    Current Stage: INTRODUCTION
                    Candidate Message:
                    %s
                    
                    Generate a warm, conversational introduction response as %s welcoming the candidate.
                    """,
                    request.candidateExplanation() != null ? request.candidateExplanation() : "Hi! I am ready for the interview.",
                    isPlayground ? "Coach Sam" : "Dr. Anya Chen"
            );
        } else {
            userPrompt = String.format("""
                    Problem Context:
                    %s
                    
                    Candidate Latest Explanation:
                    %s
                    
                    Candidate Code Snippet:
                    %s
                    
                    Generate realistic, natural interviewer dialogue response in strict JSON format.
                    """,
                    request.questionContext(),
                    request.candidateExplanation(),
                    request.candidateCode() != null ? request.candidateCode() : "No code written yet"
            );
        }

        try {
            String rawResponse = client.generateCompletion(
                    effectiveProvider,
                    systemInstruction,
                    userPrompt,
                    effectiveApiKey,
                    request.modelName() != null ? request.modelName() : "dialogue"
            );
            if (providerStatusService != null) {
                providerStatusService.recordOutcome(effectiveProvider, "OK", 200);
            }

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
            if (isEngineError) {
                if (reply.toLowerCase().matches(".*(all (test cases? )?(passed|pass|correct|solved)|passes all|passed all|passed successfully|your (code|solution) failed|failing test case).*")) {
                    reply = "The platform could not verify this run because the execution engine is temporarily offline; your code is not marked wrong. Can you walk me through your algorithmic approach and time complexity while the sandbox reconnects?";
                    followUp = "What is the expected time and space complexity of your implementation?";
                    isComplete = false;
                    recommendedAction = "PROBE_DEEPER";
                    log.info("POST-GUARD: Replaced LLM reply during ENGINE_ERROR to protect candidate from penalty");
                }
            } else if (isExecutionFailed && reply.toLowerCase().matches(".*(all (test cases? )?(passed|pass|correct|solved)|passes all|passed all|passed successfully).*")) {
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

            // Anti-inversion post-guard: Never let the AI address the candidate as Mickey or Dr. Anya Chen
            if (reply.matches("(?i).*\\b(mickey|dr\\.? anya chen)\\b.*")) {
                String properName = (request.candidateName() != null && !request.candidateName().isBlank())
                        ? request.candidateName().trim().split("\\s+")[0]
                        : "";
                reply = reply.replaceAll("(?i)\\b(mickey|dr\\.? anya chen)\\b", properName.isEmpty() ? "there" : properName);
                log.info("POST-GUARD: Sanitized persona name inversion from reply");
            }

            // Deterministic Affirmative Consent Guard [C0]
            if ("ADVANCE_STAGE".equalsIgnoreCase(recommendedAction)) {
                String candidateText = request.candidateExplanation() != null ? request.candidateExplanation() : "";
                if (candidateText.isBlank() && request.chatHistory() != null && !request.chatHistory().isEmpty()) {
                    for (int i = request.chatHistory().size() - 1; i >= 0; i--) {
                        var msg = request.chatHistory().get(i);
                        if ("user".equalsIgnoreCase(msg.role()) || "candidate".equalsIgnoreCase(msg.role())) {
                            candidateText = msg.content() != null ? msg.content() : "";
                            break;
                        }
                    }
                }
                if (!hasAffirmativeConsent(candidateText)) {
                    log.info("CONSENT-GUARD: Downgraded recommendedAction from ADVANCE_STAGE to PROPOSE_STAGE_ADVANCE due to missing affirmative consent or negation in candidate text: '{}'", candidateText);
                    recommendedAction = "PROPOSE_STAGE_ADVANCE";
                }
            }

            // STT-Guard: STT turns cannot trigger PROPOSE_STAGE_ADVANCE or ADVANCE_STAGE [F1.3]
            if (Boolean.TRUE.equals(request.isStt())) {
                if ("ADVANCE_STAGE".equalsIgnoreCase(recommendedAction) || "PROPOSE_STAGE_ADVANCE".equalsIgnoreCase(recommendedAction)) {
                    log.info("STT-GUARD: Suppressed {} on STT turn; resetting recommendedAction to PROBE_DEEPER", recommendedAction);
                    recommendedAction = "PROBE_DEEPER";
                }
            }

            String approachAssessment = root.hasNonNull("approachAssessment") && !root.get("approachAssessment").asText().isBlank()
                    ? root.get("approachAssessment").asText().trim().toUpperCase()
                    : "NOT_APPLICABLE";

            // IH1 Deterministic Post-guard on Approach Agreement
            if (isGatedType && isInterviewMode) {
                if (Boolean.TRUE.equals(request.isStt())) {
                    log.info("STT-GUARD: Gate mutations suppressed on STT turn; setting approachAssessment to PROBE_MORE");
                    approachAssessment = "PROBE_MORE";
                } else if ("AGREE".equalsIgnoreCase(approachAssessment)) {
                    boolean hasQualifyingTurn = hasQualifyingCandidateExplanation(currentSectionTurns);
                    boolean hasCodeExecution = hasCodeExecutionTurn(currentSectionTurns);

                    if (!hasQualifyingTurn || hasCodeExecution) {
                        log.warn("POST-GUARD: AGREE rejected (qualifyingTurn={}, codeExecution={}). Downgrading to PROBE_MORE.",
                                hasQualifyingTurn, hasCodeExecution);
                        approachAssessment = "PROBE_MORE";
                    } else {
                        int secIdx = request.sectionIndex() != null ? request.sectionIndex() : 0;
                        boolean gateOpened = sessionTranscriptClient.openSectionGate(request.sessionId(), secIdx, "APPROACH_AGREED", 0L);
                        if (!gateOpened) {
                            log.error("POST-GUARD: Failed to open gate via internal endpoint for session {} section {}. Downgrading to PROBE_MORE.",
                                    request.sessionId(), secIdx);
                            approachAssessment = "PROBE_MORE";
                        } else {
                            log.info("POST-GUARD: Gate successfully opened for session {} section {}.", request.sessionId(), secIdx);
                        }
                    }
                } else if (!"PROBE_MORE".equalsIgnoreCase(approachAssessment)) {
                    approachAssessment = "PROBE_MORE";
                }
            } else {
                approachAssessment = "NOT_APPLICABLE";
            }

            List<Integer> usedFollowUpSeedIds = new ArrayList<>();
            if (root.has("usedFollowUpSeedIds") && root.get("usedFollowUpSeedIds").isArray()) {
                root.get("usedFollowUpSeedIds").forEach(idNode -> {
                    if (idNode.isInt() || idNode.isNumber()) {
                        usedFollowUpSeedIds.add(idNode.asInt());
                    } else if (idNode.isTextual()) {
                        try {
                            usedFollowUpSeedIds.add(Integer.parseInt(idNode.asText().trim()));
                        } catch (NumberFormatException ignored) {}
                    }
                });
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
                    recommendedAction,
                    approachAssessment,
                    usedFollowUpSeedIds
            );
        } catch (Exception e) {
            if (providerStatusService != null) {
                Integer status = (e instanceof org.springframework.web.client.RestClientResponseException rce)
                        ? rce.getStatusCode().value() : null;
                providerStatusService.recordOutcome(effectiveProvider, "ERROR", status);
            }
            log.warn("⚠️ LLM dialogue extraction notice: {}. Using completion-aware structured fallback dialogue.", e.getMessage());

            String defaultApproach = (isGatedType && isInterviewMode) ? "PROBE_MORE" : "NOT_APPLICABLE";
            if (isEngineError) {
                return new AiDialogueResponse(
                        "The platform could not verify this run because the code execution engine is temporarily offline; your code has not been marked wrong.",
                        "While the sandbox reconnects, could you walk me through your algorithmic approach and time complexity?",
                        false,
                        "Execution sandbox offline. Continuing with conversational code evaluation without penalty.",
                        List.of("Proactive code implementation attempt"),
                        List.of("Walk through edge cases and Big-O complexity conceptually"),
                        "EXPLAINING_APPROACH",
                        "Candidate code execution could not be verified due to engine downtime. No penalty applied.",
                        "PROBE_DEEPER",
                        defaultApproach
                );
            } else if (isAllTestsPassed) {
                int passed = request.latestExecution().passedTests();
                int total = request.latestExecution().totalTests();
                String recAction = "ADVANCE_STAGE";
                String candidateText = request.candidateExplanation() != null ? request.candidateExplanation() : "";
                if (!hasAffirmativeConsent(candidateText)) {
                    recAction = "PROPOSE_STAGE_ADVANCE";
                }
                if (Boolean.TRUE.equals(request.isStt())) {
                    recAction = "PROBE_DEEPER";
                }
                return new AiDialogueResponse(
                        String.format("Your solution is correct and passes all %d/%d test cases! Excellent work.", passed, total),
                        "You can now move to the next question using the Question Rail on the left, or advance to the next stage.",
                        true,
                        "Solution passes all sandbox functional test cases cleanly.",
                        List.of("Passed all test invariants", "Correct boundary and edge case handling"),
                        List.of("Continue practicing multi-track challenges"),
                        "COMPLETE",
                        "Candidate successfully solved and submitted passing solution.",
                        recAction,
                        defaultApproach
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
                        "OFFER_HINT",
                        defaultApproach
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
                    "PROBE_DEEPER",
                    defaultApproach
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

    public boolean isOllamaRunning() {
        try {
            var cfg = providerProperties.getConfigFor(ModelProvider.OLLAMA);
            String endpoint = (cfg != null && cfg.endpoint() != null) ? cfg.endpoint() : "http://host.docker.internal:11434/api/generate";
            String base = endpoint.replace("/api/generate", "");
            if (base.contains("host.docker.internal") && !isRunningInsideDocker()) {
                base = base.replace("host.docker.internal", "localhost");
            }
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) java.net.URI.create(base + "/api/tags").toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(800);
            conn.setReadTimeout(800);
            return conn.getResponseCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isRunningInsideDocker() {
        return new java.io.File("/.dockerenv").exists();
    }

    public ModelProvider resolveEffectiveProvider(ModelProvider requested, String apiKey) {
        if (requested != null) {
            if (requested == ModelProvider.GEMINI && (apiKey == null || apiKey.isBlank()) && !isGeminiConfigured()) {
                if (isOllamaRunning()) {
                    log.info("⚡ Auto-routing from unconfigured GEMINI to local OLLAMA");
                    return ModelProvider.OLLAMA;
                } else if (isGroqConfigured()) {
                    log.info("⚡ Auto-routing from unconfigured GEMINI to configured GROQ");
                    return ModelProvider.GROQ;
                }
            }
            if (requested == ModelProvider.GROQ && (apiKey == null || apiKey.isBlank()) && !isGroqConfigured()) {
                if (isOllamaRunning()) {
                    log.info("⚡ Auto-routing from unconfigured GROQ to local OLLAMA");
                    return ModelProvider.OLLAMA;
                }
            }
            return requested;
        }

        // Local-First Purity default hierarchy:
        if (isOllamaRunning()) {
            log.info("🔒 Defaulting to local OLLAMA instance for dialogue (100% local purity)");
            return ModelProvider.OLLAMA;
        }
        if (isGroqConfigured()) {
            return ModelProvider.GROQ;
        }
        if (isGeminiConfigured()) {
            return ModelProvider.GEMINI;
        }
        return ModelProvider.OLLAMA;
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

    public static boolean isGatedSectionType(String sType) {
        if (sType == null) return false;
        String upper = sType.toUpperCase();
        return upper.contains("DSA") || upper.contains("LLD") || upper.contains("SQL");
    }

    public static List<TranscriptTurnDto> extractCurrentSectionTurns(List<TranscriptTurnDto> transcript, String currentSectionType, Integer currentSectionIndex) {
        if (transcript == null || transcript.isEmpty()) return List.of();
        int targetIdx = currentSectionIndex != null ? currentSectionIndex : 0;
        int start = 0;
        for (int i = transcript.size() - 1; i >= 0; i--) {
            TranscriptTurnDto t = transcript.get(i);
            Map<String, String> meta = t.metadata();
            if (meta != null) {
                if ("ROUND_BOUNDARY".equalsIgnoreCase(meta.get("type")) || "SECTION_HANDOFF".equalsIgnoreCase(meta.get("type"))) {
                    start = i;
                    break;
                }
                String sIdx = meta.get("sectionIndex");
                if (sIdx != null) {
                    try {
                        if (Integer.parseInt(sIdx) != targetIdx) {
                            start = i + 1;
                            break;
                        }
                    } catch (NumberFormatException ignored) {}
                }
                String sType = meta.get("sectionType");
                if (sType != null && currentSectionType != null && !sType.equalsIgnoreCase(currentSectionType)) {
                    start = i + 1;
                    break;
                }
            }
        }
        return transcript.subList(start, transcript.size());
    }

    public static boolean hasQualifyingCandidateExplanation(List<TranscriptTurnDto> turns) {
        if (turns == null) return false;
        for (TranscriptTurnDto t : turns) {
            if ("CANDIDATE".equalsIgnoreCase(t.senderRole())) {
                String msgType = t.messageType();
                boolean isExplanation = msgType == null || "EXPLANATION".equalsIgnoreCase(msgType) || "MESSAGE".equalsIgnoreCase(msgType);
                boolean isEcho = t.metadata() != null && "true".equalsIgnoreCase(t.metadata().get("echoFiltered"));
                String content = t.content();
                if (isExplanation && !isEcho && content != null && content.trim().length() >= 60) {
                    return true;
                }
            }
        }
        return false;
    }

    public static boolean hasCodeExecutionTurn(List<TranscriptTurnDto> turns) {
        if (turns == null) return false;
        for (TranscriptTurnDto t : turns) {
            if ("CODE_EXECUTION".equalsIgnoreCase(t.messageType())) {
                return true;
            }
            if (t.metadata() != null && "CODE_EXECUTION".equalsIgnoreCase(t.metadata().get("type"))) {
                return true;
            }
        }
        return false;
    }

    public String buildHandoffPrompt(AiHandoffRequest request, String lastTurnSummary) {
        String candidateName = (request.candidateName() != null && !request.candidateName().isBlank())
                ? request.candidateName().trim()
                : "the candidate";
        String toTitle = (request.toSectionTitle() != null && !request.toSectionTitle().isBlank())
                ? request.toSectionTitle().trim()
                : request.toSectionType();
        boolean isGated = Boolean.TRUE.equals(request.toSectionGated()) || isGatedSectionType(request.toSectionType());

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("""
                You are Dr. Anya Chen, AI Principal Bar Raiser conducting a live, rigorous technical interview assessment.
                Do not state your own name or introduce yourself by name in your responses. The UI displays your persona header separately.
                
                You are narrating a section handoff transition in the interview.
                - Previous section: %s
                - Previous section summary/progress: %s
                - Next section title: %s
                - Next section type: %s
                - Next section gated: %s
                - Candidate name: %s
                
                INSTRUCTIONS:
                1. Close the previous section in ONE sentence grounded in its summary/progress.
                2. Introduce the next section by its title ("%s").
                """.formatted(
                request.fromSectionType() != null ? request.fromSectionType() : "Previous Round",
                (lastTurnSummary != null && !lastTurnSummary.isBlank()) ? lastTurnSummary : "We have completed the previous round.",
                toTitle,
                request.toSectionType(),
                isGated,
                candidateName,
                toTitle
        ));

        if (isGated) {
            promptBuilder.append("""
                    3. Since this section requires an agreed approach before coding, append this exact instruction:
                    "Open the problem and read it fully. Before you write any code, explain to me in the chat how you plan to solve it — the editor unlocks once we agree on the approach."
                    """);
        } else {
            promptBuilder.append("""
                    3. Invite the candidate to begin when they are ready.
                    """);
        }

        promptBuilder.append("""
                
                CRITICAL INSTRUCTION: You MUST reply ONLY with a valid raw JSON object matching this schema:
                {
                  "interviewerReply": "Your concise, professional transition narration text",
                  "followUpQuestion": "",
                  "isSolutionComplete": false,
                  "codeAnalysis": null,
                  "keyStrengths": [],
                  "areasToImprove": [],
                  "detectedIntent": "SECTION_HANDOFF",
                  "turnSummary": "Section handoff transition",
                  "recommendedAction": "NOT_APPLICABLE",
                  "approachAssessment": "NOT_APPLICABLE"
                }
                """);

        return promptBuilder.toString();
    }

    public AiDialogueResponse processHandoff(AiHandoffRequest request) {
        List<TranscriptTurnDto> transcript = List.of();
        if (request.sessionId() != null) {
            try {
                transcript = sessionTranscriptClient.fetchSessionTranscript(request.sessionId());
            } catch (Exception e) {
                log.warn("Notice: could not fetch transcript for session {} during handoff: {}", request.sessionId(), e.getMessage());
            }
        }

        String lastSummary = null;
        if (transcript != null && !transcript.isEmpty()) {
            for (int i = transcript.size() - 1; i >= 0; i--) {
                var t = transcript.get(i);
                Map<String, String> meta = t.metadata();
                String sType = meta != null ? meta.get("sectionType") : null;
                if (request.fromSectionType() == null || request.fromSectionType().equalsIgnoreCase(sType)) {
                    String turnSum = meta != null ? meta.get("turnSummary") : null;
                    if (turnSum != null && !turnSum.isBlank()) {
                        lastSummary = turnSum.trim();
                        break;
                    }
                    if (t.content() != null && !t.content().isBlank()) {
                        lastSummary = t.content().trim();
                        if (lastSummary.length() > 120) {
                            lastSummary = lastSummary.substring(0, 120) + "...";
                        }
                        break;
                    }
                }
            }
        }

        String systemPrompt = buildHandoffPrompt(request, lastSummary);

        ModelProvider provider = request.modelProvider() != null ? request.modelProvider() : ModelProvider.GROQ;
        String modelName = request.modelName() != null && !request.modelName().isBlank()
                ? request.modelName()
                : "dialogue";

        AiClient client = clientFactory.getClient(provider);
        String rawResponse = client.generateCompletion(
                provider,
                systemPrompt,
                "Please deliver the transition narration now.",
                request.apiKey(),
                modelName
        );

        JsonNode root = null;
        try {
            String cleanJson = JsonCleaner.extractPureJson(rawResponse);
            root = objectMapper.readTree(cleanJson);
        } catch (Exception e) {
            log.warn("Notice on parsing handoff JSON response: {}", e.getMessage());
        }

        String reply = (root != null && root.hasNonNull("interviewerReply"))
                ? root.get("interviewerReply").asText().trim()
                : (rawResponse != null ? rawResponse.trim() : "Moving to the next section.");

        if (reply.matches("(?i).*\\b(mickey|dr\\.? anya chen)\\b.*")) {
            String properName = (request.candidateName() != null && !request.candidateName().isBlank())
                    ? request.candidateName().trim().split("\\s+")[0]
                    : "";
            reply = reply.replaceAll("(?i)\\b(mickey|dr\\.? anya chen)\\b", properName.isEmpty() ? "there" : properName);
        }

        return new AiDialogueResponse(
                reply,
                "",
                false,
                null,
                List.of(),
                List.of(),
                "SECTION_HANDOFF",
                "Section handoff transition",
                "NOT_APPLICABLE",
                "NOT_APPLICABLE"
        );
    }
}
