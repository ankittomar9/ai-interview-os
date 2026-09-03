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
                "I implemented two pointers",
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
}
