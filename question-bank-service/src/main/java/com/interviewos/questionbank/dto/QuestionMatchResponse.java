package com.interviewos.questionbank.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record QuestionMatchResponse(
        QuestionPublicView question,
        List<QuestionPublicView> questions,
        String rationale,
        boolean llmAssisted
) {}
