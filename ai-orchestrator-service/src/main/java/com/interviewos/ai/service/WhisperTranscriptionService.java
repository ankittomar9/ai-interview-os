package com.interviewos.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhisperTranscriptionService {

    private final RestClient.Builder restClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${ai.providers.groq.api-key:${GROQ_API_KEY:}}")
    private String defaultGroqApiKey;

    private static final String GROQ_WHISPER_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String DEFAULT_WHISPER_MODEL = "whisper-large-v3-turbo";

    /**
     * Transcribes candidate audio into high-fidelity text using Groq Whisper LPU.
     */
    public Map<String, String> transcribeAudio(MultipartFile audioFile, String customApiKey, String customModel) {
        String apiKey = (customApiKey != null && !customApiKey.isBlank()) ? customApiKey : defaultGroqApiKey;
        if (apiKey == null || apiKey.isBlank()) {
            String envKey = System.getenv("GROQ_API_KEY");
            if (envKey != null && !envKey.isBlank()) {
                apiKey = envKey.trim();
            }
        }
        String model = (customModel != null && !customModel.isBlank()) ? customModel : DEFAULT_WHISPER_MODEL;

        if (apiKey == null || apiKey.isBlank()) {
            log.warn("⚠️ No Groq API Key provided for Whisper transcription. Provide key via BYOK, header, or GROQ_API_KEY env.");
            return Map.of("text", "", "status", "MISSING_API_KEY");
        }

        try {
            long startTime = System.currentTimeMillis();
            String fileName = (audioFile.getOriginalFilename() != null && !audioFile.getOriginalFilename().isBlank())
                    ? audioFile.getOriginalFilename() : "candidate_speech.webm";

            ByteArrayResource audioResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() {
                    return fileName;
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", audioResource);
            body.add("model", model);
            body.add("language", "en");
            body.add("response_format", "json");

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
            return Map.of("text", transcript, "status", "SUCCESS", "latencyMs", String.valueOf(duration), "model", model);

        } catch (Exception e) {
            log.error("⚠️ Groq Whisper transcription error: {}", e.getMessage(), e);
            return Map.of("text", "", "status", "ERROR", "message", e.getMessage());
        }
    }
}
