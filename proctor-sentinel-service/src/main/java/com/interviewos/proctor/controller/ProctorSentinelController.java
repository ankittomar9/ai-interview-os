package com.interviewos.proctor.controller;

import com.interviewos.proctor.dto.RecordTelemetryRequest;
import com.interviewos.proctor.dto.TelemetrySummaryResponse;
import com.interviewos.proctor.service.ProctorSentinelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/proctor")
//@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProctorSentinelController {

    private final ProctorSentinelService proctorService;

    @PostMapping("/events")
    public ResponseEntity<TelemetrySummaryResponse.TelemetryEventResponse> recordEvent(
            @Valid @RequestBody RecordTelemetryRequest request
    ) {
        long start = System.currentTimeMillis();
        log.info("🛡️ Telemetry Event Ingested: Session={}, EventType={}, Chars={}, Duration={}s",
                request.sessionId(), request.eventType(), request.characterCount(), request.durationSeconds());

        TelemetrySummaryResponse.TelemetryEventResponse response = proctorService.recordEvent(request);
        log.info("🛡️ Telemetry Event Processed: Session={}, Flagged={} in {}ms",
                request.sessionId(), response.isFlagged(), (System.currentTimeMillis() - start));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/session/{sessionId}/summary")
    public ResponseEntity<TelemetrySummaryResponse> getSessionSummary(@PathVariable Long sessionId) {
        long start = System.currentTimeMillis();
        log.info("🛡️ Fetching Proctor Integrity Summary for Session: {}", sessionId);
        TelemetrySummaryResponse summary = proctorService.getSessionSummary(sessionId);
        log.info("🛡️ Proctor Summary: Session={}, IntegrityScore={}/100, RiskLevel={}, EventsCount={} in {}ms",
                sessionId, summary.integrityScore(), summary.riskLevel(), summary.totalEventsCount(), (System.currentTimeMillis() - start));
        return ResponseEntity.ok(summary);
    }
}