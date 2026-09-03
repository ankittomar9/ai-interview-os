package com.interviewos.ai.dto;

public record VoiceCoachTipResponse(
        String tip,
        String category,
        boolean shouldSpeak
) {}
