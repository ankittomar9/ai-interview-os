package com.interviewos.proctor.dto;

import com.interviewos.proctor.model.TelemetryEventType;
import jakarta.validation.constraints.NotNull;

public record RecordTelemetryRequest(
        @NotNull(message = "Session ID is required")
        Long sessionId,

        @NotNull(message = "Event type is required")
        TelemetryEventType eventType,

        Integer characterCount,
        Long durationSeconds,
        String metadataDetails
) {}