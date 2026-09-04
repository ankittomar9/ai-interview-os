package com.interviewos.session.controller;

import com.interviewos.session.service.SessionRecordingService;
import com.interviewos.session.service.SessionRecordingService.RecordingManifest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class SessionRecordingController {

    private final SessionRecordingService recordingService;

    @PostMapping(value = "/{id}/recordings/chunk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadChunk(
            @PathVariable Long id,
            @RequestParam("seq") int seq,
            @RequestParam(value = "kind", defaultValue = "camera") String kind,
            @RequestParam("chunk") MultipartFile chunk
    ) {
        if (!"camera".equals(kind) && !"screen".equals(kind)) {
            return ResponseEntity.badRequest().body(Map.of("error", "kind must be camera|screen"));
        }
        try {
            recordingService.saveChunk(id, seq, kind, chunk);
            return ResponseEntity.ok(Map.of(
                    "sessionId", id,
                    "seq", seq,
                    "kind", kind,
                    "receivedBytes", chunk.getSize(),
                    "status", "SAVED"
            ));
        } catch (Exception e) {
            log.error("Failed to store {} chunk {} for session {}: {}", kind, seq, id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/recordings/manifest")
    public ResponseEntity<RecordingManifest> getManifest(@PathVariable Long id) {
        RecordingManifest manifest = recordingService.getManifest(id);
        return ResponseEntity.ok(manifest);
    }

    @GetMapping("/{id}/recordings/stream")
    public ResponseEntity<StreamingResponseBody> streamRecording(
            @PathVariable Long id,
            @RequestParam(value = "kind", defaultValue = "camera") String kind
    ) {
        StreamingResponseBody responseBody = outputStream -> {
            try {
                recordingService.streamRecording(id, kind, outputStream);
            } catch (Exception e) {
                log.warn("Streaming {} recording notice for session {}: {}", kind, id, e.getMessage());
            }
        };

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "video/webm")
                .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(responseBody);
    }

    @GetMapping("/{id}/recordings/download")
    public ResponseEntity<byte[]> downloadRecording(
            @PathVariable Long id,
            @RequestParam(value = "kind", defaultValue = "camera") String kind
    ) {
        try {
            byte[] bytes = recordingService.getFullRecordingBytes(id, kind);
            if (bytes.length == 0) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, "video/webm")
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"session-" + id + "-" + kind + "-recording.webm\"")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Download failed for session {} kind {}: {}", id, kind, e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        log.error("Recording chunk exceeds size limit: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of(
                        "error", "Recording chunk exceeds 16MB limit",
                        "hint", "Reduce video quality or shorten chunk duration"
                ));
    }
}
