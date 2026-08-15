package com.interviewos.session.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.dto.CreateSessionRequest;
import com.interviewos.session.dto.SessionResponse;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.service.InterviewSessionService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(InterviewSessionController.class)
class InterviewSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InterviewSessionService sessionService;

    @Test
    @DisplayName("POST /api/v1/sessions should return 201 CREATED with new session ID")
    void testCreateSession() throws Exception {
        CreateSessionRequest request = new CreateSessionRequest(
                "candidate-123",
                "Senior Java Backend Engineer",
                InterviewTrack.JAVA_SPRING_BOOT,
                DifficultyLevel.SENIOR,
                "Google",
                "High-throughput microservices"
        );

        SessionResponse mockResponse = new SessionResponse(
                1L,
                "candidate-123",
                "Senior Java Backend Engineer",
                InterviewTrack.JAVA_SPRING_BOOT,
                DifficultyLevel.SENIOR,
                "Google",
                "High-throughput microservices",
                SessionStatus.INITIALIZED,
                Instant.now(),
                null,
                null,
                null,
                List.of()
        );

        when(sessionService.createSession(any(CreateSessionRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.status").value("INITIALIZED"))
                .andExpect(jsonPath("$.candidateId").value("candidate-123"));
    }
}