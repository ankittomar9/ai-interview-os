package com.interviewos.session.dto;

import java.time.Instant;
import java.util.List;

public record HistoryCalendarResponse(
        String userId,
        String tz,
        String fromDay,
        String toDay,
        List<HistoryCalendarDayDto> days,
        HistoryStreakDto streak,
        Instant generatedAt
) {}
