package com.interviewos.session.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Session interview plan structure (SPEC-016 §2.3).
 * Carries rotation policy (STRICT | DEGRADED_LRU | DEGRADED_ANY) and reused slugs when degraded.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SessionPlan(
        @JsonProperty("source") String source,
        @JsonProperty("level") DifficultyLevel level,
        @JsonProperty("sections") List<PlannedSection> sections,
        @JsonProperty("plannedTotalMinutes") int plannedTotalMinutes,
        @JsonProperty("rotationPolicy") String rotationPolicy,
        @JsonProperty("reusedSlugs") List<String> reusedSlugs
) {
    public SessionPlan(String source, DifficultyLevel level, List<PlannedSection> sections, int plannedTotalMinutes) {
        this(source, level, sections, plannedTotalMinutes, "STRICT", List.of());
    }

    public SessionPlan {
        if (rotationPolicy == null || rotationPolicy.isBlank()) {
            rotationPolicy = "STRICT";
        }
        if (reusedSlugs == null) {
            reusedSlugs = List.of();
        }
    }
}
