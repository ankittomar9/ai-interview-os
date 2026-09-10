package com.interviewos.ai.dto;

public record VoiceCoachTipRequest(
        int elapsedSeconds,
        int testFailures,
        int consecutiveFailures,
        int candidateWords,
        String currentTrack,
        String problemTitle,
        int candidateTurns
) {
    public VoiceCoachTipRequest(
            int elapsedSeconds,
            int testFailures,
            int consecutiveFailures,
            int candidateWords,
            String currentTrack,
            String problemTitle
    ) {
        this(elapsedSeconds, testFailures, consecutiveFailures, candidateWords, currentTrack, problemTitle, 0);
    }
}
