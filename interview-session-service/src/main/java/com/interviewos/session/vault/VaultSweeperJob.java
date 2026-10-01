package com.interviewos.session.vault;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class VaultSweeperJob {

    private final VaultProperties vaultProperties;
    private final VaultPathPolicy pathPolicy;
    private final VaultStatusService statusService;
    private final VaultArchiveService vaultArchiveService;
    private final InterviewSessionRepository sessionRepository;
    private final InterviewSessionMongoRepository mongoSessionRepository;

    @Autowired(required = false)
    private EvaluationReportClient evaluationReportClient;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(cron = "${vault.sweep-cron:0 30 3 * * ?}")
    public void scheduledSweep() {
        log.info("🧹 Starting scheduled Vault Sweeper job (dryRun={})...", vaultProperties.isSweepDryRun());
        int swept = runSweepJob(Instant.now(), vaultProperties.isSweepDryRun());
        log.info("🧹 Vault Sweeper job finished. Processed {} sessions.", swept);
    }

    public int runSweepJob(Instant now, boolean dryRun) {
        Instant oneHourCutoff = now.minus(Duration.ofHours(1));
        Instant twentyFourHoursCutoff = now.minus(Duration.ofHours(24));

        List<InterviewSession> completedSessions = sessionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SessionStatus.COMPLETED && s.getCompletedAt() != null)
                .filter(s -> s.getCompletedAt().isBefore(oneHourCutoff))
                .toList();

        int processed = 0;
        for (InterviewSession session : completedSessions) {
            Long sessionId = session.getId();
            Optional<InterviewSessionDocument> docOpt = mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId);
            InterviewSessionDocument.VaultMetadata vault = docOpt.map(InterviewSessionDocument::getVault).orElse(null);

            String status = vault != null ? vault.getStatus() : null;
            // Target sessions whose vault status is absent or STAGED
            if (status == null || "STAGED".equalsIgnoreCase(status)) {
                log.info("Sweeper found unfinalized session {} (status={}, completedAt={})", sessionId, status, session.getCompletedAt());
                if (dryRun) {
                    log.info("[DRY-RUN] Would process session {}", sessionId);
                    processed++;
                    continue;
                }

                try {
                    boolean hasReport = false;
                    if (evaluationReportClient != null) {
                        hasReport = evaluationReportClient.fetchReportJson(sessionId).isPresent();
                    }

                    if (hasReport) {
                        log.info("Report found for session {}. Sweeper finalizing vault as VERIFIED.", sessionId);
                        vaultArchiveService.finalizeWithReport(sessionId);
                        processed++;
                    } else if (session.getCompletedAt().isBefore(twentyFourHoursCutoff)) {
                        log.warn("No report found after 24h for session {}. Sweeper marking PARTIAL with missing: [\"report\"].", sessionId);
                        markSessionPartialWithMissingReport(session, docOpt.orElse(null));
                        processed++;
                    }
                } catch (Exception e) {
                    log.error("Sweeper failed to process session {}: {}", sessionId, e.getMessage(), e);
                }
            }
        }
        return processed;
    }

    private void markSessionPartialWithMissingReport(InterviewSession session, InterviewSessionDocument doc) throws Exception {
        Long sessionId = session.getId();
        Instant completionTime = session.getCompletedAt() != null ? session.getCompletedAt() : Instant.now();
        String track = session.getTrack() != null ? session.getTrack().name() : (doc != null ? doc.getInterviewTrack() : "UNKNOWN");
        String difficulty = session.getDifficulty() != null ? session.getDifficulty().name() : (doc != null ? doc.getSeniorityLevel() : "UNKNOWN");

        Path sessionDir = pathPolicy.resolveSessionPath(vaultProperties.getRoot(), completionTime, track, difficulty, sessionId);
        String relFolderPath = pathPolicy.buildRelativePath(completionTime, track, difficulty, sessionId);

        if (!Files.exists(sessionDir)) {
            vaultArchiveService.archiveSessionStage1(sessionId);
        }

        // Update manifest with status PARTIAL and missing: ["report"]
        Path manifestPath = sessionDir.resolve("manifest.json");
        if (Files.exists(manifestPath)) {
            try {
                VaultArchiveService.ManifestPayload manifest = objectMapper.readValue(manifestPath.toFile(), VaultArchiveService.ManifestPayload.class);
                int nextVersion = manifest.getVaultVersion() != null ? manifest.getVaultVersion() + 1 : 1;
                vaultArchiveService.buildAndWriteManifest(sessionDir, sessionId, relFolderPath, session, doc, "PARTIAL", nextVersion, true);

                // Ensure PARTIAL status and "report" token in missing for sweeper contract
                VaultArchiveService.ManifestPayload updated = objectMapper.readValue(manifestPath.toFile(), VaultArchiveService.ManifestPayload.class);
                updated.setStatus("PARTIAL");
                List<String> missing = new java.util.ArrayList<>(updated.getMissing() != null ? updated.getMissing() : List.of());
                if (!missing.contains("report")) {
                    missing.add(0, "report");
                }
                updated.setMissing(missing);
                byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(updated);
                Files.write(manifestPath, bytes);
            } catch (IOException e) {
                log.warn("Could not update manifest missing report for session {}: {}", sessionId, e.getMessage());
            }
        }

        statusService.markPartial(sessionId, sessionDir, "Report missing after 24h sweeper cutoff");
    }
}
