package com.interviewos.ai.rubric.dto;

public record TurnDto(
        String role,
        String messageType,
        String content,
        String codeSnippet
) {}
