package com.interviewos.evaluation.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
public class AiRubricClient {

    private final RestClient restClient;
    private final MeterRegistry meterRegistry;

    public AiRubricClient(
            @Value("${services.ai-orchestrator.url:http://ai-orchestrator-service:8082}") String aiOrchestratorUrl,
            @Value("${services.ai-orchestrator.timeout-seconds:65}") int timeoutSeconds,
            ObjectProvider<MeterRegistry> meterRegistryProvider
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(aiOrchestratorUrl)
                .build();
        this.meterRegistry = meterRegistryProvider.getIfAvailable();
    }

    AiRubricClient(RestClient restClient, MeterRegistry meterRegistry) {
        this.restClient = restClient;
        this.meterRegistry = meterRegistry;
    }

    public Optional<RubricResponseDto> evaluateRubric(RubricEvaluationRequestDto request) {
        long start = System.currentTimeMillis();
        try {
            log.info("Requesting qualitative rubric evaluation from AI orchestrator for problem '{}'", request.problemSlug());
            RubricResponseDto response = restClient.post()
                    .uri("/api/v1/ai/rubric-evaluate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(RubricResponseDto.class);

            return Optional.ofNullable(response);
        } catch (Exception e) {
            long elapsedMs = System.currentTimeMillis() - start;
            String reason = "UNKNOWN";
            String statusCode = "NONE";
            String contentType = "UNKNOWN";
            String bodySnippet = "";

            if (e instanceof RestClientResponseException rce) {
                statusCode = String.valueOf(rce.getStatusCode().value());
                if (rce.getResponseHeaders() != null && rce.getResponseHeaders().getContentType() != null) {
                    contentType = rce.getResponseHeaders().getContentType().toString();
                }
                String body = rce.getResponseBodyAsString();
                if (body != null) {
                    bodySnippet = body.length() > 500 ? body.substring(0, 500) + "..." : body;
                }
                if (rce.getStatusCode().value() == 415) {
                    reason = "UNSUPPORTED_MEDIA_TYPE_415";
                } else if (rce.getStatusCode().is5xxServerError()) {
                    reason = "SERVER_ERROR_5XX";
                } else if (rce.getStatusCode().is4xxClientError()) {
                    reason = "CLIENT_ERROR_4XX";
                }
            } else if (e instanceof ResourceAccessException) {
                reason = "TIMEOUT_OR_NETWORK";
            } else if (e.getMessage() != null && e.getMessage().contains("application/octet-stream")) {
                reason = "OCTET_STREAM_MISMATCH";
            }

            if (meterRegistry != null) {
                try {
                    Counter.builder("ai_rubric_fallback_total")
                            .tag("reason", reason)
                            .description("Total number of rubric evaluation fallbacks to deterministic scoring")
                            .register(meterRegistry)
                            .increment();
                } catch (Exception mEx) {
                    log.debug("Metric registration failed: {}", mEx.getMessage());
                }
            }

            log.warn("⚠️ AI Rubric Orchestrator evaluation request failed: reason={}, status={}, contentType={}, elapsedMs={}, body='{}', error={}. Falling back to deterministic scoring.",
                    reason, statusCode, contentType, elapsedMs, bodySnippet, e.getMessage());
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
