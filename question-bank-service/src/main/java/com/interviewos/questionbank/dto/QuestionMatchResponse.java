package com.interviewos.questionbank.dto;

import lombok.Builder;

@Builder
public record QuestionMatchResponse(
        QuestionPublicView question,
        String rationale,
        boolean llmAssisted
) {}
