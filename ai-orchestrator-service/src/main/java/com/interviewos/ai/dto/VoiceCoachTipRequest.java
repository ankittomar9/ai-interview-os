package com.interviewos.ai.dto;

public record VoiceCoachTipRequest(
        int elapsedSeconds,
        int testFailures,
        int consecutiveFailures,
        int candidateWords,
        String currentTrack,
        String problemTitle
) {}
