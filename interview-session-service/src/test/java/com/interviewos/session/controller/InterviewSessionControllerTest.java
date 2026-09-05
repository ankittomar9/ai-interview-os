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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                "Ankit Singh Tomar",
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

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/messages with metadata should return 201 CREATED and metadata")
    void testAddMessageWithMetadata() throws Exception {
        com.interviewos.session.dto.AddMessageRequest request = new com.interviewos.session.dto.AddMessageRequest(
                "AI",
                com.interviewos.session.model.MessageType.FEEDBACK,
                "Good start. Let's explore concurrency.",
                null,
                java.util.Map.of(
                        "detectedIntent", "EXPLAINING_APPROACH",
                        "turnSummary", "Candidate explained locking strategy.",
                        "recommendedAction", "PROBE_DEEPER"
                )
        );

        SessionResponse.MessageResponse mockResponse = new SessionResponse.MessageResponse(
                10L,
                "AI",
                com.interviewos.session.model.MessageType.FEEDBACK,
                "Good start. Let's explore concurrency.",
                null,
                Instant.now(),
                java.util.Map.of(
                        "detectedIntent", "EXPLAINING_APPROACH",
                        "turnSummary", "Candidate explained locking strategy.",
                        "recommendedAction", "PROBE_DEEPER"
                )
        );

        when(sessionService.addMessage(any(), any(com.interviewos.session.dto.AddMessageRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/sessions/1/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.metadata.detectedIntent").value("EXPLAINING_APPROACH"))
                .andExpect(jsonPath("$.metadata.recommendedAction").value("PROBE_DEEPER"));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/transcript should return transcript list with metadata")
    void testGetTranscriptWithMetadata() throws Exception {
        SessionResponse.MessageResponse turn1 = new SessionResponse.MessageResponse(
                1L,
                "CANDIDATE",
                com.interviewos.session.model.MessageType.EXPLANATION,
                "I will use a HashMap and DoublyLinkedList.",
                null,
                Instant.now(),
                null
        );

        SessionResponse.MessageResponse turn2 = new SessionResponse.MessageResponse(
                2L,
                "AI",
                com.interviewos.session.model.MessageType.FEEDBACK,
                "Sounds solid. How do you handle thread safety?",
                null,
                Instant.now(),
                java.util.Map.of(
                        "detectedIntent", "EXPLAINING_APPROACH",
                        "turnSummary", "Candidate proposed HashMap + DLL.",
                        "recommendedAction", "PROBE_DEEPER"
                )
        );

        when(sessionService.getSessionTranscript(1L)).thenReturn(List.of(turn1, turn2));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/sessions/1/transcript")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].metadata.detectedIntent").value("EXPLAINING_APPROACH"))
                .andExpect(jsonPath("$[1].metadata.recommendedAction").value("PROBE_DEEPER"));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/messages with integrity signals should return 201 CREATED and integrity fields")
    void testAddMessageWithIntegritySignals() throws Exception {
        com.interviewos.session.dto.IntegritySignals signals = com.interviewos.session.dto.IntegritySignals.builder()
                .keystrokeCount(350)
                .avgKeystrokeIntervalMs(120)
                .keystrokeVariance(450)
                .estimatedWpm(75)
                .suspiciousTyping(false)
                .copyCount(1)
                .pasteCount(2)
                .tabSwitchCount(0)
                .build();

        com.interviewos.session.dto.AddMessageRequest request = new com.interviewos.session.dto.AddMessageRequest(
                "CANDIDATE",
                com.interviewos.session.model.MessageType.EXPLANATION,
                "Here is my solution explanation.",
                "int a = 1;",
                null,
                signals
        );

        SessionResponse.MessageResponse mockResponse = new SessionResponse.MessageResponse(
                11L,
                "CANDIDATE",
                com.interviewos.session.model.MessageType.EXPLANATION,
                "Here is my solution explanation.",
                "int a = 1;",
                Instant.now(),
                null,
                350,
                120,
                450,
                75,
                false,
                1,
                2,
                0
        );

        when(sessionService.addMessage(any(), any(com.interviewos.session.dto.AddMessageRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/sessions/1/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(11))
                .andExpect(jsonPath("$.keystrokeCount").value(350))
                .andExpect(jsonPath("$.estimatedWpm").value(75))
                .andExpect(jsonPath("$.suspiciousTyping").value(false))
                .andExpect(jsonPath("$.copyCount").value(1))
                .andExpect(jsonPath("$.pasteCount").value(2));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/section-transitions should record transition and return 200 OK")
    void testRecordSectionTransition() throws Exception {
        com.interviewos.session.dto.SectionTransitionRequest req = new com.interviewos.session.dto.SectionTransitionRequest(
                "INTRODUCTION", "CODING_DSA", 0, "MANUAL_JUMP", 0
        );

        com.interviewos.session.document.InterviewSessionDocument.SectionProgress p1 =
                com.interviewos.session.document.InterviewSessionDocument.SectionProgress.builder()
                        .sectionType("INTRODUCTION")
                        .index(0)
                        .reason("MANUAL_JUMP")
                        .turnCount(0)
                        .build();

        com.interviewos.session.document.InterviewSessionDocument.SectionProgress p2 =
                com.interviewos.session.document.InterviewSessionDocument.SectionProgress.builder()
                        .sectionType("CORE_TECH")
                        .index(1)
                        .reason("MANUAL_JUMP")
                        .turnCount(0)
                        .build();

        when(sessionService.recordSectionTransition(any(), any(com.interviewos.session.dto.SectionTransitionRequest.class)))
                .thenReturn(List.of(p1, p2));

        mockMvc.perform(post("/api/v1/sessions/1/section-transitions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sectionType").value("INTRODUCTION"))
                .andExpect(jsonPath("$[0].reason").value("MANUAL_JUMP"))
                .andExpect(jsonPath("$[1].sectionType").value("CORE_TECH"))
                .andExpect(jsonPath("$[1].reason").value("MANUAL_JUMP"))
                .andExpect(jsonPath("$[1].turnCount").value(0));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/section-transitions should return list of section progresses")
    void testGetSectionProgress() throws Exception {
        com.interviewos.session.document.InterviewSessionDocument.SectionProgress p =
                com.interviewos.session.document.InterviewSessionDocument.SectionProgress.builder()
                        .sectionType("INTRODUCTION")
                        .index(0)
                        .reason("CONSENTED")
                        .turnCount(3)
                        .build();

        when(sessionService.getSectionProgress(1L)).thenReturn(List.of(p));

        mockMvc.perform(get("/api/v1/sessions/1/section-transitions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sectionType").value("INTRODUCTION"))
                .andExpect(jsonPath("$[0].reason").value("CONSENTED"))
                .andExpect(jsonPath("$[0].turnCount").value(3));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/start without verification returns 409 VERIFICATION_REQUIRED")
    void testStartSession_WithoutVerification_Returns409() throws Exception {
        when(sessionService.startSession(1L)).thenThrow(
                new com.interviewos.session.exception.VerificationRequiredException(
                        "VERIFICATION_REQUIRED: Valid screen share and verification receipt required to start interview session"
                )
        );

        mockMvc.perform(post("/api/v1/sessions/1/start"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("VERIFICATION_REQUIRED"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("VERIFICATION_REQUIRED")));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/start with valid verification returns 200 OK")
    void testStartSession_Success() throws Exception {
        SessionResponse mockResponse = new SessionResponse(
                1L, "candidate-123", "Role", InterviewTrack.JAVA_SPRING_BOOT,
                DifficultyLevel.SENIOR, "Google", "JD", SessionStatus.IN_PROGRESS,
                Instant.now(), Instant.now(), null, null, "INTERVIEW", null, null
        );

        when(sessionService.startSession(1L)).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/sessions/1/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/verification records hardware receipt")
    void testRecordVerification_Success() throws Exception {
        com.interviewos.session.dto.SessionVerificationRequest req = new com.interviewos.session.dto.SessionVerificationRequest(
                true, true, true, "MONITOR", "Primary Display", true, "VERIFIED", "Mozilla/5.0"
        );
        com.interviewos.session.dto.SessionVerificationResponse resp = new com.interviewos.session.dto.SessionVerificationResponse(
                1L, 1L, "OK", "OK", "OK", "MONITOR", "Primary Display", true, "VERIFIED", "Mozilla/5.0", Instant.now()
        );

        when(sessionService.recordVerification(any(), any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/sessions/1/verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outcome").value("VERIFIED"))
                .andExpect(jsonPath("$.screenScope").value("MONITOR"))
                .andExpect(jsonPath("$.screenStatus").value("OK"));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/{id}/verification returns verification receipt")
    void testGetVerification_Success() throws Exception {
        com.interviewos.session.dto.SessionVerificationResponse resp = new com.interviewos.session.dto.SessionVerificationResponse(
                1L, 1L, "OK", "OK", "OK", "MONITOR", "Primary Display", true, "VERIFIED", "Mozilla/5.0", Instant.now()
        );

        when(sessionService.getVerification(1L)).thenReturn(resp);

        mockMvc.perform(get("/api/v1/sessions/1/verification"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.screenScope").value("MONITOR"))
                .andExpect(jsonPath("$.outcome").value("VERIFIED"));
    }

    @Test
    @DisplayName("POST /api/v1/sessions/{id}/abort transitions session to ABORTED_SHARE")
    void testAbortSession_Success() throws Exception {
        com.interviewos.session.dto.AbortSessionRequest req = new com.interviewos.session.dto.AbortSessionRequest("SHARE_LOST_EXPIRED");
        SessionResponse mockResponse = new SessionResponse(
                1L, "candidate-123", "Role", InterviewTrack.JAVA_SPRING_BOOT,
                DifficultyLevel.SENIOR, "Google", "JD", SessionStatus.ABORTED_SHARE,
                Instant.now(), Instant.now(), Instant.now(), 60L, "INTERVIEW", null, null
        );

        when(sessionService.abortSession(any(), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/sessions/1/abort")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ABORTED_SHARE"));
    }
}
