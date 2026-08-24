package com.interviewos.session.runner;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.WaitContainerResultCallback;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.Frame;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Volume;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class LldMavenRunner implements TrackRunner {

    private static final Pattern MVN_EXIT_PATTERN = Pattern.compile("MVN_EXIT:(\\d+)");
    private static final Pattern SUREFIRE_BLOCK_PATTERN = Pattern.compile("===SUREFIRE_START([\\s\\S]*?)===SUREFIRE_END");
    private static final Pattern XML_FILE_PATTERN = Pattern.compile("===FILE:.*?\\n([\\s\\S]*?)(?====FILE:|$)");

    @Value("${runner.maven.image:ai-interview-os/lld-runner:latest}")
    private String runnerImage;

    @Value("${runner.maven.timeout-seconds:240}")
    private int timeoutSeconds;

    private DockerClient dockerClient;
    private boolean isDockerAvailable = false;
    private boolean isInitialized = false;

    // Constructor for testing / injection
    public LldMavenRunner(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
        this.isDockerAvailable = dockerClient != null;
        this.isInitialized = true;
    }

    public LldMavenRunner() {}

    public synchronized boolean isDockerReady() {
        ensureDockerInitialized();
        if (!isDockerAvailable || dockerClient == null) {
            return false;
        }
        try {
            dockerClient.pingCmd().exec();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private synchronized void ensureDockerInitialized() {
        if (isInitialized) return;
        try {
            String dockerHost = System.getenv("DOCKER_HOST");
            if (dockerHost == null || dockerHost.isBlank()) {
                if (new File("/var/run/docker.sock").exists()) {
                    dockerHost = "unix:///var/run/docker.sock";
                }
            }

            DefaultDockerClientConfig.Builder configBuilder = DefaultDockerClientConfig.createDefaultConfigBuilder();
            if (dockerHost != null && !dockerHost.isBlank()) {
                configBuilder.withDockerHost(dockerHost);
            }
            DefaultDockerClientConfig config = configBuilder.build();

            ApacheDockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                    .dockerHost(config.getDockerHost())
                    .sslConfig(config.getSSLConfig())
                    .maxConnections(50)
                    .build();

            this.dockerClient = DockerClientImpl.getInstance(config, httpClient);
            this.dockerClient.pingCmd().exec();
            this.isDockerAvailable = true;
            log.info("🐳 Docker Java client initialized lazily for LLD Maven Sandbox. Image: {}, Host: {}", runnerImage, config.getDockerHost());
        } catch (Throwable t) {
            this.isDockerAvailable = false;
            log.warn("⚠️ Docker daemon unavailable for LLD Maven Runner: {}. Sandbox will return ENGINE_UNAVAILABLE.", t.getMessage());
        } finally {
            this.isInitialized = true;
        }
    }

    @Override
    public boolean supports(ProblemDocument problem) {
        return problem != null && "maven-spring".equalsIgnoreCase(problem.getBuildProfile());
    }

    @Override
    public ExecutionResultResponse run(Long sessionId, ProblemDocument problem, Map<String, String> candidateFiles, String language) {
        log.info("🚀 Initiating LLD Spring Boot Maven execution for session {} [problem: {}]", sessionId, problem.getProblemSlug());

        Path tempWorkspace = null;
        try {
            // 1. Create temporary isolated workspace directory
            tempWorkspace = Files.createTempDirectory("lld-ws-" + sessionId + "-" + System.currentTimeMillis());

            // 2. Populate skeleton starterFiles (pom.xml, models, interfaces, config)
            if (problem.getStarterFiles() != null) {
                for (Map.Entry<String, String> entry : problem.getStarterFiles().entrySet()) {
                    writeFile(tempWorkspace, entry.getKey(), entry.getValue());
                }
            }

            // 3. Overwrite with Candidate's files (STRICTLY constrained to editablePaths whitelist)
            Set<String> allowedPaths = new HashSet<>(problem.getEditablePaths() != null ? problem.getEditablePaths() : List.of());
            if (candidateFiles != null) {
                for (Map.Entry<String, String> entry : candidateFiles.entrySet()) {
                    String relativePath = entry.getKey().replace('\\', '/').trim();
                    if (allowedPaths.contains(relativePath)) {
                        writeFile(tempWorkspace, relativePath, entry.getValue());
                    } else {
                        log.warn("🔒 Candidate attempted to overwrite non-editable file: '{}'. Ignored.", relativePath);
                    }
                }
            }

            // 4. Inject Server-Only Hidden JUnit Test Files (under src/test/java/)
            if (problem.getHiddenTestFiles() != null) {
                for (Map.Entry<String, String> entry : problem.getHiddenTestFiles().entrySet()) {
                    writeFile(tempWorkspace, entry.getKey(), entry.getValue());
                }
            }

            // 5. Ensure lazy Docker client is initialized
            ensureDockerInitialized();

            // 6. Execute via Docker container
            if (isDockerAvailable && dockerClient != null) {
                return executeInDocker(tempWorkspace.toFile());
            } else {
                return executeFallbackSimulation(problem, candidateFiles);
            }

        } catch (Exception e) {
            log.error("Failed executing LLD Maven project: {}", e.getMessage(), e);
            return ExecutionResultResponse.builder()
                    .status("ENGINE_UNAVAILABLE")
                    .totalTests(0)
                    .passedTests(0)
                    .executionTimeMs(0.0)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("Execution engine error: " + e.getMessage())
                    .compilerOutput("")
                    .testResults(List.of())
                    .build();
        } finally {
            cleanupDirectory(tempWorkspace);
        }
    }

    @Override
    public ExecutionResultResponse runWithVolume(Long sessionId, ProblemDocument problem, String volumeName) {
        log.info("🚀 Initiating LLD Spring Boot Maven execution directly from Docker volume '{}' for session {} [problem: {}]",
                volumeName, sessionId, problem.getProblemSlug());
        ensureDockerInitialized();

        if (isDockerAvailable && dockerClient != null) {
            return executeInDockerVolume(volumeName, problem);
        } else {
            return executeFallbackSimulation(problem, Map.of());
        }
    }

    private ExecutionResultResponse executeInDockerVolume(String volumeName, ProblemDocument problem) {
        String containerId = null;
        Path tempHiddenTestsDir = null;
        try {
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withNetworkMode("none")
                    .withMemory(768L * 1024 * 1024) // 768MB RAM
                    .withNanoCPUs(2_000_000_000L)   // 2 CPU cores
                    .withAutoRemove(false)
                    .withBinds(new Bind(volumeName, new Volume("/workspace")));

            String cmdScript = "cd /workspace && mvn -o -B test; echo MVN_EXIT:$?; " +
                    "echo ===SUREFIRE_START; for f in target/surefire-reports/TEST-*.xml; do [ -f \"$f\" ] && echo ===FILE:$f && cat \"$f\"; done; echo ===SUREFIRE_END";

            CreateContainerResponse container = dockerClient.createContainerCmd(runnerImage)
                    .withHostConfig(hostConfig)
                    .withCmd("sh", "-c", cmdScript)
                    .exec();

            containerId = container.getId();

            // 1. Prepare canonical overlay directory: non-editable starter files (pom.xml, models, configs) + hidden tests
            tempHiddenTestsDir = Files.createTempDirectory("lld-canonical-overlay-");

            Set<String> editablePaths = new HashSet<>(problem.getEditablePaths() != null ? problem.getEditablePaths() : List.of());
            if (problem.getStarterFiles() != null) {
                for (Map.Entry<String, String> entry : problem.getStarterFiles().entrySet()) {
                    String relativePath = entry.getKey().replace('\\', '/').trim();
                    if (!editablePaths.contains(relativePath)) {
                        writeFile(tempHiddenTestsDir, relativePath, entry.getValue());
                    }
                }
            }

            // 2. Inject hidden tests
            if (problem.getHiddenTestFiles() != null && !problem.getHiddenTestFiles().isEmpty()) {
                for (Map.Entry<String, String> entry : problem.getHiddenTestFiles().entrySet()) {
                    writeFile(tempHiddenTestsDir, entry.getKey(), entry.getValue());
                }
            }

            // 3. Copy canonical overlay directly over /workspace in the container
            dockerClient.copyArchiveToContainerCmd(containerId)
                    .withHostResource(tempHiddenTestsDir.toAbsolutePath().toString())
                    .withRemotePath("/workspace")
                    .withDirChildrenOnly(true)
                    .exec();

            dockerClient.startContainerCmd(containerId).exec();

            // Collect logs
            StringBuilder logOutput = new StringBuilder();
            ResultCallback.Adapter<Frame> logCallback = new ResultCallback.Adapter<>() {
                @Override
                public void onNext(Frame frame) {
                    if (frame != null && frame.getPayload() != null) {
                        logOutput.append(new String(frame.getPayload(), StandardCharsets.UTF_8));
                    }
                }
            };

            dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .withFollowStream(true)
                    .exec(logCallback);

            WaitContainerResultCallback waitCallback = new WaitContainerResultCallback();
            dockerClient.waitContainerCmd(containerId).exec(waitCallback);

            boolean completed = waitCallback.awaitCompletion(timeoutSeconds, TimeUnit.SECONDS);

            if (!completed) {
                log.warn("⏱️ Maven test execution timed out after {} seconds. Killing container {}.", timeoutSeconds, containerId);
                try {
                    dockerClient.killContainerCmd(containerId).exec();
                } catch (Exception ignored) {}

                try {
                    logCallback.close();
                } catch (Exception ignored) {}

                return ExecutionResultResponse.builder()
                        .status("TIMEOUT")
                        .totalTests(0)
                        .passedTests(0)
                        .executionTimeMs(timeoutSeconds * 1000.0)
                        .memoryUsedMb(512.0)
                        .stdout("")
                        .stderr("Execution timed out after " + timeoutSeconds + " seconds.")
                        .compilerOutput("")
                        .testResults(List.of())
                        .build();
            }

            try {
                logCallback.awaitCompletion(5, TimeUnit.SECONDS);
                logCallback.close();
            } catch (Exception ignored) {}

            return parseExecutionOutput(logOutput.toString());

        } catch (Exception e) {
            log.error("Docker container volume execution failed: {}", e.getMessage(), e);
            return ExecutionResultResponse.builder()
                    .status("ENGINE_UNAVAILABLE")
                    .totalTests(0)
                    .passedTests(0)
                    .executionTimeMs(0.0)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("Execution engine error: " + e.getMessage())
                    .compilerOutput("")
                    .testResults(List.of())
                    .build();
        } finally {
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception ignored) {}
            }
            if (tempHiddenTestsDir != null) {
                cleanupDirectory(tempHiddenTestsDir);
            }
        }
    }

    private ExecutionResultResponse executeInDocker(File workspaceDir) {
        String containerId = null;
        try {
            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withNetworkMode("none")
                    .withMemory(768L * 1024 * 1024) // 768MB RAM
                    .withNanoCPUs(2_000_000_000L)   // 2 CPU cores
                    .withAutoRemove(false);

            String cmdScript = "cd /workspace && mvn -o -B test; echo MVN_EXIT:$?; " +
                    "echo ===SUREFIRE_START; for f in target/surefire-reports/TEST-*.xml; do [ -f \"$f\" ] && echo ===FILE:$f && cat \"$f\"; done; echo ===SUREFIRE_END";

            CreateContainerResponse container = dockerClient.createContainerCmd(runnerImage)
                    .withHostConfig(hostConfig)
                    .withCmd("sh", "-c", cmdScript)
                    .exec();

            containerId = container.getId();

            // Stream candidate workspace files directly into container /workspace
            dockerClient.copyArchiveToContainerCmd(containerId)
                    .withHostResource(workspaceDir.getAbsolutePath())
                    .withRemotePath("/workspace")
                    .withDirChildrenOnly(true)
                    .exec();

            dockerClient.startContainerCmd(containerId).exec();

            // Collect logs
            StringBuilder logOutput = new StringBuilder();
            ResultCallback.Adapter<Frame> logCallback = new ResultCallback.Adapter<>() {
                @Override
                public void onNext(Frame frame) {
                    if (frame != null && frame.getPayload() != null) {
                        logOutput.append(new String(frame.getPayload(), StandardCharsets.UTF_8));
                    }
                }
            };

            dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .withFollowStream(true)
                    .exec(logCallback);

            // Await completion with timeout
            WaitContainerResultCallback waitCallback = new WaitContainerResultCallback();
            dockerClient.waitContainerCmd(containerId).exec(waitCallback);

            boolean completed = waitCallback.awaitCompletion(timeoutSeconds, TimeUnit.SECONDS);

            if (!completed) {
                log.warn("⏱️ Maven test execution timed out after {} seconds. Killing container {}.", timeoutSeconds, containerId);
                try {
                    dockerClient.killContainerCmd(containerId).exec();
                } catch (Exception ignored) {}

                try {
                    logCallback.close();
                } catch (Exception ignored) {}

                return ExecutionResultResponse.builder()
                        .status("TIMEOUT")
                        .totalTests(0)
                        .passedTests(0)
                        .executionTimeMs(timeoutSeconds * 1000.0)
                        .memoryUsedMb(512.0)
                        .stdout("")
                        .stderr("Execution timed out after " + timeoutSeconds + " seconds.")
                        .compilerOutput("")
                        .testResults(List.of())
                        .build();
            }

            // Ensure log stream has completed flushing before parsing
            try {
                logCallback.awaitCompletion(5, TimeUnit.SECONDS);
                logCallback.close();
            } catch (Exception ignored) {}

            return parseExecutionOutput(logOutput.toString());

        } catch (Exception e) {
            log.error("Docker container execution failed: {}", e.getMessage(), e);
            return ExecutionResultResponse.builder()
                    .status("ENGINE_UNAVAILABLE")
                    .totalTests(0)
                    .passedTests(0)
                    .executionTimeMs(0.0)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("Docker execution failed: " + e.getMessage())
                    .compilerOutput("")
                    .testResults(List.of())
                    .build();
        } finally {
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception ignored) {}
            }
        }
    }

    public ExecutionResultResponse parseExecutionOutput(String rawOutput) {
        int exitCode = 0;
        Matcher exitMatcher = MVN_EXIT_PATTERN.matcher(rawOutput);
        if (exitMatcher.find()) {
            try {
                exitCode = Integer.parseInt(exitMatcher.group(1));
            } catch (NumberFormatException ignored) {}
        }

        List<ExecutionResultResponse.TestCaseResult> allResults = new ArrayList<>();
        Matcher surefireMatcher = SUREFIRE_BLOCK_PATTERN.matcher(rawOutput);
        if (surefireMatcher.find()) {
            String surefireBlock = surefireMatcher.group(1);
            Matcher fileMatcher = XML_FILE_PATTERN.matcher(surefireBlock);
            while (fileMatcher.find()) {
                String xmlContent = fileMatcher.group(1).trim();
                allResults.addAll(SurefireParser.parseSurefireXml(xmlContent));
            }
        }

        int totalTests = allResults.size();
        int passedTests = (int) allResults.stream().filter(r -> "PASS".equalsIgnoreCase(r.status())).count();

        // Compile failure check: Maven exited with non-zero and produced NO surefire testcase reports
        if (exitCode != 0 && totalTests == 0) {
            return ExecutionResultResponse.builder()
                    .status("COMPILE_ERROR")
                    .totalTests(0)
                    .passedTests(0)
                    .executionTimeMs(0.0)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("Maven compilation failed.")
                    .compilerOutput(extractCompilerOutput(rawOutput))
                    .testResults(List.of())
                    .build();
        }

        String overallStatus = (totalTests > 0 && passedTests == totalTests) ? "PASSED"
                : (passedTests > 0 ? "PARTIAL" : "FAILED");

        double totalDurationMs = allResults.stream().mapToDouble(ExecutionResultResponse.TestCaseResult::durationMs).sum();

        return ExecutionResultResponse.builder()
                .status(overallStatus)
                .totalTests(totalTests)
                .passedTests(passedTests)
                .executionTimeMs(totalDurationMs > 0 ? totalDurationMs : 1250.0)
                .memoryUsedMb(384.0)
                .stdout(rawOutput)
                .stderr("")
                .compilerOutput("")
                .testResults(allResults)
                .build();
    }

    private String extractCompilerOutput(String fullLog) {
        StringBuilder sb = new StringBuilder();
        String[] lines = fullLog.split("\\r?\\n");
        boolean capturing = false;
        for (String line : lines) {
            if (line.contains("[ERROR]") || line.contains("COMPILATION ERROR")) {
                capturing = true;
            }
            if (capturing) {
                sb.append(line).append("\n");
            }
        }
        return sb.length() > 0 ? sb.toString() : fullLog;
    }

    private ExecutionResultResponse executeFallbackSimulation(ProblemDocument problem, Map<String, String> candidateFiles) {
        log.warn("⚠️ Docker daemon unavailable for LLD Maven Runner. Sandbox cannot execute containerized Maven test suite.");
        return ExecutionResultResponse.builder()
                .status("ENGINE_UNAVAILABLE")
                .totalTests(problem.getSampleTests() != null ? problem.getSampleTests().size() : 0)
                .passedTests(0)
                .executionTimeMs(0.0)
                .memoryUsedMb(0.0)
                .stdout("")
                .stderr("Docker daemon unavailable — LLD sandbox requires Docker socket access to execute Maven test runner.")
                .compilerOutput("")
                .testResults(List.of())
                .build();
    }

    private void writeFile(Path baseDir, String relativePath, String content) throws IOException {
        Path target = baseDir.resolve(relativePath).normalize();
        if (!target.startsWith(baseDir)) {
            throw new SecurityException("Path traversal attempt detected: " + relativePath);
        }
        Files.createDirectories(target.getParent());
        Files.writeString(target, content != null ? content : "", StandardCharsets.UTF_8);
    }

    private void cleanupDirectory(Path dir) {
        if (dir != null && Files.exists(dir)) {
            try {
                Files.walk(dir)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
            } catch (Exception e) {
                log.warn("Failed to delete temp workspace directory: {}", e.getMessage());
            }
        }
    }
}
