package com.interviewos.ai.rubric.dto;

import java.util.List;

public record RubricEvaluationRequest(
        String problemSlug,
        String problemStatement,
        String track,
        String difficulty,
        List<TurnDto> transcript,
        List<ExecutionDto> executions,
        String finalCode,
        String language
) {}
