package com.interviewos.session.controller;

import com.interviewos.session.dto.*;
import com.interviewos.session.service.HistoryService;
import com.interviewos.session.service.HistoryValidationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HistoryController.class)
class HistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HistoryService historyService;

    @Test
    @DisplayName("H-07: 200 for a seeded calendar")
    void testGetCalendar_Success() throws Exception {
        HistoryStreakDto streak = new HistoryStreakDto(5, 10, true, "2026-10-14", 25, 42);
        HistoryCalendarResponse response = new HistoryCalendarResponse(
                "local",
                "Asia/Kolkata",
                "2025-10-15",
                "2026-10-14",
                List.of(new HistoryCalendarDayDto("2026-10-14", 3, 5, 2, 1)),
                streak,
                Instant.now()
        );

        when(historyService.getCalendar(eq("local"), eq("Asia/Kolkata"), any(), any()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/history/calendar")
                        .param("userId", "local")
                        .param("tz", "Asia/Kolkata")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", equalTo("local")))
                .andExpect(jsonPath("$.tz", equalTo("Asia/Kolkata")))
                .andExpect(jsonPath("$.streak.currentStreak", equalTo(5)))
                .andExpect(jsonPath("$.days[0].day", equalTo("2026-10-14")));
    }

    @Test
    @DisplayName("H-07: 400 + INVALID_DAY for 2026-13-40")
    void testGetCalendar_InvalidDay() throws Exception {
        when(historyService.getCalendar(any(), any(), eq("2026-13-40"), any()))
                .thenThrow(new HistoryValidationException("invalid from format: 2026-13-40", "INVALID_DAY"));

        mockMvc.perform(get("/api/v1/history/calendar")
                        .param("from", "2026-13-40")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("INVALID_DAY")));
    }

    @Test
    @DisplayName("H-07: 400 + INVALID_TZ for Mars/Olympus")
    void testGetCalendar_InvalidTz() throws Exception {
        when(historyService.getCalendar(any(), eq("Mars/Olympus"), any(), any()))
                .thenThrow(new HistoryValidationException("unknown timezone: Mars/Olympus", "INVALID_TZ"));

        mockMvc.perform(get("/api/v1/history/calendar")
                        .param("tz", "Mars/Olympus")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("INVALID_TZ")));
    }

    @Test
    @DisplayName("H-07: 400 + INVALID_RANGE when from > to")
    void testGetCalendar_InvalidRange() throws Exception {
        when(historyService.getCalendar(any(), any(), eq("2026-10-20"), eq("2026-10-10")))
                .thenThrow(new HistoryValidationException("from day must be <= to day", "INVALID_RANGE"));

        mockMvc.perform(get("/api/v1/history/calendar")
                        .param("from", "2026-10-20")
                        .param("to", "2026-10-10")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("INVALID_RANGE")));
    }

    @Test
    @DisplayName("GET /api/v1/history/day returns 200 with day detail and streak")
    void testGetDay_Success() throws Exception {
        HistoryStreakDto streak = new HistoryStreakDto(3, 7, true, "2026-10-14", 10, 15);
        HistoryDayItem item = new HistoryDayItem(
                "PRACTICE-1", "PRACTICE", "dsa-two-sum", null,
                "ALGORITHMS_DATA_STRUCTURES", "PASSED", "4/4 tests passed (10ms)",
                Instant.parse("2026-10-14T05:00:00Z"), HistoryLinkDto.practice("dsa-two-sum")
        );
        HistoryDayResponse response = new HistoryDayResponse(
                "local", "Asia/Kolkata", "2026-10-14", 1, 1, false, List.of(item), streak
        );

        when(historyService.getDay(eq("local"), eq("Asia/Kolkata"), eq("2026-10-14")))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/history/day")
                        .param("day", "2026-10-14")
                        .param("tz", "Asia/Kolkata")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.day", equalTo("2026-10-14")))
                .andExpect(jsonPath("$.solvedCount", equalTo(1)))
                .andExpect(jsonPath("$.items[0].id", equalTo("PRACTICE-1")));
    }

    @Test
    @DisplayName("GET /api/v1/history/day without day parameter returns 400 + INVALID_DAY")
    void testGetDay_MissingDayParam() throws Exception {
        mockMvc.perform(get("/api/v1/history/day")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", equalTo("INVALID_DAY")));
    }

    @Test
    @DisplayName("GET /api/v1/history/streak returns 200 with streak summary")
    void testGetStreak_Success() throws Exception {
        HistoryStreakDto streak = new HistoryStreakDto(5, 12, true, "2026-10-14", 45, 80);
        HistoryStreakResponse response = HistoryStreakResponse.from(streak, "Asia/Kolkata", Instant.now());

        when(historyService.getStreak(eq("local"), eq("Asia/Kolkata")))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/history/streak")
                        .param("tz", "Asia/Kolkata")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak", equalTo(5)))
                .andExpect(jsonPath("$.longestStreak", equalTo(12)))
                .andExpect(jsonPath("$.activeToday", equalTo(true)));
    }
}
