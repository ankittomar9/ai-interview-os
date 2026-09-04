package com.interviewos.session.dto;

import lombok.Builder;

@Builder
public record IntegritySignals(
        Integer keystrokeCount,
        Integer avgKeystrokeIntervalMs,
        Integer keystrokeVariance,
        Integer estimatedWpm,
        Boolean suspiciousTyping,
        Integer copyCount,
        Integer pasteCount,
        Integer tabSwitchCount,
        Integer echoFilteredCount
) {}
