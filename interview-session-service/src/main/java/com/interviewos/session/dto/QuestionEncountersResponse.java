package com.interviewos.session.dto;

import java.time.Instant;
import java.util.List;

public record QuestionEncountersResponse(
        String questionSlug,
        int practiceSolveCount,
        int interviewPassCount,
        int interviewAttemptCount,
        String pressureGap,
        List<EncounterItem> encounters
) {
    public record EncounterItem(
            Long sessionId,
            String verdict, // PASSED | FAILED | UNATTEMPTED
            Instant attemptedAt
    ) {}

    public static String formatPressureGap(int practiceSolves, int interviewPasses, int interviewAttempts) {
        return String.format("Practice ×%d · Interview %d/%d", practiceSolves, interviewPasses, interviewAttempts);
    }
}
