package com.interviewos.session.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.mongodb.client.gridfs.GridFSBucket;
import com.mongodb.client.gridfs.GridFSFindIterable;
import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
public class SessionRecordingService {

    private final GridFsTemplate gridFsTemplate;
    private final GridFSBucket gridFSBucket;
    private final InterviewSessionMongoRepository mongoSessionRepository;
    private final MeterRegistry meterRegistry;

    @org.springframework.beans.factory.annotation.Autowired
    public SessionRecordingService(
            GridFsTemplate gridFsTemplate,
            GridFSBucket gridFSBucket,
            InterviewSessionMongoRepository mongoSessionRepository,
            ObjectProvider<MeterRegistry> meterRegistryProvider
    ) {
        this.gridFsTemplate = gridFsTemplate;
        this.gridFSBucket = gridFSBucket;
        this.mongoSessionRepository = mongoSessionRepository;
        this.meterRegistry = meterRegistryProvider != null ? meterRegistryProvider.getIfAvailable() : null;
    }

    public SessionRecordingService(
            GridFsTemplate gridFsTemplate,
            GridFSBucket gridFSBucket,
            InterviewSessionMongoRepository mongoSessionRepository
    ) {
        this(gridFsTemplate, gridFSBucket, mongoSessionRepository, null);
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class DroppedChunkInfo {
        private int seq;
        private String kind;
        private String reason;
        private String timestamp;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RecordingSummaryInfo {
        private String kind;
        private int attempted;
        private int uploaded;
        private List<Integer> failedSeqs;
        private String codec;
        private Integer width;
        private Integer height;
        private Integer bitrateBps;
        private String qualityPreset;
        private String reportedAt;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StreamMeta {
        private int chunks;
        private long bytes;
        private String startedAt;
        private String endedAt;
        private RecordingSummaryInfo summary;
    }

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RecordingManifest {
        private Long sessionId;
        private String format;
        private boolean isComplete;
        private Map<String, StreamMeta> streams;
        private Integer totalChunks;
        private Long totalBytes;
        private List<DroppedChunkInfo> droppedChunks;
        private String startedAt;
        private String endedAt;
        private String note;
    }

    public void saveChunk(Long sessionId, int seq, String kind, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            log.warn("Received empty recording chunk for session {} seq {} kind {}", sessionId, seq, kind);
            return;
        }

        String safeKind = (kind != null && "screen".equalsIgnoreCase(kind)) ? "screen" : "camera";
        String filename = String.format("rec_%d_%s_chunk_%05d.webm", sessionId, safeKind, seq);

        // Remove any previous attempt of the same chunk seq and kind
        gridFsTemplate.delete(new Query(
                Criteria.where("metadata.sessionId").is(sessionId)
                        .and("metadata.type").is("RECORDING_CHUNK")
                        .and("metadata.kind").is(safeKind)
                        .and("metadata.seq").is(seq)
        ));

        Document meta = new Document();
        meta.put("sessionId", sessionId);
        meta.put("type", "RECORDING_CHUNK");
        meta.put("kind", safeKind);
        meta.put("seq", seq);
        meta.put("size", file.getSize());
        meta.put("uploadedAt", Instant.now().toString());

        try (InputStream in = file.getInputStream()) {
            ObjectId id = gridFsTemplate.store(in, filename, "video/webm", meta);
            log.info("📹 Stored {} recording chunk {} for session {} ({} bytes, id: {})", safeKind, seq, sessionId, file.getSize(), id);
        }
    }

    public void saveChunk(Long sessionId, int seq, MultipartFile file) throws Exception {
        saveChunk(sessionId, seq, "camera", file);
    }

    public List<GridFSFile> getSortedChunks(Long sessionId, String kind) {
        String targetKind = (kind != null && "screen".equalsIgnoreCase(kind)) ? "screen" : "camera";
        List<GridFSFile> chunkList = new ArrayList<>();
        GridFSFindIterable files = gridFSBucket.find(
                new Document("metadata.sessionId", sessionId)
                        .append("metadata.type", "RECORDING_CHUNK")
        );
        for (GridFSFile f : files) {
            Document meta = f.getMetadata();
            String chunkKind = (meta != null && meta.containsKey("kind")) ? meta.getString("kind") : "camera";
            if (targetKind.equalsIgnoreCase(chunkKind)) {
                chunkList.add(f);
            }
        }

        chunkList.sort(Comparator.comparingInt(a -> {
            Document meta = a.getMetadata();
            return meta != null && meta.containsKey("seq") ? meta.getInteger("seq", 0) : 0;
        }));

        return chunkList;
    }

    public List<GridFSFile> getSortedChunks(Long sessionId) {
        return getSortedChunks(sessionId, "camera");
    }

    public void recordDroppedChunk(Long sessionId, int seq, String kind, String reason) {
        String safeKind = (kind != null && "screen".equalsIgnoreCase(kind)) ? "screen" : "camera";
        String safeReason = (reason != null && !reason.isBlank()) ? reason : "PAYLOAD_TOO_LARGE_413";
        log.warn("⚠️ Recording dropped chunk: session={}, seq={}, kind={}, reason={}", sessionId, seq, safeKind, safeReason);

        if (meterRegistry != null) {
            try {
                Counter.builder("recording_chunk_dropped_total")
                        .tag("kind", safeKind)
                        .tag("reason", safeReason)
                        .description("Total number of dropped recording chunks")
                        .register(meterRegistry)
                        .increment();
            } catch (Exception e) {
                log.debug("Metric registration failed: {}", e.getMessage());
            }
        }

        if (sessionId != null) {
            try {
                Document meta = new Document();
                meta.put("sessionId", sessionId);
                meta.put("type", "RECORDING_DROPPED_CHUNK");
                meta.put("kind", safeKind);
                meta.put("seq", seq);
                meta.put("reason", safeReason);
                meta.put("droppedAt", Instant.now().toString());

                gridFsTemplate.store(new java.io.ByteArrayInputStream(new byte[0]),
                        String.format("dropped_%d_%s_chunk_%05d.json", sessionId, safeKind, seq),
                        "application/json", meta);
            } catch (Exception e) {
                log.warn("Failed to store dropped chunk record in GridFS: {}", e.getMessage());
            }
        }
    }

    public void saveSummary(Long sessionId, RecordingSummaryInfo summary) {
        if (summary == null || sessionId == null) return;
        String safeKind = (summary.getKind() != null && "screen".equalsIgnoreCase(summary.getKind())) ? "screen" : "camera";
        gridFsTemplate.delete(new Query(
                Criteria.where("metadata.sessionId").is(sessionId)
                        .and("metadata.type").is("RECORDING_SUMMARY")
                        .and("metadata.kind").is(safeKind)
        ));
        Document meta = new Document();
        meta.put("sessionId", sessionId);
        meta.put("type", "RECORDING_SUMMARY");
        meta.put("kind", safeKind);
        meta.put("attempted", summary.getAttempted());
        meta.put("uploaded", summary.getUploaded());
        meta.put("failedSeqs", summary.getFailedSeqs() != null ? summary.getFailedSeqs() : Collections.emptyList());
        meta.put("codec", summary.getCodec());
        meta.put("width", summary.getWidth());
        meta.put("height", summary.getHeight());
        meta.put("bitrateBps", summary.getBitrateBps());
        meta.put("qualityPreset", summary.getQualityPreset());
        meta.put("reportedAt", Instant.now().toString());

        gridFsTemplate.store(new java.io.ByteArrayInputStream(new byte[0]),
                String.format("summary_%d_%s.json", sessionId, safeKind),
                "application/json", meta);
        log.info("📊 Stored recordings/summary for session {} kind {}: preset={}, attempted={}, uploaded={}",
                sessionId, safeKind, summary.getQualityPreset(), summary.getAttempted(), summary.getUploaded());
    }

    public RecordingManifest getManifest(Long sessionId) {
        List<GridFSFile> cameraChunks = getSortedChunks(sessionId, "camera");
        List<GridFSFile> screenChunks = getSortedChunks(sessionId, "screen");

        Map<String, StreamMeta> streams = new LinkedHashMap<>();

        if (!cameraChunks.isEmpty()) {
            long bytes = cameraChunks.stream().mapToLong(GridFSFile::getLength).sum();
            String startedAt = cameraChunks.get(0).getUploadDate().toInstant().toString();
            String endedAt = cameraChunks.get(cameraChunks.size() - 1).getUploadDate().toInstant().toString();
            streams.put("camera", StreamMeta.builder()
                    .chunks(cameraChunks.size())
                    .bytes(bytes)
                    .startedAt(startedAt)
                    .endedAt(endedAt)
                    .build());
        }

        if (!screenChunks.isEmpty()) {
            long bytes = screenChunks.stream().mapToLong(GridFSFile::getLength).sum();
            String startedAt = screenChunks.get(0).getUploadDate().toInstant().toString();
            String endedAt = screenChunks.get(screenChunks.size() - 1).getUploadDate().toInstant().toString();
            streams.put("screen", StreamMeta.builder()
                    .chunks(screenChunks.size())
                    .bytes(bytes)
                    .startedAt(startedAt)
                    .endedAt(endedAt)
                    .build());
        }

        try {
            GridFSFindIterable summaryFiles = gridFSBucket.find(
                    new Document("metadata.sessionId", sessionId)
                            .append("metadata.type", "RECORDING_SUMMARY")
            );
            for (GridFSFile f : summaryFiles) {
                Document meta = f.getMetadata();
                if (meta != null) {
                    String k = meta.getString("kind");
                    @SuppressWarnings("unchecked")
                    List<Integer> failed = (List<Integer>) meta.get("failedSeqs");
                    RecordingSummaryInfo s = RecordingSummaryInfo.builder()
                            .kind(k)
                            .attempted(meta.getInteger("attempted", 0))
                            .uploaded(meta.getInteger("uploaded", 0))
                            .failedSeqs(failed != null ? failed : Collections.emptyList())
                            .codec(meta.getString("codec"))
                            .width(meta.getInteger("width"))
                            .height(meta.getInteger("height"))
                            .bitrateBps(meta.getInteger("bitrateBps"))
                            .qualityPreset(meta.getString("qualityPreset"))
                            .reportedAt(meta.getString("reportedAt"))
                            .build();
                    if (streams.containsKey(k)) {
                        streams.get(k).setSummary(s);
                    } else {
                        streams.put(k, StreamMeta.builder()
                                .chunks(0)
                                .bytes(0L)
                                .summary(s)
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not query recording summaries for session {}: {}", sessionId, e.getMessage());
        }

        List<DroppedChunkInfo> droppedChunks = new ArrayList<>();
        try {
            GridFSFindIterable droppedFiles = gridFSBucket.find(
                    new Document("metadata.sessionId", sessionId)
                            .append("metadata.type", "RECORDING_DROPPED_CHUNK")
            );
            for (GridFSFile f : droppedFiles) {
                Document meta = f.getMetadata();
                if (meta != null) {
                    droppedChunks.add(DroppedChunkInfo.builder()
                            .seq(meta.getInteger("seq", 0))
                            .kind(meta.getString("kind"))
                            .reason(meta.getString("reason"))
                            .timestamp(meta.getString("droppedAt"))
                            .build());
                }
            }
        } catch (Exception e) {
            log.warn("Could not query dropped chunks for session {}: {}", sessionId, e.getMessage());
        }

        boolean isComplete = !streams.isEmpty();
        int totalChunks = cameraChunks.size() + screenChunks.size();
        long totalBytes = streams.values().stream().mapToLong(StreamMeta::getBytes).sum();

        return RecordingManifest.builder()
                .sessionId(sessionId)
                .format("video/webm")
                .isComplete(isComplete)
                .streams(streams.isEmpty() ? null : streams)
                .totalChunks(totalChunks)
                .totalBytes(totalBytes)
                .droppedChunks(droppedChunks.isEmpty() ? null : droppedChunks)
                .note("Stream timestamps are upload-time")
                .build();
    }

    public void streamRecording(Long sessionId, String kind, OutputStream out) throws Exception {
        List<GridFSFile> chunks = getSortedChunks(sessionId, kind);
        log.info("📹 Streaming {} recording for session {}: {} chunks found", kind, sessionId, chunks.size());

        for (GridFSFile chunk : chunks) {
            gridFSBucket.downloadToStream(chunk.getObjectId(), out);
            out.flush();
        }
    }

    public void streamRecording(Long sessionId, OutputStream out) throws Exception {
        streamRecording(sessionId, "camera", out);
    }

    public byte[] getFullRecordingBytes(Long sessionId, String kind) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        streamRecording(sessionId, kind, baos);
        return baos.toByteArray();
    }

    public byte[] getFullRecordingBytes(Long sessionId) throws Exception {
        return getFullRecordingBytes(sessionId, "camera");
    }
}
