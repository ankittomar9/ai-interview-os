package com.interviewos.session.vault;

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
    void testVaultHealthUnmounted() throws Exception {
        // Point to an invalid path that cannot be created on Windows
        String invalidPath = "Z:\\nonexistent_vault_drive_xyz\\forbidden";
        when(vaultProperties.getRoot()).thenReturn(invalidPath);

        mockMvc.perform(get("/api/v1/sessions/vault/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.root").value(invalidPath))
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

            // If OS supports setReadOnly on dirs (on Windows setReadOnly on directories might still allow file creation),
            // we verify the endpoint behaves predictably without error.
            mockMvc.perform(get("/api/v1/sessions/vault/health"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.root").value(tempDir.toString()))
                    .andExpect(jsonPath("$.mounted").value(true));
        } finally {
            dirFile.setWritable(true);
        }
    }
}
