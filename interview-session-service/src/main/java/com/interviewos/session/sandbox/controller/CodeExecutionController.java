package com.interviewos.session.sandbox.controller;

import com.interviewos.session.sandbox.dto.ExecuteCodeRequest;
import com.interviewos.session.sandbox.dto.ExecuteProjectRequest;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import com.interviewos.session.sandbox.service.CodeExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class CodeExecutionController {

    private final CodeExecutionService executionService;

    @PostMapping("/{id}/execute")
    public ResponseEntity<ExecutionResultResponse> executeCode(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteCodeRequest request
    ) {
        log.info("Received single-file code execution request for session: {}", id);
        ExecutionResultResponse response = executionService.executeCode(id, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/execute-project")
    public ResponseEntity<ExecutionResultResponse> executeProject(
            @PathVariable Long id,
            @Valid @RequestBody ExecuteProjectRequest request
    ) {
        log.info("Received multi-file project execution request for session: {}", id);
        ExecutionResultResponse response = executionService.executeProject(id, request);
        return ResponseEntity.ok(response);
    }
}
