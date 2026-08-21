package com.interviewos.ai.rubric.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.AiClient;
import com.interviewos.ai.client.AiClientFactory;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.rubric.dto.ExecutionDto;
import com.interviewos.ai.rubric.dto.RubricEvaluationRequest;
import com.interviewos.ai.rubric.dto.RubricResponse;
import com.interviewos.ai.rubric.dto.TurnDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RubricServiceTest {

    @Mock
    private AiClientFactory clientFactory;

    @Mock
    private AiClient aiClient;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private RubricService rubricService;

    @Test
    @DisplayName("Provider/Parse failure returns fallback response with llmGenerated=false and empty dimensions")
    void testParseFailureReturnsFallback() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);
        when(aiClient.generateCompletion(any(), any(), any(), any(), any()))
                .thenReturn("INVALID_NON_JSON_RESPONSE");

        RubricEvaluationRequest request = new RubricEvaluationRequest(
                "reverse-a-string",
                "Reverse a string in O(N)",
                "ALGORITHMS_DATA_STRUCTURES",
                "JUNIOR",
                List.of(new TurnDto("CANDIDATE", "EXPLANATION", "Using StringBuilder", null)),
                List.of(new ExecutionDto("PASSED", 4, 4, 120.0, 20.0)),
                "class Main {}",
                "java"
        );

        RubricResponse response = rubricService.evaluateRubric(request);

        assertThat(response.llmGenerated()).isFalse();
        assertThat(response.dimensions()).isEmpty();
    }

    @Test
    @DisplayName("Valid JSON response parses 5 dimensions and sets llmGenerated=true")
    void testValidJsonResponseParsesDimensions() {
        String validJson = """
                {
                  "dimensions": [
                    { "dimension": "REQUIREMENTS_CLARIFICATION", "score": 80, "rationale": "Clarified inputs", "evidence": "Does input contain spaces?" },
                    { "dimension": "ALGORITHMIC_REASONING", "score": 85, "rationale": "Identified O(N)", "evidence": "O(N) time and O(1) space" },
                    { "dimension": "EDGE_CASE_THOROUGHNESS", "score": 75, "rationale": "Handled null", "evidence": "if (str == null) return;" },
                    { "dimension": "COMMUNICATION_CLARITY", "score": 90, "rationale": "Concise", "evidence": "Let us step through..." },
                    { "dimension": "CODE_QUALITY", "score": 85, "rationale": "Clean naming", "evidence": "int left = 0;" }
                  ],
                  "strengths": ["Clear complexity analysis"],
                  "weaknesses": ["Consider benchmark tests"],
                  "studyPlan": [
                    "Day 1: String algorithms", "Day 2: Two pointers", "Day 3: Sliding window",
                    "Day 4: Stacks", "Day 5: Queues", "Day 6: System design", "Day 7: Mock review"
                  ],
                  "executiveSummary": "Strong candidate."
                }
                """;

        when(clientFactory.getClient(any())).thenReturn(aiClient);
        when(aiClient.generateCompletion(any(), any(), any(), any(), any()))
                .thenReturn(validJson);

        RubricEvaluationRequest request = new RubricEvaluationRequest(
                "reverse-a-string",
                "Reverse a string",
                "ALGORITHMS_DATA_STRUCTURES",
                "JUNIOR",
                List.of(new TurnDto("CANDIDATE", "EXPLANATION", "O(N) time and O(1) space", null)),
                List.of(new ExecutionDto("PASSED", 4, 4, 120.0, 20.0)),
                "class Main {}",
                "java"
        );

        RubricResponse response = rubricService.evaluateRubric(request);

        assertThat(response.llmGenerated()).isTrue();
        assertThat(response.dimensions()).hasSize(5);
        assertThat(response.dimensions().get(0).dimension()).isEqualTo("REQUIREMENTS_CLARIFICATION");
        assertThat(response.dimensions().get(0).evidence()).isEqualTo("Does input contain spaces?");
        assertThat(response.studyPlan()).hasSize(7);
    }
}
