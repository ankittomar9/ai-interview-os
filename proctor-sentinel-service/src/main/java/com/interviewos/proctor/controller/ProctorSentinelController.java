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
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ProctorSentinelController {

    private final ProctorSentinelService proctorService;

    @PostMapping("/events")
    public ResponseEntity<TelemetrySummaryResponse.TelemetryEventResponse> recordEvent(
            @Valid @RequestBody RecordTelemetryRequest request
    ) {
        TelemetrySummaryResponse.TelemetryEventResponse response = proctorService.recordEvent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/session/{sessionId}/summary")
    public ResponseEntity<TelemetrySummaryResponse> getSessionSummary(@PathVariable Long sessionId) {
        TelemetrySummaryResponse summary = proctorService.getSessionSummary(sessionId);
        return ResponseEntity.ok(summary);
    }
}