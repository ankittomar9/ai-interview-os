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

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionRecordingService {

    private final GridFsTemplate gridFsTemplate;
    private final GridFSBucket gridFSBucket;
    private final InterviewSessionMongoRepository mongoSessionRepository;

    @Data
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class StreamMeta {
        private int chunks;
        private long bytes;
        private String startedAt;
        private String endedAt;
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
        private String startedAt;
        private String endedAt;
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
