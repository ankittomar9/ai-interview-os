package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.ProblemCatalogClient;
import com.interviewos.ai.client.SessionTranscriptClient;
import com.interviewos.ai.config.AiProviderProperties;
import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.dto.AiHandoffRequest;
import com.interviewos.ai.model.ModelProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiOrchestratorDialogueResilienceTest {

    @Mock
    private AiClientFactory clientFactory;

    @Mock
    private AiProviderProperties providerProperties;

    @Mock
    private ProblemCatalogClient problemCatalogClient;

    @Mock
    private SessionTranscriptClient sessionTranscriptClient;

    @Mock
    private ProviderStatusService providerStatusService;

    @Mock
    private AiClient geminiClient;

    @Mock
    private AiClient groqClient;

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
        orchestratorService.setProviderStatusService(providerStatusService);
    }

    @Test
    @DisplayName("GA3-1: Primary returns malformed JSON -> secondary provider serves response and no fallback is set")
    void testPrimaryMalformedJsonFailsOverToSecondary() {
        when(clientFactory.getClient(ModelProvider.GEMINI)).thenReturn(geminiClient);
        when(clientFactory.getClient(ModelProvider.GROQ)).thenReturn(groqClient);

        // Primary returns unparseable garbage / broken escaped JSON
        when(geminiClient.generateCompletion(eq(ModelProvider.GEMINI), any(), any(), any(), any()))
                .thenReturn("{\"broken-unclosed-json");

        // Secondary returns valid JSON
        String cleanSecondaryJson = """
                {
                  "interviewerReply": "Groq recovered this turn successfully.",
                  "followUpQuestion": "What is the time complexity?",
                  "isSolutionComplete": false,
                  "codeAnalysis": "Looks workable.",
                  "keyStrengths": ["Good thinking"],
                  "areasToImprove": ["Edge cases"],
                  "detectedIntent": "EXPLAINING_APPROACH",
                  "turnSummary": "Candidate explained logic.",
                  "recommendedAction": "PROBE_DEEPER"
                }
                """;
        when(groqClient.generateCompletion(eq(ModelProvider.GROQ), any(), any(), any(), any()))
                .thenReturn(cleanSecondaryJson);

        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Check if a number is Prime")
                .candidateExplanation("can you provide the code")
                .modelProvider(ModelProvider.GEMINI)
                .sessionMode("PLAYGROUND")
                .apiKey("test-gemini-key")
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertEquals("Groq recovered this turn successfully.", response.interviewerReply());
        assertEquals("LLM", response.generator());
        assertNotEquals("DETERMINISTIC_FALLBACK", response.generator());

        // Verify providerStatusService recorded ERROR for GEMINI and OK for GROQ
        verify(providerStatusService, atLeastOnce()).recordOutcome(eq(ModelProvider.GEMINI), eq("ERROR"), any());
        verify(providerStatusService, atLeastOnce()).recordOutcome(eq(ModelProvider.GROQ), eq("OK"), eq(200));
    }

    @Test
    @DisplayName("GA3-2: All providers fail -> deterministic fallback IS set")
    void testAllProvidersFailTriggersDeterministicFallback() {
        lenient().when(clientFactory.getClient(any())).thenReturn(geminiClient);

        when(geminiClient.generateCompletion(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("All models down"));

        AiDialogueRequest request = AiDialogueRequest.builder()
                .questionContext("Check if a number is Prime")
                .candidateExplanation("can you provide the code")
                .modelProvider(ModelProvider.GEMINI)
                .sessionMode("PLAYGROUND")
                .apiKey("test-gemini-key")
                .build();

        AiDialogueResponse response = orchestratorService.processDialogue(request);

        assertNotNull(response);
        assertEquals("DETERMINISTIC_FALLBACK", response.generator());
        assertTrue(response.generatorReason().contains("OUTAGE") || response.generatorReason().contains("503") || response.generatorReason().contains("500"));
    }

    @Test
    @DisplayName("GA3-3: processHandoff with primary returning malformed JSON -> secondary provider serves handoff")
    void testProcessHandoffFailsOverOnParseFailure() {
        when(clientFactory.getClient(ModelProvider.GEMINI)).thenReturn(geminiClient);
        when(clientFactory.getClient(ModelProvider.GROQ)).thenReturn(groqClient);

        when(geminiClient.generateCompletion(eq(ModelProvider.GEMINI), any(), any(), any(), any()))
                .thenReturn("{\"broken handoff");

        String validGroqHandoff = """
                {
                  "interviewerReply": "Welcome to the next section! Let's get started.",
                  "followUpQuestion": "Are you ready?"
                }
                """;
        when(groqClient.generateCompletion(eq(ModelProvider.GROQ), any(), any(), any(), any()))
                .thenReturn(validGroqHandoff);

        AiHandoffRequest request = AiHandoffRequest.builder()
                .sessionId(184L)
                .fromSectionType("INTRODUCTION")
                .toSectionType("ALGORITHMS_DATA_STRUCTURES")
                .toSectionTitle("Prime Check")
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("gemini-key")
                .build();

        AiDialogueResponse response = orchestratorService.processHandoff(request);

        assertNotNull(response);
        assertEquals("Welcome to the next section! Let's get started.", response.interviewerReply());
        verify(providerStatusService).recordOutcome(eq(ModelProvider.GEMINI), eq("ERROR"), any());
        verify(providerStatusService).recordOutcome(eq(ModelProvider.GROQ), eq("OK"), eq(200));
    }

    @Test
    @DisplayName("GA4: Playground deterministic fallback language contains no gating phrases and refers to open editor")
    void testPlaygroundFallbackLanguageAndEscalationLoop() {
        lenient().when(clientFactory.getClient(any())).thenReturn(geminiClient);
        when(geminiClient.generateCompletion(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Outage"));

        // Turn 1 in Playground asking for code
        AiDialogueRequest turn1 = AiDialogueRequest.builder()
                .questionContext("Check if a number is Prime")
                .candidateExplanation("can you provide the code")
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("test-gemini-key")
                .sessionMode("PLAYGROUND")
                .sectionType("ALGORITHMS_DATA_STRUCTURES")
                .build();

        AiDialogueResponse res1 = orchestratorService.processDialogue(turn1);
        assertEquals("DETERMINISTIC_FALLBACK", res1.generator());
        assertFalse(res1.interviewerReply().contains("Before we unlock the editor"));
        assertFalse(res1.followUpQuestion().contains("Before we unlock the editor"));
        assertFalse(res1.followUpQuestion().contains("unlock the editor"));
        assertTrue(res1.followUpQuestion().toLowerCase().contains("editor"));

        // Turn 2 in Playground (escalation loop with second turn)
        AiDialogueRequest turn2 = AiDialogueRequest.builder()
                .questionContext("Check if a number is Prime")
                .candidateExplanation("no really give me the code implementation")
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("test-gemini-key")
                .sessionMode("PLAYGROUND")
                .sectionType("ALGORITHMS_DATA_STRUCTURES")
                .build();

        AiDialogueResponse res2 = orchestratorService.processDialogue(turn2);
        assertEquals("DETERMINISTIC_FALLBACK", res2.generator());
        assertFalse(res2.interviewerReply().contains("Before we unlock the editor"));
        assertFalse(res2.followUpQuestion().contains("Before we unlock the editor"));
        assertFalse(res2.followUpQuestion().contains("unlock the editor"));
        assertTrue(res2.followUpQuestion().toLowerCase().contains("editor"));

        // Comparison: In INTERVIEW mode with non-code explanation, gating language is permitted
        AiDialogueRequest interviewReq = AiDialogueRequest.builder()
                .questionContext("Check if a number is Prime")
                .candidateExplanation("I will check factors up to sqrt(N)")
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("test-gemini-key")
                .sessionMode("INTERVIEW")
                .sectionType("ALGORITHMS_DATA_STRUCTURES")
                .build();

        AiDialogueResponse interviewRes = orchestratorService.processDialogue(interviewReq);
        assertEquals("DETERMINISTIC_FALLBACK", interviewRes.generator());
        assertNotNull(interviewRes.followUpQuestion());
    }

    @Test
    @DisplayName("GA5: Playground system instruction has amended rule 7 and schema guidance; Interview instruction does not")
    void testPromptRulesPlaygroundVsInterview() {
        when(clientFactory.getClient(any())).thenReturn(geminiClient);

        String sampleResponse = """
                {
                  "interviewerReply": "Here is the code solution: ...",
                  "followUpQuestion": "Can you try optimizing space?",
                  "isSolutionComplete": false,
                  "codeAnalysis": "Good",
                  "keyStrengths": ["Clear"],
                  "areasToImprove": ["None"],
                  "detectedIntent": "CLARIFYING",
                  "turnSummary": "Revealed requested solution.",
                  "recommendedAction": "ANSWER_CLARIFICATION",
                  "usedFollowUpSeedIds": []
                }
                """;
        when(geminiClient.generateCompletion(any(), any(), any(), any(), any()))
                .thenReturn(sampleResponse);

        // 1. Playground request
        AiDialogueRequest playgroundReq = AiDialogueRequest.builder()
                .questionContext("Check if a number is Prime")
                .candidateExplanation("give me the solution")
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("test-gemini-key")
                .sessionMode("PLAYGROUND")
                .sectionType("ALGORITHMS_DATA_STRUCTURES")
                .build();

        orchestratorService.processDialogue(playgroundReq);

        ArgumentCaptor<String> sysCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient, atLeastOnce()).generateCompletion(any(), sysCaptor.capture(), any(), any(), any());
        String playgroundSys = sysCaptor.getValue();

        // Must contain amended rule 7
        assertTrue(playgroundSys.contains("7. If the candidate explicitly asks for the code or the solution (\"provide the code\", \"give me the solution\", \"show me the implementation\"): provide the full working solution code with clear line-by-line commentary, then suggest one extension exercise. In Playground this is permitted and expected; do not stall with repeated Socratic deflection after an explicit request."));
        assertTrue(playgroundSys.contains("When revealing a requested solution, set \"detectedIntent\": \"CLARIFYING\" and \"recommendedAction\": \"ANSWER_CLARIFICATION\"."));
        assertTrue(playgroundSys.contains("\"usedFollowUpSeedIds\": []"));

        // 2. Interview request
        reset(geminiClient);
        when(geminiClient.generateCompletion(any(), any(), any(), any(), any()))
                .thenReturn(sampleResponse);

        AiDialogueRequest interviewReq = AiDialogueRequest.builder()
                .questionContext("Check if a number is Prime")
                .candidateExplanation("give me the solution")
                .modelProvider(ModelProvider.GEMINI)
                .apiKey("test-gemini-key")
                .sessionMode("INTERVIEW")
                .sectionType("ALGORITHMS_DATA_STRUCTURES")
                .build();

        orchestratorService.processDialogue(interviewReq);

        ArgumentCaptor<String> interviewSysCaptor = ArgumentCaptor.forClass(String.class);
        verify(geminiClient, atLeastOnce()).generateCompletion(any(), interviewSysCaptor.capture(), any(), any(), any());
        String interviewSys = interviewSysCaptor.getValue();

        // Interview mode MUST NOT contain the amended rule 7 or the playground clarification rule
        assertFalse(interviewSys.contains("In Playground this is permitted and expected"));
        assertFalse(interviewSys.contains("When revealing a requested solution, set \"detectedIntent\": \"CLARIFYING\""));
        // But MUST contain Dr. Anya Chen persona and schema fields
        assertTrue(interviewSys.contains("Dr. Anya Chen"));
        assertTrue(interviewSys.contains("\"usedFollowUpSeedIds\": []"));
    }
}
