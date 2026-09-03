package com.interviewos.ai.rubric.model;

public enum RubricSchema {
    CODING,
    BEHAVIORAL,
    RESUME_BASED,
    SYSTEM_DESIGN;

    public static RubricSchema fromTrack(String track) {
        if (track == null || track.isBlank()) {
            return CODING;
        }
        String upper = track.toUpperCase();
        if (upper.contains("BEHAVIORAL") || upper.contains("LEADERSHIP")) {
            return BEHAVIORAL;
        }
        if (upper.contains("RESUME")) {
            return RESUME_BASED;
        }
        if (upper.contains("SYSTEM_DESIGN") || upper.contains("ARCHITECTURE") || upper.contains("HLD")) {
            return SYSTEM_DESIGN;
        }
        return CODING;
    }
}
