package com.interviewos.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Lightweight DTO representing a transcript turn from interview-session-service.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record TranscriptTurnDto(
        Long id,
        String senderRole,
        String messageType,
        String content,
        String codeSnippet,
        Map<String, String> metadata
) {}
