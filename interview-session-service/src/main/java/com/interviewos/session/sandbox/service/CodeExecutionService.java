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

    /**
     * Executes single-file DSA / algorithm submissions (backward compatible).
     */
    public ExecutionResultResponse executeCode(Long sessionId, ExecuteCodeRequest request) {
        log.info("Executing single-file code for session {} [Language: {}, Problem: {}]", sessionId, request.language(), request.problemSlug());

        Optional<ProblemDocument> problemOpt = resolveProblem(request.problemSlug());
        if (problemOpt.isEmpty()) {
            log.warn("❌ Problem definition not found for slug: {}", request.problemSlug());
            return buildProblemNotFound(request.problemSlug());
        }

        ProblemDocument problem = problemOpt.get();
        TrackRunner runner = findRunner(problem);
        Map<String, String> candidateFiles = Map.of("Solution", request.codeSnippet());

        ExecutionResultResponse result = runner.run(sessionId, problem, candidateFiles, request.language());
        recordExecutionTurn(sessionId, request.problemSlug(), result, request.codeSnippet());
        return result;
    }

    /**
     * Executes multi-file project workspace submissions (Spring Boot / LLD).
     */
    public ExecutionResultResponse executeProject(Long sessionId, ExecuteProjectRequest request) {
        log.info("Executing multi-file project for session {} [Problem: {}, Source: {}]",
                sessionId, request.problemSlug(), request.source());

        Optional<ProblemDocument> problemOpt = resolveProblem(request.problemSlug());
        if (problemOpt.isEmpty()) {
            log.warn("❌ Problem definition not found for slug: {}", request.problemSlug());
            return buildProblemNotFound(request.problemSlug());
        }

        ProblemDocument problem = problemOpt.get();
        TrackRunner runner = findRunner(problem);

        ExecutionResultResponse result;
        if (request.isWorkspaceSource()) {
            String volumeName = request.workspaceVolume() != null && !request.workspaceVolume().isBlank()
                    ? request.workspaceVolume()
                    : "ws_" + sessionId;
            result = runner.runWithVolume(sessionId, problem, volumeName);
            recordExecutionTurn(sessionId, request.problemSlug(), result, "[Workspace Volume Execution: " + volumeName + "]");
        } else {
            Map<String, String> candidateFiles = request.files() != null ? request.files() : Map.of();
            result = runner.run(sessionId, problem, candidateFiles);
            recordExecutionTurn(sessionId, request.problemSlug(), result, "[Multi-file Project Submission]");
        }

        return result;
    }

    private TrackRunner findRunner(ProblemDocument problem) {
        return trackRunners.stream()
                .filter(r -> r.supports(problem))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No compatible TrackRunner found for problem buildProfile: " + problem.getBuildProfile()));
    }

    private void recordExecutionTurn(Long sessionId, String slug, ExecutionResultResponse result, String codeSnippet) {
        try {
            sessionMongoRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                if (doc.getTranscript() == null) {
                    doc.setTranscript(new ArrayList<>());
                }
                InterviewSessionDocument.TranscriptTurn turn = InterviewSessionDocument.TranscriptTurn.builder()
                        .turnNumber(doc.getTranscript().size() + 1)
                        .senderRole("CANDIDATE")
                        .messageType("CODE_EXECUTION")
                        .content(String.format("Candidate executed project tests: %d/%d tests passed (%s) in %.1fms. [problem:%s]",
                                result.passedTests(), result.totalTests(), result.status(), result.executionTimeMs(), slug))
                        .codeSnippet(codeSnippet)
                        .timestamp(LocalDateTime.now())
                        .build();

                doc.getTranscript().add(turn);
                sessionMongoRepository.save(doc);
                log.info("Recorded CODE_EXECUTION turn for session {}: {}/{} passed ({})", sessionId, result.passedTests(), result.totalTests(), result.status());
            });
        } catch (Exception e) {
            log.warn("⚠️ Failed to record execution turn in Mongo transcript: {}", e.getMessage());
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
}
