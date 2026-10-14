package com.interviewos.session.sandbox.dto;

import lombok.Builder;

import java.util.List;

@Builder(toBuilder = true)
public record ExecutionResultResponse(
        String status, // PASSED, PARTIAL, FAILED, COMPILE_ERROR, TIMEOUT, MEMORY_EXCEEDED
        int totalTests,
        int passedTests,
        double executionTimeMs,
        double memoryUsedMb,
        String stdout,
        String stderr,
        String compilerOutput,
        List<TestCaseResult> testResults,
        Integer droppedFilesCount
) {
    /**
     * V8-01 (SPEC V-2.0.8): number of candidate file writes rejected by the editablePaths
     * whitelist during the LLD run. Surfaced so silent whitelist drops are observable.
     */
    public int droppedWriteCount() {
        return droppedFilesCount != null ? droppedFilesCount : 0;
    }

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
