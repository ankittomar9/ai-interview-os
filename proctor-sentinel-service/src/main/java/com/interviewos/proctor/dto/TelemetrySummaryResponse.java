package com.interviewos.proctor.dto;

import com.interviewos.proctor.entity.TelemetryEvent;
import com.interviewos.proctor.model.IntegrityRiskLevel;
import com.interviewos.proctor.model.TelemetryEventType;

import java.time.Instant;
import java.util.List;

public record TelemetrySummaryResponse(
        Long sessionId,
        int integrityScore,
        IntegrityRiskLevel riskLevel,
        String integrityVerdict,
        long totalEventsCount,
        int tabSwitchCount,
        int pasteDumpCount,
        int keystrokeBurstCount,
        List<String> anomalyFlags,
        List<TelemetryEventResponse> recentEvents
) {
    public record TelemetryEventResponse(
            Long id,
            TelemetryEventType eventType,
            Integer characterCount,
            Long durationSeconds,
            String metadataDetails,
            boolean isFlagged,
            Instant timestamp
    ) {
        public static TelemetryEventResponse fromEntity(TelemetryEvent event) {
            return new TelemetryEventResponse(
                    event.getId(),
                    event.getEventType(),
                    event.getCharacterCount(),
                    event.getDurationSeconds(),
                    event.getMetadataDetails(),
                    event.isFlagged(),
                    event.getTimestamp()
            );
        }
    }
}