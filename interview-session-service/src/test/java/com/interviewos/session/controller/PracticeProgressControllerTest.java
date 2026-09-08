package com.interviewos.session.controller;

import com.interviewos.session.dto.QuestionEncountersResponse;
import com.interviewos.session.service.PracticeTrackingService;
import com.interviewos.session.service.SessionQuestionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PracticeProgressController.class)
class PracticeProgressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private PracticeTrackingService practiceTrackingService;

    @MockitoBean
    private SessionQuestionService sessionQuestionService;

    @Test
    @DisplayName("GET /api/v1/practice/questions/{slug}/encounters returns 200 with encounter ledger")
    void testGetEncountersEndpoint() throws Exception {
        String slug = "dsa-lru-cache";
        QuestionEncountersResponse response = new QuestionEncountersResponse(
                slug,
                3,
                1,
                2,
                "Practice ×3 · Interview 1/2",
                List.of(
                        new QuestionEncountersResponse.EncounterItem(100L, "PASSED", Instant.now()),
                        new QuestionEncountersResponse.EncounterItem(99L, "FAILED", Instant.now())
                )
        );

        when(sessionQuestionService.getQuestionEncounters(eq(slug), eq("local")))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/practice/questions/{slug}/encounters", slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionSlug").value(slug))
                .andExpect(jsonPath("$.practiceSolveCount").value(3))
                .andExpect(jsonPath("$.interviewPassCount").value(1))
                .andExpect(jsonPath("$.interviewAttemptCount").value(2))
                .andExpect(jsonPath("$.pressureGap").value("Practice ×3 · Interview 1/2"))
                .andExpect(jsonPath("$.encounters.length()").value(2));
    }
}
