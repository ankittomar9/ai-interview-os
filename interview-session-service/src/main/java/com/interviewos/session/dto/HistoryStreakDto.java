package com.interviewos.session.dto;

public record HistoryStreakDto(
        int currentStreak,
        int longestStreak,
        boolean activeToday,
        String lastSolvedDay,
        long totalDaysActive,
        long totalSolved
) {}
