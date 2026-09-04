package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.ProblemCatalogClient;
import com.interviewos.ai.client.SessionTranscriptClient;
import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.model.ModelProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiOrchestratorServiceDialogueTest {

    @Mock
    private AiClientFactory clientFactory;

    @Mock
    private com.interviewos.ai.config.AiProviderProperties providerProperties;

    @Mock
    private ProblemCatalogClient problemCatalogClient;

    @Mock
    private SessionTranscriptClient sessionTranscriptClient;

    @Mock
    private AiClient aiClient;

    private ObjectMapper objectMapper;
    private AiOrchestratorService orchestratorService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        orchestratorService = new AiOrchestratorService(
                clientFactory,
                providerProperties,
                problemCatalogClient,
                sessionTranscriptClient,
                objectMapper
        );
    }

    @Test
    @DisplayName("processDialogue parses full JSON response including intent and action")
    void testProcessDialogueFullJson() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                ```json
                {
                  "interviewerReply": "Great observation regarding the two-pointer approach.",
                  "followUpQuestion": "What is the time complexity when there are duplicate elements?",
                  "isSolutionComplete": true,
                  "codeAnalysis": "Clean O(N) traversal.",
                  "keyStrengths": ["Good algorithmic intuition"],
                  "areasToImprove": ["Handle edge duplicates"],
                  "detectedIntent": "COMPLETE",
                  "turnSummary": "Candidate finished solution and passed tests.",
                  "recommendedAction": "ADVANCE_STAGE"
                }
                ```
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        AiDialogueRequest request = new AiDialogueRequest(
                "Two Sum problem",
                "I implemented two pointers and yes I am ready to move on",
                "int l = 0;",
                List.of(),
                ModelProvider.GEMINI,
                "fake-key",
                null
        );

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertEquals("Great observation regarding the two-pointer approach.", response.interviewerReply());
        assertTrue(response.isSolutionComplete());
        assertEquals("COMPLETE", response.detectedIntent());
        assertEquals("Candidate finished solution and passed tests.", response.turnSummary());
        assertEquals("ADVANCE_STAGE", response.recommendedAction());
    }

    @Test
    @DisplayName("processDialogue applies safe defaults when LLM omits intent fields")
    void testProcessDialogueMissingIntentDefaults() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                {
                  "interviewerReply": "Understood.",
                  "followUpQuestion": "Can you code it up?",
                  "isSolutionComplete": false,
                  "codeAnalysis": "",
                  "keyStrengths": [],
                  "areasToImprove": []
                }
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        AiDialogueRequest request = new AiDialogueRequest(
                "LRU Cache",
                "I will use HashMap",
                null,
                List.of(),
                ModelProvider.GROQ,
                "fake-key",
                null
        );

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertEquals("Understood.", response.interviewerReply());
        assertEquals("EXPLAINING_APPROACH", response.detectedIntent());
        assertEquals("Candidate shared technical explanation.", response.turnSummary());
        assertEquals("PROBE_DEEPER", response.recommendedAction());
    }

    @Test
    @DisplayName("processDialogue replaces LLM reply claiming tests passed when execution failed")
    void testPostGuardInterceptsFalselyClaimedPassOnFailedRun() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                {
                  "interviewerReply": "Congratulations! Your code passed all test cases perfectly!",
                  "followUpQuestion": "Would you like to optimize further?",
                  "isSolutionComplete": true,
                  "codeAnalysis": "Looks good.",
                  "keyStrengths": [],
                  "areasToImprove": [],
                  "detectedIntent": "COMPLETE",
                  "turnSummary": "Candidate finished.",
                  "recommendedAction": "ADVANCE_STAGE"
                }
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Reverse a String")
                .candidateExplanation("Here is my solution")
                .candidateCode("class Solution {}")
                .chatHistory(List.of())
                .modelProvider(ModelProvider.OLLAMA)
                .apiKey("fake-key")
                .latestExecution(new com.interviewos.ai.rubric.dto.ExecutionDto(
                        "FAILED",
                        0,
                        2,
                        120.0,
                        15.0
                ))
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertTrue(response.interviewerReply().contains("0/2 test cases passing"));
        assertTrue(response.interviewerReply().contains("Let's debug this together"));
        assertFalse(response.isSolutionComplete());
        assertEquals("OFFER_HINT", response.recommendedAction());
    }

    @Test
    @DisplayName("post-guard sanitizes Mickey name inversion and replaces with candidate name")
    void testAntiInversionPostGuardSanitizesMickey() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                {
                  "interviewerReply": "Thanks for sharing your code, Mickey. Let's review it.",
                  "followUpQuestion": "What is the time complexity?",
                  "isSolutionComplete": false,
                  "codeAnalysis": "Looks solid.",
                  "keyStrengths": [],
                  "areasToImprove": [],
                  "detectedIntent": "CODING",
                  "turnSummary": "Candidate shared code.",
                  "recommendedAction": "PROBE_DEEPER"
                }
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Reverse a String")
                .candidateExplanation("Here is my code")
                .candidateCode("class Solution {}")
                .candidateName("Ankit Singh Tomar")
                .chatHistory(List.of())
                .modelProvider(ModelProvider.OLLAMA)
                .apiKey("fake-key")
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertFalse(response.interviewerReply().contains("Mickey"));
        assertTrue(response.interviewerReply().contains("Ankit"));
    }

    @Test
    @DisplayName("post-guard protects candidate during ENGINE_UNAVAILABLE and replaces hallucinated failure or pass")
    void testEngineErrorPostGuardProtectsCandidate() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                {
                  "interviewerReply": "Unfortunately your code failed the test cases.",
                  "followUpQuestion": "Can you fix the failing test case?",
                  "isSolutionComplete": false,
                  "codeAnalysis": "Fails tests.",
                  "keyStrengths": [],
                  "areasToImprove": [],
                  "detectedIntent": "CODING",
                  "turnSummary": "Candidate code failed.",
                  "recommendedAction": "OFFER_HINT"
                }
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Two Sum")
                .candidateExplanation("Here is my hash map solution")
                .candidateCode("class Solution {}")
                .candidateName("Alice")
                .chatHistory(List.of())
                .modelProvider(ModelProvider.OLLAMA)
                .apiKey("fake-key")
                .latestExecution(new com.interviewos.ai.rubric.dto.ExecutionDto(
                        "ENGINE_UNAVAILABLE",
                        0,
                        0,
                        0.0,
                        0.0
                ))
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertFalse(response.interviewerReply().contains("your code failed"));
        assertTrue(response.interviewerReply().contains("engine is temporarily offline"));
        assertTrue(response.interviewerReply().contains("not marked wrong"));
        assertFalse(response.isSolutionComplete());
        assertEquals("PROBE_DEEPER", response.recommendedAction());
    }

    @Test
    @DisplayName("Engine recovery: prior ENGINE_ERROR in chatHistory does not stick when latest execution passes")
    void testRecoveredEngineAfterPriorEngineErrorInChatHistoryAcknowledgesPass() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                {
                  "interviewerReply": "Great job! All test cases passed successfully.",
                  "followUpQuestion": "Can you explain the space complexity?",
                  "isSolutionComplete": true,
                  "codeAnalysis": "Optimal solution.",
                  "keyStrengths": ["Correctness"],
                  "areasToImprove": [],
                  "detectedIntent": "CODING",
                  "turnSummary": "Candidate code passed all test cases.",
                  "recommendedAction": "WRAP_UP"
                }
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Two Sum")
                .candidateExplanation("Here is my optimal solution")
                .candidateCode("class Solution {}")
                .candidateName("Alice")
                .chatHistory(List.of(
                        new com.interviewos.ai.dto.AiDialogueRequest.ChatMessageDto("assistant", "The execution engine encountered an error: ENGINE_ERROR"),
                        new com.interviewos.ai.dto.AiDialogueRequest.ChatMessageDto("user", "Let me retry submitting.")
                ))
                .modelProvider(ModelProvider.OLLAMA)
                .apiKey("fake-key")
                .latestExecution(new com.interviewos.ai.rubric.dto.ExecutionDto(
                        "PASSED",
                        10,
                        10,
                        25.0,
                        12.5
                ))
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertTrue(response.isSolutionComplete());
        assertFalse(response.interviewerReply().contains("engine is temporarily offline"),
                "AI should acknowledge pass and not revert to engine offline post-guard");
        assertEquals("WRAP_UP", response.recommendedAction());
    }

    @Test
    @DisplayName("AC-2.1: Prompt assembly INTRODUCTION instructions contain propose-and-wait contract and no time-based advance language")
    void testPromptAssemblyIntroductionProposeAndWaitContract() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        org.mockito.ArgumentCaptor<String> sysPromptCaptor = org.mockito.ArgumentCaptor.forClass(String.class);
        when(aiClient.generateCompletion(any(), sysPromptCaptor.capture(), any(), any(), any()))
                .thenReturn("""
                        {
                          "interviewerReply": "Welcome Alice! What distributed systems have you worked with?",
                          "followUpQuestion": null,
                          "isSolutionComplete": false,
                          "codeAnalysis": null,
                          "keyStrengths": [],
                          "areasToImprove": [],
                          "detectedIntent": "EXPLAINING_APPROACH",
                          "turnSummary": "Candidate gave background.",
                          "recommendedAction": "PROPOSE_STAGE_ADVANCE"
                        }
                        """);

        AiDialogueRequest request = AiDialogueRequest.builder()
                .candidateName("Alice")
                .currentStage("INTRODUCTION")
                .candidateExplanation("Hi, I am Alice, a backend engineer.")
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("fake-key")
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertEquals("PROPOSE_STAGE_ADVANCE", response.recommendedAction());

        String capturedPrompt = sysPromptCaptor.getValue();
        assertNotNull(capturedPrompt);

        // Assert contract requirements:
        assertTrue(capturedPrompt.contains("PROPOSE_STAGE_ADVANCE"), "Prompt schema must include PROPOSE_STAGE_ADVANCE");
        assertTrue(capturedPrompt.contains("There is NO time limit on the introduction"), "Prompt must explicitly forbid time limits");
        assertTrue(capturedPrompt.contains("MUST NOT set \"recommendedAction\": \"ADVANCE_STAGE\" during introduction unless the candidate has explicitly agreed"), "Prompt must require affirmative consent");
        assertFalse(capturedPrompt.contains("Once the introduction exchange is complete, politely guide them: \"Great! Let's dive into our first coding challenge.\" and set \"recommendedAction\": \"ADVANCE_STAGE\""),
                "Prompt must not contain unconditional auto-advance language");
    }

    @Test
    @DisplayName("C0: Consent guard downgrades ADVANCE_STAGE to PROPOSE_STAGE_ADVANCE when candidate lacks affirmative consent")
    void testConsentGuardDowngradesWithoutAffirmative() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                {
                  "interviewerReply": "Great job on the code!",
                  "followUpQuestion": "Next section?",
                  "isSolutionComplete": true,
                  "codeAnalysis": "Optimal.",
                  "keyStrengths": [],
                  "areasToImprove": [],
                  "detectedIntent": "COMPLETE",
                  "turnSummary": "Candidate finished.",
                  "recommendedAction": "ADVANCE_STAGE"
                }
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Valid Parentheses")
                .candidateExplanation("Here is my code submission with stack.")
                .candidateCode("class Solution {}")
                .chatHistory(List.of())
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("fake-key")
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertEquals("PROPOSE_STAGE_ADVANCE", response.recommendedAction(),
                "Must downgrade ADVANCE_STAGE to PROPOSE_STAGE_ADVANCE when candidate has not given affirmative consent");
    }

    @Test
    @DisplayName("C0: Consent guard downgrades ADVANCE_STAGE to PROPOSE_STAGE_ADVANCE when candidate text contains negation")
    void testConsentGuardDowngradesOnNegation() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);

        String rawJson = """
                {
                  "interviewerReply": "Understood.",
                  "followUpQuestion": "Ready to move on?",
                  "isSolutionComplete": true,
                  "codeAnalysis": "Optimal.",
                  "keyStrengths": [],
                  "areasToImprove": [],
                  "detectedIntent": "COMPLETE",
                  "turnSummary": "Candidate finished.",
                  "recommendedAction": "ADVANCE_STAGE"
                }
                """;

        when(aiClient.generateCompletion(any(), any(), any(), any(), any())).thenReturn(rawJson);

        // Candidate says "sure", but also "not yet, I want to review"
        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Valid Parentheses")
                .candidateExplanation("Sure, but not yet, I want to check my logic first.")
                .candidateCode("class Solution {}")
                .chatHistory(List.of())
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("fake-key")
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertEquals("PROPOSE_STAGE_ADVANCE", response.recommendedAction(),
                "Must downgrade ADVANCE_STAGE to PROPOSE_STAGE_ADVANCE when negation phrase is present");
    }

    @Test
    @DisplayName("C0: Consent guard validates all affirmative phrases and blocks all negation phrases")
    void testHasAffirmativeConsentExhaustive() {
        // Valid affirmative phrases
        String[] affirmatives = {
                "yes", "Yes, I am done.", "yeah let's do it", "yep", "yup",
                "sure", "ok", "okay, let's continue", "ready", "I am ready now",
                "let's go", "lets go", "go ahead", "sounds good", "move on", "let's move on"
        };
        for (String phrase : affirmatives) {
            assertTrue(AiOrchestratorService.hasAffirmativeConsent(phrase),
                    "Expected affirmative consent for: " + phrase);
        }

        // Negation phrases
        String[] negations = {
                "not yet", "I am not yet done", "not ready", "I'm not ready to move on",
                "don't", "don't advance yet", "dont move on", "do not advance",
                "later", "we can do that later"
        };
        for (String phrase : negations) {
            assertFalse(AiOrchestratorService.hasAffirmativeConsent(phrase),
                    "Expected negation guard to reject: " + phrase);
        }

        // Mixed phrases (affirmative + negation) -> must reject
        assertFalse(AiOrchestratorService.hasAffirmativeConsent("ok, but not yet"));
        assertFalse(AiOrchestratorService.hasAffirmativeConsent("sure, but I don't think so"));
        assertFalse(AiOrchestratorService.hasAffirmativeConsent("ready, but later"));

        // Non-affirmative regular text
        assertFalse(AiOrchestratorService.hasAffirmativeConsent("Here is my code implementation"));
        assertFalse(AiOrchestratorService.hasAffirmativeConsent(""));
        assertFalse(AiOrchestratorService.hasAffirmativeConsent(null));
    }
}
