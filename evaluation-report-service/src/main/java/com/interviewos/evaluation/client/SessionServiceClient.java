package com.interviewos.evaluation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@FeignClient(name = "interview-session-service", url = "${SESSION_SERVICE_URL:http://interview-session-service:8081}")
public interface SessionServiceClient {

    @GetMapping("/api/v1/sessions/{id}")
    SessionDetailsDto getSessionById(@PathVariable("id") Long id);

    @GetMapping("/api/v1/sessions/{id}/transcript")
    List<TranscriptMessageDto> getSessionTranscript(@PathVariable("id") Long id);

    @GetMapping("/api/v1/problems/{slug}")
    ProblemDetailsDto getProblemBySlug(@PathVariable("slug") String slug);

    @GetMapping("/api/v1/sessions/{id}/recordings/manifest")
    RecordingManifestDto getRecordingManifest(@PathVariable("id") Long id);

    record ProblemDetailsDto(
            String id,
            String problemSlug,
            String title,
            String track,
            String difficulty,
            String problemStatement
    ) {}

    record SessionDetailsDto(
            Long id,
            String candidateId,
            String roleTitle,
            String track,
            String difficulty,
            String targetCompany,
            String status,
            Long durationSeconds
    ) {}

    record RecordingManifestDto(
            Long sessionId,
            int totalChunks,
            List<DroppedChunkDto> droppedChunks
    ) {
        public record DroppedChunkDto(int seq, String kind, String reason) {}
    }

    record TranscriptMessageDto(
            Long id,
            String senderRole,
            String messageType,
            String content,
            String codeSnippet,
            Instant timestamp,
            Map<String, String> metadata,
            Integer echoFilteredCount
    ) {
        public TranscriptMessageDto(Long id, String senderRole, String messageType, String content, String codeSnippet, Instant timestamp) {
            this(id, senderRole, messageType, content, codeSnippet, timestamp, null, 0);
        }

        public TranscriptMessageDto(Long id, String senderRole, String messageType, String content, String codeSnippet, Instant timestamp, Map<String, String> metadata) {
            this(id, senderRole, messageType, content, codeSnippet, timestamp, metadata, 0);
        }
    }
}