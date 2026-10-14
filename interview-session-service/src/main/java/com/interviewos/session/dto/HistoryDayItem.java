package com.interviewos.session.dto;

import java.time.Instant;

public record HistoryDayItem(
        String id,
        String source,
        String questionId,
        String title,
        String track,
        String verdict,
        String detail,
        Instant at,
        HistoryLinkDto link
) {}
