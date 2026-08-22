package com.interviewos.evaluation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
public class AiRubricClient {

    private final RestClient restClient;

    public AiRubricClient(
            @Value("${services.ai-orchestrator.url:http://ai-orchestrator-service:8082}") String aiOrchestratorUrl,
            @Value("${services.ai-orchestrator.timeout-seconds:65}") int timeoutSeconds
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(aiOrchestratorUrl)
                .build();
    }

    public Optional<RubricResponseDto> evaluateRubric(RubricEvaluationRequestDto request) {
        try {
            log.info("Requesting qualitative rubric evaluation from AI orchestrator for problem '{}'", request.problemSlug());
            RubricResponseDto response = restClient.post()
                    .uri("/api/v1/ai/rubric-evaluate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(RubricResponseDto.class);

            return Optional.ofNullable(response);
        } catch (Exception e) {
            log.warn("⚠️ AI Rubric Orchestrator evaluation request failed: {}. Falling back to deterministic scoring.", e.getMessage());
            return Optional.empty();
        }
    }

    @Builder
    public record RubricEvaluationRequestDto(
            String problemSlug,
            String problemStatement,
            String track,
            String difficulty,
            List<TurnDto> transcript,
            List<ExecutionDto> executions,
            String finalCode,
            String language
    ) {}

    public record TurnDto(String role, String messageType, String content, String codeSnippet, java.util.Map<String, String> metadata) {
        public TurnDto(String role, String messageType, String content, String codeSnippet) {
            this(role, messageType, content, codeSnippet, null);
        }
    }
    public record ExecutionDto(String status, int passedTests, int totalTests, double executionTimeMs, double memoryUsedMb) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RubricResponseDto(
            List<DimensionScoreDto> dimensions,
            List<String> strengths,
            List<String> weaknesses,
            List<String> studyPlan,
            String executiveSummary,
            boolean llmGenerated
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DimensionScoreDto(
            String dimension,
            int score,
            String rationale,
            String evidence
    ) {}
}
