package com.interviewos.session.vault;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/internal/sessions")
@RequiredArgsConstructor
public class InternalVaultController {

    private final VaultArchiveService vaultArchiveService;

    @PostMapping("/{sessionId}/vault/report-ready")
    public ResponseEntity<Map<String, Object>> notifyReportReady(@PathVariable Long sessionId) {
        log.info("Received internal vault report-ready callback for session: {}", sessionId);
        vaultArchiveService.finalizeWithReportAsync(sessionId);
        return ResponseEntity.ok(Map.of(
                "sessionId", sessionId,
                "status", "PROCESSING",
                "message", "Vault finalization with evaluation report scheduled"
        ));
    }
}
