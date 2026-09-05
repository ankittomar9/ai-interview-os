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

import java.util.List;
import java.util.Map;
import com.interviewos.ai.dto.ProviderStatusDto;
import com.interviewos.ai.service.ProviderStatusService;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiOrchestratorController {

    private final AiOrchestratorService orchestratorService;
    private final WhisperTranscriptionService whisperService;
    private final com.interviewos.ai.service.VoiceCoachService voiceCoachService;
    private final com.interviewos.ai.service.EgressTracker egressTracker;
    private final ProviderStatusService providerStatusService;

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
                        .integritySignals(request.integritySignals())
                        .candidateName(request.candidateName())
                        .currentStage(request.currentStage())
                        .sectionType(request.sectionType())
                        .sectionIndex(request.sectionIndex())
                        .totalSections(request.totalSections())
                        .softTimeBudgetMinutes(request.softTimeBudgetMinutes())
                        .sectionQuestionTitle(request.sectionQuestionTitle())
                        .sectionNote(request.sectionNote())
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
            @RequestParam(value = "model", required = false) String model,
            @RequestParam(value = "promptContext", required = false) String promptContext,
            @RequestParam(value = "sessionId", required = false) Long sessionId,
            @RequestParam(value = "lang", required = false, defaultValue = "en") String lang
    ) {
        MultipartFile targetFile = file != null ? file : audio;
        if (targetFile == null || targetFile.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No audio file provided in request"));
        }
        String effectiveApiKey = (headerApiKey != null && !headerApiKey.isBlank()) ? headerApiKey : apiKey;
        log.info("🎙️ Transcribe Audio Request Received: File='{}', Size={} bytes, sessionId={}, hasPromptContext={}",
                targetFile.getOriginalFilename(), targetFile.getSize(), sessionId, (promptContext != null && !promptContext.isBlank()));
        Map<String, String> result = whisperService.transcribeAudio(targetFile, effectiveApiKey, model, promptContext, sessionId, lang);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/voice-coach/tip")
    public ResponseEntity<com.interviewos.ai.dto.VoiceCoachTipResponse> getVoiceCoachTip(
            @RequestBody com.interviewos.ai.dto.VoiceCoachTipRequest request
    ) {
        log.info("💡 Generating Voice Coach tip for elapsed={}s, failures={}", request.elapsedSeconds(), request.testFailures());
        com.interviewos.ai.dto.VoiceCoachTipResponse tip = voiceCoachService.generateTip(request);
        return ResponseEntity.ok(tip);
    }

    @GetMapping("/purity")
    public ResponseEntity<com.interviewos.ai.service.EgressTracker.PurityStatus> getPurityStatus() {
        return ResponseEntity.ok(egressTracker.getStatus());
    }

    @GetMapping("/ollama/status")
    public ResponseEntity<Map<String, Object>> getOllamaStatus() {
        boolean running = orchestratorService.isOllamaRunning();
        return ResponseEntity.ok(Map.of(
                "running", running,
                "provider", "OLLAMA"
        ));
    }

    @GetMapping("/providers/status")
    public ResponseEntity<List<ProviderStatusDto>> getProvidersStatus(
            @RequestHeader(value = "X-InterviewOS-Key", required = false) String byokKey,
            @RequestHeader(value = "X-InterviewOS-Provider", required = false) String headerProvider,
            @RequestParam(value = "provider", required = false) String queryProvider
    ) {
        String targetProvider = queryProvider != null && !queryProvider.isBlank() ? queryProvider : headerProvider;
        return ResponseEntity.ok(providerStatusService.getProvidersStatus(byokKey, targetProvider));
    }

    @PostMapping("/providers/status/refresh")
    public ResponseEntity<List<ProviderStatusDto>> refreshProvidersStatus() {
        return ResponseEntity.ok(providerStatusService.refresh());
    }
}