package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.SessionTranscriptClient;
import com.interviewos.ai.dto.TranscriptTurnDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WhisperTranscriptionServiceTest {

    @Mock
    private RestClient.Builder restClientBuilder;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private EgressTracker egressTracker;

    @Mock
    private SessionTranscriptClient sessionTranscriptClient;

    private WhisperTranscriptionService transcriptionService;

    @BeforeEach
    void setUp() {
        transcriptionService = new WhisperTranscriptionService(
                restClientBuilder,
                objectMapper,
                egressTracker,
                sessionTranscriptClient
        );
        ReflectionTestUtils.setField(transcriptionService, "localWhisperEndpoint", "");
        ReflectionTestUtils.setField(transcriptionService, "defaultGroqApiKey", "");
    }

    @Test
    @DisplayName("assemblePrompt with promptContext only returns trimmed prompt")
    void testAssemblePromptWithContextOnly() {
        String prompt = transcriptionService.assemblePrompt("Kafka; Dijkstra; React", null);
        assertEquals("Kafka; Dijkstra; React", prompt);
    }

    @Test
    @DisplayName("assemblePrompt with promptContext and sessionId combines hints and rolling turns")
    void testAssemblePromptWithSessionTurns() {
        TranscriptTurnDto turn1 = new TranscriptTurnDto(1L, "CANDIDATE", "TEXT", "I chose PostgreSQL.", null, Map.of());
        TranscriptTurnDto turn2 = new TranscriptTurnDto(2L, "AI", "TEXT", "**Good**. How do you handle *caching*?\nUse Redis.", null, Map.of());

        when(sessionTranscriptClient.fetchSessionTranscript(100L)).thenReturn(List.of(turn1, turn2));

        String prompt = transcriptionService.assemblePrompt("System Design", 100L);
        assertTrue(prompt.startsWith("System Design; I chose PostgreSQL.; Good. How do you handle caching? Use Redis."));
    }

    @Test
    @DisplayName("assemblePrompt truncates prompt to 400 characters max")
    void testAssemblePromptTruncatesAt400() {
        String longText = "A".repeat(500);
        String prompt = transcriptionService.assemblePrompt(longText, null);
        assertEquals(400, prompt.length());
    }

    @Test
    @DisplayName("assemblePrompt is null-safe on all parameters and failures")
    void testAssemblePromptNullSafe() {
        when(sessionTranscriptClient.fetchSessionTranscript(anyLong())).thenThrow(new RuntimeException("Service down"));
        String prompt = transcriptionService.assemblePrompt(null, 999L);
        assertEquals("", prompt);

        String promptWithContext = transcriptionService.assemblePrompt("Fallback Context", 999L);
        assertEquals("Fallback Context", promptWithContext);
    }

    @Test
    @DisplayName("transcribeAudio returns MISSING_API_KEY when sidecar is down and no key provided")
    void testTranscribeMissingApiKey() {
        MockMultipartFile audioFile = new MockMultipartFile(
                "file", "speech.wav", "audio/wav", new byte[]{1, 2, 3, 4}
        );

        Map<String, String> result = transcriptionService.transcribeAudio(
                audioFile, "", "", "Kafka", 1L, "en"
        );

        assertEquals("MISSING_API_KEY", result.get("status"));
        assertEquals("", result.get("text"));
    }

    @Test
    @DisplayName("assemblePrompt biases proper nouns including candidate name and target company")
    void testAssemblePromptWithProperNounContextBiasing() {
        String prompt = transcriptionService.assemblePrompt("Ankit Singh Tomar, InterviewOS, ALGORITHMS_DATA_STRUCTURES", null);
        assertNotNull(prompt);
        assertTrue(prompt.contains("Ankit Singh Tomar"));
        assertTrue(prompt.contains("InterviewOS"));
        assertEquals("Ankit Singh Tomar, InterviewOS, ALGORITHMS_DATA_STRUCTURES", prompt);
    }
}
