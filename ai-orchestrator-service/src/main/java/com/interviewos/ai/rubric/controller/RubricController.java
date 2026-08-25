package com.interviewos.ai.rubric.controller;

import com.interviewos.ai.rubric.dto.RubricEvaluationRequest;
import com.interviewos.ai.rubric.dto.RubricResponse;
import com.interviewos.ai.rubric.service.RubricService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class RubricController {

    private final RubricService rubricService;

    @PostMapping(value = "/rubric-evaluate", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RubricResponse> evaluateRubric(
            @RequestHeader(value = "X-InterviewOS-Key", required = false) String headerApiKey,
            @RequestBody RubricEvaluationRequest request
    ) {
        log.info("Received rubric evaluation request for problem '{}'", request.problemSlug());
        RubricResponse response = rubricService.evaluateRubric(request);
        return ResponseEntity.ok(response);
    }
}
