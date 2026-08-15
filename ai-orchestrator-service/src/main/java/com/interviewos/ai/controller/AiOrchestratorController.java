package com.interviewos.ai.controller;

import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.dto.GenerateQuestionRequest;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import com.interviewos.ai.service.AiOrchestratorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@CrossOrigin(origins = "*") // Allows local React frontend to connect
@RequiredArgsConstructor
public class AiOrchestratorController {

    private final AiOrchestratorService orchestratorService;

    @PostMapping("/generate-question")
    public ResponseEntity<GenerateQuestionResponse> generateQuestion(
            @Valid @RequestBody GenerateQuestionRequest request
    ) {
        log.info("Received request to generate question for role: {}, track: {}, provider: {}",
                request.roleTitle(), request.track(), request.modelProvider());

        GenerateQuestionResponse response = orchestratorService.generateQuestion(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dialogue")
    public ResponseEntity<AiDialogueResponse> processDialogue(
            @Valid @RequestBody AiDialogueRequest request
    ) {
        log.info("Received dialogue turn for provider: {}", request.modelProvider());

        AiDialogueResponse response = orchestratorService.processDialogue(request);
        return ResponseEntity.ok(response);
    }
}