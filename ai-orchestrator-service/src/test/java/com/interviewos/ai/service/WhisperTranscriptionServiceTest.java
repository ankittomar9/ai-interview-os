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

import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

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

    @Test
    @DisplayName("isWhisperSidecarRunning caches health probe status for 30s TTL and re-probes after expiry")
    void testWhisperSidecarCacheTtlAndReprobe() throws Exception {
        AtomicInteger probeCount = new AtomicInteger(0);
        AtomicInteger responseCode = new AtomicInteger(200);

        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/health", exchange -> {
            probeCount.incrementAndGet();
            int code = responseCode.get();
            exchange.sendResponseHeaders(code, 0);
            exchange.close();
        });
        server.start();

        try {
            int port = server.getAddress().getPort();
            String endpoint = "http://127.0.0.1:" + port + "/inference";
            ReflectionTestUtils.setField(transcriptionService, "localWhisperEndpoint", endpoint);
            ReflectionTestUtils.setField(transcriptionService, "lastSidecarCheckTime", 0L);
            ReflectionTestUtils.setField(transcriptionService, "lastSidecarStatus", false);

            // 1. First call hits probe -> true
            boolean firstCall = transcriptionService.isWhisperSidecarRunning();
            assertTrue(firstCall, "Initial probe should return true when server responds 200");
            assertEquals(1, probeCount.get(), "First call must hit probe");

            // 2. Second call inside TTL returns cached -> true without hitting probe
            boolean secondCall = transcriptionService.isWhisperSidecarRunning();
            assertTrue(secondCall, "Second call within 30s TTL should return cached true");
            assertEquals(1, probeCount.get(), "Second call within 30s TTL should not re-probe");

            // 3. Post-TTL re-probes: artificially advance lastSidecarCheckTime past 30s
            ReflectionTestUtils.setField(transcriptionService, "lastSidecarCheckTime", System.currentTimeMillis() - 31000L);
            boolean thirdCall = transcriptionService.isWhisperSidecarRunning();
            assertTrue(thirdCall, "Post-TTL call should return probe response");
            assertEquals(2, probeCount.get(), "Post-TTL call should re-probe server");

            // 4. Failure path caches false
            responseCode.set(500);
            ReflectionTestUtils.setField(transcriptionService, "lastSidecarCheckTime", System.currentTimeMillis() - 31000L);
            boolean fourthCall = transcriptionService.isWhisperSidecarRunning();
            assertFalse(fourthCall, "Server returning 500 should evaluate to false");
            assertEquals(3, probeCount.get(), "Failure call should hit probe");

            // 5. Subsequent call within TTL preserves false cache
            boolean fifthCall = transcriptionService.isWhisperSidecarRunning();
            assertFalse(fifthCall, "Subsequent call within TTL should return cached false");
            assertEquals(3, probeCount.get(), "Cached false must not re-probe");
        } finally {
            server.stop(0);
        }
    }
}
