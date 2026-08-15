package com.interviewos.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.dto.GenerateQuestionRequest;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import com.interviewos.ai.model.DifficultyLevel;
import com.interviewos.ai.model.InterviewTrack;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.service.AiOrchestratorService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AiOrchestratorController.class)
class AiOrchestratorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AiOrchestratorService orchestratorService;

    @Test
    @DisplayName("POST /generate-question with valid payload should return 200 OK")
    void testGenerateQuestionSuccess() throws Exception {
        GenerateQuestionRequest request = new GenerateQuestionRequest(
                "Senior Java Engineer",
                InterviewTrack.JAVA_SPRING_BOOT,
                DifficultyLevel.SENIOR,
                "Microservices architecture with Spring Boot",
                List.of(),
                ModelProvider.GROQ,
                "mock-api-key",
                null
        );

        GenerateQuestionResponse mockResponse = new GenerateQuestionResponse(
                "Implement Thread-Safe Rate Limiter",
                InterviewTrack.JAVA_SPRING_BOOT,
                DifficultyLevel.SENIOR,
                "Design a token bucket rate limiter in Java 21 using Virtual Threads.",
                "public class RateLimiter { ... }",
                List.of("Use AtomicLong", "Consider ConcurrentHashMap"),
                List.of("Zero race conditions", "O(1) lookup")
        );

        when(orchestratorService.generateQuestion(any(GenerateQuestionRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/ai/generate-question")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Implement Thread-Safe Rate Limiter"))
                .andExpect(jsonPath("$.track").value("JAVA_SPRING_BOOT"))
                .andExpect(jsonPath("$.difficulty").value("SENIOR"));
    }

    @Test
    @DisplayName("POST /generate-question with blank roleTitle should return 400 Bad Request")
    void testGenerateQuestionValidationFailure() throws Exception {
        GenerateQuestionRequest invalidRequest = new GenerateQuestionRequest(
                "", // Blank role title violates @NotBlank
                InterviewTrack.JAVA_SPRING_BOOT,
                DifficultyLevel.SENIOR,
                null,
                null,
                ModelProvider.GEMINI,
                "key",
                null
        );

        mockMvc.perform(post("/api/v1/ai/generate-question")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.roleTitle").exists());
    }
}