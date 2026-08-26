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
}
