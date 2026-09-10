package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.client.SessionTranscriptClient;
import com.interviewos.ai.dto.TranscriptTurnDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhisperTranscriptionService {

    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;
    private final EgressTracker egressTracker;
    private final SessionTranscriptClient sessionTranscriptClient;

    @Value("${ai.providers.groq.api-key:${GROQ_API_KEY:}}")
    private String defaultGroqApiKey;

    @Value("${ai.whisper.local-endpoint:${WHISPER_ENDPOINT:http://localhost:8178/inference}}")
    private String localWhisperEndpoint;

    @Value("${ai.providers.groq.stt-model:${GROQ_MODEL_STT:whisper-large-v3-turbo}}")
    private String configuredGroqSttModel;

    @Value("${ai.whisper.stt-provider:${STT_PROVIDER:auto}}")
    private String configuredSttProvider = "auto";

    private static final String GROQ_WHISPER_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String DEFAULT_WHISPER_MODEL = "whisper-large-v3-turbo";

    public String assemblePrompt(String promptContext, Long sessionId) {
        StringBuilder sb = new StringBuilder();
        if (promptContext != null && !promptContext.isBlank()) {
            sb.append(promptContext.trim());
        }
        if (sessionId != null && sessionTranscriptClient != null) {
            try {
                List<TranscriptTurnDto> turns = sessionTranscriptClient.fetchSessionTranscript(sessionId);
                if (turns != null && !turns.isEmpty()) {
                    int start = Math.max(0, turns.size() - 2);
                    for (int i = start; i < turns.size(); i++) {
                        TranscriptTurnDto turn = turns.get(i);
                        String content = turn.content();
                        if (content != null && !content.isBlank()) {
                            String clean = content.replaceAll("[\\r\\n]+", " ")
                                                  .replaceAll("[*_#`]", "")
                                                  .replaceAll("\\s+", " ")
                                                  .trim();
                            if (!clean.isEmpty()) {
                                if (sb.length() > 0) sb.append("; ");
                                sb.append(clean);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("⚠️ Failed to fetch session transcript for prompt biasing (sessionId={}): {}", sessionId, e.getMessage());
            }
        }
        String fullPrompt = sb.toString().trim();
        if (fullPrompt.length() > 400) {
            fullPrompt = fullPrompt.substring(0, 400);
        }
        return fullPrompt;
    }

    public static final double MIN_AUDIO_DURATION_SEC = 1.2;
    public static final double SILENCE_RMS_FLOOR = 0.003;
    public static final String TOAST_TOO_SHORT = "Recording too short — hold/toggle and speak your full approach.";

    public Map<String, String> checkAudioFragment(byte[] audioBytes, String filename) {
        if (audioBytes == null || audioBytes.length == 0) {
            return Map.of("text", "", "status", "TOO_SHORT", "sttLowConfidence", "true", "message", TOAST_TOO_SHORT);
        }

        // Check if WAV format (RIFF ... WAVE)
        if (audioBytes.length >= 44 && audioBytes[0] == 'R' && audioBytes[1] == 'I' && audioBytes[2] == 'F' && audioBytes[3] == 'F'
                && audioBytes[8] == 'W' && audioBytes[9] == 'A' && audioBytes[10] == 'V' && audioBytes[11] == 'E') {
            int channels = (audioBytes[22] & 0xFF) | ((audioBytes[23] & 0xFF) << 8);
            int sampleRate = (audioBytes[24] & 0xFF) | ((audioBytes[25] & 0xFF) << 8)
                    | ((audioBytes[26] & 0xFF) << 16) | ((audioBytes[27] & 0xFF) << 24);
            int bitsPerSample = (audioBytes[34] & 0xFF) | ((audioBytes[35] & 0xFF) << 8);

            int dataOffset = 44;
            int dataSize = audioBytes.length - 44;
            for (int i = 12; i < Math.min(audioBytes.length - 8, 120); i++) {
                if (audioBytes[i] == 'd' && audioBytes[i + 1] == 'a' && audioBytes[i + 2] == 't' && audioBytes[i + 3] == 'a') {
                    dataOffset = i + 8;
                    dataSize = (audioBytes[i + 4] & 0xFF) | ((audioBytes[i + 5] & 0xFF) << 8)
                            | ((audioBytes[i + 6] & 0xFF) << 16) | ((audioBytes[i + 7] & 0xFF) << 24);
                    break;
                }
            }
            if (channels > 0 && sampleRate > 0 && bitsPerSample > 0) {
                int bytesPerSample = bitsPerSample / 8;
                int totalSamples = dataSize / (channels * bytesPerSample);
                double durationSec = (double) totalSamples / sampleRate;

                if (durationSec < MIN_AUDIO_DURATION_SEC) {
                    log.warn("STT Fragment Gate: Rejected audio duration {}s (< {}s floor), samples={}, bytes={}",
                            String.format("%.2f", durationSec), MIN_AUDIO_DURATION_SEC, totalSamples, dataSize);
                    return Map.of("text", "", "status", "TOO_SHORT", "sttLowConfidence", "true", "message", TOAST_TOO_SHORT);
                }

                // Compute RMS for 16-bit PCM samples
                if (bitsPerSample == 16 && dataOffset + 2 <= audioBytes.length) {
                    double sumSq = 0.0;
                    int pcmSamples = Math.min((audioBytes.length - dataOffset) / 2, totalSamples);
                    if (pcmSamples > 0) {
                        for (int i = 0; i < pcmSamples; i++) {
                            int idx = dataOffset + i * 2;
                            if (idx + 1 >= audioBytes.length) break;
                            short sample = (short) ((audioBytes[idx] & 0xFF) | (audioBytes[idx + 1] << 8));
                            double norm = sample / 32768.0;
                            sumSq += norm * norm;
                        }
                        double rms = Math.sqrt(sumSq / pcmSamples);
                        if (rms < SILENCE_RMS_FLOOR) {
                            log.warn("STT Fragment Gate: Rejected audio below silence floor RMS={} (< {})",
                                    String.format("%.5f", rms), SILENCE_RMS_FLOOR);
                            return Map.of("text", "", "status", "TOO_SHORT", "sttLowConfidence", "true", "message", TOAST_TOO_SHORT);
                        }
                    }
                }
            }
        } else {
            // Non-WAV (e.g. webm/opus): raw byte size heuristic.
            // A 1.2s webm audio stream is typically >= 12,000 bytes.
            if (audioBytes.length < 12000) {
                log.warn("STT Fragment Gate: Rejected non-WAV audio below minimum size bytes={} (< 12000)", audioBytes.length);
                return Map.of("text", "", "status", "TOO_SHORT", "sttLowConfidence", "true", "message", TOAST_TOO_SHORT);
            }
        }
        return null;
    }

    private Map<String, String> evaluateTranscribedText(Map<String, String> result) {
        String text = result.get("text");
        if (text != null && !text.isBlank()) {
            String[] words = text.trim().split("\\s+");
            if (words.length < 3) {
                log.warn("STT Fragment Gate: Transcribed text has only {} words (< 3): '{}'. Flagging sttLowConfidence.", words.length, text);
                Map<String, String> updated = new java.util.HashMap<>(result);
                updated.put("sttLowConfidence", "true");
                updated.put("status", "TOO_SHORT");
                updated.put("message", TOAST_TOO_SHORT);
                return updated;
            }
        }
        return result;
    }

    /**
     * Transcribes candidate audio using local Whisper.cpp if available, falling back to Groq Whisper LPU.
     */
    public String resolveEffectiveProvider(String sttProviderSetting, String apiKey, String sessionMode) {
        String pref = (sttProviderSetting != null && !sttProviderSetting.isBlank())
                ? sttProviderSetting.trim().toLowerCase() : "auto";

        if ("local".equals(pref)) {
            return "local";
        }
        if ("groq".equals(pref)) {
            return "groq";
        }
        // auto: if usable key exists and mode is INTERVIEW -> groq; else local
        boolean hasKey = apiKey != null && !apiKey.isBlank();
        boolean isInterview = sessionMode == null || !"PLAYGROUND".equalsIgnoreCase(sessionMode.trim());
        if (hasKey && isInterview) {
            return "groq";
        }
        return "local";
    }

    /**
     * Transcribes candidate audio according to configured STT_PROVIDER policy (local | groq | auto).
     */
    public Map<String, String> transcribeAudio(MultipartFile audioFile, String customApiKey, String customModel) {
        return transcribeAudio(audioFile, customApiKey, customModel, null, null, "en", "INTERVIEW");
    }

    public Map<String, String> transcribeAudio(MultipartFile audioFile, String customApiKey, String customModel,
                                              String promptContext, Long sessionId, String lang) {
        return transcribeAudio(audioFile, customApiKey, customModel, promptContext, sessionId, lang, "INTERVIEW");
    }

    public Map<String, String> transcribeAudio(MultipartFile audioFile, String customApiKey, String customModel,
                                              String promptContext, Long sessionId, String lang, String sessionMode) {
        try {
            byte[] bytes = audioFile.getBytes();
            Map<String, String> fragmentGate = checkAudioFragment(bytes, audioFile.getOriginalFilename());
            if (fragmentGate != null) {
                return fragmentGate;
            }
        } catch (Exception e) {
            log.warn("Notice checking audio fragment gate: {}", e.getMessage());
        }

        String apiKey = (customApiKey != null && !customApiKey.isBlank()) ? customApiKey : defaultGroqApiKey;
        if (apiKey == null || apiKey.isBlank()) {
            String envKey = System.getenv("GROQ_API_KEY");
            if (envKey != null && !envKey.isBlank()) {
                apiKey = envKey.trim();
            }
        }

        String effectiveProvider = resolveEffectiveProvider(configuredSttProvider, apiKey, sessionMode);
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang.trim() : "en";
        String prompt = assemblePrompt(promptContext, sessionId);

        if ("groq".equals(effectiveProvider)) {
            if (apiKey == null || apiKey.isBlank()) {
                log.warn("⚠️ Groq STT selected but no Groq API Key provided.");
                return Map.of("text", "", "status", "MISSING_API_KEY", "message", "No Groq API key available for Groq STT.");
            }
            try {
                return evaluateTranscribedText(transcribeGroq(audioFile, apiKey, customModel, prompt, effectiveLang));
            } catch (Exception e) {
                log.error("⚠️ Groq Whisper transcription error: {}", e.getMessage(), e);
                // In auto mode, fallback to local sidecar if running
                if ("auto".equalsIgnoreCase(configuredSttProvider) && isWhisperSidecarRunning()) {
                    log.info("⚠️ Falling back to 100% Local Whisper.cpp sidecar after Groq failure: {}", e.getMessage());
                    return evaluateTranscribedText(transcribeLocal(audioFile, prompt, effectiveLang));
                }
                return Map.of("text", "", "status", "ERROR", "message", e.getMessage(), "sttProvider", "groq", "provider", "GROQ");
            }
        }

        // effectiveProvider is "local"
        if (isWhisperSidecarRunning()) {
            log.info("🔒 Transcribing speech via 100% Local Whisper.cpp sidecar at {} (promptLength={}, lang={})",
                    localWhisperEndpoint, prompt.length(), effectiveLang);
            return evaluateTranscribedText(transcribeLocal(audioFile, prompt, effectiveLang));
        }

        // In auto mode, if sidecar is down but Groq key is present, fallback to Groq
        if ("auto".equalsIgnoreCase(configuredSttProvider) && apiKey != null && !apiKey.isBlank()) {
            log.info("Local Whisper sidecar not running, routing to Groq Whisper LPU.");
            try {
                return evaluateTranscribedText(transcribeGroq(audioFile, apiKey, customModel, prompt, effectiveLang));
            } catch (Exception e) {
                log.error("⚠️ Groq Whisper fallback error: {}", e.getMessage(), e);
                return Map.of("text", "", "status", "ERROR", "message", e.getMessage(), "sttProvider", "groq", "provider", "GROQ");
            }
        }

        log.warn("⚠️ No local Whisper.cpp running and no Groq API Key provided for Whisper transcription.");
        return Map.of("text", "", "status", "MISSING_API_KEY", "message", "No STT provider available. Start Whisper sidecar or provide GROQ_API_KEY.");
    }

    private Map<String, String> transcribeGroq(MultipartFile audioFile, String apiKey, String customModel, String prompt, String effectiveLang) throws Exception {
        egressTracker.recordCloudCall("GROQ_WHISPER");
        long startTime = System.currentTimeMillis();
        String fileName = (audioFile.getOriginalFilename() != null && !audioFile.getOriginalFilename().isBlank())
                ? audioFile.getOriginalFilename() : "candidate_speech.webm";

        ByteArrayResource audioResource = new ByteArrayResource(audioFile.getBytes()) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };

        String fallbackModel = (configuredGroqSttModel != null && !configuredGroqSttModel.isBlank())
                ? configuredGroqSttModel : DEFAULT_WHISPER_MODEL;
        String model = (customModel != null && !customModel.isBlank()) ? customModel : fallbackModel;

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", audioResource);
        body.add("model", model);
        body.add("language", effectiveLang);
        body.add("response_format", "json");
        if (!prompt.isBlank()) {
            body.add("prompt", prompt);
        }

        RestClient restClient = restClientBuilder.build();

        String rawResponse = restClient.post()
                .uri(GROQ_WHISPER_ENDPOINT)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(rawResponse);
        String transcript = root.path("text").asText("");
        long duration = System.currentTimeMillis() - startTime;

        log.info("🎙️ Groq Whisper Transcribed using model '{}' ({}ms): \"{}\"", model, duration, transcript);
        return Map.of(
                "text", transcript,
                "status", "SUCCESS",
                "sttProvider", "groq",
                "provider", "GROQ",
                "sttMs", String.valueOf(duration),
                "latencyMs", String.valueOf(duration),
                "model", model,
                "promptUsed", String.valueOf(!prompt.isBlank())
        );
    }

    private volatile long lastSidecarCheckTime = 0;
    private volatile boolean lastSidecarStatus = false;
    private static final long SIDECAR_CACHE_TTL_MS = 30000;

    public boolean isWhisperSidecarRunning() {
        if (localWhisperEndpoint == null || localWhisperEndpoint.isBlank()) {
            return false;
        }
        long now = System.currentTimeMillis();
        if (now - lastSidecarCheckTime < SIDECAR_CACHE_TTL_MS) {
            return lastSidecarStatus;
        }
        try {
            String healthUrl = localWhisperEndpoint.replace("/inference", "") + "/health";
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) java.net.URI.create(healthUrl).toURL().openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(800);
            conn.setReadTimeout(800);
            boolean isRunning = (conn.getResponseCode() == 200);
            lastSidecarStatus = isRunning;
            lastSidecarCheckTime = now;
            return isRunning;
        } catch (Exception e) {
            lastSidecarStatus = false;
            lastSidecarCheckTime = now;
            return false;
        }
    }

    private Map<String, String> transcribeLocal(MultipartFile audioFile, String prompt, String lang) {
        long startTime = System.currentTimeMillis();
        try {
            String originalName = audioFile.getOriginalFilename();
            String uploadName = (originalName != null && originalName.endsWith(".wav")) ? "speech.wav" : "candidate_speech.webm";

            ByteArrayResource audioResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return uploadName;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", audioResource);
            if (prompt != null && !prompt.isBlank()) {
                body.add("prompt", prompt);
            }
            body.add("language", (lang != null && !lang.isBlank()) ? lang : "en");
            body.add("temperature", "0");
            body.add("response_format", "json");

            RestClient restClient = restClientBuilder.build();
            String rawResponse = restClient.post()
                    .uri(localWhisperEndpoint)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(rawResponse);
            String text = root.has("text") ? root.path("text").asText("") : "";
            long duration = System.currentTimeMillis() - startTime;

            log.info("🔒 Local Whisper.cpp Transcribed ({}ms): \"{}\"", duration, text);
            return Map.of(
                    "text", text,
                    "status", "SUCCESS",
                    "sttProvider", "local",
                    "provider", "WHISPER_CPP_LOCAL",
                    "sttMs", String.valueOf(duration),
                    "latencyMs", String.valueOf(duration),
                    "promptUsed", String.valueOf(prompt != null && !prompt.isBlank())
            );
        } catch (Exception e) {
            log.error("⚠️ Local Whisper.cpp transcription error: {}", e.getMessage(), e);
            return Map.of("text", "", "status", "LOCAL_STT_ERROR", "message", e.getMessage());
        }
    }
}
