package com.interviewos.ai.rubric.controller;

import com.interviewos.ai.rubric.dto.RubricEvaluationRequest;
import com.interviewos.ai.rubric.dto.RubricResponse;
import com.interviewos.ai.rubric.service.RubricService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class RubricController {

    private final RubricService rubricService;

    @PostMapping("/rubric-evaluate")
    public ResponseEntity<RubricResponse> evaluateRubric(@RequestBody RubricEvaluationRequest request) {
        log.info("Received rubric evaluation request for problem '{}'", request.problemSlug());
        RubricResponse response = rubricService.evaluateRubric(request);
        return ResponseEntity.ok(response);
    }
}
