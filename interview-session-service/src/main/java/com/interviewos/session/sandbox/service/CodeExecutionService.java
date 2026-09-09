package com.interviewos.session.sandbox.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.runner.TrackRunner;
import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecuteCodeRequest;
import com.interviewos.session.sandbox.dto.ExecuteProjectRequest;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    private final List<TrackRunner> trackRunners;
    private final QuestionBankClient questionBankClient;
    private final InterviewSessionMongoRepository sessionMongoRepository;
    private final org.springframework.beans.factory.ObjectProvider<com.interviewos.session.workspace.service.WorkspaceProvisionerService> workspaceProvisionerProvider;
    private final com.interviewos.session.service.PracticeTrackingService practiceTrackingService;

    /**
     * Executes single-file DSA / algorithm submissions (backward compatible).
     */
    public ExecutionResultResponse executeCode(Long sessionId, ExecuteCodeRequest request) {
        log.info("Executing single-file code for session {} [Language: {}, Problem: {}]", sessionId, request.language(), request.problemSlug());
        assertApproachGateOpen(sessionId);

        Optional<ProblemDocument> problemOpt = resolveProblem(request.problemSlug());
        if (problemOpt.isEmpty()) {
            log.warn("❌ Problem definition not found for slug: {}", request.problemSlug());
            return buildProblemNotFound(request.problemSlug());
        }

        ProblemDocument problem = problemOpt.get();
        TrackRunner runner = findRunner(problem);
        Map<String, String> candidateFiles = Map.of("Solution", request.codeSnippet());

        ExecutionResultResponse result = runner.run(sessionId, problem, candidateFiles, request.language());
        recordExecution(sessionId, request.problemSlug(), result, request.codeSnippet(), Boolean.TRUE.equals(request.submit()));
        recordPracticeAttempt(problem, request, result);
        return result;
    }

    /**
     * Executes multi-file project workspace submissions (Spring Boot / LLD).
     */
    public ExecutionResultResponse executeProject(Long sessionId, ExecuteProjectRequest request) {
        log.info("Executing multi-file project for session {} [Problem: {}, Source: {}]",
                sessionId, request.problemSlug(), request.source());
        assertApproachGateOpen(sessionId);

        workspaceProvisionerProvider.ifAvailable(p -> p.touchWorkspace(sessionId));

        Optional<ProblemDocument> problemOpt = resolveProblem(request.problemSlug());
        if (problemOpt.isEmpty()) {
            log.warn("❌ Problem definition not found for slug: {}", request.problemSlug());
            return buildProblemNotFound(request.problemSlug());
        }

        ProblemDocument problem = problemOpt.get();
        TrackRunner runner = findRunner(problem);

        ExecutionResultResponse result;
        boolean isSubmit = Boolean.TRUE.equals(request.submit());
        if (request.isWorkspaceSource()) {
            String volumeName = request.workspaceVolume() != null && !request.workspaceVolume().isBlank()
                    ? request.workspaceVolume()
                    : "ws_" + sessionId;
            result = runner.runWithVolume(sessionId, problem, volumeName);
            recordExecution(sessionId, request.problemSlug(), result, "[Workspace Volume Execution: " + volumeName + "]", isSubmit);
        } else {
            Map<String, String> candidateFiles = request.files() != null ? request.files() : Map.of();
            result = runner.run(sessionId, problem, candidateFiles);
            recordExecution(sessionId, request.problemSlug(), result, "[Multi-file Project Submission]", isSubmit);
        }

        recordPracticeAttempt(problem, request.problemSlug(), result, 62);
        return result;
    }

    private TrackRunner findRunner(ProblemDocument problem) {
        return trackRunners.stream()
                .filter(r -> r.supports(problem))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No compatible TrackRunner found for problem buildProfile: " + problem.getBuildProfile()));
    }

    private void recordExecution(Long sessionId, String slug, ExecutionResultResponse result, String codeSnippet, boolean submit) {
        try {
            sessionMongoRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                if (doc.getSubmissionsLedger() == null) {
                    doc.setSubmissionsLedger(new ArrayList<>());
                }

                String action = submit ? "SUBMIT" : "RUN";
                InterviewSessionDocument.SubmissionEntry entry = InterviewSessionDocument.SubmissionEntry.builder()
                        .id(java.util.UUID.randomUUID().toString())
                        .problemSlug(slug)
                        .action(action)
                        .status(result.status())
                        .passedTests(result.passedTests())
                        .totalTests(result.totalTests())
                        .executionTimeMs(result.executionTimeMs())
                        .memoryUsedMb(result.memoryUsedMb())
                        .codeSnippet(codeSnippet)
                        .timestamp(LocalDateTime.now())
                        .build();
                doc.getSubmissionsLedger().add(entry);

                if (submit) {
                    if (doc.getTranscript() == null) {
                        doc.setTranscript(new ArrayList<>());
                    }

                    boolean isEngineUnavailable = "ENGINE_UNAVAILABLE".equalsIgnoreCase(result.status());
                    String messageType = isEngineUnavailable ? "ENGINE_ERROR" : "CODE_EXECUTION";
                    String senderRole = isEngineUnavailable ? "SYSTEM" : "CANDIDATE";
                    String content = isEngineUnavailable
                            ? String.format("SYSTEM NOTICE: Code execution sandbox offline (ENGINE_UNAVAILABLE) for problem '%s'. Run was not executed; candidate is not penalized.", slug)
                            : String.format("Candidate executed project tests: %d/%d tests passed (%s) in %.1fms. [problem:%s]",
                                    result.passedTests(), result.totalTests(), result.status(), result.executionTimeMs(), slug);

                    InterviewSessionDocument.TranscriptTurn turn = InterviewSessionDocument.TranscriptTurn.builder()
                            .turnNumber(doc.getTranscript().size() + 1)
                            .senderRole(senderRole)
                            .messageType(messageType)
                            .content(content)
                            .codeSnippet(codeSnippet)
                            .timestamp(LocalDateTime.now())
                            .build();

                    doc.getTranscript().add(turn);
                    if (isEngineUnavailable) {
                        log.warn("Recorded ENGINE_ERROR turn for session {} due to sandbox downtime ({})", sessionId, result.status());
                    } else {
                        log.info("Recorded CODE_EXECUTION turn for session {}: {}/{} passed ({})", sessionId, result.passedTests(), result.totalTests(), result.status());
                    }
                }

                sessionMongoRepository.save(doc);
                log.info("Saved {} attempt in submissions ledger for session {} [problem: {}, passed: {}/{}, status: {}]",
                        action, sessionId, slug, result.passedTests(), result.totalTests(), result.status());
            });
        } catch (Exception e) {
            log.warn("⚠️ Failed to record execution in Mongo: {}", e.getMessage());
        }
    }

    private Optional<ProblemDocument> resolveProblem(String slug) {
        if (slug != null && !slug.isBlank()) {
            return questionBankClient.fetchProblemBySlug(slug);
        }
        return Optional.empty();
    }

    private ExecutionResultResponse buildProblemNotFound(String slug) {
        return ExecutionResultResponse.builder()
                .status("PROBLEM_NOT_FOUND")
                .totalTests(0)
                .passedTests(0)
                .executionTimeMs(0.0)
                .memoryUsedMb(0.0)
                .stdout("")
                .stderr("Problem definition not found in Question Bank for slug: '" + slug + "'. Zero silent fallback.")
                .compilerOutput("")
                .testResults(List.of())
                .build();
    }

    private void recordPracticeAttempt(ProblemDocument problem, ExecuteCodeRequest request, ExecutionResultResponse result) {
        try {
            if (practiceTrackingService != null && problem != null && result != null) {
                int languageId = 62;
                for (TrackRunner r : trackRunners) {
                    if (r instanceof com.interviewos.session.runner.DsaJudge0Runner dsaRunner) {
                        try {
                            languageId = dsaRunner.resolveLanguageId(request.language());
                        } catch (Exception ignored) {}
                        break;
                    }
                }
                int runtimeMs = (int) Math.round(result.executionTimeMs());
                int memoryKb = (int) Math.round(result.memoryUsedMb() * 1024);
                practiceTrackingService.recordAttempt(
                        "local",
                        problem.getProblemSlug(),
                        problem.getTrack(),
                        languageId,
                        result.status(),
                        result.passedTests(),
                        result.totalTests(),
                        runtimeMs,
                        memoryKb
                );
            }
        } catch (Exception e) {
            log.warn("Failed to record practice attempt for {}: {}", problem != null ? problem.getProblemSlug() : "unknown", e.getMessage());
        }
    }

    private void recordPracticeAttempt(ProblemDocument problem, String problemSlug, ExecutionResultResponse result, int languageId) {
        try {
            if (practiceTrackingService != null && problem != null && result != null) {
                int runtimeMs = (int) Math.round(result.executionTimeMs());
                int memoryKb = (int) Math.round(result.memoryUsedMb() * 1024);
                practiceTrackingService.recordAttempt(
                        "local",
                        problemSlug,
                        problem.getTrack(),
                        languageId,
                        result.status(),
                        result.passedTests(),
                        result.totalTests(),
                        runtimeMs,
                        memoryKb
                );
            }
        } catch (Exception e) {
            log.warn("Failed to record practice attempt for {}: {}", problemSlug, e.getMessage());
        }
    }

    private void assertApproachGateOpen(Long sessionId) {
        if (sessionId == null) return;
        sessionMongoRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
            // Scope: Gate applies ONLY to SectionType in {DSA, LLD, SQL} in INTERVIEW mode. PLAYGROUND is never gated.
            if ("PLAYGROUND".equalsIgnoreCase(doc.getSessionMode())) {
                return;
            }
            List<InterviewSessionDocument.SectionProgress> progressList = doc.getSectionProgress();
            if (progressList != null && !progressList.isEmpty()) {
                InterviewSessionDocument.SectionProgress activeSection = progressList.get(progressList.size() - 1);
                String sType = activeSection.getSectionType();
                if (isGatedSectionType(sType)) {
                    String gateStatus = activeSection.getGateStatus();
                    // Backward compatibility: missing gateStatus reads as OPEN
                    if ("LOCKED".equalsIgnoreCase(gateStatus)) {
                        log.warn("Code execution rejected for session {}: GATE_LOCKED in active section '{}' (idx: {})",
                                sessionId, sType, activeSection.getIndex());
                        throw new com.interviewos.session.exception.GateLockedException("Explain your approach to the interviewer before coding.");
                    }
                }
            }
        });
    }

    private static boolean isGatedSectionType(String sType) {
        if (sType == null) return false;
        String upper = sType.toUpperCase();
        return upper.contains("DSA") || upper.contains("LLD") || upper.contains("SQL");
    }
}
