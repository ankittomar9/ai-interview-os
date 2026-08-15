package com.interviewos.proctor.service;

import com.interviewos.proctor.dto.RecordTelemetryRequest;
import com.interviewos.proctor.dto.TelemetrySummaryResponse;
import com.interviewos.proctor.entity.TelemetryEvent;
import com.interviewos.proctor.model.IntegrityRiskLevel;
import com.interviewos.proctor.model.TelemetryEventType;
import com.interviewos.proctor.repository.TelemetryEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProctorSentinelService {

    private final TelemetryEventRepository eventRepository;

    @Transactional
    public TelemetrySummaryResponse.TelemetryEventResponse recordEvent(RecordTelemetryRequest request) {
        boolean flagged = isEventSuspicious(request);

        TelemetryEvent event = TelemetryEvent.builder()
                .sessionId(request.sessionId())
                .eventType(request.eventType())
                .characterCount(request.characterCount())
                .durationSeconds(request.durationSeconds())
                .metadataDetails(request.metadataDetails())
                .isFlagged(flagged)
                .build();

        TelemetryEvent saved = eventRepository.save(event);
        log.info("Recorded proctor event: {} for session {}, flagged={}", request.eventType(), request.sessionId(), flagged);

        return TelemetrySummaryResponse.TelemetryEventResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public TelemetrySummaryResponse getSessionSummary(Long sessionId) {
        List<TelemetryEvent> events = eventRepository.findBySessionIdOrderByTimestampAsc(sessionId);

        int tabSwitches = 0;
        int pasteDumps = 0;
        int keystrokeBursts = 0;
        int totalPenalty = 0;
        List<String> anomalyFlags = new ArrayList<>();

        for (TelemetryEvent e : events) {
            if (e.getEventType() == TelemetryEventType.TAB_BLUR) {
                tabSwitches++;
                totalPenalty += 5; // 5 pts per tab switch
                if (e.getDurationSeconds() != null && e.getDurationSeconds() > 10) {
                    anomalyFlags.add("Candidate was away from interview tab for " + e.getDurationSeconds() + " seconds.");
                }
            } else if (e.getEventType() == TelemetryEventType.PASTE_DUMP) {
                pasteDumps++;
                totalPenalty += 15; // 15 pts per instant code paste dump
                anomalyFlags.add("Instantaneous paste dump detected (" + (e.getCharacterCount() != null ? e.getCharacterCount() : ">150") + " characters).");
            } else if (e.getEventType() == TelemetryEventType.KEYSTROKE_BURST) {
                keystrokeBursts++;
                totalPenalty += 10;
                anomalyFlags.add("Unnatural high-frequency keystroke burst detected.");
            }
        }

        // Cap score between 0 and 100
        int finalScore = Math.max(0, 100 - totalPenalty);

        IntegrityRiskLevel riskLevel;
        String verdict;

        if (finalScore >= 85) {
            riskLevel = IntegrityRiskLevel.CLEAN;
            verdict = "High Integrity: Natural, honest interview progression observed.";
        } else if (finalScore >= 60) {
            riskLevel = IntegrityRiskLevel.SUSPICIOUS;
            verdict = "Moderate Suspicion: Multiple tab focus losses or code paste bursts spotted.";
        } else {
            riskLevel = IntegrityRiskLevel.CHEATING_FLAGGED;
            verdict = "High Cheating Risk: Significant external assistance or copy-paste code injection detected.";
        }

        List<TelemetrySummaryResponse.TelemetryEventResponse> eventResponses = events.stream()
                .map(TelemetrySummaryResponse.TelemetryEventResponse::fromEntity)
                .toList();

        return new TelemetrySummaryResponse(
                sessionId,
                finalScore,
                riskLevel,
                verdict,
                events.size(),
                tabSwitches,
                pasteDumps,
                keystrokeBursts,
                anomalyFlags,
                eventResponses
        );
    }

    private boolean isEventSuspicious(RecordTelemetryRequest req) {
        if (req.eventType() == TelemetryEventType.PASTE_DUMP && req.characterCount() != null && req.characterCount() > 100) {
            return true;
        }
        if (req.eventType() == TelemetryEventType.TAB_BLUR && req.durationSeconds() != null && req.durationSeconds() > 5) {
            return true;
        }
        return req.eventType() == TelemetryEventType.KEYSTROKE_BURST;
    }
}