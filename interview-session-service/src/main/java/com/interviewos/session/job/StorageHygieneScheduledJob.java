package com.interviewos.session.job;

import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSFindIterable;
import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class StorageHygieneScheduledJob {

    private final GridFsTemplate gridFsTemplate;
    private final GridFSBucket gridFSBucket;
    private final InterviewSessionRepository interviewSessionRepository;

    @Value("${storage.retention-days:14}")
    private int retentionDays;

    @Scheduled(cron = "${storage.cleanup-cron:0 0 3 * * ?}")
    public void scheduledCleanup() {
        log.info("🧹 Starting scheduled GridFS storage hygiene and attachment cleanup job...");
        int purged = runCleanupJob(Instant.now());
        log.info("🧹 Storage hygiene job completed. Purged {} expired/orphan attachments.", purged);
    }

    public int runCleanupJob(Instant now) {
        Instant cutoff = now.minus(Duration.ofDays(retentionDays));
        log.info("Cleaning up GridFS attachments for completed sessions older than {} days (cutoff: {})...", retentionDays, cutoff);

        int purgedCount = 0;
        long reclaimedBytes = 0;

        try {
            GridFSFindIterable files = gridFSBucket.find();
            Map<Long, Optional<InterviewSession>> sessionCache = new HashMap<>();

            for (GridFSFile file : files) {
                Document metadata = file.getMetadata();
                ObjectId fileId = file.getObjectId();
                long fileLength = file.getLength();
                boolean shouldDelete = false;
                String deleteReason = "";

                if (metadata == null || !metadata.containsKey("sessionId")) {
                    shouldDelete = true;
                    deleteReason = "Missing sessionId metadata (orphan)";
                } else {
                    Object sessionVal = metadata.get("sessionId");
                    Long sessionId = null;
                    if (sessionVal instanceof Number num) {
                        sessionId = num.longValue();
                    } else if (sessionVal instanceof String str) {
                        try {
                            sessionId = Long.parseLong(str);
                        } catch (NumberFormatException ignored) {}
                    }

                    if (sessionId == null) {
                        shouldDelete = true;
                        deleteReason = "Invalid sessionId format: " + sessionVal;
                    } else {
                        Optional<InterviewSession> optSession = sessionCache.computeIfAbsent(
                                sessionId,
                                interviewSessionRepository::findById
                        );

                        if (optSession.isEmpty()) {
                            shouldDelete = true;
                            deleteReason = "Session " + sessionId + " does not exist (orphan)";
                        } else {
                            InterviewSession session = optSession.get();
                            if (session.getStatus() == SessionStatus.COMPLETED) {
                                Instant sessionTime = session.getCompletedAt() != null
                                        ? session.getCompletedAt()
                                        : session.getCreatedAt();
                                if (sessionTime != null && sessionTime.isBefore(cutoff)) {
                                    shouldDelete = true;
                                    deleteReason = String.format("Session %d COMPLETED at %s (> %d days ago)",
                                            sessionId, sessionTime, retentionDays);
                                }
                            }
                        }
                    }
                }

                if (shouldDelete) {
                    log.info("🗑️ Deleting attachment {} ({} bytes): {}", fileId, fileLength, deleteReason);
                    gridFsTemplate.delete(new Query(Criteria.where("_id").is(fileId)));
                    purgedCount++;
                    reclaimedBytes += fileLength;
                }
            }

            log.info("✅ Storage hygiene cycle complete: {} attachments deleted, {} KB reclaimed.",
                    purgedCount, reclaimedBytes / 1024);

        } catch (Exception e) {
            log.error("Failed during storage hygiene execution: {}", e.getMessage(), e);
        }

        return purgedCount;
    }
}
