package com.interviewos.session.dto;

import java.time.Instant;

public record HistoryStreakResponse(
        int currentStreak,
        int longestStreak,
        boolean activeToday,
        String lastSolvedDay,
        long totalDaysActive,
        long totalSolved,
        String tz,
        Instant generatedAt
) {
    public static HistoryStreakResponse from(HistoryStreakDto streak, String tz, Instant generatedAt) {
        return new HistoryStreakResponse(
                streak.currentStreak(),
                streak.longestStreak(),
                streak.activeToday(),
                streak.lastSolvedDay(),
                streak.totalDaysActive(),
                streak.totalSolved(),
                tz,
                generatedAt
        );
    }
}
