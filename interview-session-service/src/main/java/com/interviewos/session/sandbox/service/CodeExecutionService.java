package com.interviewos.session.sandbox.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.sandbox.client.Judge0Client;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecuteCodeRequest;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import com.interviewos.session.sandbox.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeExecutionService {

    private final Judge0Client judge0Client;
    private final ProblemRepository problemRepository;
    private final InterviewSessionMongoRepository sessionMongoRepository;

    public ExecutionResultResponse executeCode(Long sessionId, ExecuteCodeRequest request) {
        log.info("Executing code for session {} [Language: {}, Problem: {}]", sessionId, request.language(), request.problemSlug());

        // 1. Resolve Problem Definition (Zero Silent Fallback)
        Optional<ProblemDocument> problemOpt = resolveProblem(request.problemSlug());
        if (problemOpt.isEmpty()) {
            log.warn("❌ Problem definition not found for slug: {}", request.problemSlug());
            return ExecutionResultResponse.builder()
                    .status("PROBLEM_NOT_FOUND")
                    .totalTests(0)
                    .passedTests(0)
                    .executionTimeMs(0.0)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("Problem definition not found in catalog for slug: '" + request.problemSlug() + "'. Zero silent fallback.")
                    .compilerOutput("")
                    .testResults(List.of())
                    .build();
        }

        ProblemDocument problem = problemOpt.get();
        int languageId = resolveLanguageId(request.language());
        double timeLimitSec = Math.min(5.0, (double) problem.getLimits().timeLimitMs() / 1000.0);
        int memoryLimitKb = Math.min(256000, problem.getLimits().memoryLimitMb() * 1000);

        List<ExecutionResultResponse.TestCaseResult> testResults = new ArrayList<>();
        int passedCount = 0;
        double maxExecTimeMs = 0.0;
        double maxMemoryMb = 0.0;
        StringBuilder aggregatedStdout = new StringBuilder();
        StringBuilder aggregatedStderr = new StringBuilder();

        // 2. Unified sequence of Sample Tests + Hidden Tests
        List<TestDescriptor> allTests = new ArrayList<>();
        problem.getSampleTests().forEach(st -> allTests.add(new TestDescriptor(st.name(), st.input(), st.expectedOutput(), false)));
        problem.getHiddenTests().forEach(ht -> allTests.add(new TestDescriptor(ht.name(), ht.input(), ht.expectedOutput(), true)));

        int totalTests = allTests.size();

        // 3. Per-Test-Case Execution Loop
        for (int i = 0; i < allTests.size(); i++) {
            TestDescriptor test = allTests.get(i);

            Judge0Client.Judge0SubmissionRequest subReq = Judge0Client.Judge0SubmissionRequest.builder()
                    .source_code(request.codeSnippet())
                    .language_id(languageId)
                    .stdin(test.input())
                    .expected_output(test.expectedOutput())
                    .cpu_time_limit(timeLimitSec)
                    .memory_limit(memoryLimitKb)
                    .build();

            Optional<Judge0Client.Judge0SubmissionResponse> optResp = judge0Client.submitAndAwait(subReq);

            // If Judge0 is down or unreachable, return ENGINE_UNAVAILABLE (never fabricate passes)
            if (optResp.isEmpty()) {
                return ExecutionResultResponse.builder()
                        .status("ENGINE_UNAVAILABLE")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(0.0)
                        .memoryUsedMb(0.0)
                        .stdout("")
                        .stderr("Judge0 execution engine is currently unreachable. Please ensure the judge0 container is running.")
                        .compilerOutput("")
                        .testResults(List.of())
                        .build();
            }

            Judge0Client.Judge0SubmissionResponse resp = optResp.get();
            String compileOutput = resp.compile_output() != null ? resp.compile_output() : "";
            int statusId = resp.status() != null ? resp.status().id() : 0;

            // COMPILE_ERROR check (Status 6 or compile_output non-blank) -> abort test loop immediately
            if (statusId == 6 || !compileOutput.isBlank()) {
                return ExecutionResultResponse.builder()
                        .status("COMPILE_ERROR")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(0.0)
                        .memoryUsedMb(0.0)
                        .stdout(resp.stdout() != null ? resp.stdout() : "")
                        .stderr(resp.stderr() != null ? resp.stderr() : "")
                        .compilerOutput(compileOutput)
                        .testResults(List.of())
                        .build();
            }

            // TIMEOUT check (Status 5) -> abort immediately with TIMEOUT
            if (statusId == 5) {
                return ExecutionResultResponse.builder()
                        .status("TIMEOUT")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(problem.getLimits().timeLimitMs())
                        .memoryUsedMb(maxMemoryMb)
                        .stdout(aggregatedStdout.toString())
                        .stderr("Time Limit Exceeded: Execution took longer than " + problem.getLimits().timeLimitMs() + "ms on test: " + test.name())
                        .compilerOutput("")
                        .testResults(testResults)
                        .build();
            }

            // Track execution performance
            double durationMs = 0.0;
            if (resp.time() != null) {
                try {
                    durationMs = Double.parseDouble(resp.time()) * 1000.0;
                    maxExecTimeMs = Math.max(maxExecTimeMs, durationMs);
                } catch (NumberFormatException ignored) {}
            }
            if (resp.memory() != null) {
                maxMemoryMb = Math.max(maxMemoryMb, resp.memory() / 1024.0);
            }

            if (resp.stdout() != null) aggregatedStdout.append(resp.stdout());
            if (resp.stderr() != null) aggregatedStderr.append(resp.stderr());

            // Check actual stdout against expected
            String actualStdout = resp.stdout() != null ? resp.stdout().trim() : "";
            String expected = test.expectedOutput() != null ? test.expectedOutput().trim() : "";
            boolean passed = (statusId == 3) || actualStdout.equals(expected);

            if (passed) {
                passedCount++;
            }

            testResults.add(ExecutionResultResponse.TestCaseResult.builder()
                    .name(test.name())
                    .status(passed ? "PASS" : "FAIL")
                    .durationMs(durationMs)
                    .input(test.isHidden() ? "[Hidden Input]" : test.input())
                    .expectedOutput(test.isHidden() ? "[Hidden Expected]" : test.expectedOutput())
                    .actualOutput(test.isHidden() ? (passed ? "[Verified]" : "[Mismatch]") : actualStdout)
                    .error(passed ? null : (resp.stderr() != null && !resp.stderr().isBlank() ? resp.stderr().trim() : "Expected: '" + expected + "', Got: '" + actualStdout + "'"))
                    .isHidden(test.isHidden())
                    .build());
        }

        String overallStatus = passedCount == totalTests ? "PASSED" : (passedCount > 0 ? "PARTIAL" : "FAILED");

        ExecutionResultResponse finalResult = ExecutionResultResponse.builder()
                .status(overallStatus)
                .totalTests(totalTests)
                .passedTests(passedCount)
                .executionTimeMs(maxExecTimeMs)
                .memoryUsedMb(maxMemoryMb)
                .stdout(aggregatedStdout.toString())
                .stderr(aggregatedStderr.toString())
                .compilerOutput("")
                .testResults(testResults)
                .build();

        // 4. Persist Execution Turn into MongoDB Transcript as CODE_EXECUTION
        try {
            sessionMongoRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                if (doc.getTranscript() == null) {
                    doc.setTranscript(new ArrayList<>());
                }
                InterviewSessionDocument.TranscriptTurn turn = InterviewSessionDocument.TranscriptTurn.builder()
                        .turnNumber(doc.getTranscript().size() + 1)
                        .senderRole("CANDIDATE")
                        .messageType("CODE_EXECUTION")
                        .content(String.format("Candidate executed code: %d/%d tests passed (%s) in %.1fms. [problem:%s]",
                                finalResult.passedTests(), finalResult.totalTests(), finalResult.status(), finalResult.executionTimeMs(), request.problemSlug()))
                        .codeSnippet(request.codeSnippet())
                        .timestamp(LocalDateTime.now())
                        .build();

                doc.getTranscript().add(turn);
                sessionMongoRepository.save(doc);
            });
        } catch (Exception e) {
            log.warn("⚠️ Failed to record code execution turn in Mongo transcript: {}", e.getMessage());
        }

        return finalResult;
    }

    private Optional<ProblemDocument> resolveProblem(String slug) {
        if (slug != null && !slug.isBlank()) {
            return problemRepository.findByProblemSlug(slug);
        }
        return Optional.empty();
    }

    private int resolveLanguageId(String language) {
        if (language == null) return 62; // Java 13/17/21
        String lower = language.toLowerCase();
        if (lower.contains("py")) return 71; // Python 3
        if (lower.contains("js") || lower.contains("node") || lower.contains("script")) return 63; // Node.js
        return 62; // Default Java
    }

    private record TestDescriptor(String name, String input, String expectedOutput, boolean isHidden) {}
}
