package com.interviewos.session.sandbox.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class Judge0Client {

    private final RestClient restClient;
    private final RestClient pingClient;
    private final ObjectMapper objectMapper;
    private final String judge0Url;

    public Judge0Client(
            @Value("${judge0.url:http://judge0:2358}") String judge0Url,
            @Value("${judge0.auth-token:}") String authToken,
            @Value("${judge0.wait-timeout-seconds:20}") int waitTimeoutSeconds,
            ObjectMapper objectMapper
    ) {
        this.judge0Url = judge0Url;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(waitTimeoutSeconds));

        RestClient.Builder builder = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl(judge0Url);

        if (authToken != null && !authToken.isBlank()) {
            builder.defaultHeader("X-Auth-Token", authToken);
        }

        this.restClient = builder.build();

        SimpleClientHttpRequestFactory pingFactory = new SimpleClientHttpRequestFactory();
        pingFactory.setConnectTimeout(Duration.ofSeconds(2));
        pingFactory.setReadTimeout(Duration.ofSeconds(2));

        this.pingClient = RestClient.builder()
                .requestFactory(pingFactory)
                .baseUrl(judge0Url)
                .build();
    }

    public boolean ping() {
        try {
            String resp = pingClient.get()
                    .uri("/system_info")
                    .retrieve()
                    .body(String.class);
            return resp != null && !resp.isBlank();
        } catch (Exception e) {
            try {
                // Fallback probe to /about or /
                String resp = pingClient.get()
                        .uri("/about")
                        .retrieve()
                        .body(String.class);
                return resp != null && !resp.isBlank();
            } catch (Exception ex) {
                return false;
            }
        }
    }

    public Optional<Judge0SubmissionResponse> submitAndAwait(Judge0SubmissionRequest request) {
        try {
            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("source_code", request.source_code());
            payloadMap.put("language_id", request.language_id());
            if (request.stdin() != null) payloadMap.put("stdin", request.stdin());
            if (request.expected_output() != null) payloadMap.put("expected_output", request.expected_output());
            if (request.cpu_time_limit() != null) payloadMap.put("cpu_time_limit", request.cpu_time_limit());
            if (request.memory_limit() != null) payloadMap.put("memory_limit", request.memory_limit());

            String jsonPayload = objectMapper.writeValueAsString(payloadMap);
            log.info("Sending payload to Judge0: {}", jsonPayload);

            String rawResponseBody = restClient.post()
                    .uri("/submissions?base64_encoded=false&wait=true")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jsonPayload)
                    .retrieve()
                    .body(String.class);

            if (rawResponseBody == null || rawResponseBody.isBlank()) {
                return Optional.empty();
            }

            Judge0SubmissionResponse response = objectMapper.readValue(rawResponseBody, Judge0SubmissionResponse.class);
            return Optional.ofNullable(response);
        } catch (Exception e) {
            log.warn("⚠️ Judge0 submission error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Judge0SubmissionRequest(
            @JsonProperty("source_code") String source_code,
            @JsonProperty("language_id") int language_id,
            @JsonProperty("stdin") String stdin,
            @JsonProperty("expected_output") String expected_output,
            @JsonProperty("cpu_time_limit") Double cpu_time_limit,
            @JsonProperty("memory_limit") Integer memory_limit
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Judge0SubmissionResponse(
            @JsonProperty("stdout") String stdout,
            @JsonProperty("stderr") String stderr,
            @JsonProperty("compile_output") String compile_output,
            @JsonProperty("message") String message,
            @JsonProperty("time") String time,
            @JsonProperty("memory") Double memory,
            @JsonProperty("status") Judge0Status status
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Judge0Status(
            @JsonProperty("id") int id,
            @JsonProperty("description") String description
    ) {}
}
