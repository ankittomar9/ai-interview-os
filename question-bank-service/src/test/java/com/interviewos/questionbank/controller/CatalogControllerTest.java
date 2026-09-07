package com.interviewos.questionbank.controller;

import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.repository.QuestionRepository;
import com.interviewos.questionbank.service.CatalogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CatalogController.class)
@Import(CatalogService.class)
class CatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private QuestionRepository questionRepository;

    private QuestionDocument sampleDoc;

    @BeforeEach
    void setUp() {
        sampleDoc = QuestionDocument.builder()
                .slug("dsa-two-sum")
                .title("Two Sum")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("EASY")
                .topics(List.of("arrays", "hashing"))
                .estMinutes(15)
                .problemStatement("Find two numbers that add up to target.")
                .starterCode("class Solution {}")
                .solutionCode("public class Main {}")
                .status("PUBLISHED")
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/catalog/topics returns list of topics with counts")
    void testGetTopics() throws Exception {
        when(questionRepository.findByStatus("PUBLISHED")).thenReturn(List.of(sampleDoc));

        mockMvc.perform(get("/api/v1/catalog/topics?track=ALGORITHMS_DATA_STRUCTURES"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[?(@.id == 'arrays')].total").value(hasItem(1)));
    }

    @Test
    @DisplayName("VP4: GET /api/v1/catalog/questions?topic=arrays returns questions, topic=nonexistent returns 200 empty")
    void testGetQuestions_VP4Gate() throws Exception {
        when(questionRepository.findByStatus("PUBLISHED")).thenReturn(List.of(sampleDoc));

        // 1. Existing topic returns match
        mockMvc.perform(get("/api/v1/catalog/questions?topic=arrays"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].slug").value("dsa-two-sum"))
                .andExpect(jsonPath("$.content[0].topics", hasItem("arrays")));

        // 2. Unknown/nonexistent topic returns HTTP 200 with empty list, NOT 500
        mockMvc.perform(get("/api/v1/catalog/questions?topic=nonexistent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.content", empty()));
    }

    @Test
    @DisplayName("GET /api/v1/catalog/questions/{slug} hides solution by default and reveals on revealSolution=true")
    void testGetQuestionDetail_solutionMasking() throws Exception {
        when(questionRepository.findBySlug("dsa-two-sum")).thenReturn(Optional.of(sampleDoc));

        // Hidden by default
        mockMvc.perform(get("/api/v1/catalog/questions/dsa-two-sum"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("dsa-two-sum"))
                .andExpect(jsonPath("$.solutionCode").doesNotExist());

        // Revealed on demand
        mockMvc.perform(get("/api/v1/catalog/questions/dsa-two-sum?revealSolution=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.solutionCode").value("public class Main {}"));
    }
}
