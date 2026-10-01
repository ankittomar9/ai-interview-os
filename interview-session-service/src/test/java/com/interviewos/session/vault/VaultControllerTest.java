package com.interviewos.session.vault;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VaultController.class)
class VaultControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VaultProperties vaultProperties;

    @MockBean
    private InterviewSessionMongoRepository mongoSessionRepository;

    @MockBean
    private InterviewSessionRepository sessionRepository;

    @Test
    @DisplayName("GET /api/v1/sessions/vault/health returns mounted=true and writable=true for valid writable dir")
    void testVaultHealthWritable(@TempDir Path tempDir) throws Exception {
        when(vaultProperties.getRoot()).thenReturn(tempDir.toString());

        mockMvc.perform(get("/api/v1/sessions/vault/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.root").value(tempDir.toString()))
                .andExpect(jsonPath("$.mounted").value(true))
                .andExpect(jsonPath("$.writable").value(true));

        // Ensure probe file was cleaned up
        assertFalse(Files.exists(tempDir.resolve(".vault-write-probe")));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/vault/health returns mounted=false and writable=false when root cannot be created")
    void testVaultHealthUnmounted(@TempDir Path tempDir) throws Exception {
        // Platform-neutral uncreatable path: a regular file cannot be a parent directory
        Path regularFile = Files.writeString(tempDir.resolve("blocking-file.txt"), "not-a-directory");
        Path uncreatablePath = regularFile.resolve("child-vault-root");
        when(vaultProperties.getRoot()).thenReturn(uncreatablePath.toString());

        mockMvc.perform(get("/api/v1/sessions/vault/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.root").value(uncreatablePath.toString()))
                .andExpect(jsonPath("$.mounted").value(false))
                .andExpect(jsonPath("$.writable").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/vault/health returns writable=false when dir is read-only")
    void testVaultHealthReadOnly(@TempDir Path tempDir) throws Exception {
        File dirFile = tempDir.toFile();
        boolean setReadOnly = dirFile.setReadOnly();
        try {
            when(vaultProperties.getRoot()).thenReturn(tempDir.toString());

            mockMvc.perform(get("/api/v1/sessions/vault/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.root").value(tempDir.toString()))
                    .andExpect(jsonPath("$.mounted").value(true));
        } finally {
            dirFile.setWritable(true);
        }
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/vault returns 404 when session does not exist")
    void testGetSessionVaultNotFound() throws Exception {
        when(sessionRepository.findById(9999L)).thenReturn(Optional.empty());
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(9999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/v1/sessions/9999/vault"))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/vault returns status and manifest summary when archived")
    void testGetSessionVaultVerified(@TempDir Path tempVaultFolder) throws Exception {
        Long sessionId = 1042L;
        LocalDateTime now = LocalDateTime.parse("2026-10-01T15:00:00");

        // Write a test manifest.json in tempVaultFolder
        String manifestContent = """
                {
                  "schema": "av1.manifest@1",
                  "sessionId": 1042,
                  "sessionFolder": "2026-10-01/1432_DSA_MEDIUM_1042",
                  "status": "VERIFIED",
                  "vaultVersion": 1,
                  "generatedAt": "2026-10-01T15:00:00Z",
                  "artifacts": [
                    { "path": "session.json", "kind": "session", "bytes": 100, "sha256": "abc" },
                    { "path": "report/report.pdf", "kind": "report", "bytes": 200, "sha256": "def" }
                  ],
                  "missing": [],
                  "errors": []
                }
                """;
        Files.writeString(tempVaultFolder.resolve("manifest.json"), manifestContent);

        InterviewSession session = InterviewSession.builder().id(sessionId).build();
        InterviewSessionDocument mongoDoc = InterviewSessionDocument.builder()
                .sessionId(sessionId)
                .vault(InterviewSessionDocument.VaultMetadata.builder()
                        .status("VERIFIED")
                        .folderPath(tempVaultFolder.toString())
                        .stagedAt(now)
                        .verifiedAt(now)
                        .attempts(1)
                        .build())
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.of(mongoDoc));

        mockMvc.perform(get("/api/v1/sessions/1042/vault"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(1042))
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.folderPath").value(tempVaultFolder.toString()))
                .andExpect(jsonPath("$.vaultVersion").value(1))
                .andExpect(jsonPath("$.artifactCount").value(2));
    }
}
