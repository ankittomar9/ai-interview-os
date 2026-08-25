package com.interviewos.session.runner;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.command.PullImageResultCallback;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.zerodep.ZerodepDockerHttpClient;
import com.interviewos.session.runner.sql.SqlResultComparator;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.net.URI;
import java.sql.*;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class SqlPostgresRunner implements TrackRunner {

    private static final String DEFAULT_IMAGE = "postgres:13-alpine";
    private static final String DB_USER = "interview";
    private static final String DB_PASSWORD = "interview";
    private static final String DB_NAME = "interview";
    private static final int MAX_ROWS = 500;
    private static final int MAX_COLS = 64;

    @Value("${runner.sql.image:postgres:13-alpine}")
    private String postgresImage;

    @Value("${runner.sql.network:ai-interview-net}")
    private String networkName;

    @Value("${runner.sql.timeout-seconds:20}")
    private int timeoutSeconds;

    private DockerClient dockerClient;
    private boolean isDockerAvailable = false;
    private boolean isInitialized = false;
    private final SqlResultComparator comparator = new SqlResultComparator();

    public SqlPostgresRunner(DockerClient dockerClient) {
        this.dockerClient = dockerClient;
        this.isDockerAvailable = dockerClient != null;
        this.isInitialized = true;
    }

    public SqlPostgresRunner() {}

    public boolean isDockerReady() {
        ensureDockerInitialized();
        return isDockerAvailable && dockerClient != null;
    }

    @Override
    public boolean supports(ProblemDocument problem) {
        return problem != null && "sql-postgres".equalsIgnoreCase(problem.getBuildProfile());
    }

    @Override
    public ExecutionResultResponse run(Long sessionId, ProblemDocument problem, Map<String, String> candidateFiles, String language) {
        long startTime = System.currentTimeMillis();
        log.info("🐘 Starting PostgreSQL 13 isolated sandbox execution for session {} [problem: {}]",
                sessionId, problem.getProblemSlug());

        ensureDockerInitialized();
        if (!isDockerAvailable || dockerClient == null) {
            return ExecutionResultResponse.builder()
                    .status("ENGINE_UNAVAILABLE")
                    .totalTests(0)
                    .passedTests(0)
                    .executionTimeMs(0.0)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("Docker engine unavailable for SQL PostgreSQL sandbox.")
                    .compilerOutput("")
                    .testResults(List.of())
                    .build();
        }

        String candidateSql = extractCandidateQuery(candidateFiles);
        if (candidateSql == null || candidateSql.isBlank()) {
            return ExecutionResultResponse.builder()
                    .status("SYNTAX_ERROR")
                    .totalTests(1)
                    .passedTests(0)
                    .executionTimeMs(0.0)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("No SQL query provided in candidate submission.")
                    .compilerOutput("Syntax Error: Candidate query is empty.")
                    .testResults(List.of(
                            ExecutionResultResponse.TestCaseResult.builder()
                                    .name("Query Result")
                                    .status("FAIL")
                                    .error("No SQL query provided in submission.")
                                    .build()
                    ))
                    .build();
        }

        String containerId = null;
        String containerName = "sql-" + sessionId + "-" + (System.nanoTime() % 1000000);
        Connection conn = null;

        try {
            ensureImagePresent(postgresImage != null ? postgresImage : DEFAULT_IMAGE);

            ExposedPort dbPort = ExposedPort.tcp(5432);
            Ports portBindings = new Ports();
            portBindings.bind(dbPort, Ports.Binding.bindIp("127.0.0.1"));

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withNetworkMode(networkName)
                    .withPortBindings(portBindings)
                    .withMemory(512L * 1024 * 1024)  // 512MB
                    .withNanoCPUs(2_000_000_000L)    // 2 CPUs
                    .withAutoRemove(false);

            CreateContainerResponse container = dockerClient.createContainerCmd(postgresImage != null ? postgresImage : DEFAULT_IMAGE)
                    .withName(containerName)
                    .withHostConfig(hostConfig)
                    .withEnv(
                            "POSTGRES_USER=" + DB_USER,
                            "POSTGRES_PASSWORD=" + DB_PASSWORD,
                            "POSTGRES_DB=" + DB_NAME
                    )
                    .exec();

            containerId = container.getId();
            dockerClient.startContainerCmd(containerId).exec();

            // Resolve reachable JDBC connection string
            conn = establishConnectionWithRetry(containerId, containerName);
            if (conn == null) {
                return ExecutionResultResponse.builder()
                        .status("ENGINE_UNAVAILABLE")
                        .totalTests(1)
                        .passedTests(0)
                        .executionTimeMs((double) (System.currentTimeMillis() - startTime))
                        .memoryUsedMb(0.0)
                        .stdout("")
                        .stderr("Timed out waiting for PostgreSQL container to accept connections (20s).")
                        .compilerOutput("")
                        .testResults(List.of())
                        .build();
            }

            // 1. Execute Setup SQL (DDL + Seed Data)
            if (problem.getSetupSql() != null && !problem.getSetupSql().isBlank()) {
                try (Statement setupStmt = conn.createStatement()) {
                    setupStmt.execute(problem.getSetupSql());
                } catch (SQLException e) {
                    log.warn("⚠️ Setup SQL execution failed: {}", e.getMessage());
                    return ExecutionResultResponse.builder()
                            .status("RUNTIME_ERROR")
                            .totalTests(1)
                            .passedTests(0)
                            .executionTimeMs((double) (System.currentTimeMillis() - startTime))
                            .memoryUsedMb(0.0)
                            .stdout("")
                            .stderr("Database Setup Error: " + e.getMessage())
                            .compilerOutput("")
                            .testResults(List.of(
                                    ExecutionResultResponse.TestCaseResult.builder()
                                            .name("Database Initialization")
                                            .status("FAIL")
                                            .error("Setup SQL failed: " + e.getMessage())
                                            .build()
                            ))
                            .build();
                }
            }

            // 2. Execute Candidate Query with 5s Statement Timeout
            String actualCsv;
            try (Statement candidateStmt = conn.createStatement()) {
                candidateStmt.execute("SET statement_timeout = '5000'");
                try (ResultSet rs = candidateStmt.executeQuery(candidateSql)) {
                    actualCsv = convertResultSetToCsv(rs);
                }
            }

            // 3. Compare with Expected CSV
            SqlResultComparator.ComparisonResult comparison = comparator.compare(
                    actualCsv,
                    problem.getExpectedCsv() != null ? problem.getExpectedCsv() : "",
                    problem.isOrdered()
            );

            long elapsed = System.currentTimeMillis() - startTime;
            String executionStatus = comparison.passed() ? "ACCEPTED" : "FAILED";

            return ExecutionResultResponse.builder()
                    .status(executionStatus)
                    .totalTests(1)
                    .passedTests(comparison.passed() ? 1 : 0)
                    .executionTimeMs((double) elapsed)
                    .memoryUsedMb(28.0)
                    .stdout(comparison.actualFormatted())
                    .stderr(comparison.passed() ? "" : comparison.summary())
                    .compilerOutput("")
                    .testResults(List.of(
                            ExecutionResultResponse.TestCaseResult.builder()
                                    .name("Query Result")
                                    .status(comparison.passed() ? "PASS" : "FAIL")
                                    .actualOutput(comparison.actualFormatted())
                                    .expectedOutput(comparison.expectedFormatted())
                                    .durationMs((double) elapsed)
                                    .error(comparison.passed() ? null : comparison.summary())
                                    .build()
                    ))
                    .build();

        } catch (SQLException e) {
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("PostgreSQL execution error for session {}: {} [SQLState: {}]", sessionId, e.getMessage(), e.getSQLState());

            String sqlState = e.getSQLState() != null ? e.getSQLState() : "";
            boolean isSyntaxError = sqlState.startsWith("42") || e instanceof SQLSyntaxErrorException;
            boolean isTimeout = sqlState.equals("57014") || e.getMessage().toLowerCase().contains("statement timeout") || e.getMessage().toLowerCase().contains("canceling statement");

            String status = isTimeout ? "TIMEOUT" : isSyntaxError ? "SYNTAX_ERROR" : "RUNTIME_ERROR";
            String errorMsg = isTimeout
                    ? "Query cancelled: execution exceeded 5000ms statement limit."
                    : e.getMessage();

            return ExecutionResultResponse.builder()
                    .status(status)
                    .totalTests(1)
                    .passedTests(0)
                    .executionTimeMs((double) elapsed)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr(errorMsg)
                    .compilerOutput(isSyntaxError ? errorMsg : "")
                    .testResults(List.of(
                            ExecutionResultResponse.TestCaseResult.builder()
                                    .name("Query Execution")
                                    .status("FAIL")
                                    .error(errorMsg)
                                    .build()
                    ))
                    .build();

        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - startTime;
            log.error("Unhandled error during SQL execution: {}", e.getMessage(), e);
            return ExecutionResultResponse.builder()
                    .status("ENGINE_UNAVAILABLE")
                    .totalTests(1)
                    .passedTests(0)
                    .executionTimeMs((double) elapsed)
                    .memoryUsedMb(0.0)
                    .stdout("")
                    .stderr("Execution engine error: " + e.getMessage())
                    .compilerOutput("")
                    .testResults(List.of())
                    .build();

        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (Exception ignored) {}
            }
            if (containerId != null && dockerClient != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                    log.info("🧹 Destroyed ephemeral PostgreSQL container '{}'", containerName);
                } catch (Exception e) {
                    log.warn("⚠️ Failed removing container '{}': {}", containerId, e.getMessage());
                }
            }
        }
    }

    private Connection establishConnectionWithRetry(String containerId, String containerName) {
        String containerDnsUrl = String.format("jdbc:postgresql://%s:5432/%s", containerName, DB_NAME);

        // Also check mapped port on localhost for non-containerized host execution
        Integer mappedPort = null;
        try {
            InspectContainerResponse inspect = dockerClient.inspectContainerCmd(containerId).exec();
            if (inspect.getNetworkSettings() != null && inspect.getNetworkSettings().getPorts() != null) {
                Ports.Binding[] bindings = inspect.getNetworkSettings().getPorts().getBindings().get(ExposedPort.tcp(5432));
                if (bindings != null && bindings.length > 0 && bindings[0].getHostPortSpec() != null) {
                    mappedPort = Integer.parseInt(bindings[0].getHostPortSpec());
                }
            }
        } catch (Exception ignored) {}

        String localhostUrl = mappedPort != null
                ? String.format("jdbc:postgresql://localhost:%d/%s", mappedPort, DB_NAME)
                : null;

        long deadline = System.currentTimeMillis() + (timeoutSeconds * 1000L);
        while (System.currentTimeMillis() < deadline) {
            // First attempt container network DNS
            try {
                Properties props = new Properties();
                props.setProperty("user", DB_USER);
                props.setProperty("password", DB_PASSWORD);
                props.setProperty("connectTimeout", "2");
                props.setProperty("loginTimeout", "2");
                return DriverManager.getConnection(containerDnsUrl, props);
            } catch (Exception e) {
                // If container DNS fails (e.g. host mode), attempt localhost mapped port
                if (localhostUrl != null) {
                    try {
                        Properties props = new Properties();
                        props.setProperty("user", DB_USER);
                        props.setProperty("password", DB_PASSWORD);
                        props.setProperty("connectTimeout", "2");
                        props.setProperty("loginTimeout", "2");
                        return DriverManager.getConnection(localhostUrl, props);
                    } catch (Exception ignored) {}
                }
            }

            try {
                TimeUnit.MILLISECONDS.sleep(300);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return null;
            }
        }
        return null;
    }

    private String convertResultSetToCsv(ResultSet rs) throws SQLException {
        ResultSetMetaData meta = rs.getMetaData();
        int columnCount = Math.min(meta.getColumnCount(), MAX_COLS);

        StringBuilder sb = new StringBuilder();
        // Header row
        for (int i = 1; i <= columnCount; i++) {
            sb.append(escapeCsvCell(meta.getColumnLabel(i)));
            if (i < columnCount) sb.append(",");
        }
        sb.append("\n");

        int rowCount = 0;
        while (rs.next()) {
            rowCount++;
            if (rowCount > MAX_ROWS + 5) {
                // Exceeded cap; comparator will catch truncation
                break;
            }
            for (int i = 1; i <= columnCount; i++) {
                String val = rs.getString(i);
                sb.append(escapeCsvCell(val));
                if (i < columnCount) sb.append(",");
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private String escapeCsvCell(String val) {
        if (val == null) return "";
        String s = val.trim();
        if (s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private String extractCandidateQuery(Map<String, String> candidateFiles) {
        if (candidateFiles == null || candidateFiles.isEmpty()) return null;
        if (candidateFiles.containsKey("solution.sql")) return candidateFiles.get("solution.sql");
        if (candidateFiles.containsKey("Solution")) return candidateFiles.get("Solution");
        if (candidateFiles.containsKey("solution")) return candidateFiles.get("solution");
        if (candidateFiles.containsKey("query.sql")) return candidateFiles.get("query.sql");
        return candidateFiles.values().iterator().next();
    }

    private void ensureImagePresent(String imageName) {
        try {
            dockerClient.inspectImageCmd(imageName).exec();
        } catch (Exception e) {
            log.info("📥 Image '{}' not cached locally. Pulling...", imageName);
            try {
                dockerClient.pullImageCmd(imageName)
                        .exec(new PullImageResultCallback())
                        .awaitCompletion(90, TimeUnit.SECONDS);
                log.info("✅ Image '{}' pulled successfully.", imageName);
            } catch (Exception pullEx) {
                log.warn("⚠️ Could not pull image '{}': {}", imageName, pullEx.getMessage());
            }
        }
    }

    private synchronized void ensureDockerInitialized() {
        if (isInitialized) return;
        try {
            URI dockerHostUri;
            String dockerHostEnv = System.getenv("DOCKER_HOST");
            if (dockerHostEnv != null && !dockerHostEnv.isBlank()) {
                dockerHostUri = URI.create(dockerHostEnv);
            } else if (new File("/var/run/docker.sock").exists()) {
                dockerHostUri = URI.create("unix:///var/run/docker.sock");
            } else if (System.getProperty("os.name", "").toLowerCase().contains("win")) {
                dockerHostUri = URI.create("npipe:////./pipe/docker_engine");
            } else {
                dockerHostUri = URI.create("unix:///var/run/docker.sock");
            }

            DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                    .withDockerHost(dockerHostUri.toString())
                    .build();

            ZerodepDockerHttpClient httpClient = new ZerodepDockerHttpClient.Builder()
                    .dockerHost(dockerHostUri)
                    .sslConfig(config.getSSLConfig())
                    .maxConnections(50)
                    .build();

            this.dockerClient = DockerClientImpl.getInstance(config, httpClient);
            this.dockerClient.pingCmd().exec();
            this.isDockerAvailable = true;
            log.info("🐳 Docker client initialized for SQL PostgreSQL Sandbox. Host: {}", dockerHostUri);
        } catch (Throwable t) {
            log.warn("⚠️ Docker unavailable for SQL PostgreSQL sandbox: {}", t.getMessage());
            this.isDockerAvailable = false;
        } finally {
            this.isInitialized = true;
        }
    }
}
