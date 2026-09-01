package com.interviewos.session.service;

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
    public static class RecordingManifest {
        private Long sessionId;
        private int totalChunks;
        private long totalBytes;
        private String format;
        private String startedAt;
        private String endedAt;
        private boolean isComplete;
    }

    public void saveChunk(Long sessionId, int seq, MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            log.warn("Received empty recording chunk for session {} seq {}", sessionId, seq);
            return;
        }

        String filename = String.format("rec_%d_chunk_%05d.webm", sessionId, seq);

        // Remove any previous attempt of the same chunk seq
        gridFsTemplate.delete(new Query(
                Criteria.where("metadata.sessionId").is(sessionId)
                        .and("metadata.type").is("RECORDING_CHUNK")
                        .and("metadata.seq").is(seq)
        ));

        Document meta = new Document();
        meta.put("sessionId", sessionId);
        meta.put("type", "RECORDING_CHUNK");
        meta.put("seq", seq);
        meta.put("size", file.getSize());
        meta.put("uploadedAt", Instant.now().toString());

        try (InputStream in = file.getInputStream()) {
            ObjectId id = gridFsTemplate.store(in, filename, "video/webm", meta);
            log.info("📹 Stored recording chunk {} for session {} ({} bytes, id: {})", seq, sessionId, file.getSize(), id);
        }
    }

    public List<GridFSFile> getSortedChunks(Long sessionId) {
        List<GridFSFile> chunkList = new ArrayList<>();
        GridFSFindIterable files = gridFSBucket.find(
                new Document("metadata.sessionId", sessionId)
                        .append("metadata.type", "RECORDING_CHUNK")
        );
        for (GridFSFile f : files) {
            chunkList.add(f);
        }

        chunkList.sort(Comparator.comparingInt(a -> {
            Document meta = a.getMetadata();
            return meta != null && meta.containsKey("seq") ? meta.getInteger("seq", 0) : 0;
        }));

        return chunkList;
    }

    public RecordingManifest getManifest(Long sessionId) {
        List<GridFSFile> chunks = getSortedChunks(sessionId);
        long totalBytes = chunks.stream().mapToLong(GridFSFile::getLength).sum();

        String startedAt = chunks.isEmpty() ? null : chunks.get(0).getUploadDate().toInstant().toString();
        String endedAt = chunks.isEmpty() ? null : chunks.get(chunks.size() - 1).getUploadDate().toInstant().toString();

        return RecordingManifest.builder()
                .sessionId(sessionId)
                .totalChunks(chunks.size())
                .totalBytes(totalBytes)
                .format("video/webm")
                .startedAt(startedAt)
                .endedAt(endedAt)
                .isComplete(!chunks.isEmpty())
                .build();
    }

    public void streamRecording(Long sessionId, OutputStream out) throws Exception {
        List<GridFSFile> chunks = getSortedChunks(sessionId);
        log.info("📹 Streaming recording for session {}: {} chunks found", sessionId, chunks.size());

        for (GridFSFile chunk : chunks) {
            gridFSBucket.downloadToStream(chunk.getObjectId(), out);
            out.flush();
        }
    }

    public byte[] getFullRecordingBytes(Long sessionId) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        streamRecording(sessionId, baos);
        return baos.toByteArray();
    }
}
