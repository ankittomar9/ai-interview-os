package com.interviewos.evaluation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.time.Instant;
import java.util.List;

@FeignClient(name = "interview-session-service")
public interface SessionServiceClient {

    @GetMapping("/api/v1/sessions/{id}")
    SessionDetailsDto getSessionById(@PathVariable("id") Long id);

    @GetMapping("/api/v1/sessions/{id}/transcript")
    List<TranscriptMessageDto> getSessionTranscript(@PathVariable("id") Long id);

    @GetMapping("/api/v1/problems/{slug}")
    ProblemDetailsDto getProblemBySlug(@PathVariable("slug") String slug);

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

    record TranscriptMessageDto(
            Long id,
            String senderRole,
            String messageType,
            String content,
            String codeSnippet,
            Instant timestamp
    ) {}
}