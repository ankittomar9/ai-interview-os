package com.interviewos.ai.rubric.dto;

import java.util.List;

public record RubricResponse(
        List<DimensionScore> dimensions,
        List<String> strengths,
        List<String> weaknesses,
        List<String> studyPlan,
        String executiveSummary,
        boolean llmGenerated
) {
    public static RubricResponse emptyFallback() {
        return new RubricResponse(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                "",
                false
        );
    }
}
