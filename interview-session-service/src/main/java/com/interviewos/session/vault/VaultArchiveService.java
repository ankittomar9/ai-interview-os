package com.interviewos.session.vault;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.SessionQuestionResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.SessionVerification;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.SessionVerificationRepository;
import com.interviewos.session.service.SessionQuestionService;
import com.interviewos.session.service.SessionRecordingService;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSFindIterable;
import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Stream;

@Slf4j
@Service
public class VaultArchiveService {

    public static final List<String> STAGE1_EXPECTED_ARTIFACTS = List.of(
            "session/session.json",
            "recordings/screen.webm",
            "recordings/camera.webm",
            "recordings/mic-audio.webm",
            "recordings/manifest.json",
            "transcript/transcript.json",
            "transcript/transcript.md",
            "problems/session-questions.json",
            "problems/submissions-ledger.jsonl",
            "plan/session-plan.json"
    );

    public static final List<String> REPORT_EXPECTED_ARTIFACTS = List.of(
            "report/report.json",
            "report/report.pdf"
    );

    private final VaultProperties vaultProperties;
    private final VaultPathPolicy pathPolicy;
    private final VaultStatusService statusService;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewSessionMongoRepository mongoSessionRepository;
    private final SessionRecordingService sessionRecordingService;
    private final SessionQuestionService sessionQuestionService;
    private final GridFSBucket gridFSBucket;
    private final SessionVerificationRepository verificationRepository;
    private final EvaluationReportClient evaluationReportClient;

    private final ObjectMapper objectMapper;
    private final ExecutorService executor;

    @Autowired
    public VaultArchiveService(
            VaultProperties vaultProperties,
            VaultPathPolicy pathPolicy,
            VaultStatusService statusService,
            InterviewSessionRepository sessionRepository,
            InterviewSessionMongoRepository mongoSessionRepository,
            SessionRecordingService sessionRecordingService,
            @Autowired(required = false) SessionQuestionService sessionQuestionService,
            @Autowired(required = false) GridFSBucket gridFSBucket,
            @Autowired(required = false) SessionVerificationRepository verificationRepository,
            @Autowired(required = false) EvaluationReportClient evaluationReportClient
    ) {
        this.vaultProperties = vaultProperties;
        this.pathPolicy = pathPolicy;
        this.statusService = statusService;
        this.sessionRepository = sessionRepository;
        this.mongoSessionRepository = mongoSessionRepository;
        this.sessionRecordingService = sessionRecordingService;
        this.sessionQuestionService = sessionQuestionService;
        this.gridFSBucket = gridFSBucket;
        this.verificationRepository = verificationRepository;
        this.evaluationReportClient = evaluationReportClient;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .enable(SerializationFeature.INDENT_OUTPUT)
                .setSerializationInclusion(JsonInclude.Include.NON_NULL);
        this.executor = Executors.newSingleThreadExecutor(r -> {
            Thread t = new Thread(r, "vault-archive-worker");
            t.setDaemon(true);
            return t;
        });
    }

    public VaultArchiveService(
            VaultProperties vaultProperties,
            VaultPathPolicy pathPolicy,
            VaultStatusService statusService,
            InterviewSessionRepository sessionRepository,
            InterviewSessionMongoRepository mongoSessionRepository,
            SessionRecordingService sessionRecordingService,
            SessionQuestionService sessionQuestionService,
            GridFSBucket gridFSBucket,
            SessionVerificationRepository verificationRepository
    ) {
        this(vaultProperties, pathPolicy, statusService, sessionRepository, mongoSessionRepository, sessionRecordingService, sessionQuestionService, gridFSBucket, verificationRepository, null);
    }

    /**
     * Dedicated executor submission for Stage-1 vault archiving.
     * Guarantees failure isolation (VP13): never re-throws, never blocks HTTP request thread.
     */
    public void archiveSessionAsync(Long sessionId) {
        if (sessionId == null) return;
        executor.execute(() -> {
            try {
                archiveSessionStage1(sessionId);
            } catch (Exception e) {
                log.error("Vault archive stage 1 failed for session {}: {}", sessionId, e.getMessage(), e);
                statusService.markFailed(sessionId, e.getMessage());
            }
        });
    }

    /**
     * Dedicated executor submission for Stage-2 report finalization (REQ-AV-4).
     */
    public void finalizeWithReportAsync(Long sessionId) {
        if (sessionId == null) return;
        executor.execute(() -> {
            try {
                finalizeWithReport(sessionId);
            } catch (Exception e) {
                log.error("Vault report finalization failed for session {}: {}", sessionId, e.getMessage(), e);
                statusService.markFailed(sessionId, e.getMessage());
            }
        });
    }

    /**
     * Stage 2 Report Finalizer (REQ-AV-4):
     * Fetches report JSON and PDF, writes them to report/, re-verifies hashes, bumps vaultVersion, sets status VERIFIED.
     */
    public Path finalizeWithReport(Long sessionId) throws Exception {
        log.info("🗄️ Starting Stage-2 report finalization for session ID: {}", sessionId);

        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found in PostgreSQL: " + sessionId));
        InterviewSessionDocument doc = mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .orElse(null);

        Instant completionTime = session.getCompletedAt() != null ? session.getCompletedAt() : Instant.now();
        String track = session.getTrack() != null ? session.getTrack().name() : (doc != null ? doc.getInterviewTrack() : "UNKNOWN");
        String difficulty = session.getDifficulty() != null ? session.getDifficulty().name() : (doc != null ? doc.getSeniorityLevel() : "UNKNOWN");

        Path sessionDir = pathPolicy.resolveSessionPath(vaultProperties.getRoot(), completionTime, track, difficulty, sessionId);
        String relFolderPath = pathPolicy.buildRelativePath(completionTime, track, difficulty, sessionId);

        if (!Files.exists(sessionDir)) {
            log.info("Session vault folder does not exist for session {}. Running Stage-1 archival first.", sessionId);
            archiveSessionStage1(sessionId);
        }

        Path reportDir = sessionDir.resolve("report");
        Files.createDirectories(reportDir);

        if (evaluationReportClient != null) {
            Optional<byte[]> jsonOpt = evaluationReportClient.fetchReportJson(sessionId);
            if (jsonOpt.isPresent()) {
                Path reportJson = reportDir.resolve("report.json");
                Path reportJsonPart = reportDir.resolve("report.json.part");
                Files.write(reportJsonPart, jsonOpt.get(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
                atomicMove(reportJsonPart, reportJson);
            }

            Optional<byte[]> pdfOpt = evaluationReportClient.fetchReportPdf(sessionId);
            if (pdfOpt.isPresent()) {
                Path reportPdf = reportDir.resolve("report.pdf");
                Path reportPdfPart = reportDir.resolve("report.pdf.part");
                Files.write(reportPdfPart, pdfOpt.get(), StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
                atomicMove(reportPdfPart, reportPdf);
            }
        }

        // Determine next vaultVersion
        int nextVersion = 1;
        Path manifestPath = sessionDir.resolve("manifest.json");
        if (Files.exists(manifestPath)) {
            try {
                ManifestPayload prev = objectMapper.readValue(manifestPath.toFile(), ManifestPayload.class);
                if (prev.getVaultVersion() != null) {
                    nextVersion = prev.getVaultVersion() + 1;
                }
            } catch (Exception e) {
                log.warn("Could not read previous manifest vaultVersion for session {}: {}", sessionId, e.getMessage());
            }
        }

        boolean hasReportJson = Files.exists(reportDir.resolve("report.json"));

        // If report JSON is missing: maintain STAGED status, write manifest with expectReport=true (so missing[] contains report artifacts), skip markVerified
        if (!hasReportJson) {
            log.warn("Report JSON not available for session {}. Maintaining vault status STAGED and skipping markVerified for sweeper retry.", sessionId);
            buildAndWriteManifest(sessionDir, sessionId, relFolderPath, session, doc, "STAGED", nextVersion, true);
            return sessionDir;
        }

        // Update manifest with VERIFIED status and new vaultVersion
        buildAndWriteManifest(sessionDir, sessionId, relFolderPath, session, doc, "VERIFIED", nextVersion, true);

        // Run full folder verification
        ManifestVerificationResult verification = verifyVaultFolder(sessionDir);
        if (verification.isValid()) {
            statusService.markVerified(sessionId, sessionDir);
            log.info("✅ Vault report finalization successfully completed (VERIFIED, v{}) for session {} at {}", nextVersion, sessionId, sessionDir);
        } else {
            String err = "Verification failed: " + String.join(", ", verification.getErrors());
            try {
                buildAndWriteManifest(sessionDir, sessionId, relFolderPath, session, doc, "FAILED", nextVersion, true, verification.getErrors());
            } catch (Exception writeEx) {
                log.warn("Failed to rewrite manifest as FAILED for session {}: {}", sessionId, writeEx.getMessage());
            }
            statusService.markFailed(sessionId, sessionDir, err);
            log.error("❌ Vault report finalization verification failed for session {}: {}", sessionId, err);
            throw new IllegalStateException(err);
        }

        return sessionDir;
    }

    /**
     * Stage 1 Archive Writer (REQ-AV-3):
     * Writes all session artifacts to <VAULT_ROOT>/<YYYY-MM-DD>/<HHmm>_<TRACK>_<DIFFICULTY>_<sessionId>/
     */
    public Path archiveSessionStage1(Long sessionId) throws Exception {
        log.info("🗄️ Starting Stage-1 vault archival for session ID: {}", sessionId);

        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found in PostgreSQL: " + sessionId));
        InterviewSessionDocument doc = mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .orElse(null);

        Instant completionTime = session.getCompletedAt() != null ? session.getCompletedAt() : Instant.now();
        String track = session.getTrack() != null ? session.getTrack().name() : (doc != null ? doc.getInterviewTrack() : "UNKNOWN");
        String difficulty = session.getDifficulty() != null ? session.getDifficulty().name() : (doc != null ? doc.getSeniorityLevel() : "UNKNOWN");

        Path sessionDir = pathPolicy.resolveSessionPath(vaultProperties.getRoot(), completionTime, track, difficulty, sessionId);
        String relFolderPath = pathPolicy.buildRelativePath(completionTime, track, difficulty, sessionId);

        Files.createDirectories(sessionDir);
        Files.createDirectories(sessionDir.resolve("session"));
        Files.createDirectories(sessionDir.resolve("recordings"));
        Files.createDirectories(sessionDir.resolve("transcript"));
        Files.createDirectories(sessionDir.resolve("problems"));
        Files.createDirectories(sessionDir.resolve("problems/code"));
        Files.createDirectories(sessionDir.resolve("plan"));
        Files.createDirectories(sessionDir.resolve("integrity"));
        Files.createDirectories(sessionDir.resolve("attachments"));

        // 1. session/session.json
        writeSessionMetadata(sessionDir, session, doc);

        // 2. recordings (stream GridFS -> disk directly)
        writeRecordings(sessionDir, sessionId);

        // 3. transcript (JSON and Markdown)
        writeTranscripts(sessionDir, sessionId, session, doc);

        // 4. problems (session-questions, submissions-ledger, code snippets)
        writeProblems(sessionDir, sessionId, session, doc);

        // 5. plan
        writePlan(sessionDir, session, doc);

        // 6. integrity (verification-receipt, message-integrity)
        writeIntegrity(sessionDir, sessionId, session, doc);

        // 7. attachments (CANVAS_PNG, CANVAS_JSON, RESUME from GridFS)
        writeAttachments(sessionDir, sessionId);

        // 8. manifest.json (av1.manifest@1)
        boolean isAborted = session.getStatus() == SessionStatus.ABORTED_SHARE;
        String manifestStatus = isAborted ? "PARTIAL" : "STAGED";
        buildAndWriteManifest(sessionDir, sessionId, relFolderPath, session, doc, manifestStatus, 1);

        // 9. Update MongoDB & status sidecar
        if (isAborted) {
            statusService.markAborted(sessionId, relFolderPath, sessionDir);
        } else {
            statusService.markStaged(sessionId, relFolderPath, sessionDir);
        }

        log.info("✅ Stage-1 vault archival successfully completed for session {} at {}", sessionId, sessionDir);
        return sessionDir;
    }

    private void writeSessionMetadata(Path sessionDir, InterviewSession session, InterviewSessionDocument doc) throws IOException {
        Map<String, Object> sessionMeta = new LinkedHashMap<>();
        sessionMeta.put("id", session.getId());
        sessionMeta.put("candidateId", session.getCandidateId());
        sessionMeta.put("roleTitle", session.getRoleTitle());
        sessionMeta.put("track", session.getTrack() != null ? session.getTrack().name() : null);
        sessionMeta.put("difficulty", session.getDifficulty() != null ? session.getDifficulty().name() : null);
        sessionMeta.put("targetCompany", session.getTargetCompany());
        sessionMeta.put("status", session.getStatus() != null ? session.getStatus().name() : null);
        sessionMeta.put("sessionMode", session.getSessionMode());
        sessionMeta.put("createdAt", session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);
        sessionMeta.put("startedAt", session.getStartedAt() != null ? session.getStartedAt().toString() : null);
        sessionMeta.put("completedAt", session.getCompletedAt() != null ? session.getCompletedAt().toString() : null);
        sessionMeta.put("durationSeconds", session.getDurationSeconds());
        sessionMeta.put("plannedSlugs", session.getPlannedSlugs());

        atomicWriteJson(sessionDir.resolve("session/session.json"), sessionMeta);
    }

    private void writeRecordings(Path sessionDir, Long sessionId) throws Exception {
        Path recordingsDir = sessionDir.resolve("recordings");
        for (String kind : List.of("screen", "camera", "mic-audio")) {
            Path finalWebm = recordingsDir.resolve(kind + ".webm");
            Path partWebm = recordingsDir.resolve(kind + ".webm.part");
            try (OutputStream out = Files.newOutputStream(partWebm, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE)) {
                if (sessionRecordingService != null) {
                    sessionRecordingService.streamRecording(sessionId, kind, out);
                }
                out.flush();
            }
            atomicMove(partWebm, finalWebm);
        }

        if (sessionRecordingService != null) {
            try {
                Object manifest = sessionRecordingService.getManifest(sessionId);
                atomicWriteJson(recordingsDir.resolve("manifest.json"), manifest);
            } catch (Exception e) {
                log.warn("Could not generate recordings/manifest.json for session {}: {}", sessionId, e.getMessage());
            }
        }
    }

    private void writeTranscripts(Path sessionDir, Long sessionId, InterviewSession session, InterviewSessionDocument doc) throws IOException {
        Path transcriptDir = sessionDir.resolve("transcript");
        List<InterviewSessionDocument.TranscriptTurn> turns = (doc != null && doc.getTranscript() != null)
                ? doc.getTranscript()
                : Collections.emptyList();

        // transcript.json
        atomicWriteJson(transcriptDir.resolve("transcript.json"), turns);

        // transcript.md
        StringBuilder md = new StringBuilder();
        md.append("# Interview Session Transcript — Session #").append(sessionId).append("\n\n");
        md.append("- **Role:** ").append(session.getRoleTitle()).append("\n");
        md.append("- **Track:** ").append(session.getTrack()).append(" (").append(session.getDifficulty()).append(")\n");
        md.append("- **Status:** ").append(session.getStatus()).append("\n");
        md.append("- **Duration:** ").append(session.getDurationSeconds() != null ? session.getDurationSeconds() + "s" : "N/A").append("\n\n");
        md.append("---\n\n");

        if (turns.isEmpty()) {
            md.append("*No transcript turns recorded for this session.*\n");
        } else {
            for (InterviewSessionDocument.TranscriptTurn turn : turns) {
                md.append("### Turn ").append(turn.getTurnNumber())
                        .append(" — [").append(turn.getSenderRole()).append("] (")
                        .append(turn.getMessageType()).append(")");
                if (turn.getTimestamp() != null) {
                    md.append(" _").append(turn.getTimestamp()).append("_");
                }
                md.append("\n\n");

                if (turn.getContent() != null && !turn.getContent().isBlank()) {
                    md.append(turn.getContent()).append("\n\n");
                }
                if (turn.getCodeSnippet() != null && !turn.getCodeSnippet().isBlank()) {
                    md.append("```\n").append(turn.getCodeSnippet()).append("\n```\n\n");
                }
                md.append("---\n\n");
            }
        }
        atomicWriteString(transcriptDir.resolve("transcript.md"), md.toString());
    }

    private void writeProblems(Path sessionDir, Long sessionId, InterviewSession session, InterviewSessionDocument doc) throws IOException {
        Path problemsDir = sessionDir.resolve("problems");

        // 1. session-questions.json
        List<SessionQuestionResponse> questions = Collections.emptyList();
        if (sessionQuestionService != null) {
            try {
                questions = sessionQuestionService.getSessionQuestions(sessionId);
            } catch (Exception e) {
                log.warn("Could not fetch session questions for session {}: {}", sessionId, e.getMessage());
            }
        }
        atomicWriteJson(problemsDir.resolve("session-questions.json"), questions);

        // 2. submissions-ledger.jsonl and code snippets
        List<InterviewSessionDocument.SubmissionEntry> ledger = (doc != null && doc.getSubmissionsLedger() != null)
                ? doc.getSubmissionsLedger()
                : Collections.emptyList();

        StringBuilder jsonl = new StringBuilder();
        Path codeDir = problemsDir.resolve("code");
        int seq = 1;

        for (InterviewSessionDocument.SubmissionEntry entry : ledger) {
            String line = objectMapper.writeValueAsString(entry);
            jsonl.append(line).append("\n");

            if (entry.getCodeSnippet() != null && !entry.getCodeSnippet().isBlank()) {
                String safeSlug = pathPolicy.sanitizeToken(entry.getProblemSlug(), "PROBLEM");
                String safeAction = pathPolicy.sanitizeToken(entry.getAction(), "RUN");
                String ext = resolveExtension(session.getTrack() != null ? session.getTrack().name() : null, entry.getCodeSnippet());
                String codeFileName = String.format("%s__%s__%03d.%s", safeSlug, safeAction, seq, ext);
                atomicWriteString(codeDir.resolve(codeFileName), entry.getCodeSnippet());
            }
            seq++;
        }
        atomicWriteString(problemsDir.resolve("submissions-ledger.jsonl"), jsonl.toString());
    }

    private void writePlan(Path sessionDir, InterviewSession session, InterviewSessionDocument doc) throws IOException {
        Map<String, Object> planData = new LinkedHashMap<>();
        planData.put("plannedSlugs", session.getPlannedSlugs());
        planData.put("planJson", session.getPlanJson());
        if (doc != null && doc.getPlanSections() != null) {
            planData.put("planSections", doc.getPlanSections());
        }
        atomicWriteJson(sessionDir.resolve("plan/session-plan.json"), planData);
    }

    private void writeIntegrity(Path sessionDir, Long sessionId, InterviewSession session, InterviewSessionDocument doc) throws IOException {
        Path integrityDir = sessionDir.resolve("integrity");

        // verification-receipt.json
        if (verificationRepository != null) {
            Optional<SessionVerification> verification = verificationRepository.findBySessionId(sessionId);
            if (verification.isPresent()) {
                atomicWriteJson(integrityDir.resolve("verification-receipt.json"), verification.get());
            }
        }

        // message-integrity.json
        List<Map<String, Object>> integritySignals = new ArrayList<>();
        if (doc != null && doc.getTranscript() != null) {
            for (InterviewSessionDocument.TranscriptTurn turn : doc.getTranscript()) {
                if (turn.getKeystrokeCount() != null || turn.getPasteCount() != null || turn.getTabSwitchCount() != null) {
                    Map<String, Object> sig = new LinkedHashMap<>();
                    sig.put("turnNumber", turn.getTurnNumber());
                    sig.put("senderRole", turn.getSenderRole());
                    sig.put("keystrokeCount", turn.getKeystrokeCount());
                    sig.put("avgKeystrokeIntervalMs", turn.getAvgKeystrokeIntervalMs());
                    sig.put("keystrokeVariance", turn.getKeystrokeVariance());
                    sig.put("estimatedWpm", turn.getEstimatedWpm());
                    sig.put("suspiciousTyping", turn.getSuspiciousTyping());
                    sig.put("copyCount", turn.getCopyCount());
                    sig.put("pasteCount", turn.getPasteCount());
                    sig.put("tabSwitchCount", turn.getTabSwitchCount());
                    sig.put("echoFilteredCount", turn.getEchoFilteredCount());
                    integritySignals.add(sig);
                }
            }
        }
        atomicWriteJson(integrityDir.resolve("message-integrity.json"), integritySignals);
    }

    private void writeAttachments(Path sessionDir, Long sessionId) {
        if (gridFSBucket == null) return;
        Path attachmentsDir = sessionDir.resolve("attachments");
        try {
            GridFSFindIterable files = gridFSBucket.find(new Document("metadata.sessionId", sessionId));
            for (GridFSFile file : files) {
                Document meta = file.getMetadata();
                String type = meta != null ? meta.getString("type") : null;
                // Exclude recording chunks from attachments
                if ("RECORDING_CHUNK".equals(type) || "RECORDING_DROPPED_CHUNK".equals(type) || "RECORDING_SUMMARY".equals(type)) {
                    continue;
                }
                String filename = file.getFilename();
                if (filename == null || filename.isBlank()) {
                    filename = "attachment_" + file.getObjectId().toHexString();
                }
                String safeName = filename.replaceAll("[^a-zA-Z0-9._-]", "_");
                Path target = attachmentsDir.resolve(safeName);
                Path part = attachmentsDir.resolve(safeName + ".part");
                try (OutputStream out = Files.newOutputStream(part, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE)) {
                    gridFSBucket.downloadToStream(file.getObjectId(), out);
                    out.flush();
                }
                atomicMove(part, target);
            }
        } catch (Exception e) {
            log.warn("Could not archive attachments for session {}: {}", sessionId, e.getMessage());
        }
    }

    public void buildAndWriteManifest(
            Path sessionDir,
            Long sessionId,
            String relFolderPath,
            InterviewSession session,
            InterviewSessionDocument doc,
            String status,
            int vaultVersion
    ) throws IOException {
        buildAndWriteManifest(sessionDir, sessionId, relFolderPath, session, doc, status, vaultVersion, "VERIFIED".equalsIgnoreCase(status));
    }

    public void buildAndWriteManifest(
            Path sessionDir,
            Long sessionId,
            String relFolderPath,
            InterviewSession session,
            InterviewSessionDocument doc,
            String status,
            int vaultVersion,
            boolean expectReport
    ) throws IOException {
        buildAndWriteManifest(sessionDir, sessionId, relFolderPath, session, doc, status, vaultVersion, expectReport, Collections.emptyList());
    }

    public void buildAndWriteManifest(
            Path sessionDir,
            Long sessionId,
            String relFolderPath,
            InterviewSession session,
            InterviewSessionDocument doc,
            String status,
            int vaultVersion,
            boolean expectReport,
            List<String> errors
    ) throws IOException {
        List<ArtifactEntry> artifacts = new ArrayList<>();
        try (Stream<Path> stream = Files.walk(sessionDir)) {
            List<Path> files = stream.filter(Files::isRegularFile).sorted().toList();
            for (Path file : files) {
                String fileName = file.getFileName().toString();
                if (fileName.equals("manifest.json") || fileName.equals("vault-status.json") || fileName.endsWith(".part")) {
                    continue;
                }
                Path rel = sessionDir.relativize(file);
                String relPathStr = rel.toString().replace('\\', '/');
                String kind = determineKind(relPathStr);
                long bytes = Files.size(file);
                String sha256 = computeSha256(file);
                artifacts.add(ArtifactEntry.builder()
                        .path(relPathStr)
                        .kind(kind)
                        .bytes(bytes)
                        .sha256(sha256)
                        .build());
            }
        }

        // Expected artifacts schema validation to compute real missing[]
        List<String> expectedArtifacts = new ArrayList<>(STAGE1_EXPECTED_ARTIFACTS);
        if (expectReport || "VERIFIED".equalsIgnoreCase(status)) {
            expectedArtifacts.addAll(REPORT_EXPECTED_ARTIFACTS);
        }
        if (doc != null && doc.getSubmissionsLedger() != null) {
            int seq = 1;
            for (InterviewSessionDocument.SubmissionEntry entry : doc.getSubmissionsLedger()) {
                if (entry.getCodeSnippet() != null && !entry.getCodeSnippet().isBlank()) {
                    String safeSlug = pathPolicy.sanitizeToken(entry.getProblemSlug(), "PROBLEM");
                    String safeAction = pathPolicy.sanitizeToken(entry.getAction(), "RUN");
                    String ext = resolveExtension(session.getTrack() != null ? session.getTrack().name() : null, entry.getCodeSnippet());
                    String codeFileName = String.format("problems/code/%s__%s__%03d.%s", safeSlug, safeAction, seq, ext);
                    expectedArtifacts.add(codeFileName);
                }
                seq++;
            }
        }

        List<String> missing = new ArrayList<>();
        for (String expectedRelPath : expectedArtifacts) {
            if (!Files.exists(sessionDir.resolve(expectedRelPath))) {
                missing.add(expectedRelPath);
            }
        }

        int problemsCount = session.getPlannedSlugs() != null ? session.getPlannedSlugs().size() : 0;
        int solvedCount = 0;
        if (sessionQuestionService != null) {
            try {
                solvedCount = (int) sessionQuestionService.getSessionQuestions(sessionId).stream()
                        .filter(q -> "PASSED".equalsIgnoreCase(q.verdict()))
                        .count();
            } catch (Exception ignored) {}
        }
        int submissionsCount = (doc != null && doc.getSubmissionsLedger() != null) ? doc.getSubmissionsLedger().size() : 0;
        int transcriptTurnsCount = (doc != null && doc.getTranscript() != null) ? doc.getTranscript().size() : 0;
        int recordingsCount = 3; // screen, camera, mic-audio
        int attachmentsCount = 0;
        Path attachmentsDir = sessionDir.resolve("attachments");
        if (Files.exists(attachmentsDir)) {
            try (Stream<Path> s = Files.list(attachmentsDir)) {
                attachmentsCount = (int) s.filter(Files::isRegularFile).count();
            } catch (Exception ignored) {}
        }

        ManifestPayload manifest = ManifestPayload.builder()
                .schema("av1.manifest@1")
                .sessionId(sessionId)
                .sessionFolder(relFolderPath)
                .status(status)
                .vaultVersion(vaultVersion)
                .generatedAt(Instant.now().toString())
                .session(ManifestSessionInfo.builder()
                        .track(session.getTrack() != null ? session.getTrack().name() : null)
                        .difficulty(session.getDifficulty() != null ? session.getDifficulty().name() : null)
                        .roleTitle(session.getRoleTitle())
                        .sessionMode(session.getSessionMode())
                        .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
                        .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : null)
                        .durationSeconds(session.getDurationSeconds())
                        .build())
                .counts(ManifestCounts.builder()
                        .problems(problemsCount)
                        .solved(solvedCount)
                        .submissions(submissionsCount)
                        .transcriptTurns(transcriptTurnsCount)
                        .recordings(recordingsCount)
                        .attachments(attachmentsCount)
                        .build())
                .artifacts(artifacts)
                .missing(missing)
                .errors(errors != null ? errors : Collections.emptyList())
                .build();

        atomicWriteJson(sessionDir.resolve("manifest.json"), manifest);
    }

    public ManifestVerificationResult verifyVaultFolder(Path sessionDir) {
        Path manifestPath = sessionDir.resolve("manifest.json");
        if (!Files.exists(manifestPath)) {
            return ManifestVerificationResult.builder()
                    .valid(false)
                    .errors(List.of("manifest.json not found"))
                    .build();
        }
        try {
            ManifestPayload manifest = objectMapper.readValue(manifestPath.toFile(), ManifestPayload.class);
            List<String> missing = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            // 1. Validate presence against the expected-artifact schema
            List<String> expectedSchema = new ArrayList<>(STAGE1_EXPECTED_ARTIFACTS);
            if ("VERIFIED".equalsIgnoreCase(manifest.getStatus())) {
                expectedSchema.addAll(REPORT_EXPECTED_ARTIFACTS);
            }
            for (String expected : expectedSchema) {
                Path expFile = sessionDir.resolve(expected);
                if (!Files.exists(expFile)) {
                    if (!missing.contains(expected)) {
                        missing.add(expected);
                    }
                    errors.add("Expected artifact missing: " + expected);
                }
            }

            // 2. Validate all manifest-declared artifacts exist on disk and hashes match
            if (manifest.getArtifacts() != null) {
                for (ArtifactEntry entry : manifest.getArtifacts()) {
                    Path file = sessionDir.resolve(entry.getPath());
                    if (!Files.exists(file)) {
                        if (!missing.contains(entry.getPath())) {
                            missing.add(entry.getPath());
                        }
                        errors.add("Manifest artifact missing from disk: " + entry.getPath());
                    } else {
                        String actualSha = computeSha256(file);
                        if (!actualSha.equalsIgnoreCase(entry.getSha256())) {
                            errors.add(String.format("Hash mismatch for %s: expected %s, got %s", entry.getPath(), entry.getSha256(), actualSha));
                        }
                    }
                }
            }
            boolean valid = missing.isEmpty() && errors.isEmpty();
            return ManifestVerificationResult.builder()
                    .valid(valid)
                    .missing(missing)
                    .errors(errors)
                    .build();
        } catch (Exception e) {
            return ManifestVerificationResult.builder()
                    .valid(false)
                    .errors(List.of("Failed to parse or verify manifest: " + e.getMessage()))
                    .build();
        }
    }

    public String computeSha256(Path file) throws IOException {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            try (InputStream is = Files.newInputStream(file)) {
                byte[] buf = new byte[8192];
                int read;
                while ((read = is.read(buf)) != -1) {
                    md.update(buf, 0, read);
                }
            }
            byte[] digest = md.digest();
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 unavailable", e);
        }
    }

    private String determineKind(String relPath) {
        if (relPath.startsWith("recordings/")) return "recording";
        if (relPath.startsWith("session/")) return "session";
        if (relPath.startsWith("transcript/")) return "transcript";
        if (relPath.startsWith("problems/")) return "problem";
        if (relPath.startsWith("plan/")) return "plan";
        if (relPath.startsWith("integrity/")) return "integrity";
        if (relPath.startsWith("attachments/")) return "attachment";
        if (relPath.startsWith("report/")) return "report";
        if (relPath.startsWith("proctor/")) return "proctor";
        return "other";
    }

    String resolveExtension(String track, String codeSnippet) {
        if (codeSnippet != null && !codeSnippet.isBlank()) {
            // Java-specific signals
            if (codeSnippet.contains("import java") || codeSnippet.contains("public class")
                    || codeSnippet.contains("System.out") || codeSnippet.contains("public static void")) {
                return "java";
            }
            // Python signals (def, print, elif, self., non-java import, class with colon)
            if (codeSnippet.contains("def ") || codeSnippet.contains("print(")
                    || codeSnippet.contains("elif ") || codeSnippet.contains("self.")
                    || (codeSnippet.contains("import ") && !codeSnippet.contains("import java"))
                    || (codeSnippet.contains("class ") && codeSnippet.contains(":"))) {
                return "py";
            }
            // JavaScript / TypeScript signals
            if (codeSnippet.contains("function ") || codeSnippet.contains("const ")
                    || codeSnippet.contains("let ") || codeSnippet.contains("=>")
                    || codeSnippet.contains("console.log")) {
                return "js";
            }
            // SQL signals
            String upper = codeSnippet.toUpperCase();
            if (upper.contains("SELECT ") || upper.contains("CREATE TABLE") || upper.contains("INSERT INTO ") || upper.contains("UPDATE ")) {
                return "sql";
            }
            // Java class fallback if code has class declaration with java types
            if (codeSnippet.contains("class ") && (codeSnippet.contains("void ") || codeSnippet.contains("int ") || codeSnippet.contains("String ") || codeSnippet.contains("boolean "))) {
                return "java";
            }
        }

        // Track default when content gives no signal
        String normalizedTrack = pathPolicy.normalizeTrack(track);
        if ("SQL".equalsIgnoreCase(normalizedTrack)) {
            return "sql";
        }
        if ("DSA".equalsIgnoreCase(normalizedTrack) || "LLD".equalsIgnoreCase(normalizedTrack)) {
            return "java";
        }
        return "txt";
    }

    private void atomicWriteJson(Path targetFile, Object data) throws IOException {
        Path parent = targetFile.getParent();
        if (parent != null && !Files.exists(parent)) {
            Files.createDirectories(parent);
        }
        Path part = targetFile.resolveSibling(targetFile.getFileName().toString() + ".part");
        byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(data);
        Files.write(part, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        atomicMove(part, targetFile);
    }

    private void atomicWriteString(Path targetFile, String content) throws IOException {
        Path parent = targetFile.getParent();
        if (parent != null && !Files.exists(parent)) {
            Files.createDirectories(parent);
        }
        Path part = targetFile.resolveSibling(targetFile.getFileName().toString() + ".part");
        Files.writeString(part, content, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
        atomicMove(part, targetFile);
    }

    private void atomicMove(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(source, target, StandardCopyOption.REPLACE_EXISTING);
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManifestPayload {
        private String schema;
        private Long sessionId;
        private String sessionFolder;
        private String status;
        private Integer vaultVersion;
        private String generatedAt;
        private ManifestSessionInfo session;
        private ManifestCounts counts;
        private List<ArtifactEntry> artifacts;
        private List<String> missing;
        private List<String> errors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManifestSessionInfo {
        private String track;
        private String difficulty;
        private String roleTitle;
        private String sessionMode;
        private String startedAt;
        private String completedAt;
        private Long durationSeconds;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManifestCounts {
        private Integer problems;
        private Integer solved;
        private Integer submissions;
        private Integer transcriptTurns;
        private Integer recordings;
        private Integer attachments;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArtifactEntry {
        private String path;
        private String kind;
        private Long bytes;
        private String sha256;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManifestVerificationResult {
        private boolean valid;
        private List<String> missing;
        private List<String> errors;
    }
}
