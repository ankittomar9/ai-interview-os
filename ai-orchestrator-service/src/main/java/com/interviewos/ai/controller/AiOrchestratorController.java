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
            @RequestHeader(value = "X-InterviewOS-Key", required = false) String headerApiKey,
            @Valid @RequestBody GenerateQuestionRequest request
    ) {
        long start = System.currentTimeMillis();
        String effectiveApiKey = (headerApiKey != null && !headerApiKey.isBlank()) ? headerApiKey : request.apiKey();
        GenerateQuestionRequest effectiveRequest = (request.apiKey() == null || !request.apiKey().equals(effectiveApiKey))
                ? GenerateQuestionRequest.builder()
                        .roleTitle(request.roleTitle())
                        .track(request.track())
                        .difficulty(request.difficulty())
                        .jobDescription(request.jobDescription())
                        .resumeSkills(request.resumeSkills())
                        .previousQuestions(request.previousQuestions())
                        .modelProvider(request.modelProvider())
                        .apiKey(effectiveApiKey)
                        .modelName(request.modelName())
                        .build()
                : request;

        log.info("🤖 AI Generation Requested: Role='{}', Track='{}', Seniority='{}', Provider='{}', Model='{}'",
                effectiveRequest.roleTitle(), effectiveRequest.track(), effectiveRequest.difficulty(), effectiveRequest.modelProvider(),
                effectiveRequest.modelName() != null ? effectiveRequest.modelName() : "default");

        GenerateQuestionResponse response = orchestratorService.generateQuestion(effectiveRequest);
        long duration = System.currentTimeMillis() - start;

        log.info("✅ AI Question Generated: Title='{}', Difficulty='{}' in {}ms",
                response.title(), response.difficulty(), duration);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/dialogue")
    public ResponseEntity<AiDialogueResponse> processDialogue(
            @RequestHeader(value = "X-InterviewOS-Key", required = false) String headerApiKey,
            @Valid @RequestBody AiDialogueRequest request
    ) {
        long start = System.currentTimeMillis();
        String effectiveApiKey = (headerApiKey != null && !headerApiKey.isBlank()) ? headerApiKey : request.apiKey();
        AiDialogueRequest effectiveRequest = (request.apiKey() == null || !request.apiKey().equals(effectiveApiKey))
                ? AiDialogueRequest.builder()
                        .questionContext(request.questionContext())
                        .sessionId(request.sessionId())
                        .problemSlug(request.problemSlug())
                        .candidateExplanation(request.candidateExplanation())
                        .candidateCode(request.candidateCode())
                        .chatHistory(request.chatHistory())
                        .modelProvider(request.modelProvider())
                        .apiKey(effectiveApiKey)
                        .modelName(request.modelName())
                        .latestExecution(request.latestExecution())
                        .sessionMode(request.sessionMode())
                        .build()
                : request;

        log.info("💬 AI Dialogue Turn Received: Provider='{}', CodeProvided={}, ExplanationLength={}",
                effectiveRequest.modelProvider(),
                effectiveRequest.candidateCode() != null && !effectiveRequest.candidateCode().isBlank(),
                effectiveRequest.candidateExplanation() != null ? effectiveRequest.candidateExplanation().length() : 0);

        AiDialogueResponse response = orchestratorService.processDialogue(effectiveRequest);
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
            @RequestHeader(value = "X-InterviewOS-Key", required = false) String headerApiKey,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "audio", required = false) MultipartFile audio,
            @RequestParam(value = "apiKey", required = false) String apiKey,
            @RequestParam(value = "model", required = false) String model
    ) {
        MultipartFile targetFile = file != null ? file : audio;
        if (targetFile == null || targetFile.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No audio file provided in request"));
        }
        String effectiveApiKey = (headerApiKey != null && !headerApiKey.isBlank()) ? headerApiKey : apiKey;
        log.info("🎙️ Transcribe Audio Request Received: File='{}', Size={} bytes",
                targetFile.getOriginalFilename(), targetFile.getSize());
        Map<String, String> result = whisperService.transcribeAudio(targetFile, effectiveApiKey, model);
        return ResponseEntity.ok(result);
    }
}