package com.interviewos.session.dto;

public record HistoryCalendarDayDto(
        String day,
        long solvedCount,
        long attemptCount,
        long practiceSolved,
        long interviewSolved
) {}
