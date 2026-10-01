package com.interviewos.session.vault;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Component
public class EvaluationReportClient {

    private final RestClient restClient;

    public EvaluationReportClient(
            @Value("${evaluation.report.url:http://evaluation-report-service:8084}") String reportUrl
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(15));
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(reportUrl)
                .build();
    }

    public EvaluationReportClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public Optional<byte[]> fetchReportJson(Long sessionId) {
        try {
            byte[] bytes = restClient.get()
                    .uri("/api/v1/reports/session/{sessionId}", sessionId)
                    .retrieve()
                    .body(byte[].class);
            return Optional.ofNullable(bytes);
        } catch (Exception e) {
            log.warn("Failed to fetch report JSON for session {}: {}", sessionId, e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<byte[]> fetchReportPdf(Long sessionId) {
        try {
            byte[] bytes = restClient.get()
                    .uri("/api/v1/reports/{sessionId}/human-transcript.pdf", sessionId)
                    .retrieve()
                    .body(byte[].class);
            return Optional.ofNullable(bytes);
        } catch (Exception e) {
            log.warn("Failed to fetch report PDF for session {}: {}", sessionId, e.getMessage());
            return Optional.empty();
        }
    }
}
