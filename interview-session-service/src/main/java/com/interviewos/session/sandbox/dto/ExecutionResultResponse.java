package com.interviewos.session.sandbox.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record ExecutionResultResponse(
        String status, // PASSED, PARTIAL, FAILED, COMPILE_ERROR, TIMEOUT, MEMORY_EXCEEDED
        int totalTests,
        int passedTests,
        double executionTimeMs,
        double memoryUsedMb,
        String stdout,
        String stderr,
        String compilerOutput,
        List<TestCaseResult> testResults
) {
    @Builder
    public record TestCaseResult(
            String name,
            String status, // PASS, FAIL, ERROR
            double durationMs,
            String input,
            String expectedOutput,
            String actualOutput,
            String error,
            boolean isHidden
    ) {}
}
