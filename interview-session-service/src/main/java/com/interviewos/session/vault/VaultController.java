package com.interviewos.session.vault;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

@Slf4j
@RestController
@RequestMapping("/api/v1/sessions/vault")
@RequiredArgsConstructor
public class VaultController {

    private final VaultProperties vaultProperties;

    @GetMapping("/health")
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

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VaultHealthResponse {
        private String root;
        private boolean mounted;
        private boolean writable;
    }
}
