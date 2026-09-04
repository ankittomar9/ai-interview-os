package com.interviewos.session.model;

import java.util.List;

public record PlannedSection(
        SectionType sectionType,
        InterviewTrack track,
        int itemCount,
        int softTimeBudgetMinutes,
        String note,
        List<String> problemSlugs
) {
    public PlannedSection(SectionType sectionType, InterviewTrack track, int itemCount, int softTimeBudgetMinutes, String note) {
        this(sectionType, track, itemCount, softTimeBudgetMinutes, note, List.of());
    }
}
