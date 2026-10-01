package com.interviewos.session.vault;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VaultStatusService {

    private final InterviewSessionMongoRepository mongoSessionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .enable(SerializationFeature.INDENT_OUTPUT)
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    public void markStaged(Long sessionId, String folderPath, Path sessionDir) {
        LocalDateTime now = LocalDateTime.now();
        updateMongoStatus(sessionId, doc -> {
            InterviewSessionDocument.VaultMetadata meta = doc.getVault();
            if (meta == null) {
                meta = new InterviewSessionDocument.VaultMetadata();
                meta.setAttempts(1);
            } else {
                meta.setAttempts(meta.getAttempts() != null ? meta.getAttempts() + 1 : 1);
            }
            meta.setStatus("STAGED");
            meta.setFolderPath(folderPath);
            meta.setStagedAt(now);
            meta.setLastError(null);
            doc.setVault(meta);
        });

        writeStatusSidecar(sessionDir, VaultStatusPayload.builder()
                .schema("av1.status@1")
                .sessionId(sessionId)
                .status("STAGED")
                .stagedAt(Instant.now().toString())
                .attempts(1)
                .build());
    }

    public void markVerified(Long sessionId, Path sessionDir) {
        LocalDateTime now = LocalDateTime.now();
        updateMongoStatus(sessionId, doc -> {
            InterviewSessionDocument.VaultMetadata meta = doc.getVault();
            if (meta == null) {
                meta = new InterviewSessionDocument.VaultMetadata();
            }
            meta.setStatus("VERIFIED");
            meta.setVerifiedAt(now);
            meta.setLastError(null);
            doc.setVault(meta);
        });

        writeStatusSidecar(sessionDir, VaultStatusPayload.builder()
                .schema("av1.status@1")
                .sessionId(sessionId)
                .status("VERIFIED")
                .verifiedAt(Instant.now().toString())
                .build());
    }

    public void markPartial(Long sessionId, Path sessionDir, String reason) {
        updateMongoStatus(sessionId, doc -> {
            InterviewSessionDocument.VaultMetadata meta = doc.getVault();
            if (meta == null) {
                meta = new InterviewSessionDocument.VaultMetadata();
            }
            meta.setStatus("PARTIAL");
            meta.setLastError(reason);
            doc.setVault(meta);
        });

        writeStatusSidecar(sessionDir, VaultStatusPayload.builder()
                .schema("av1.status@1")
                .sessionId(sessionId)
                .status("PARTIAL")
                .lastError(reason)
                .build());
    }

    public void markAborted(Long sessionId, String folderPath, Path sessionDir) {
        updateMongoStatus(sessionId, doc -> {
            InterviewSessionDocument.VaultMetadata meta = doc.getVault();
            if (meta == null) {
                meta = new InterviewSessionDocument.VaultMetadata();
            }
            meta.setStatus("ABORTED");
            meta.setFolderPath(folderPath);
            meta.setStagedAt(LocalDateTime.now());
            doc.setVault(meta);
        });

        writeStatusSidecar(sessionDir, VaultStatusPayload.builder()
                .schema("av1.status@1")
                .sessionId(sessionId)
                .status("ABORTED")
                .stagedAt(Instant.now().toString())
                .build());
    }

    public void markFailed(Long sessionId, String errorMessage) {
        markFailed(sessionId, null, errorMessage);
    }

    public void markFailed(Long sessionId, Path sessionDir, String errorMessage) {
        updateMongoStatus(sessionId, doc -> {
            InterviewSessionDocument.VaultMetadata meta = doc.getVault();
            if (meta == null) {
                meta = new InterviewSessionDocument.VaultMetadata();
                meta.setAttempts(1);
            } else {
                meta.setAttempts(meta.getAttempts() != null ? meta.getAttempts() + 1 : 1);
            }
            meta.setStatus("FAILED");
            meta.setLastError(errorMessage);
            doc.setVault(meta);
        });

        if (sessionDir != null && Files.exists(sessionDir)) {
            writeStatusSidecar(sessionDir, VaultStatusPayload.builder()
                    .schema("av1.status@1")
                    .sessionId(sessionId)
                    .status("FAILED")
                    .lastError(errorMessage)
                    .build());
        }
    }

    public Optional<InterviewSessionDocument.VaultMetadata> getVaultMetadata(Long sessionId) {
        return mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .map(InterviewSessionDocument::getVault);
    }

    private void updateMongoStatus(Long sessionId, java.util.function.Consumer<InterviewSessionDocument> updater) {
        try {
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                updater.accept(doc);
                mongoSessionRepository.save(doc);
            });
        } catch (Exception e) {
            log.warn("Could not update MongoDB vault metadata for session {}: {}", sessionId, e.getMessage());
        }
    }

    private void writeStatusSidecar(Path sessionDir, VaultStatusPayload payload) {
        if (sessionDir == null || !Files.exists(sessionDir)) {
            return;
        }
        Path target = sessionDir.resolve("vault-status.json");
        Path part = sessionDir.resolve("vault-status.json.part");
        try {
            byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(payload);
            Files.write(part, bytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
            try {
                Files.move(part, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(part, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception e) {
            log.warn("Failed to write vault-status.json sidecar to {}: {}", target, e.getMessage());
        }
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VaultStatusPayload {
        private String schema;
        private Long sessionId;
        private String status;
        private String stagedAt;
        private String verifiedAt;
        private Integer attempts;
        private String lastError;
    }
}
