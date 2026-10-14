package com.interviewos.session.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record HistoryLinkDto(
        String kind,
        String slug,
        Long sessionId
) {
    public static HistoryLinkDto practice(String slug) {
        return new HistoryLinkDto("PRACTICE", slug, null);
    }

    public static HistoryLinkDto report(Long sessionId) {
        return new HistoryLinkDto("REPORT", null, sessionId);
    }
}
