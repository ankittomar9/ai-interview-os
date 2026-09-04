package com.interviewos.evaluation.client;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class AiRubricClientTest {

    private SimpleMeterRegistry meterRegistry;
    private MockRestServiceServer mockServer;
    private AiRubricClient client;

    @BeforeEach
    void setUp() {
        meterRegistry = new SimpleMeterRegistry();
        RestClient.Builder builder = RestClient.builder().baseUrl("http://ai-orchestrator-test:8082");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        client = new AiRubricClient(builder.build(), meterRegistry);
    }

    @Test
    @DisplayName("evaluateRubric: returns RubricResponseDto on 200 OK")
    void testEvaluateRubric_Success() {
        String responseJson = """
                {
                    "dimensions": [
                        {"dimension": "CODE_QUALITY", "score": 90, "rationale": "Clean code", "evidence": "good variable names"}
                    ],
                    "strengths": ["Clear design"],
                    "weaknesses": ["None"],
                    "studyPlan": ["Review algorithms"],
                    "executiveSummary": "Outstanding performance.",
                    "llmGenerated": true
                }
                """;

        mockServer.expect(requestTo("http://ai-orchestrator-test:8082/api/v1/ai/rubric-evaluate"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withSuccess(responseJson, MediaType.APPLICATION_JSON));

        AiRubricClient.RubricEvaluationRequestDto request = AiRubricClient.RubricEvaluationRequestDto.builder()
                .problemSlug("two-sum")
                .problemStatement("Given nums and target...")
                .build();

        Optional<AiRubricClient.RubricResponseDto> result = client.evaluateRubric(request);

        assertThat(result).isPresent();
        assertThat(result.get().llmGenerated()).isTrue();
        assertThat(result.get().executiveSummary()).isEqualTo("Outstanding performance.");

        Counter fallbackCounter = meterRegistry.find("ai_rubric_fallback_total").counter();
        assertThat(fallbackCounter).isNull();
    }

    @Test
    @DisplayName("evaluateRubric: 415 unsupported media type returns Optional.empty and increments metric with reason=UNSUPPORTED_MEDIA_TYPE_415")
    void testEvaluateRubric_FallbackOn415() {
        mockServer.expect(requestTo("http://ai-orchestrator-test:8082/api/v1/ai/rubric-evaluate"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body("Unsupported media type"));

        AiRubricClient.RubricEvaluationRequestDto request = AiRubricClient.RubricEvaluationRequestDto.builder()
                .problemSlug("valid-parentheses")
                .build();

        Optional<AiRubricClient.RubricResponseDto> result = client.evaluateRubric(request);

        assertThat(result).isEmpty();

        Counter counter = meterRegistry.find("ai_rubric_fallback_total")
                .tag("reason", "UNSUPPORTED_MEDIA_TYPE_415")
                .counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("evaluateRubric: network timeout returns Optional.empty and increments metric with reason=TIMEOUT_OR_NETWORK")
    void testEvaluateRubric_FallbackOnTimeout() {
        mockServer.expect(requestTo("http://ai-orchestrator-test:8082/api/v1/ai/rubric-evaluate"))
                .andExpect(method(HttpMethod.POST))
                .andRespond((request) -> {
                    throw new org.springframework.web.client.ResourceAccessException("Read timed out", new SocketTimeoutException("timeout"));
                });

        AiRubricClient.RubricEvaluationRequestDto request = AiRubricClient.RubricEvaluationRequestDto.builder()
                .problemSlug("lru-cache")
                .build();

        Optional<AiRubricClient.RubricResponseDto> result = client.evaluateRubric(request);

        assertThat(result).isEmpty();

        Counter counter = meterRegistry.find("ai_rubric_fallback_total")
                .tag("reason", "TIMEOUT_OR_NETWORK")
                .counter();
        assertThat(counter).isNotNull();
        assertThat(counter.count()).isEqualTo(1.0);
    }
}
