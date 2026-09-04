package com.interviewos.session.model;

import java.util.List;

public record SessionPlan(
        String source,
        DifficultyLevel level,
        List<PlannedSection> sections,
        int plannedTotalMinutes
) {}
