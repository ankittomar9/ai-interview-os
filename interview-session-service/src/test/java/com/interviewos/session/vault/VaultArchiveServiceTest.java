package com.interviewos.session.vault;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.SessionQuestionResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.service.InterviewSessionService;
import com.interviewos.session.service.SessionQuestionService;
import com.interviewos.session.service.SessionRecordingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mockito;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class VaultArchiveServiceTest {

    private VaultProperties vaultProperties;
    private VaultPathPolicy pathPolicy;
    private VaultStatusService statusService;
    private InterviewSessionRepository sessionRepository;
    private InterviewSessionMongoRepository mongoSessionRepository;
    private SessionRecordingService sessionRecordingService;
    private SessionQuestionService sessionQuestionService;
    private VaultArchiveService vaultArchiveService;

    @BeforeEach
    void setUp(@TempDir Path tempVaultRoot) {
        vaultProperties = new VaultProperties();
        vaultProperties.setRoot(tempVaultRoot.toString());
        pathPolicy = new VaultPathPolicy();

        sessionRepository = mock(InterviewSessionRepository.class);
        mongoSessionRepository = mock(InterviewSessionMongoRepository.class);
        sessionRecordingService = mock(SessionRecordingService.class);
        sessionQuestionService = mock(SessionQuestionService.class);
        statusService = mock(VaultStatusService.class);

        vaultArchiveService = new VaultArchiveService(
                vaultProperties,
                pathPolicy,
                statusService,
                sessionRepository,
                mongoSessionRepository,
                sessionRecordingService,
                sessionQuestionService,
                null,
                null
        );
    }

    @Test
    @DisplayName("VP11 PASS: Stage-1 archival produces all MUST artifacts with valid manifest hashes")
    void testStage1ArchiveSuccess(@TempDir Path tempVaultRoot) throws Exception {
        vaultProperties.setRoot(tempVaultRoot.toString());
        Long sessionId = 1042L;
        Instant now = Instant.parse("2026-10-01T14:32:00Z");

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .candidateId("cand-1")
                .roleTitle("SDE-2")
                .track(InterviewTrack.ALGORITHMS_DATA_STRUCTURES)
                .difficulty(DifficultyLevel.MID)
                .status(SessionStatus.COMPLETED)
                .startedAt(now.minusSeconds(1800))
                .completedAt(now)
                .durationSeconds(1800L)
                .plannedSlugs(List.of("two-sum"))
                .planJson("{\"plan\":\"dummy\"}")
                .build();

        InterviewSessionDocument doc = InterviewSessionDocument.builder()
                .sessionId(sessionId)
                .interviewTrack("DSA")
                .seniorityLevel("MEDIUM")
                .transcript(List.of(
                        InterviewSessionDocument.TranscriptTurn.builder()
                                .turnNumber(1)
                                .senderRole("CANDIDATE")
                                .messageType("QUESTION")
                                .content("How do I solve this?")
                                .timestamp(LocalDateTime.now())
                                .build(),
                        InterviewSessionDocument.TranscriptTurn.builder()
                                .turnNumber(2)
                                .senderRole("AI")
                                .messageType("EXPLANATION")
                                .content("Consider using a hash map.")
                                .timestamp(LocalDateTime.now())
                                .build()
                ))
                .submissionsLedger(List.of(
                        InterviewSessionDocument.SubmissionEntry.builder()
                                .id("sub-1")
                                .problemSlug("two-sum")
                                .action("SUBMIT")
                                .status("PASSED")
                                .passedTests(5)
                                .totalTests(5)
                                .codeSnippet("class Solution { public int[] twoSum() { return new int[]{0,1}; } }")
                                .build()
                ))
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.of(doc));

        // Mock recording streams
        doAnswer(invocation -> {
            OutputStream out = invocation.getArgument(2);
            out.write("RIFF_FAKE_WEBM_BYTES".getBytes(StandardCharsets.UTF_8));
            return null;
        }).when(sessionRecordingService).streamRecording(eq(sessionId), any(String.class), any(OutputStream.class));

        when(sessionQuestionService.getSessionQuestions(sessionId)).thenReturn(List.of(
                new SessionQuestionResponse(1L, sessionId, "two-sum", 1, "PASSED", now, now)
        ));

        // Act
        Path sessionDir = vaultArchiveService.archiveSessionStage1(sessionId);

        // Assert folder structure
        assertTrue(Files.exists(sessionDir), "Session folder must exist");
        assertEquals("1432_DSA_MEDIUM_1042", sessionDir.getFileName().toString());

        // Assert all MUST artifacts exist
        assertTrue(Files.exists(sessionDir.resolve("session/session.json")));
        assertTrue(Files.exists(sessionDir.resolve("recordings/screen.webm")));
        assertTrue(Files.exists(sessionDir.resolve("recordings/camera.webm")));
        assertTrue(Files.exists(sessionDir.resolve("recordings/mic-audio.webm")));
        assertTrue(Files.exists(sessionDir.resolve("recordings/manifest.json")));
        assertTrue(Files.exists(sessionDir.resolve("transcript/transcript.json")));
        assertTrue(Files.exists(sessionDir.resolve("transcript/transcript.md")));
        assertTrue(Files.exists(sessionDir.resolve("problems/session-questions.json")));
        assertTrue(Files.exists(sessionDir.resolve("problems/submissions-ledger.jsonl")));
        assertTrue(Files.exists(sessionDir.resolve("problems/code/TWOSUM__SUBMIT__001.java")));
        assertTrue(Files.exists(sessionDir.resolve("plan/session-plan.json")));
        assertTrue(Files.exists(sessionDir.resolve("manifest.json")));

        // Verify status service notified
        verify(statusService, times(1)).markStaged(eq(sessionId), anyString(), eq(sessionDir));

        // Verify cryptographic manifest integrity (PASS case)
        VaultArchiveService.ManifestVerificationResult verification = vaultArchiveService.verifyVaultFolder(sessionDir);
        assertTrue(verification.isValid(), "Cryptographic manifest must be valid for uncorrupted folder");
        assertTrue(verification.getMissing().isEmpty());
        assertTrue(verification.getErrors().isEmpty());
    }

    @Test
    @DisplayName("VP11 FAIL (G4 pair): Manifest verification fails when an artifact is tampered or corrupted")
    void testStage1ArchiveCorruptDetection(@TempDir Path tempVaultRoot) throws Exception {
        vaultProperties.setRoot(tempVaultRoot.toString());
        Long sessionId = 1043L;
        Instant now = Instant.parse("2026-10-01T14:35:00Z");

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .roleTitle("SDE-1")
                .track(InterviewTrack.ALGORITHMS_DATA_STRUCTURES)
                .difficulty(DifficultyLevel.JUNIOR)
                .status(SessionStatus.COMPLETED)
                .completedAt(now)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.empty());

        Path sessionDir = vaultArchiveService.archiveSessionStage1(sessionId);
        assertTrue(Files.exists(sessionDir.resolve("manifest.json")));

        // Verify initially valid
        assertTrue(vaultArchiveService.verifyVaultFolder(sessionDir).isValid());

        // Deliberately corrupt a file (screen.webm)
        Path screenWebm = sessionDir.resolve("recordings/screen.webm");
        Files.writeString(screenWebm, "CORRUPTED_TAMPERED_BYTES", StandardCharsets.UTF_8);

        // Verify corrupted folder fails verification
        VaultArchiveService.ManifestVerificationResult verification = vaultArchiveService.verifyVaultFolder(sessionDir);
        assertFalse(verification.isValid(), "Tampered file must fail manifest verification");
        assertFalse(verification.getErrors().isEmpty(), "Errors list must record the hash mismatch");
        assertTrue(verification.getErrors().get(0).contains("Hash mismatch for recordings/screen.webm"));
    }

    @Test
    @DisplayName("VP13 Failure Isolation: completeSession never throws when vault archive encounters error")
    void testCompleteSessionFailureIsolation() {
        InterviewSessionRepository mockSessionRepo = mock(InterviewSessionRepository.class);
        InterviewSessionMongoRepository mockMongoRepo = mock(InterviewSessionMongoRepository.class);
        VaultArchiveService mockArchiveService = mock(VaultArchiveService.class);

        InterviewSession session = InterviewSession.builder()
                .id(999L)
                .status(SessionStatus.IN_PROGRESS)
                .roleTitle("Staff Engineer")
                .track(InterviewTrack.SYSTEM_DESIGN)
                .difficulty(DifficultyLevel.STAFF)
                .build();

        when(mockSessionRepo.findById(999L)).thenReturn(Optional.of(session));
        when(mockSessionRepo.save(any(InterviewSession.class))).thenAnswer(i -> i.getArgument(0));

        // Simulate vault archive throwing a critical filesystem or disk error
        doThrow(new RuntimeException("Simulated disk full or permission error")).when(mockArchiveService).archiveSessionAsync(999L);

        InterviewSessionService sessionService = new InterviewSessionService(
                mockSessionRepo,
                null,
                mockMongoRepo,
                null,
                null,
                null,
                null,
                null,
                null,
                mockArchiveService
        );

        // completeSession MUST NOT throw despite vault failure
        assertDoesNotThrow(() -> sessionService.completeSession(999L));
        assertEquals(SessionStatus.COMPLETED, session.getStatus());
    }

    @Test
    @DisplayName("VP12: Report finalize writes report artifacts, sets status VERIFIED, and is idempotent")
    void testFinalizeWithReportAndIdempotency(@TempDir Path tempVaultRoot) throws Exception {
        vaultProperties.setRoot(tempVaultRoot.toString());
        Long sessionId = 2001L;
        Instant now = Instant.parse("2026-10-01T14:40:00Z");

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .roleTitle("Senior Backend Engineer")
                .track(InterviewTrack.ALGORITHMS_DATA_STRUCTURES)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.COMPLETED)
                .completedAt(now)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.empty());

        EvaluationReportClient mockReportClient = mock(EvaluationReportClient.class);
        byte[] fakeJson = "{\"score\": 95, \"verdict\": \"STRONG_HIRE\"}".getBytes(StandardCharsets.UTF_8);
        byte[] fakePdf = "%PDF-1.4 fake pdf data".getBytes(StandardCharsets.UTF_8);

        when(mockReportClient.fetchReportJson(sessionId)).thenReturn(Optional.of(fakeJson));
        when(mockReportClient.fetchReportPdf(sessionId)).thenReturn(Optional.of(fakePdf));

        VaultArchiveService archiveServiceWithReportClient = new VaultArchiveService(
                vaultProperties,
                pathPolicy,
                statusService,
                sessionRepository,
                mongoSessionRepository,
                sessionRecordingService,
                sessionQuestionService,
                null,
                null,
                mockReportClient
        );

        // Run Stage 1
        Path sessionDir = archiveServiceWithReportClient.archiveSessionStage1(sessionId);
        assertTrue(Files.exists(sessionDir.resolve("manifest.json")));

        // Finalize pass 1
        archiveServiceWithReportClient.finalizeWithReport(sessionId);

        // Assert report files created
        assertTrue(Files.exists(sessionDir.resolve("report/report.json")));
        assertTrue(Files.exists(sessionDir.resolve("report/report.pdf")));
        verify(statusService, times(1)).markVerified(eq(sessionId), eq(sessionDir));

        String screenSha1 = archiveServiceWithReportClient.computeSha256(sessionDir.resolve("recordings/screen.webm"));

        // Idempotency: Finalize pass 2 (e.g. NEEDS_REGRADE re-run)
        byte[] updatedJson = "{\"score\": 98, \"verdict\": \"STRONG_HIRE\"}".getBytes(StandardCharsets.UTF_8);
        when(mockReportClient.fetchReportJson(sessionId)).thenReturn(Optional.of(updatedJson));

        archiveServiceWithReportClient.finalizeWithReport(sessionId);

        // Non-report file sha must be identical
        String screenSha2 = archiveServiceWithReportClient.computeSha256(sessionDir.resolve("recordings/screen.webm"));
        assertEquals(screenSha1, screenSha2, "Non-report files must maintain identical hashes on re-finalize");

        // Verify manifest is valid and updated
        VaultArchiveService.ManifestVerificationResult result = archiveServiceWithReportClient.verifyVaultFolder(sessionDir);
        assertTrue(result.isValid(), "Manifest must remain valid after idempotent finalize");
    }

    @Test
    @DisplayName("REQ-AV-9: Aborted session produces PARTIAL manifest and calls markAborted")
    void testAbortSessionArchiving(@TempDir Path tempVaultRoot) throws Exception {
        vaultProperties.setRoot(tempVaultRoot.toString());
        Long sessionId = 4001L;
        Instant now = Instant.parse("2026-10-01T14:45:00Z");

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .roleTitle("Mid Developer")
                .track(InterviewTrack.ALGORITHMS_DATA_STRUCTURES)
                .difficulty(DifficultyLevel.MID)
                .status(SessionStatus.ABORTED_SHARE)
                .completedAt(now)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.empty());

        Path sessionDir = vaultArchiveService.archiveSessionStage1(sessionId);

        // Verify folder and manifest
        assertTrue(Files.exists(sessionDir.resolve("manifest.json")));
        VaultArchiveService.ManifestPayload manifest = new ObjectMapper().readValue(
                sessionDir.resolve("manifest.json").toFile(),
                VaultArchiveService.ManifestPayload.class
        );
        assertEquals("PARTIAL", manifest.getStatus(), "Aborted session manifest status must be PARTIAL");
        verify(statusService, times(1)).markAborted(eq(sessionId), anyString(), eq(sessionDir));
    }
}
