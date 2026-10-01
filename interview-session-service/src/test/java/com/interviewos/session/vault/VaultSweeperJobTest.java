package com.interviewos.session.vault;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VaultSweeperJobTest {

    private VaultProperties vaultProperties;
    private VaultPathPolicy pathPolicy;
    private VaultStatusService statusService;
    private VaultArchiveService vaultArchiveService;
    private InterviewSessionRepository sessionRepository;
    private InterviewSessionMongoRepository mongoSessionRepository;
    private EvaluationReportClient evaluationReportClient;
    private VaultSweeperJob sweeperJob;

    @BeforeEach
    void setUp(@TempDir Path tempVaultRoot) {
        vaultProperties = new VaultProperties();
        vaultProperties.setRoot(tempVaultRoot.toString());
        pathPolicy = new VaultPathPolicy();
        statusService = mock(VaultStatusService.class);
        vaultArchiveService = mock(VaultArchiveService.class);
        sessionRepository = mock(InterviewSessionRepository.class);
        mongoSessionRepository = mock(InterviewSessionMongoRepository.class);
        evaluationReportClient = mock(EvaluationReportClient.class);

        sweeperJob = new VaultSweeperJob(
                vaultProperties,
                pathPolicy,
                statusService,
                vaultArchiveService,
                sessionRepository,
                mongoSessionRepository
        );

        // Inject evaluationReportClient via reflection or package-private field
        org.springframework.test.util.ReflectionTestUtils.setField(sweeperJob, "evaluationReportClient", evaluationReportClient);
    }

    @Test
    @DisplayName("VP14a: Sweeper finalizes session as VERIFIED when report is ready after callback was suppressed")
    void testSweeperFinalizesWhenReportAvailable() throws Exception {
        Long sessionId = 3001L;
        Instant now = Instant.parse("2026-10-01T15:00:00Z");
        Instant completedAt = now.minus(Duration.ofHours(2)); // > 1h ago

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .roleTitle("Senior Engineer")
                .track(InterviewTrack.ALGORITHMS_DATA_STRUCTURES)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.COMPLETED)
                .completedAt(completedAt)
                .build();

        InterviewSessionDocument doc = InterviewSessionDocument.builder()
                .sessionId(sessionId)
                .vault(InterviewSessionDocument.VaultMetadata.builder()
                        .status("STAGED")
                        .folderPath("2026-10-01/1300_DSA_SENIOR_3001")
                        .build())
                .build();

        when(sessionRepository.findAll()).thenReturn(List.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.of(doc));

        // Report is present in ERS
        when(evaluationReportClient.fetchReportJson(sessionId))
                .thenReturn(Optional.of("{\"score\":90}".getBytes(StandardCharsets.UTF_8)));

        int processed = sweeperJob.runSweepJob(now, false);

        assertEquals(1, processed);
        verify(vaultArchiveService, times(1)).finalizeWithReport(sessionId);
    }

    @Test
    @DisplayName("VP14b: Sweeper closes session as PARTIAL with missing:['report'] after 24h cutoff")
    void testSweeperClosesAsPartialAfter24Hours(@TempDir Path tempVaultRoot) throws Exception {
        vaultProperties.setRoot(tempVaultRoot.toString());
        Long sessionId = 3002L;
        Instant now = Instant.parse("2026-10-01T15:00:00Z");
        Instant completedAt = now.minus(Duration.ofHours(25)); // > 24h ago

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .roleTitle("Junior Engineer")
                .track(InterviewTrack.ALGORITHMS_DATA_STRUCTURES)
                .difficulty(DifficultyLevel.JUNIOR)
                .status(SessionStatus.COMPLETED)
                .completedAt(completedAt)
                .build();

        Path sessionDir = pathPolicy.resolveSessionPath(vaultProperties.getRoot(), completedAt, "DSA", "JUNIOR", sessionId);
        Files.createDirectories(sessionDir);
        Path manifestPath = sessionDir.resolve("manifest.json");

        VaultArchiveService.ManifestPayload initialManifest = VaultArchiveService.ManifestPayload.builder()
                .schema("av1.manifest@1")
                .sessionId(sessionId)
                .status("STAGED")
                .vaultVersion(1)
                .build();
        Files.write(manifestPath, new ObjectMapper().writeValueAsBytes(initialManifest));

        InterviewSessionDocument doc = InterviewSessionDocument.builder()
                .sessionId(sessionId)
                .vault(InterviewSessionDocument.VaultMetadata.builder()
                        .status("STAGED")
                        .folderPath("2026-09-30/1400_DSA_JUNIOR_3002")
                        .build())
                .build();

        when(sessionRepository.findAll()).thenReturn(List.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.of(doc));

        // No report in ERS
        when(evaluationReportClient.fetchReportJson(sessionId)).thenReturn(Optional.empty());

        int processed = sweeperJob.runSweepJob(now, false);

        assertEquals(1, processed);
        verify(statusService, times(1)).markPartial(eq(sessionId), eq(sessionDir), contains("24h sweeper cutoff"));

        // Verify manifest updated with missing report
        VaultArchiveService.ManifestPayload updatedManifest = new ObjectMapper().readValue(manifestPath.toFile(), VaultArchiveService.ManifestPayload.class);
        assertEquals("PARTIAL", updatedManifest.getStatus());
        assertTrue(updatedManifest.getMissing().contains("report"));
    }

    @Test
    @DisplayName("Sweeper respects dry-run mode and performs no mutations")
    void testSweeperDryRun() {
        Long sessionId = 3003L;
        Instant now = Instant.parse("2026-10-01T15:00:00Z");
        Instant completedAt = now.minus(Duration.ofHours(2));

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .status(SessionStatus.COMPLETED)
                .completedAt(completedAt)
                .build();

        when(sessionRepository.findAll()).thenReturn(List.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.empty());

        int processed = sweeperJob.runSweepJob(now, true);

        assertEquals(1, processed);
        verifyNoInteractions(vaultArchiveService);
        verifyNoInteractions(statusService);
    }
}
