package com.interviewos.questionbank.dto;

import java.util.List;

public record QuestionMatchRequest(
        String track,
        String difficulty,
        List<String> resumeSkills,
        String jdText,
        String provider,
        String apiKey,
        Integer count
) {
    public QuestionMatchRequest(
            String track,
            String difficulty,
            List<String> resumeSkills,
            String jdText,
            String provider,
            String apiKey
    ) {
        this(track, difficulty, resumeSkills, jdText, provider, apiKey, 1);
    }
}
