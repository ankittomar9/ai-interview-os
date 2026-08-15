package com.interviewos.proctor.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.proctor.dto.RecordTelemetryRequest;
import com.interviewos.proctor.dto.TelemetrySummaryResponse;
import com.interviewos.proctor.model.IntegrityRiskLevel;
import com.interviewos.proctor.model.TelemetryEventType;
import com.interviewos.proctor.service.ProctorSentinelService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProctorSentinelController.class)
class ProctorSentinelControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProctorSentinelService proctorService;

    @Test
    @DisplayName("POST /api/v1/proctor/events should return 201 CREATED")
    void testRecordEvent() throws Exception {
        RecordTelemetryRequest request = new RecordTelemetryRequest(
                1L,
                TelemetryEventType.TAB_BLUR,
                null,
                15L,
                "Candidate switched to external browser window"
        );

        TelemetrySummaryResponse.TelemetryEventResponse mockResponse = new TelemetrySummaryResponse.TelemetryEventResponse(
                1L,
                TelemetryEventType.TAB_BLUR,
                null,
                15L,
                "Candidate switched to external browser window",
                true,
                Instant.now()
        );

        when(proctorService.recordEvent(any(RecordTelemetryRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/proctor/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventType").value("TAB_BLUR"))
                .andExpect(jsonPath("$.isFlagged").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/proctor/session/{id}/summary should return integrity scorecard")
    void testGetSummary() throws Exception {
        TelemetrySummaryResponse summary = new TelemetrySummaryResponse(
                1L,
                95,
                IntegrityRiskLevel.CLEAN,
                "High Integrity: Natural interview observed.",
                1L,
                1,
                0,
                0,
                List.of(),
                List.of()
        );

        when(proctorService.getSessionSummary(1L)).thenReturn(summary);

        mockMvc.perform(get("/api/v1/proctor/session/1/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.integrityScore").value(95))
                .andExpect(jsonPath("$.riskLevel").value("CLEAN"));
    }
}