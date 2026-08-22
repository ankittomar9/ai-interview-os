package com.interviewos.session.controller;

import com.interviewos.session.dto.AttachmentResponse;
import com.interviewos.session.dto.CanvasJsonAttachmentRequest;
import com.mongodb.client.gridfs.model.GridFSFile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions/{sessionId}/attachments")
@RequiredArgsConstructor
public class AttachmentController {

    private static final long MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_KINDS = Set.of("CANVAS_PNG", "CANVAS_JSON");

    private final GridFsTemplate gridFsTemplate;

    /**
     * Upload binary attachment (e.g. CANVAS_PNG or JSON file) via multipart/form-data.
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMultipartAttachment(
            @PathVariable("sessionId") Long sessionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "kind", defaultValue = "CANVAS_PNG") String kind
    ) {
        String normalizedKind = kind != null ? kind.trim().toUpperCase() : "CANVAS_PNG";
        if (!ALLOWED_KINDS.contains(normalizedKind)) {
            return ResponseEntity.badRequest().body("Invalid kind: '" + kind + "'. Allowed kinds: " + ALLOWED_KINDS);
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Uploaded file cannot be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest().body("Attachment exceeds maximum allowed size of 5MB");
        }

        try {
            Document metadata = new Document();
            metadata.put("sessionId", sessionId);
            metadata.put("kind", normalizedKind);
            metadata.put("contentType", file.getContentType() != null ? file.getContentType() : "application/octet-stream");

            ObjectId objectId = gridFsTemplate.store(
                    file.getInputStream(),
                    file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment-" + normalizedKind.toLowerCase(),
                    file.getContentType(),
                    metadata
            );

            log.info("📎 Stored attachment {} (kind: {}, size: {} bytes) for session {}", objectId, normalizedKind, file.getSize(), sessionId);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AttachmentResponse(objectId.toHexString(), normalizedKind, file.getSize()));
        } catch (IOException e) {
            log.error("Failed to store multipart attachment for session {}: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to store attachment: " + e.getMessage());
        }
    }

    /**
     * Upload structured JSON canvas snapshot via application/json.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> uploadJsonAttachment(
            @PathVariable("sessionId") Long sessionId,
            @Valid @RequestBody CanvasJsonAttachmentRequest request
    ) {
        String normalizedKind = request.kind() != null ? request.kind().trim().toUpperCase() : "CANVAS_JSON";
        if (!ALLOWED_KINDS.contains(normalizedKind)) {
            return ResponseEntity.badRequest().body("Invalid kind: '" + request.kind() + "'. Allowed kinds: " + ALLOWED_KINDS);
        }

        byte[] bytes = request.canvasData().getBytes(StandardCharsets.UTF_8);
        if (bytes.length > MAX_FILE_SIZE_BYTES) {
            return ResponseEntity.badRequest().body("Attachment exceeds maximum allowed size of 5MB");
        }

        Document metadata = new Document();
        metadata.put("sessionId", sessionId);
        metadata.put("kind", normalizedKind);
        metadata.put("contentType", "application/json");

        ObjectId objectId = gridFsTemplate.store(
                new ByteArrayInputStream(bytes),
                "canvas-snapshot.json",
                "application/json",
                metadata
        );

        log.info("📎 Stored JSON attachment {} (kind: {}, size: {} bytes) for session {}", objectId, normalizedKind, bytes.length, sessionId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AttachmentResponse(objectId.toHexString(), normalizedKind, bytes.length));
    }

    /**
     * Download / Stream attachment bytes by attachment ID.
     */
    @GetMapping("/{attId}")
    public ResponseEntity<Resource> getAttachment(
            @PathVariable("sessionId") Long sessionId,
            @PathVariable("attId") String attId
    ) {
        ObjectId objectId;
        try {
            objectId = new ObjectId(attId);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid ObjectId format: {}", attId);
            return ResponseEntity.notFound().build();
        }

        GridFSFile gridFSFile = gridFsTemplate.findOne(
                new Query(Criteria.where("_id").is(objectId).and("metadata.sessionId").is(sessionId))
        );

        if (gridFSFile == null) {
            gridFSFile = gridFsTemplate.findOne(new Query(Criteria.where("_id").is(objectId)));
            if (gridFSFile == null) {
                return ResponseEntity.notFound().build();
            }
        }

        GridFsResource resource = gridFsTemplate.getResource(gridFSFile);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        if (gridFSFile.getMetadata() != null && gridFSFile.getMetadata().getString("contentType") != null) {
            contentType = gridFSFile.getMetadata().getString("contentType");
        }

        try {
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(gridFSFile.getLength())
                    .body(new InputStreamResource(resource.getInputStream()));
        } catch (IOException e) {
            log.error("Failed to stream attachment {}: {}", attId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
