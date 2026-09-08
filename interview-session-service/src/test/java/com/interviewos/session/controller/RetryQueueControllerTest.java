package com.interviewos.session.controller;

import com.interviewos.session.dto.RetryQueueItem;
import com.interviewos.session.service.RetryQueueService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RetryQueueController.class)
class RetryQueueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RetryQueueService retryQueueService;

    @Test
    @DisplayName("GET /api/v1/learn/retry returns 200 with list of retry items")
    void testGetRetryQueue() throws Exception {
        RetryQueueItem item1 = new RetryQueueItem(
                "dsa-lru-cache",
                "LRU Cache Implementation",
                "stacks-queues",
                "FAILED",
                1,
                Instant.parse("2026-09-08T18:40:00Z")
        );
        RetryQueueItem item2 = new RetryQueueItem(
                "trapping-rain-water",
                "Elevation Map Rainwater Retention",
                "two-pointers",
                "FAILED",
                1,
                Instant.parse("2026-09-08T18:30:00Z")
        );

        when(retryQueueService.getRetryQueue(eq("vp10-candidate")))
                .thenReturn(List.of(item1, item2));

        mockMvc.perform(get("/api/v1/learn/retry?userId=vp10-candidate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].slug").value("dsa-lru-cache"))
                .andExpect(jsonPath("$[0].lastVerdict").value("FAILED"))
                .andExpect(jsonPath("$[0].failCount").value(1))
                .andExpect(jsonPath("$[1].slug").value("trapping-rain-water"))
                .andExpect(jsonPath("$[1].lastVerdict").value("FAILED"));
    }

    @Test
    @DisplayName("Dual mapping: GET /api/v1/sessions/learn/retry returns 200")
    void testGetRetryQueueDualMapping() throws Exception {
        when(retryQueueService.getRetryQueue(eq("local")))
                .thenReturn(List.of());

        mockMvc.perform(get("/api/v1/sessions/learn/retry"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
