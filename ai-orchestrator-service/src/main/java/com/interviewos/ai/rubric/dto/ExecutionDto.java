package com.interviewos.ai.rubric.dto;

public record ExecutionDto(
        String status,
        int passedTests,
        int totalTests,
        double executionTimeMs,
        double memoryUsedMb
) {}
