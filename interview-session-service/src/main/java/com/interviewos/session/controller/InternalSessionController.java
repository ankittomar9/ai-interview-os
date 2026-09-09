package com.interviewos.session.controller;

import com.interviewos.session.dto.OpenGateRequest;
import com.interviewos.session.dto.OpenGateResponse;
import com.interviewos.session.service.InterviewSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/internal/v1/sessions")
@RequiredArgsConstructor
public class InternalSessionController {

    private final InterviewSessionService sessionService;

    @PostMapping("/{sessionId}/sections/{index}/gate/open")
    public ResponseEntity<OpenGateResponse> openSectionGate(
            @PathVariable Long sessionId,
            @PathVariable int index,
            @RequestBody(required = false) OpenGateRequest request
    ) {
        log.info("Received internal open gate request for session {} section {}", sessionId, index);
        OpenGateResponse response = sessionService.openSectionGate(sessionId, index, request != null ? request : new OpenGateRequest("APPROACH_AGREED", 0L));
        return ResponseEntity.ok(response);
    }
}
