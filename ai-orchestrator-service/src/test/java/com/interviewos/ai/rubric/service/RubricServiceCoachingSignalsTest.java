package com.interviewos.ai.rubric.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.client.ProblemCatalogClient;
import com.interviewos.ai.rubric.dto.ExecutionDto;
import com.interviewos.ai.rubric.dto.TurnDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class RubricServiceCoachingSignalsTest {

    @Mock
    private AiClientFactory clientFactory;

    @Mock
    private ProblemCatalogClient problemCatalogClient;

    @Mock
    private com.interviewos.ai.service.EgressTracker egressTracker;

    private RubricService rubricService;

    @BeforeEach
    void setUp() {
        rubricService = new RubricService(clientFactory, problemCatalogClient, new ObjectMapper(), egressTracker);
    }

    @Test
    @DisplayName("computeCoachingSignals returns null when transcript has no metadata")
    void testComputeCoachingSignalsNoMetadata() {
        List<TurnDto> transcript = List.of(
                new TurnDto("CANDIDATE", "EXPLANATION", "My approach", null, null),
                new TurnDto("AI", "FEEDBACK", "Understood", null, null)
        );

        String signals = rubricService.computeCoachingSignals(transcript, List.of());
        assertNull(signals);
    }

    @Test
    @DisplayName("computeCoachingSignals accurately extracts intent sequence, hint episodes, and stuck recovery")
    void testComputeCoachingSignalsWithStuckAndRecovery() {
        List<TurnDto> transcript = List.of(
                new TurnDto("AI", "FEEDBACK", "Intro", null, Map.of("detectedIntent", "CLARIFYING", "recommendedAction", "ANSWER_CLARIFICATION")),
                new TurnDto("AI", "FEEDBACK", "Hint 1", null, Map.of("detectedIntent", "STUCK", "recommendedAction", "OFFER_HINT")),
                new TurnDto("AI", "FEEDBACK", "Solution complete", null, Map.of("detectedIntent", "COMPLETE", "recommendedAction", "ADVANCE_STAGE"))
        );

        List<ExecutionDto> executions = List.of(
                new ExecutionDto("PASSED", 5, 5, 120.0, 15.0)
        );

        String signals = rubricService.computeCoachingSignals(transcript, executions);

        assertNotNull(signals);
        assertTrue(signals.contains("Coaching Signals:"));
        assertTrue(signals.contains("Intent Sequence: CLARIFYING -> STUCK -> COMPLETE"));
        assertTrue(signals.contains("Hint Episodes Count: 1"));
        assertTrue(signals.contains("Stuck Episodes Count: 1"));
        assertTrue(signals.contains("Recovery after being stuck (Passed execution later): true"));
    }
}
