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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
@RequiredArgsConstructor
public class DsaJudge0Runner implements TrackRunner {

    private static final int MAX_RETRIES = 3;
    private static final long BASE_DELAY_MS = 1000;

    private final Judge0Client judge0Client;

    @Override
    public boolean supports(ProblemDocument problem) {
        if (problem == null) return false;
        if ("judge0".equalsIgnoreCase(problem.getBuildProfile())) {
            return true;
        }
        if (problem.getBuildProfile() != null && !"judge0".equalsIgnoreCase(problem.getBuildProfile())) {
            return false;
        }
        return problem.getStarterFiles() == null || problem.getStarterFiles().isEmpty();
    }

    @Override
    public ExecutionResultResponse run(Long sessionId, ProblemDocument problem, Map<String, String> candidateFiles, String language) {
        String codeSnippet = candidateFiles != null ? candidateFiles.values().stream().findFirst().orElse("") : "";
        int languageId = resolveLanguageId(language);
        if (languageId == 62) {
            codeSnippet = normalizeJavaCode(codeSnippet);
        }

        log.info("Running DSA Judge0 sandbox for session {} [Language: {} (ID: {}), Problem: {}]",
                sessionId, language, languageId, problem.getProblemSlug());

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

            Optional<Judge0Client.Judge0SubmissionResponse> optResp = Optional.empty();
            for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
                optResp = judge0Client.submitAndAwait(subReq);
                if (optResp.isPresent()) {
                    break;
                }
                if (attempt < MAX_RETRIES - 1) {
                    long delay = BASE_DELAY_MS * (1L << attempt);
                    log.warn("Judge0 call failed on attempt {}/{}, retrying in {}ms...", attempt + 1, MAX_RETRIES, delay);
                    try {
                        Thread.sleep(delay);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }

            if (optResp.isEmpty()) {
                log.error("Judge0 retries exhausted ({}) for session {} test {}. Marking ENGINE_UNAVAILABLE.", MAX_RETRIES, sessionId, test.name());
                return ExecutionResultResponse.builder()
                        .status("ENGINE_UNAVAILABLE")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(0.0)
                        .memoryUsedMb(0.0)
                        .stdout("")
                        .stderr("Judge0 execution engine is currently unreachable after 3 attempts.")
                        .compilerOutput("")
                        .testResults(List.of())
                        .build();
            }

            Judge0Client.Judge0SubmissionResponse resp = optResp.get();
            String compileOutput = resp.compile_output() != null ? resp.compile_output().trim() : "";
            String stderr = resp.stderr() != null ? resp.stderr().trim() : "";
            String message = resp.message() != null ? resp.message().trim() : "";
            int statusId = resp.status() != null ? resp.status().id() : 0;

            String errDetail = !compileOutput.isBlank()
                    ? compileOutput
                    : (!stderr.isBlank() ? stderr : message);

            // Compilation Error (6, or non-empty compile_output, or exec format 14)
            if (statusId == 6 || !compileOutput.isBlank()) {
                return ExecutionResultResponse.builder()
                        .status("COMPILE_ERROR")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(0.0)
                        .memoryUsedMb(0.0)
                        .stdout(resp.stdout() != null ? resp.stdout() : "")
                        .stderr(stderr)
                        .compilerOutput(!compileOutput.isBlank() ? compileOutput : (!stderr.isBlank() ? stderr : "Compilation Failed."))
                        .testResults(List.of())
                        .build();
            }

            // Timeout / TLE (5 or 20)
            if (statusId == 5 || statusId == 20) {
                return ExecutionResultResponse.builder()
                        .status("TIMEOUT")
                        .totalTests(totalTests)
                        .passedTests(0)
                        .executionTimeMs(problem.getLimits().timeLimitMs())
                        .memoryUsedMb(maxMemoryMb)
                        .stdout(aggregatedStdout.toString())
                        .stderr("Time Limit Exceeded on test: " + test.name() + (message.isBlank() ? "" : " - " + message))
                        .compilerOutput("")
                        .testResults(testResults)
                        .build();
            }

            // Runtime Errors (7-12, 15, 16)
            if ((statusId >= 7 && statusId <= 12) || statusId == 15 || statusId == 16) {
                String runtimeErr = !errDetail.isBlank() ? errDetail : "Runtime Error (Status " + statusId + ": " + (resp.status() != null ? resp.status().description() : "NZEC") + ")";
                return ExecutionResultResponse.builder()
                        .status("RUNTIME_ERROR")
                        .totalTests(totalTests)
                        .passedTests(passedCount)
                        .executionTimeMs(maxExecTimeMs)
                        .memoryUsedMb(maxMemoryMb)
                        .stdout(aggregatedStdout.toString())
                        .stderr(runtimeErr)
                        .compilerOutput(runtimeErr)
                        .testResults(testResults)
                        .build();
            }

            // Engine / Internal error (13, 14)
            if (statusId == 13 || statusId == 14) {
                String engineErr = !errDetail.isBlank() ? errDetail : "Sandbox execution error (Status " + statusId + ")";
                return ExecutionResultResponse.builder()
                        .status("ENGINE_UNAVAILABLE")
                        .totalTests(totalTests)
                        .passedTests(passedCount)
                        .executionTimeMs(maxExecTimeMs)
                        .memoryUsedMb(maxMemoryMb)
                        .stdout(aggregatedStdout.toString())
                        .stderr(engineErr)
                        .compilerOutput(engineErr)
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
            boolean passed = (statusId == 3) || (actualStdout.equals(expected) && stderr.isBlank());

            if (passed) {
                passedCount++;
            }

            String testFailureReason = passed
                    ? null
                    : (!errDetail.isBlank() ? errDetail : "Expected: '" + expected + "', Got: '" + actualStdout + "'");

            testResults.add(ExecutionResultResponse.TestCaseResult.builder()
                    .name(test.name())
                    .status(passed ? "PASS" : "FAIL")
                    .durationMs(durationMs)
                    .input(test.isHidden() ? "[Hidden Input]" : test.input())
                    .expectedOutput(test.isHidden() ? "[Hidden Expected]" : test.expectedOutput())
                    .actualOutput(test.isHidden() ? (passed ? "[Verified]" : "[Mismatch]") : actualStdout)
                    .error(testFailureReason)
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

    public int resolveLanguageId(String language) {
        if (language == null) return 62; // Java 13/17/21 default
        String lang = language.trim().toLowerCase();
        return switch (lang) {
            case "python", "python3", "py" -> 71; // Python (3.8.1)
            case "javascript", "js", "node" -> 63; // JavaScript (Node.js 12.14.0)
            case "cpp", "c++" -> 54; // C++ (GCC 9.2.0)
            case "c" -> 50; // C (GCC 9.2.0)
            default -> 62; // Java (OpenJDK 13.0.1)
        };
    }

    public static String normalizeJavaCode(String code) {
        if (code == null || code.isBlank()) {
            return "";
        }
        // 1. If public class <Name> (where Name != Main), rename to public class Main
        Matcher publicClassMatcher = Pattern.compile("public\\s+class\\s+(\\w+)").matcher(code);
        if (publicClassMatcher.find()) {
            String name = publicClassMatcher.group(1);
            if (!"Main".equals(name)) {
                return publicClassMatcher.replaceFirst("public class Main");
            }
            return code;
        }
        // 2. If non-public class <Name> where Name != Main (and no Main class exists), rename first occurrence to public class Main
        Matcher classMatcher = Pattern.compile("(?m)^\\s*class\\s+(\\w+)").matcher(code);
        if (classMatcher.find()) {
            String name = classMatcher.group(1);
            if (!"Main".equals(name) && !code.contains("class Main")) {
                return classMatcher.replaceFirst("public class Main");
            }
        }
        return code;
    }

    private record TestDescriptor(String name, String input, String expectedOutput, boolean isHidden) {}
}
