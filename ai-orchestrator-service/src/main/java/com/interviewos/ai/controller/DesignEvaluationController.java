package com.interviewos.ai.controller;

import com.interviewos.ai.dto.DesignEvaluationRequest;
import com.interviewos.ai.dto.DesignEvaluationResponse;
import com.interviewos.ai.service.DesignEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class DesignEvaluationController {

    private final DesignEvaluationService designEvaluationService;

    @PostMapping("/design-evaluate")
    public ResponseEntity<DesignEvaluationResponse> evaluateDesign(
            @RequestHeader(value = "X-InterviewOS-Key", required = false) String headerApiKey,
            @Valid @RequestBody DesignEvaluationRequest request
    ) {
        log.info("Received Design Evaluation request for session: {}", request.sessionId());
        String effectiveApiKey = (headerApiKey != null && !headerApiKey.isBlank()) ? headerApiKey : request.apiKey();
        DesignEvaluationRequest effectiveRequest = (request.apiKey() == null || !request.apiKey().equals(effectiveApiKey))
                ? new DesignEvaluationRequest(
                        request.sessionId(),
                        request.canvasJsonAttachmentId(),
                        request.pngAttachmentId(),
                        request.requirements(),
                        request.modelProvider(),
                        effectiveApiKey
                )
                : request;
        DesignEvaluationResponse response = designEvaluationService.evaluateDesign(effectiveRequest);
        return ResponseEntity.ok(response);
    }
}
