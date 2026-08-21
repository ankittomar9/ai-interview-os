package com.interviewos.ai.rubric.dto;

public record DimensionScore(
        String dimension,
        int score,
        String rationale,
        String evidence
) {}
