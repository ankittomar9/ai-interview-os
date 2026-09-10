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
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
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

    public static byte[] createWav(int sampleRate, int numSamples, double amplitude) {
        int channels = 1;
        int bitsPerSample = 16;
        int dataSize = numSamples * channels * (bitsPerSample / 8);
        int totalSize = 36 + dataSize;

        ByteBuffer bb = ByteBuffer.allocate(44 + dataSize).order(ByteOrder.LITTLE_ENDIAN);
        bb.put((byte) 'R').put((byte) 'I').put((byte) 'F').put((byte) 'F');
        bb.putInt(totalSize);
        bb.put((byte) 'W').put((byte) 'A').put((byte) 'V').put((byte) 'E');

        bb.put((byte) 'f').put((byte) 'm').put((byte) 't').put((byte) ' ');
        bb.putInt(16);
        bb.putShort((short) 1); // PCM
        bb.putShort((short) channels);
        bb.putInt(sampleRate);
        bb.putInt(sampleRate * channels * 2);
        bb.putShort((short) (channels * 2));
        bb.putShort((short) bitsPerSample);

        bb.put((byte) 'd').put((byte) 'a').put((byte) 't').put((byte) 'a');
        bb.putInt(dataSize);

        for (int i = 0; i < numSamples; i++) {
            short sample = (short) (amplitude * 32767.0 * Math.sin(2 * Math.PI * 440.0 * i / sampleRate));
            bb.putShort(sample);
        }

        return bb.array();
    }

    @Test
    @DisplayName("transcribeAudio returns MISSING_API_KEY when sidecar is down and no key provided")
    void testTranscribeMissingApiKey() {
        byte[] validWav = createWav(16000, 24000, 0.5); // 1.5s speech
        MockMultipartFile audioFile = new MockMultipartFile(
                "file", "speech.wav", "audio/wav", validWav
        );

        Map<String, String> result = transcriptionService.transcribeAudio(
                audioFile, "", "", "Kafka", 1L, "en"
        );

        assertEquals("MISSING_API_KEY", result.get("status"));
        assertEquals("", result.get("text"));
    }

    @Test
    @DisplayName("VP24 [Negative]: 0.3s / 4,800-sample fixture rejected with TOO_SHORT and sttLowConfidence")
    void testAudioFragmentGateRejectsTooShortWav() {
        byte[] shortWav = createWav(16000, 4800, 0.5); // 0.3s
        MockMultipartFile audioFile = new MockMultipartFile(
                "file", "short.wav", "audio/wav", shortWav
        );

        Map<String, String> result = transcriptionService.transcribeAudio(
                audioFile, "fake-key", "whisper-large-v3", "Context", 1L, "en"
        );

        assertEquals("TOO_SHORT", result.get("status"));
        assertEquals("true", result.get("sttLowConfidence"));
        assertEquals(WhisperTranscriptionService.TOAST_TOO_SHORT, result.get("message"));
    }

    @Test
    @DisplayName("VP24 [Negative]: 1.5s silent audio rejected below silence RMS floor")
    void testAudioFragmentGateRejectsSilenceWav() {
        byte[] silentWav = createWav(16000, 24000, 0.0); // 1.5s silence
        MockMultipartFile audioFile = new MockMultipartFile(
                "file", "silent.wav", "audio/wav", silentWav
        );

        Map<String, String> result = transcriptionService.transcribeAudio(
                audioFile, "fake-key", "whisper-large-v3", "Context", 1L, "en"
        );

        assertEquals("TOO_SHORT", result.get("status"));
        assertEquals("true", result.get("sttLowConfidence"));
        assertEquals(WhisperTranscriptionService.TOAST_TOO_SHORT, result.get("message"));
    }

    @Test
    @DisplayName("VP24 [Positive]: >=1.2s non-silent audio passes fragment gate")
    void testAudioFragmentGateAcceptsValidWav() {
        byte[] validWav = createWav(16000, 24000, 0.5); // 1.5s speech
        Map<String, String> gateCheck = transcriptionService.checkAudioFragment(validWav, "speech.wav");
        assertNull(gateCheck, "Fragment gate must return null for valid 1.5s speech audio");
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

    @Test
    @DisplayName("VP30: resolveEffectiveProvider selection matrix")
    void testResolveEffectiveProviderMatrix() {
        // auto + key + INTERVIEW -> groq
        assertEquals("groq", transcriptionService.resolveEffectiveProvider("auto", "gsk-12345", "INTERVIEW"));
        assertEquals("groq", transcriptionService.resolveEffectiveProvider(null, "gsk-12345", "INTERVIEW"));

        // auto + no key -> local
        assertEquals("local", transcriptionService.resolveEffectiveProvider("auto", "", "INTERVIEW"));
        assertEquals("local", transcriptionService.resolveEffectiveProvider("auto", null, "INTERVIEW"));

        // auto + key + PLAYGROUND -> local
        assertEquals("local", transcriptionService.resolveEffectiveProvider("auto", "gsk-12345", "PLAYGROUND"));

        // explicit local -> local (regardless of key or mode)
        assertEquals("local", transcriptionService.resolveEffectiveProvider("local", "gsk-12345", "INTERVIEW"));
        assertEquals("local", transcriptionService.resolveEffectiveProvider("local", "", "INTERVIEW"));

        // explicit groq -> groq
        assertEquals("groq", transcriptionService.resolveEffectiveProvider("groq", "gsk-12345", "INTERVIEW"));
    }

    @Test
    @DisplayName("VP30 [Negative]: Explicit local never calls Groq even when key is present and sidecar down")
    void testTranscribeAudioExplicitLocalNeverCallsGroq() {
        ReflectionTestUtils.setField(transcriptionService, "configuredSttProvider", "local");
        byte[] validWav = createWav(16000, 24000, 0.5); // 1.5s speech
        MockMultipartFile audioFile = new MockMultipartFile(
                "file", "speech.wav", "audio/wav", validWav
        );

        Map<String, String> result = transcriptionService.transcribeAudio(
                audioFile, "gsk-mock-key", "", "Kafka", 1L, "en", "INTERVIEW"
        );

        // Sidecar is not running, so in explicit local mode it must return MISSING_API_KEY / not available
        assertEquals("MISSING_API_KEY", result.get("status"));
        // verify egressTracker was NEVER called for Groq
        org.mockito.Mockito.verifyNoInteractions(egressTracker);
    }

    @Test
    @DisplayName("VP30: Auto mode without key selects local provider")
    void testTranscribeAudioAutoWithoutKeySelectsLocal() {
        ReflectionTestUtils.setField(transcriptionService, "configuredSttProvider", "auto");
        byte[] validWav = createWav(16000, 24000, 0.5); // 1.5s speech
        MockMultipartFile audioFile = new MockMultipartFile(
                "file", "speech.wav", "audio/wav", validWav
        );

        Map<String, String> result = transcriptionService.transcribeAudio(
                audioFile, "", "", "Kafka", 1L, "en", "INTERVIEW"
        );

        // Without key and sidecar down -> returns MISSING_API_KEY and never calls Groq
        assertEquals("MISSING_API_KEY", result.get("status"));
        org.mockito.Mockito.verifyNoInteractions(egressTracker);
    }
}
