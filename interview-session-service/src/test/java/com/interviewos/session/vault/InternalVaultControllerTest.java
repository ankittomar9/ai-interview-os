package com.interviewos.session.vault;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalVaultController.class)
class InternalVaultControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private VaultArchiveService vaultArchiveService;

    @Test
    @DisplayName("POST /api/v1/internal/sessions/{id}/vault/report-ready schedules async finalization and returns 200 OK")
    void testNotifyReportReady() throws Exception {
        Long sessionId = 1042L;

        mockMvc.perform(post("/api/v1/internal/sessions/{sessionId}/vault/report-ready", sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.status").value("PROCESSING"));

        verify(vaultArchiveService, times(1)).finalizeWithReportAsync(sessionId);
    }
}
