package com.interviewos.session.dto;

import java.util.List;

public record HistoryDayResponse(
        String userId,
        String tz,
        String day,
        long solvedCount,
        long attemptCount,
        boolean truncated,
        List<HistoryDayItem> items,
        HistoryStreakDto streak
) {}
