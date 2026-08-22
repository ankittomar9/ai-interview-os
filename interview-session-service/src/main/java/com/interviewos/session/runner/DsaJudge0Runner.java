package com.interviewos.session.runner;

import com.interviewos.session.sandbox.client.Judge0Client;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DsaJudge0Runner implements TrackRunner {

    private final Judge0Client judge0Client;

    @Override
    public boolean supports(ProblemDocument problem) {
        return problem != null && ("judge0".equalsIgnoreCase(problem.getBuildProfile())
                || problem.getBuildProfile() == null
                || problem.getStarterFiles() == null
                || problem.getStarterFiles().isEmpty());
    }

    @Override
    public ExecutionResultResponse run(Long sessionId, ProblemDocument problem, Map<String, String> candidateFiles) {
        String codeSnippet = candidateFiles != null ? candidateFiles.values().stream().findFirst().orElse("") : "";
        String language = "java"; // default

        int languageId = 62; // Java 13/17/21
        double timeLimitSec = Math.min(5.0, (double) problem.getLimits().timeLimitMs() / 1000.0);
        int memoryLimitKb = Math.min(256000, problem.getLimits().memoryLimitMb() * 1000);

        List<ExecutionResultResponse.TestCaseResult> testResults = new ArrayList<>();
        int passedCount = 0;
        double maxExecTimeMs = 0.0;
        double maxMemoryMb = 0.0;
        StringBuilder aggregatedStdout = new StringBuilder();
        StringBuilder aggregatedStderr = new StringBuilder();

        // Sample + Hidden Tests
        List<TestDescriptor> allTests = new ArrayList<>();
        if (problem.getSampleTests() != null) {
            problem.getSampleTests().forEach(st -> allTests.add(new TestDescriptor(st.name(), st.input(), st.expectedOutput(), false)));
        }
        if (problem.getHiddenTests() != null) {
            problem.getHiddenTests().forEach(ht -> allTests.add(new TestDescriptor(ht.name(), ht.input(), ht.expectedOutput(), true)));
        }

        int totalTests = allTests.size();

        for (TestDescriptor test : allTests) {
            Judge0Client.Judge0SubmissionRequest subReq = Judge0Client.Judge0SubmissionRequest.builder()
                    .source_code(codeSnippet)
                    .language_id(languageId)
                    .stdin(test.input())
                    .expected_output(test.expectedOutput())
                    .cpu_time_limit(timeLimitSec)
                    .memory_limit(memoryLimitKb)
                    .build();

            Optional<Judge0Client.Judge0SubmissionResponse> optResp = judge0Client.submitAndAwait(subReq);

            if (optResp.isEmpty()) {
                return ExecutionResultResponse.builder()
                        .status("ENGINE_UNAVAILABLE")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(0.0)
                        .memoryUsedMb(0.0)
                        .stdout("")
                        .stderr("Judge0 execution engine is currently unreachable.")
                        .compilerOutput("")
                        .testResults(List.of())
                        .build();
            }

            Judge0Client.Judge0SubmissionResponse resp = optResp.get();
            String compileOutput = resp.compile_output() != null ? resp.compile_output() : "";
            int statusId = resp.status() != null ? resp.status().id() : 0;

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

            if (statusId == 5) {
                return ExecutionResultResponse.builder()
                        .status("TIMEOUT")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(problem.getLimits().timeLimitMs())
                        .memoryUsedMb(maxMemoryMb)
                        .stdout(aggregatedStdout.toString())
                        .stderr("Time Limit Exceeded on test: " + test.name())
                        .compilerOutput("")
                        .testResults(testResults)
                        .build();
            }

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

        return ExecutionResultResponse.builder()
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
    }

    private record TestDescriptor(String name, String input, String expectedOutput, boolean isHidden) {}
}
