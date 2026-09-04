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

    @Mock
    private com.interviewos.ai.service.EgressTracker egressTracker;

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

    @Test
    @DisplayName("BEHAVIORAL track evaluates with BEHAVIORAL dimensions")
    void testBehavioralTrackUsesBehavioralSchema() {
        when(clientFactory.getClient(any())).thenReturn(aiClient);
        String behavioralJson = """
                {
                  "dimensions": [
                    { "dimension": "LEADERSHIP", "score": 85, "rationale": "Took initiative", "evidence": "I led the incident call" },
                    { "dimension": "CONFLICT_RESOLUTION", "score": 80, "rationale": "Resolved dispute", "evidence": "We agreed on metric-based rollout" },
                    { "dimension": "TEAMWORK", "score": 90, "rationale": "Mentored engineers", "evidence": "Paired with junior dev" },
                    { "dimension": "ADAPTABILITY", "score": 75, "rationale": "Pivoted strategy", "evidence": "Adjusted timeline" },
                    { "dimension": "COMMUNICATION_BEHAVIORAL", "score": 88, "rationale": "STAR structure", "evidence": "The situation was..." }
                  ],
                  "strengths": ["Strong ownership", "Constructive debate"],
                  "weaknesses": ["Pacing in early turns"],
                  "studyPlan": ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7"],
                  "executiveSummary": "Strong behavioral leadership hire."
                }
                """;
        when(aiClient.generateCompletion(any(), any(), any(), any(), any()))
                .thenReturn(behavioralJson);

        RubricEvaluationRequest request = new RubricEvaluationRequest(
                "team-conflict",
                "Describe a situation where you resolved technical conflict.",
                "BEHAVIORAL",
                "SENIOR",
                List.of(new TurnDto("CANDIDATE", "EXPLANATION", "I led the incident call", null)),
                List.of(),
                null,
                null
        );

        RubricResponse response = rubricService.evaluateRubric(request);

        assertThat(response.llmGenerated()).isTrue();
        assertThat(response.dimensions()).hasSize(5);
        assertThat(response.dimensions().get(0).dimension()).isEqualTo("LEADERSHIP");
        assertThat(response.dimensions().get(1).dimension()).isEqualTo("CONFLICT_RESOLUTION");
        assertThat(response.dimensions().get(2).dimension()).isEqualTo("TEAMWORK");
    }

    @Test
    @DisplayName("evaluateRubric falls back to Groq on Ollama timeout/failure")
    void testEvaluateRubricFallsBackToGroqOnOllamaTimeout() {
        AiClient mockOllama = org.mockito.Mockito.mock(AiClient.class);
        AiClient mockGroq = org.mockito.Mockito.mock(AiClient.class);

        when(clientFactory.getClient(ModelProvider.OLLAMA)).thenReturn(mockOllama);
        when(clientFactory.getClient(ModelProvider.GROQ)).thenReturn(mockGroq);

        when(mockOllama.generateCompletion(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Ollama read timeout"));

        String groqJson = """
                {
                  "dimensions": [
                    { "dimension": "REQUIREMENTS_CLARIFICATION", "score": 90, "rationale": "Clarified inputs", "evidence": "Does input contain spaces?" },
                    { "dimension": "ALGORITHMIC_REASONING", "score": 95, "rationale": "Optimal O(N)", "evidence": "O(N) time and O(1) space" },
                    { "dimension": "EDGE_CASE_THOROUGHNESS", "score": 88, "rationale": "Handled null and empty", "evidence": "if (str == null) return;" },
                    { "dimension": "COMMUNICATION_CLARITY", "score": 92, "rationale": "Structured articulation", "evidence": "Let us step through..." },
                    { "dimension": "CODE_QUALITY", "score": 95, "rationale": "Idiomatic clean code", "evidence": "int left = 0;" }
                  ],
                  "strengths": ["Excellent Big-O mastery", "Optimal solution"],
                  "weaknesses": ["None notable"],
                  "studyPlan": [
                    "Day 1: Advanced Stacks", "Day 2: Two Pointers", "Day 3: Sliding Window",
                    "Day 4: Monotonic Queues", "Day 5: Graph Theory", "Day 6: System Design", "Day 7: Mock Interview"
                  ],
                  "executiveSummary": "Strong Hire candidate with deep algorithmic foundation."
                }
                """;

        when(mockGroq.generateCompletion(eq(ModelProvider.GROQ), any(), any(), any(), eq("eval")))
                .thenReturn(groqJson);

        RubricEvaluationRequest request = new RubricEvaluationRequest(
                "reverse-a-string",
                "Reverse a string",
                "ALGORITHMS_DATA_STRUCTURES",
                "SENIOR",
                List.of(new TurnDto("CANDIDATE", "EXPLANATION", "O(N) time and O(1) space", null)),
                List.of(new ExecutionDto("PASSED", 5, 5, 80.0, 18.0)),
                "class Main {}",
                "java"
        );

        RubricResponse response = rubricService.evaluateRubric(request);

        assertThat(response.llmGenerated()).isTrue();
        assertThat(response.dimensions()).hasSize(5);
        assertThat(response.dimensions().get(0).score()).isEqualTo(90);
        assertThat(response.dimensions().get(1).score()).isEqualTo(95);
        assertThat(response.executiveSummary()).contains("Strong Hire");
        org.mockito.Mockito.verify(mockGroq, org.mockito.Mockito.times(1))
                .generateCompletion(eq(ModelProvider.GROQ), any(), any(), any(), eq("eval"));
        org.mockito.Mockito.verify(egressTracker, org.mockito.Mockito.times(1))
                .recordCloudCall("GROQ_RUBRIC_FALLBACK");
    }

    @Test
    @DisplayName("evaluateRubric skips Groq when allow-cloud-fallback is false (strict-purity mode)")
    void testEvaluateRubricSkipsGroqWhenCloudFallbackDisabled() {
        org.springframework.test.util.ReflectionTestUtils.setField(rubricService, "allowCloudFallback", false);

        AiClient mockOllama = org.mockito.Mockito.mock(AiClient.class);
        when(clientFactory.getClient(ModelProvider.OLLAMA)).thenReturn(mockOllama);
        when(mockOllama.generateCompletion(any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("Ollama read timeout"));

        RubricEvaluationRequest request = new RubricEvaluationRequest(
                "reverse-a-string",
                "Reverse a string",
                "ALGORITHMS_DATA_STRUCTURES",
                "SENIOR",
                List.of(new TurnDto("CANDIDATE", "EXPLANATION", "O(N) time and O(1) space", null)),
                List.of(new ExecutionDto("PASSED", 5, 5, 80.0, 18.0)),
                "class Main {}",
                "java"
        );

        RubricResponse response = rubricService.evaluateRubric(request);

        assertThat(response.llmGenerated()).isFalse();
        assertThat(response.dimensions()).isEmpty();
        org.mockito.Mockito.verify(clientFactory, org.mockito.Mockito.never()).getClient(ModelProvider.GROQ);
        org.mockito.Mockito.verify(egressTracker, org.mockito.Mockito.never()).recordCloudCall(any());
    }
}
