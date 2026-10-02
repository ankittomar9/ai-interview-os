package com.interviewos.apigatewayservice.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * SPEC-008 T-3: Client Telemetry Echo Controller
 * Receives frontend telemetry event batches, validates bounds, and echoes
 * each event to gateway stdout so Promtail/Loki captures browser-side telemetry.
 *
 * Non-negotiables:
 * - Zero persistence / zero repository dependencies
 * - Max 50 events per batch
 * - Max 512 chars per event message
 * - Max 64 KB (65536 bytes) body size
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/telemetry")
public class TelemetryEchoController {

    private static final int MAX_EVENTS = 50;
    private static final int MAX_MSG_LENGTH = 512;
    private static final long MAX_BODY_BYTES = 64 * 1024; // 65536 bytes

    public record ClientLogEventDto(
            String ts,
            String level,
            String tag,
            String msg,
            Long sessionId,
            String mode,
            Map<String, Object> ctx
    ) {}

    public record ClientLogsBatchDto(
            List<ClientLogEventDto> events
    ) {}

    @PostMapping("/client-logs")
    public Mono<ResponseEntity<Void>> echoClientLogs(
            @RequestHeader(value = HttpHeaders.CONTENT_LENGTH, required = false) Long contentLength,
            @RequestBody ClientLogsBatchDto batch
    ) {
        // 1. Check body size limit (64 KB)
        if (contentLength != null && contentLength > MAX_BODY_BYTES) {
            return Mono.just(ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build());
        }

        // 2. Validate batch existence
        if (batch == null || batch.events() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
        }

        List<ClientLogEventDto> events = batch.events();

        // 3. Validate max 50 events
        if (events.size() > MAX_EVENTS) {
            return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
        }

        // 4. Validate per-event bounds
        for (ClientLogEventDto event : events) {
            if (event == null || event.tag() == null || event.tag().isBlank()) {
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
            }
            if (event.msg() != null && event.msg().length() > MAX_MSG_LENGTH) {
                return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST).build());
            }
        }

        // 5. Echo to stdout for Promtail/Loki capture
        for (ClientLogEventDto event : events) {
            String sid = event.sessionId() != null ? String.valueOf(event.sessionId()) : "none";
            String mode = event.mode() != null ? event.mode() : "none";
            String tag = event.tag().trim();
            String msg = event.msg() != null ? event.msg() : "";

            log.info("[CLIENT] source=frontend sessionId={} mode={} {} | {}", sid, mode, tag, msg);
        }

        // 6. Return 202 Accepted
        return Mono.just(ResponseEntity.status(HttpStatus.ACCEPTED).build());
    }
}
