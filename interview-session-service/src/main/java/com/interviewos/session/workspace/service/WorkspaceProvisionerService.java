package com.interviewos.session.workspace.service;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.command.InspectContainerResponse;
import com.github.dockerjava.api.model.*;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.core.DockerClientImpl;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.workspace.dto.WorkspaceProvisionRequest;
import com.interviewos.session.workspace.dto.WorkspaceProvisionResponse;
import com.interviewos.session.workspace.dto.WorkspaceStatus;
import com.interviewos.session.workspace.dto.WorkspaceStatusResponse;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class WorkspaceProvisionerService {

    @Value("${workspace.image:ai-interview-os/workspace:latest}")
    private String workspaceImage;

    @Value("${workspace.host:localhost}")
    private String workspaceHost;

    @Value("${workspace.network:ai-interview-net}")
    private String workspaceNetwork;

    @Value("${workspace.port.base:9001}")
    private int portBase;

    @Value("${workspace.port.max:9099}")
    private int portMax;

    private final QuestionBankClient questionBankClient;
    private final GridFsTemplate gridFsTemplate;
    private final InterviewSessionRepository sessionRepository;

    private DockerClient dockerClient;
    private boolean isDockerAvailable = false;
    private boolean isInitialized = false;

    // Track active workspaces: sessionId -> metadata
    private final Map<Long, ActiveWorkspaceInfo> activeWorkspaces = new ConcurrentHashMap<>();

    public record ActiveWorkspaceInfo(
            Long sessionId,
            String containerId,
            String volumeName,
            int hostPort,
            Instant createdAt,
            String problemSlug
    ) {}

    public WorkspaceProvisionerService(
            QuestionBankClient questionBankClient,
            GridFsTemplate gridFsTemplate,
            InterviewSessionRepository sessionRepository
    ) {
        this.questionBankClient = questionBankClient;
        this.gridFsTemplate = gridFsTemplate;
        this.sessionRepository = sessionRepository;
    }

    @PostConstruct
    public void initAndSweepOrphans() {
        ensureDockerInitialized();
        if (isDockerAvailable && dockerClient != null) {
            log.info("🧹 Performing boot-time sweep of orphaned workspace containers & volumes...");
            sweepDockerContainers();
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
            log.info("🐳 Workspace Provisioner: Docker client ready. Image: {}, Network: {}", workspaceImage, workspaceNetwork);
        } catch (Throwable t) {
            this.isDockerAvailable = false;
            log.warn("⚠️ Docker daemon unavailable for Workspace Provisioner: {}. LLD will fall back to Monaco.", t.getMessage());
        } finally {
            this.isInitialized = true;
        }
    }

    public WorkspaceProvisionResponse provisionWorkspace(Long sessionId, WorkspaceProvisionRequest request) {
        log.info("🛠️ Provisioning embedded VS Code Workspace for session: {}, problem: {}", sessionId, request.problemSlug());
        ensureDockerInitialized();

        if (!isDockerAvailable || dockerClient == null) {
            log.warn("⚠️ Docker not available. Returning FALLBACK status for session {}", sessionId);
            return WorkspaceProvisionResponse.builder()
                    .workspaceId("fallback")
                    .status(WorkspaceStatus.FALLBACK)
                    .message("Docker engine unavailable. Falling back to Monaco editor.")
                    .build();
        }

        if (!imageExists(workspaceImage)) {
            log.warn("⚠️ Workspace image '{}' not found in Docker daemon. Run: docker compose --profile engines up -d --build", workspaceImage);
            return WorkspaceProvisionResponse.builder()
                    .workspaceId("fallback")
                    .status(WorkspaceStatus.FALLBACK)
                    .message("Workspace image not built. Run: docker compose --profile engines up -d --build")
                    .build();
        }

        String volumeName = "ws_" + sessionId;
        String containerName = "ws-" + sessionId;

        try {
            // 1. Check if container is already running
            ActiveWorkspaceInfo existing = activeWorkspaces.get(sessionId);
            if (existing != null && isContainerRunning(existing.containerId())) {
                String existingUrl = buildWorkspaceUrl(existing.hostPort());
                log.info("Reusing existing running workspace container for session {}", sessionId);
                return WorkspaceProvisionResponse.builder()
                        .workspaceId(containerName)
                        .url(existingUrl)
                        .status(WorkspaceStatus.READY)
                        .volumeName(volumeName)
                        .message("Existing workspace container active.")
                        .build();
            }

            // Clean up any stale container with the same name
            cleanupContainerByName(containerName);

            // 2. Allocate an available host port bound to 127.0.0.1
            int hostPort = allocateFreePort(sessionId);

            // 3. Create named volume if not present
            createNamedVolume(volumeName);

            // 4. Prepare starter files from QuestionBank
            Map<String, String> starterFiles = resolveStarterFiles(request.problemSlug());

            // 5. Create and configure code-server container
            ExposedPort exposedPort = ExposedPort.tcp(8080);
            Ports portBindings = new Ports();
            // Bind to 127.0.0.1 for local isolation
            portBindings.bind(exposedPort, Ports.Binding.bindIpAndPort("127.0.0.1", hostPort));

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withPortBindings(portBindings)
                    .withNetworkMode(workspaceNetwork)
                    .withBinds(new Bind(volumeName, new Volume("/home/coder/project")))
                    .withMemory(1024L * 1024 * 1024) // 1GB RAM limit
                    .withNanoCPUs(2_000_000_000L)   // 2 CPU cores
                    .withAutoRemove(false);

            CreateContainerResponse container = dockerClient.createContainerCmd(workspaceImage)
                    .withName(containerName)
                    .withHostConfig(hostConfig)
                    .withExposedPorts(exposedPort)
                    .exec();

            String containerId = container.getId();

            // 6. Seed starter files directly into the container volume if present
            if (!starterFiles.isEmpty()) {
                seedStarterFilesToContainer(containerId, starterFiles);
            }

            // 7. Start code-server container
            dockerClient.startContainerCmd(containerId).exec();

            // 8. Dual-probe readiness: internal Docker container name first, host fallback second
            String workspaceUrl = buildWorkspaceUrl(hostPort);
            boolean ready = waitForReadiness(containerName, hostPort, 15);

            if (ready) {
                activeWorkspaces.put(sessionId, new ActiveWorkspaceInfo(
                        sessionId, containerId, volumeName, hostPort, Instant.now(), request.problemSlug()
                ));
                log.info("✅ Embedded VS Code Workspace READY for session {} at {}", sessionId, workspaceUrl);
                return WorkspaceProvisionResponse.builder()
                        .workspaceId(containerName)
                        .url(workspaceUrl)
                        .status(WorkspaceStatus.READY)
                        .volumeName(volumeName)
                        .message("Workspace container provisioned successfully.")
                        .build();
            } else {
                log.warn("⏱️ Workspace container health check timed out for session {}. Falling back to Monaco.", sessionId);
                destroyWorkspace(sessionId);
                return WorkspaceProvisionResponse.builder()
                        .workspaceId("fallback")
                        .status(WorkspaceStatus.FALLBACK)
                        .message("Workspace boot timed out. Using Monaco fallback.")
                        .build();
            }

        } catch (Exception e) {
            log.error("❌ Failed to provision workspace container for session {}: {}", sessionId, e.getMessage(), e);
            destroyWorkspace(sessionId);
            return WorkspaceProvisionResponse.builder()
                    .workspaceId("fallback")
                    .status(WorkspaceStatus.FALLBACK)
                    .message("Workspace provisioning error: " + e.getMessage())
                    .build();
        }
    }

    public WorkspaceStatusResponse getWorkspaceStatus(Long sessionId) {
        ActiveWorkspaceInfo info = activeWorkspaces.get(sessionId);
        if (info == null) {
            return WorkspaceStatusResponse.builder()
                    .status(WorkspaceStatus.TERMINATED)
                    .build();
        }

        boolean running = isContainerRunning(info.containerId());
        return WorkspaceStatusResponse.builder()
                .workspaceId("ws-" + sessionId)
                .url(buildWorkspaceUrl(info.hostPort()))
                .status(running ? WorkspaceStatus.READY : WorkspaceStatus.TERMINATED)
                .volumeName(info.volumeName())
                .build();
    }

    public void destroyWorkspace(Long sessionId) {
        log.info("🧹 Destroying workspace for session: {}", sessionId);
        ensureDockerInitialized();

        ActiveWorkspaceInfo info = activeWorkspaces.remove(sessionId);
        String containerName = "ws-" + sessionId;
        String volumeName = "ws_" + sessionId;

        if (isDockerAvailable && dockerClient != null) {
            try {
                // 1. Snapshot workspace volume metadata to MongoDB GridFS before deletion
                snapshotVolumeToGridFs(sessionId, volumeName);
            } catch (Exception e) {
                log.warn("Notice: Workspace snapshot during destruction for session {}: {}", sessionId, e.getMessage());
            }

            try {
                // 2. Stop and remove container
                cleanupContainerByName(containerName);
            } catch (Exception e) {
                log.debug("Container cleanup notice: {}", e.getMessage());
            }

            try {
                // 3. Remove named volume
                dockerClient.removeVolumeCmd(volumeName).exec();
                log.info("Volume {} removed successfully", volumeName);
            } catch (Exception e) {
                log.debug("Volume removal notice: {}", e.getMessage());
            }
        }
    }

    private synchronized int allocateFreePort(Long sessionId) {
        Set<Integer> usedPorts = activeWorkspaces.values().stream()
                .map(ActiveWorkspaceInfo::hostPort)
                .collect(Collectors.toSet());

        int preferred = portBase + (int) (sessionId % (portMax - portBase + 1));
        if (!usedPorts.contains(preferred) && isPortAvailable(preferred)) {
            return preferred;
        }

        for (int p = portBase; p <= portMax; p++) {
            if (!usedPorts.contains(p) && isPortAvailable(p)) {
                return p;
            }
        }

        return preferred;
    }

    private boolean isPortAvailable(int port) {
        try (ServerSocket socket = new ServerSocket(port, 1, InetAddress.getByName("127.0.0.1"))) {
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void snapshotVolumeToGridFs(Long sessionId, String volumeName) {
        try {
            String snapshotName = String.format("workspace-snapshot-session-%d-%d.txt", sessionId, System.currentTimeMillis());
            String summary = String.format("Workspace snapshot for session %d (Volume: %s)", sessionId, volumeName);
            InputStream inputStream = new ByteArrayInputStream(summary.getBytes(StandardCharsets.UTF_8));

            DBObject metadata = new BasicDBObject();
            metadata.put("sessionId", sessionId);
            metadata.put("kind", "WORKSPACE_SNAPSHOT");
            metadata.put("volumeName", volumeName);
            metadata.put("createdAt", new Date());

            gridFsTemplate.store(inputStream, snapshotName, "application/json", metadata);
            log.info("📦 Workspace snapshot metadata archived in GridFS for session {}", sessionId);
        } catch (Exception e) {
            log.warn("⚠️ Failed archiving workspace snapshot to GridFS: {}", e.getMessage());
        }
    }

    private void seedStarterFilesToContainer(String containerId, Map<String, String> starterFiles) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("ws-seed-");
            for (Map.Entry<String, String> entry : starterFiles.entrySet()) {
                Path filePath = tempDir.resolve(entry.getKey());
                if (filePath.getParent() != null) {
                    Files.createDirectories(filePath.getParent());
                }
                Files.writeString(filePath, entry.getValue(), StandardCharsets.UTF_8);
            }

            dockerClient.copyArchiveToContainerCmd(containerId)
                    .withHostResource(tempDir.toAbsolutePath().toString())
                    .withRemotePath("/home/coder/project")
                    .withDirChildrenOnly(true)
                    .exec();
            log.info("🌱 Seeded {} starter files into workspace container {}", starterFiles.size(), containerId);
        } catch (Exception e) {
            log.warn("⚠️ Error seeding starter files to workspace container {}: {}", containerId, e.getMessage());
        } finally {
            if (tempDir != null) {
                try {
                    deleteDirectoryRecursively(tempDir.toFile());
                } catch (Exception ignored) {}
            }
        }
    }

    private Map<String, String> resolveStarterFiles(String slug) {
        if (slug == null || slug.isBlank()) return Map.of();
        try {
            Optional<ProblemDocument> probOpt = questionBankClient.fetchProblemBySlug(slug);
            if (probOpt.isPresent() && probOpt.get().getStarterFiles() != null) {
                return probOpt.get().getStarterFiles();
            }
        } catch (Exception e) {
            log.warn("Notice fetching starter files from Question Bank for {}: {}", slug, e.getMessage());
        }
        return Map.of();
    }

    private void createNamedVolume(String volumeName) {
        try {
            dockerClient.createVolumeCmd().withName(volumeName).exec();
            log.info("Created Docker volume '{}'", volumeName);
        } catch (Exception e) {
            log.debug("Volume '{}' already exists or notice: {}", volumeName, e.getMessage());
        }
    }

    private void cleanupContainerByName(String name) {
        try {
            var containers = dockerClient.listContainersCmd().withShowAll(true).exec();
            for (var c : containers) {
                if (Arrays.stream(c.getNames()).anyMatch(n -> n.contains(name))) {
                    try {
                        dockerClient.stopContainerCmd(c.getId()).withTimeout(2).exec();
                    } catch (Exception ignored) {}
                    dockerClient.removeContainerCmd(c.getId()).withForce(true).exec();
                    log.info("Removed existing container '{}'", c.getId());
                }
            }
        } catch (Exception e) {
            log.debug("Cleanup container notice for {}: {}", name, e.getMessage());
        }
    }

    private boolean imageExists(String img) {
        if (img == null || !isDockerAvailable || dockerClient == null) return false;
        try {
            dockerClient.inspectImageCmd(img).exec();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isContainerRunning(String containerId) {
        if (containerId == null || !isDockerAvailable || dockerClient == null) return false;
        try {
            InspectContainerResponse resp = dockerClient.inspectContainerCmd(containerId).exec();
            return resp.getState() != null && Boolean.TRUE.equals(resp.getState().getRunning());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Dual-probe readiness: internal container DNS first (compose), host port fallback second (native).
     */
    private boolean waitForReadiness(String containerName, int hostPort, int maxSeconds) {
        long deadline = System.currentTimeMillis() + (maxSeconds * 1000L);
        List<String> probeEndpoints = List.of(
                "http://" + containerName + ":8080/",
                "http://127.0.0.1:" + hostPort + "/",
                "http://localhost:" + hostPort + "/"
        );

        while (System.currentTimeMillis() < deadline) {
            for (String endpoint : probeEndpoints) {
                try {
                    URL url = URI.create(endpoint).toURL();
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(800);
                    conn.setReadTimeout(800);
                    conn.setRequestMethod("GET");
                    int code = conn.getResponseCode();
                    if (code >= 200 && code < 400) {
                        log.info("⚡ Readiness probe succeeded via '{}' (HTTP {})", endpoint, code);
                        return true;
                    }
                } catch (Exception ignored) {}
            }

            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        return false;
    }

    private String buildWorkspaceUrl(int hostPort) {
        return "http://" + workspaceHost + ":" + hostPort + "/?folder=/home/coder/project";
    }

    private void deleteDirectoryRecursively(File file) {
        if (file.isDirectory()) {
            File[] entries = file.listFiles();
            if (entries != null) {
                for (File entry : entries) {
                    deleteDirectoryRecursively(entry);
                }
            }
        }
        file.delete();
    }

    /**
     * Scheduled Reaper: sweeps in-memory active list and scans Docker engine directly.
     */
    @Scheduled(fixedDelay = 60000)
    public void reapOrphanWorkspaces() {
        ensureDockerInitialized();
        if (!isDockerAvailable || dockerClient == null) return;

        Instant cutoff = Instant.now().minus(Duration.ofMinutes(60));

        // 1. Check in-memory active list
        for (Map.Entry<Long, ActiveWorkspaceInfo> entry : activeWorkspaces.entrySet()) {
            Long sessionId = entry.getKey();
            ActiveWorkspaceInfo info = entry.getValue();

            boolean shouldReap = false;
            if (info.createdAt().isBefore(cutoff)) {
                log.info("⏰ Workspace for session {} exceeded 60 min TTL. Reaping...", sessionId);
                shouldReap = true;
            } else {
                try {
                    Optional<InterviewSession> sessionOpt = sessionRepository.findById(sessionId);
                    if (sessionOpt.isPresent()) {
                        SessionStatus status = sessionOpt.get().getStatus();
                        if (status == SessionStatus.COMPLETED || status == SessionStatus.EVALUATED) {
                            log.info("🏁 Session {} is {}. Reaping workspace...", sessionId, status);
                            shouldReap = true;
                        }
                    }
                } catch (Exception e) {
                    log.debug("Notice checking session {} status during reap: {}", sessionId, e.getMessage());
                }
            }

            if (shouldReap) {
                destroyWorkspace(sessionId);
            }
        }

        // 2. Scan Docker containers directly for any orphaned ws-* containers
        sweepDockerContainers();
    }

    private void sweepDockerContainers() {
        try {
            var containers = dockerClient.listContainersCmd().withShowAll(true).exec();
            for (var c : containers) {
                for (String name : c.getNames()) {
                    String cleanName = name.startsWith("/") ? name.substring(1) : name;
                    if (cleanName.startsWith("ws-")) {
                        try {
                            String idPart = cleanName.substring(3);
                            Long sId = Long.parseLong(idPart);
                            Optional<InterviewSession> sessionOpt = sessionRepository.findById(sId);
                            if (sessionOpt.isEmpty() || sessionOpt.get().getStatus() == SessionStatus.COMPLETED || sessionOpt.get().getStatus() == SessionStatus.EVALUATED) {
                                log.info("🧹 Sweeping orphaned container '{}' and volume 'ws_{}'", cleanName, sId);
                                destroyWorkspace(sId);
                            }
                        } catch (NumberFormatException ignored) {}
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Docker container sweep notice: {}", e.getMessage());
        }
    }
}
