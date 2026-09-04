package com.interviewos.session.dto;

public record SectionTransitionRequest(
        String fromSectionType,
        String toSectionType,
        Integer sectionIndex,
        String reason,
        Integer turnCount
) {
    public SectionTransitionRequest(String fromSectionType, String toSectionType, Integer sectionIndex, String reason) {
        this(fromSectionType, toSectionType, sectionIndex, reason, null);
    }
}
