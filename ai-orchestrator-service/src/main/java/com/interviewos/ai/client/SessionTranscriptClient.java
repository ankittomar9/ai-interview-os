package com.interviewos.ai.client;

import com.interviewos.ai.dto.TranscriptTurnDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;

@Slf4j
@Component
public class SessionTranscriptClient {

    private final RestClient restClient;

    public SessionTranscriptClient(
            @Value("${session.service.url:http://interview-session-service:8081}") String sessionServiceUrl
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(sessionServiceUrl)
                .build();
    }

    public List<TranscriptTurnDto> fetchSessionTranscript(Long sessionId) {
        if (sessionId == null) {
            return List.of();
        }
        try {
            List<TranscriptTurnDto> turns = restClient.get()
                    .uri("/api/v1/sessions/{id}/transcript", sessionId)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<TranscriptTurnDto>>() {});
            return turns != null ? turns : List.of();
        } catch (Exception e) {
            log.warn("⚠️ Failed to fetch session transcript for sessionId {}: {}. Continuing gracefully with empty memory.",
                    sessionId, e.getMessage());
            return List.of();
        }
    }

    public boolean openSectionGate(Long sessionId, int sectionIndex, String reason, Long turnId) {
        if (sessionId == null) {
            return false;
        }
        try {
            java.util.Map<String, Object> body = java.util.Map.of(
                    "reason", reason != null ? reason : "APPROACH_AGREED",
                    "turnId", turnId != null ? turnId : 0L
            );
            restClient.post()
                    .uri("/internal/v1/sessions/{sessionId}/sections/{index}/gate/open", sessionId, sectionIndex)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Successfully opened approach gate for session {} section {}", sessionId, sectionIndex);
            return true;
        } catch (Exception e) {
            log.error("Failed to open approach gate for session {} section {}: {}", sessionId, sectionIndex, e.getMessage());
            return false;
        }
    }
}
