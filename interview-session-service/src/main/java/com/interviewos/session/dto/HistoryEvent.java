package com.interviewos.session.dto;

import java.time.Instant;

public record HistoryEvent(
        String id,
        String source,
        String questionId,
        String verdict,
        String track,
        Instant at,
        String detail,
        HistoryLinkDto link
) {
    public boolean isPassed() {
        return verdict != null && verdict.equalsIgnoreCase("PASSED");
    }

    public boolean isAttempted() {
        if ("PRACTICE".equalsIgnoreCase(source)) {
            return true;
        }
        if ("INTERVIEW".equalsIgnoreCase(source)) {
            return verdict != null && (verdict.equalsIgnoreCase("PASSED") || verdict.equalsIgnoreCase("FAILED"));
        }
        return false;
    }
}
