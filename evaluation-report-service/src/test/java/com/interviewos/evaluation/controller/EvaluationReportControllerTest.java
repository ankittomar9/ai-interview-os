package com.interviewos.evaluation.controller;

import com.interviewos.evaluation.dto.DiagnosticReportResponse;
import com.interviewos.evaluation.model.HiringVerdict;
import com.interviewos.evaluation.service.EvaluationReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EvaluationReportController.class)
class EvaluationReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EvaluationReportService reportService;

    @MockBean
    private com.interviewos.evaluation.service.ProgressLedgerService progressLedgerService;

    @Test
    @DisplayName("POST /api/v1/reports/generate/{sessionId} should return 201 CREATED")
    void testGenerateReport() throws Exception {
        DiagnosticReportResponse.ScorecardBreakdown scorecard = new DiagnosticReportResponse.ScorecardBreakdown(85, 80, 90, 85, 95, 80);
        DiagnosticReportResponse mockReport = new DiagnosticReportResponse(
                1L, 1L, "candidate-123", "Senior Java Engineer", "JAVA_SPRING_BOOT", "SENIOR",
                HiringVerdict.STRONG_HIRE, 87, scorecard,
                "Strong candidate with deep concurrency knowledge.",
                List.of("Solid problem solving"), List.of("Minor syntax details"),
                List.of("Day 1: Concurrency drills"), List.of(), true, 80, Instant.now()
        );

        when(reportService.generateReport(1L)).thenReturn(mockReport);

        mockMvc.perform(post("/api/v1/reports/generate/1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.reportId").value(1))
                .andExpect(jsonPath("$.verdict").value("STRONG_HIRE"))
                .andExpect(jsonPath("$.overallScore").value(87));
    }
}