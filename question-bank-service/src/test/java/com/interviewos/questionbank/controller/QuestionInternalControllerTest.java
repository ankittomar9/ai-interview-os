package com.interviewos.questionbank.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.dto.QuestionFullView;
import com.interviewos.questionbank.repository.QuestionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(QuestionInternalController.class)
class QuestionInternalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private QuestionRepository questionRepository;

    @Test
    @DisplayName("GET /internal/v1/questions/{slug}/full should return 200 OK with hidden tests and notes")
    void testGetFullQuestionView() throws Exception {
        QuestionDocument doc = QuestionDocument.builder()
                .slug("lld-order-service")
                .title("Spring Boot Order Management Microservice")
                .track("SPRING_LLD")
                .difficulty("MID")
                .buildProfile("maven-spring")
                .hiddenTestFiles(Map.of("src/test/java/OrderServiceTest.java", "public class OrderServiceTest {}"))
                .interviewerNotes(new QuestionDocument.InterviewerNotes(
                        List.of("JPA"),
                        List.of("Why return DTO?"),
                        List.of("Check validation")
                ))
                .coaching(new QuestionDocument.CoachingContent(
                        List.of("Exposing entities"),
                        "Outline",
                        List.of("Discuss transactions")
                ))
                .build();

        when(questionRepository.findBySlug(eq("lld-order-service"))).thenReturn(Optional.of(doc));

        mockMvc.perform(get("/internal/v1/questions/lld-order-service/full"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug").value("lld-order-service"))
                .andExpect(jsonPath("$.hiddenTestFiles['src/test/java/OrderServiceTest.java']").exists())
                .andExpect(jsonPath("$.interviewerNotes.followUpSeeds[0]").value("Why return DTO?"))
                .andExpect(jsonPath("$.coaching.presentationTips[0]").value("Discuss transactions"));
    }

    @Test
    @DisplayName("POST /internal/v1/questions/import should import questions idempotently")
    void testImportQuestions() throws Exception {
        QuestionFullView view = QuestionFullView.builder()
                .slug("custom-problem")
                .title("Custom Problem")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("JUNIOR")
                .build();

        when(questionRepository.findBySlug(eq("custom-problem"))).thenReturn(Optional.empty());
        when(questionRepository.save(any(QuestionDocument.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(post("/internal/v1/questions/import")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(view))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.importedCount").value(1));
    }
}
