package com.interviewos.session.controller;

import com.interviewos.session.dto.DashboardStatsResponse;
import com.interviewos.session.service.DashboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DashboardController.class)
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @Test
    @DisplayName("GET /api/v1/dashboard/stats returns HTTP 200 with dashboard JSON structure")
    void testGetDashboardStatsEndpoint() throws Exception {
        DashboardStatsResponse mockStats = new DashboardStatsResponse(
                "local",
                Instant.now(),
                new DashboardStatsResponse.PracticeStats(4, 3, 1, 75.0, 4, 3, Map.of("DSA", 4L)),
                new DashboardStatsResponse.InterviewStats(1, 1, 2, 1, 1, 0, 2, 50.0),
                new DashboardStatsResponse.OverallStats(4, 6, 66.7, "Practice ×3 · Interview 1/2"),
                List.of()
        );

        when(dashboardService.getDashboardStats("local")).thenReturn(mockStats);

        mockMvc.perform(get("/api/v1/dashboard/stats?userId=local")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("local"))
                .andExpect(jsonPath("$.practice.totalAttempts").value(4))
                .andExpect(jsonPath("$.practice.passedAttempts").value(3))
                .andExpect(jsonPath("$.practice.failedAttempts").value(1))
                .andExpect(jsonPath("$.practice.successRate").value(75.0))
                .andExpect(jsonPath("$.interview.totalQuestions").value(2))
                .andExpect(jsonPath("$.interview.passedQuestions").value(1))
                .andExpect(jsonPath("$.interview.failedQuestions").value(1))
                .andExpect(jsonPath("$.interview.successRate").value(50.0))
                .andExpect(jsonPath("$.overall.totalSolved").value(4))
                .andExpect(jsonPath("$.overall.pressureGap").value("Practice ×3 · Interview 1/2"));
    }

    @Test
    @DisplayName("GET /api/v1/practice/dashboard returns HTTP 200 route compatibility")
    void testGetPracticeDashboardEndpoint() throws Exception {
        DashboardStatsResponse mockStats = new DashboardStatsResponse(
                "vp10-candidate",
                Instant.now(),
                new DashboardStatsResponse.PracticeStats(4, 3, 1, 75.0, 4, 3, Map.of()),
                new DashboardStatsResponse.InterviewStats(1, 1, 2, 1, 1, 0, 2, 50.0),
                new DashboardStatsResponse.OverallStats(4, 6, 66.7, "Practice ×3 · Interview 1/2"),
                List.of()
        );

        when(dashboardService.getDashboardStats("vp10-candidate")).thenReturn(mockStats);

        mockMvc.perform(get("/api/v1/practice/dashboard?userId=vp10-candidate")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("vp10-candidate"))
                .andExpect(jsonPath("$.practice.totalAttempts").value(4));
    }
}
