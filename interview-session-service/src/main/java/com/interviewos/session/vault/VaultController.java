package com.interviewos.session.vault;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
public class VaultController {

    private final VaultProperties vaultProperties;
    private final InterviewSessionMongoRepository mongoSessionRepository;
    private final InterviewSessionRepository sessionRepository;
    private final ObjectMapper objectMapper;

    @GetMapping("/vault/health")
    public ResponseEntity<VaultHealthResponse> getVaultHealth() {
        String root = vaultProperties.getRoot();
        Path rootPath = Paths.get(root);
        boolean mounted = Files.exists(rootPath) && Files.isDirectory(rootPath);
        if (!mounted) {
            try {
                Files.createDirectories(rootPath);
                mounted = Files.exists(rootPath) && Files.isDirectory(rootPath);
            } catch (Exception e) {
                log.debug("Vault root directory {} does not exist and could not be created: {}", rootPath, e.getMessage());
            }
        }

        boolean writable = false;
        if (mounted) {
            Path probePath = rootPath.resolve(".vault-write-probe");
            try {
                Files.writeString(probePath, "probe", StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING, StandardOpenOption.WRITE);
                Files.deleteIfExists(probePath);
                writable = true;
            } catch (Exception e) {
                log.warn("Vault health probe write failed at {}: {}", probePath, e.getMessage());
                writable = false;
            }
        }

        return ResponseEntity.ok(VaultHealthResponse.builder()
                .root(root)
                .mounted(mounted)
                .writable(writable)
                .build());
    }

    @GetMapping("/{id}/vault")
    public ResponseEntity<SessionVaultResponse> getSessionVault(@PathVariable("id") Long id) {
        Optional<InterviewSession> pgSession = sessionRepository.findById(id);
        Optional<InterviewSessionDocument> mongoDoc = mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(id);

        if (pgSession.isEmpty() && mongoDoc.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        InterviewSessionDocument.VaultMetadata vaultMeta = mongoDoc
                .map(InterviewSessionDocument::getVault)
                .orElse(null);

        String status = vaultMeta != null ? vaultMeta.getStatus() : "UNARCHIVED";
        String folderPath = vaultMeta != null ? vaultMeta.getFolderPath() : null;
        LocalDateTime stagedAt = vaultMeta != null ? vaultMeta.getStagedAt() : null;
        LocalDateTime verifiedAt = vaultMeta != null ? vaultMeta.getVerifiedAt() : null;
        Integer attempts = vaultMeta != null ? vaultMeta.getAttempts() : 0;
        String lastError = vaultMeta != null ? vaultMeta.getLastError() : null;

        Integer vaultVersion = null;
        Integer artifactCount = null;
        List<String> missing = Collections.emptyList();
        List<String> errors = Collections.emptyList();

        if (folderPath != null) {
            try {
                Path manifestPath = Paths.get(folderPath, "manifest.json");
                if (Files.exists(manifestPath)) {
                    VaultArchiveService.ManifestPayload manifest = objectMapper.readValue(
                            manifestPath.toFile(),
                            VaultArchiveService.ManifestPayload.class
                    );
                    vaultVersion = manifest.getVaultVersion();
                    artifactCount = manifest.getArtifacts() != null ? manifest.getArtifacts().size() : 0;
                    missing = manifest.getMissing() != null ? manifest.getMissing() : Collections.emptyList();
                    errors = manifest.getErrors() != null ? manifest.getErrors() : Collections.emptyList();
                }
            } catch (Exception e) {
                log.debug("Could not read manifest.json from {}: {}", folderPath, e.getMessage());
            }
        }

        SessionVaultResponse response = SessionVaultResponse.builder()
                .sessionId(id)
                .status(status)
                .folderPath(folderPath)
                .stagedAt(stagedAt)
                .verifiedAt(verifiedAt)
                .attempts(attempts)
                .lastError(lastError)
                .vaultVersion(vaultVersion)
                .artifactCount(artifactCount)
                .missing(missing)
                .errors(errors)
                .build();

        return ResponseEntity.ok(response);
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VaultHealthResponse {
        private String root;
        private boolean mounted;
        private boolean writable;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SessionVaultResponse {
        private Long sessionId;
        private String status;
        private String folderPath;
        private LocalDateTime stagedAt;
        private LocalDateTime verifiedAt;
        private Integer attempts;
        private String lastError;
        private Integer vaultVersion;
        private Integer artifactCount;
        private List<String> missing;
        private List<String> errors;
    }
}
