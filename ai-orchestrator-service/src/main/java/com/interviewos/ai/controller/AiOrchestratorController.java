package com.interviewos.ai.controller;

import com.interviewos.ai.dto.AiDialogueRequest;
import com.interviewos.ai.dto.AiDialogueResponse;
import com.interviewos.ai.dto.GenerateQuestionRequest;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import com.interviewos.ai.service.AiOrchestratorService;
import com.interviewos.ai.service.WhisperTranscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiOrchestratorController {

    private final AiOrchestratorService orchestratorService;
    private final WhisperTranscriptionService whisperService;

    @PostMapping("/generate-question")
    public ResponseEntity<GenerateQuestionResponse> generateQuestion(
            @Valid @RequestBody GenerateQuestionRequest request
    ) {
        long start = System.currentTimeMillis();
        log.info("🤖 AI Generation Requested: Role='{}', Track='{}', Seniority='{}', Provider='{}', Model='{}'",
                request.roleTitle(), request.track(), request.difficulty(), request.modelProvider(),
                request.modelName() != null ? request.modelName() : "default");

        GenerateQuestionResponse response = orchestratorService.generateQuestion(request);
        long duration = System.currentTimeMillis() - start;

        log.info("✅ AI Question Generated: Title='{}', Difficulty='{}' in {}ms",
                response.title(), response.difficulty(), duration);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dialogue")
    public ResponseEntity<AiDialogueResponse> processDialogue(
            @Valid @RequestBody AiDialogueRequest request
    ) {
        long start = System.currentTimeMillis();
        log.info("💬 AI Dialogue Turn Received: Provider='{}', CodeProvided={}, ExplanationLength={}",
                request.modelProvider(),
                request.candidateCode() != null && !request.candidateCode().isBlank(),
                request.candidateExplanation() != null ? request.candidateExplanation().length() : 0);

        AiDialogueResponse response = orchestratorService.processDialogue(request);
        long duration = System.currentTimeMillis() - start;

        log.info("✅ AI Dialogue Evaluated: IsSolutionComplete={}, FollowUp='{}' in {}ms",
                response.isSolutionComplete(), response.followUpQuestion(), duration);
        return ResponseEntity.ok(response);
    }

    /**
     * High-Speed Neural Speech-to-Text via Groq Whisper LPU.
     */
    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> transcribeAudio(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "apiKey", required = false) String apiKey,
            @RequestParam(value = "model", required = false) String model
    ) {
        log.info("🎙️ Transcribe Audio Request Received: File='{}', Size={} bytes",
                file.getOriginalFilename(), file.getSize());
        Map<String, String> result = whisperService.transcribeAudio(file, apiKey, model);
        return ResponseEntity.ok(result);
    }
}