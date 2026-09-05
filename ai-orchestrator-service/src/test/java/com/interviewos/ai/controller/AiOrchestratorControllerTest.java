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

    @MockBean
    private com.interviewos.ai.service.WhisperTranscriptionService transcriptionService;

    @MockBean
    private com.interviewos.ai.service.VoiceCoachService voiceCoachService;

    @MockBean
    private com.interviewos.ai.service.EgressTracker egressTracker;

    @MockBean
    private com.interviewos.ai.service.ProviderStatusService providerStatusService;

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

    @Test
    @DisplayName("GET /api/v1/ai/purity should return 200 OK with purity status")
    void testGetPurityStatus() throws Exception {
        when(egressTracker.getStatus()).thenReturn(
                new com.interviewos.ai.service.EgressTracker.PurityStatus(
                        true, 0, List.of(), "100% Local"
                )
        );

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/ai/purity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.local").value(true))
                .andExpect(jsonPath("$.cloudCallCount").value(0));
    }

    @Test
    @DisplayName("GET /api/v1/ai/ollama/status should return 200 OK with running state")
    void testGetOllamaStatus() throws Exception {
        when(orchestratorService.isOllamaRunning()).thenReturn(true);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/ai/ollama/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("OLLAMA"))
                .andExpect(jsonPath("$.running").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/ai/providers/status should return 200 OK with providers list")
    void testGetProvidersStatus() throws Exception {
        when(providerStatusService.getProvidersStatus(any(), any())).thenReturn(java.util.List.of(
                new com.interviewos.ai.dto.ProviderStatusDto("GEMINI", true, "ENV", "READY", "gemini-3.5-flash", true, null, null, System.currentTimeMillis())
        ));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/ai/providers/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].provider").value("GEMINI"))
                .andExpect(jsonPath("$[0].state").value("READY"))
                .andExpect(jsonPath("$[0].configuredModel").value("gemini-3.5-flash"));
    }

    @Test
    @DisplayName("POST /api/v1/ai/providers/status/refresh should return 200 OK with refreshed status")
    void testRefreshProvidersStatus() throws Exception {
        when(providerStatusService.refresh()).thenReturn(java.util.List.of(
                new com.interviewos.ai.dto.ProviderStatusDto("GROQ", true, "ENV", "READY", "openai/gpt-oss-120b", true, null, null, System.currentTimeMillis())
        ));

        mockMvc.perform(post("/api/v1/ai/providers/status/refresh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].provider").value("GROQ"));
    }

    @Test
    @DisplayName("POST /transcribe with audio file and prompt biasing params should return 200 OK")
    void testTranscribeAudioWithPromptBiasing() throws Exception {
        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "speech.wav", "audio/wav", "sample audio content".getBytes()
        );

        when(transcriptionService.transcribeAudio(
                any(), any(), any(), org.mockito.ArgumentMatchers.eq("Kafka; React"),
                org.mockito.ArgumentMatchers.eq(123L), org.mockito.ArgumentMatchers.eq("en")
        )).thenReturn(java.util.Map.of(
                "text", "We use Kafka and React",
                "status", "SUCCESS",
                "provider", "WHISPER_CPP_LOCAL",
                "promptUsed", "true"
        ));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/ai/transcribe")
                        .file(file)
                        .param("promptContext", "Kafka; React")
                        .param("sessionId", "123")
                        .param("lang", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("We use Kafka and React"))
                .andExpect(jsonPath("$.provider").value("WHISPER_CPP_LOCAL"))
                .andExpect(jsonPath("$.promptUsed").value("true"));
    }
}