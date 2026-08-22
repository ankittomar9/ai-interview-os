package com.interviewos.ai.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class SessionAttachmentClient {

    private final RestClient restClient;

    public SessionAttachmentClient(
            @Value("${session.service.url:http://interview-session-service:8081}") String sessionServiceUrl
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(sessionServiceUrl)
                .build();
    }

    public byte[] fetchAttachmentBytes(Long sessionId, String attachmentId) {
        if (attachmentId == null || attachmentId.isBlank()) {
            return null;
        }
        try {
            return restClient.get()
                    .uri("/api/v1/sessions/{sessionId}/attachments/{attId}", sessionId, attachmentId)
                    .retrieve()
                    .body(byte[].class);
        } catch (Exception e) {
            log.warn("⚠️ Failed to fetch attachment bytes for session {} id {}: {}", sessionId, attachmentId, e.getMessage());
            return null;
        }
    }

    public String fetchAttachmentText(Long sessionId, String attachmentId) {
        byte[] bytes = fetchAttachmentBytes(sessionId, attachmentId);
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        return new String(bytes, StandardCharsets.UTF_8);
    }
}
