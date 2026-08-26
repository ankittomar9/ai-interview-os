package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.SessionAttachmentClient;
import com.interviewos.ai.dto.DesignEvaluationRequest;
import com.interviewos.ai.dto.DesignEvaluationResponse;
import com.interviewos.ai.model.ModelProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DesignEvaluationServiceTest {

    @Mock
    private AiClientFactory clientFactory;

    @Mock
    private SessionAttachmentClient attachmentClient;

    @Mock
    private AiClient aiClient;

    private ObjectMapper objectMapper;
    private DesignEvaluationService evaluationService;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        evaluationService = new DesignEvaluationService(clientFactory, attachmentClient, objectMapper);
        ReflectionTestUtils.setField(evaluationService, "configuredProvider", "gemini");
        ReflectionTestUtils.setField(evaluationService, "configuredApiKey", "test-server-key");
    }

    @Test
    @DisplayName("evaluateDesign should successfully evaluate with multimodal vision when image present")
    void testEvaluateDesignWithVision() {
        DesignEvaluationRequest request = new DesignEvaluationRequest(
                1L,
                "att-json-1",
                "att-png-1",
                new DesignEvaluationRequest.DesignRequirements("50M", "4x", "20:1"),
                ModelProvider.GEMINI,
                "custom-key"
        );

        when(clientFactory.getClient(ModelProvider.GEMINI)).thenReturn(aiClient);
        when(attachmentClient.fetchAttachmentText(eq(1L), eq("att-json-1"))).thenReturn("{\"nodes\":[{\"id\":\"gateway\",\"name\":\"API Gateway\"}]}");
        when(attachmentClient.fetchAttachmentBytes(eq(1L), eq("att-png-1"))).thenReturn(new byte[]{1, 2, 3, 4});

        String mockAiJson = """
                {
                  "score": 92,
                  "feedback": [
                    "API Gateway handles incoming traffic and SSL termination well.",
                    "Proper horizontal scaling considered."
                  ],
                  "evidence": "Observed API Gateway node in canvas diagram"
                }
                """;

        when(aiClient.generateCompletionWithVision(eq(ModelProvider.GEMINI), anyString(), anyString(), any(), eq("image/png"), eq("custom-key"), any()))
                .thenReturn(mockAiJson);

        DesignEvaluationResponse response = evaluationService.evaluateDesign(request);

        assertNotNull(response);
        assertTrue(response.llmGenerated());
        assertEquals(92, response.score());
        assertEquals(2, response.feedback().size());
        assertTrue(response.feedback().get(0).contains("API Gateway"));
        assertEquals("Observed API Gateway node in canvas diagram", response.evidence());
    }

    @Test
    @DisplayName("evaluateDesign fallback path when AI Client fails")
    void testEvaluateDesignFallback() {
        DesignEvaluationRequest request = new DesignEvaluationRequest(
                1L,
                "att-json-1",
                null,
                new DesignEvaluationRequest.DesignRequirements("10M", "2x", "5:1"),
                ModelProvider.OLLAMA,
                ""
        );

        when(clientFactory.getClient(any())).thenThrow(new RuntimeException("Ollama unreachable"));

        DesignEvaluationResponse response = evaluationService.evaluateDesign(request);

        assertNotNull(response);
        assertFalse(response.llmGenerated());
        assertEquals(70, response.score());
        assertFalse(response.feedback().isEmpty());
    }
}
