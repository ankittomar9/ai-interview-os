package com.interviewos.questionbank.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.dto.QuestionMatchRequest;
import com.interviewos.questionbank.dto.QuestionMatchResponse;
import com.interviewos.questionbank.dto.QuestionPublicView;
import com.interviewos.questionbank.repository.QuestionRepository;
import com.interviewos.questionbank.service.QuestionMatchService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuestionPublicController.class)
class QuestionPublicControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private QuestionRepository questionRepository;

    @MockBean
    private QuestionMatchService questionMatchService;

    @Test
    @DisplayName("GET /api/v1/questions/{slug} should return 200 OK and STRIP all hidden tests and notes")
    void testGetPublicQuestionStripsHiddenContent() throws Exception {
        QuestionDocument doc = QuestionDocument.builder()
                .slug("lru-cache")
                .title("LRU Cache Implementation")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("SENIOR")
                .status("PUBLISHED")
                .problemStatement("Implement LRU Cache")
                .hiddenTests(List.of(new QuestionDocument.HiddenTestCase("Hidden 1", "in", "out", 1)))
                .interviewerNotes(new QuestionDocument.InterviewerNotes(List.of("Concept"), List.of("Seed"), List.of("Checkpoint")))
                .coaching(new QuestionDocument.CoachingContent(List.of("Mistake"), "Outline", List.of("Tip")))
                .build();

        when(questionRepository.findBySlug(eq("lru-cache"))).thenReturn(Optional.of(doc));

        mockMvc.perform(get("/api/v1/questions/lru-cache"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("lru-cache"))
                .andExpect(jsonPath("$.title").value("LRU Cache Implementation"))
                .andExpect(jsonPath("$.hiddenTests").doesNotExist())
                .andExpect(jsonPath("$.hiddenTestFiles").doesNotExist())
                .andExpect(jsonPath("$.interviewerNotes").doesNotExist())
                .andExpect(jsonPath("$.coaching").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/v1/questions/match should return matched question with rationale")
    void testMatchQuestion() throws Exception {
        QuestionMatchRequest req = new QuestionMatchRequest(
                "ALGORITHMS_DATA_STRUCTURES",
                "SENIOR",
                List.of("java", "hashmap"),
                "Looking for a Senior Backend Engineer",
                null,
                null
        );

        QuestionPublicView publicView = QuestionPublicView.builder()
                .slug("lru-cache")
                .title("LRU Cache Implementation")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("SENIOR")
                .build();

        QuestionMatchResponse resp = QuestionMatchResponse.builder()
                .question(publicView)
                .rationale("Matched based on HashMap and Doubly Linked List skills")
                .llmAssisted(false)
                .build();

        when(questionMatchService.matchQuestion(any(QuestionMatchRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/v1/questions/match")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.question.slug").value("lru-cache"))
                .andExpect(jsonPath("$.llmAssisted").value(false))
                .andExpect(jsonPath("$.rationale").exists());
    }
}
