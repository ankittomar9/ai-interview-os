package com.interviewos.session.sandbox.client;

import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Optional;

@Slf4j
@Component
public class Judge0Client {

    private final RestClient restClient;

    public Judge0Client(
            @Value("${judge0.url:http://judge0:2358}") String judge0Url,
            @Value("${judge0.auth-token:}") String authToken
    ) {
        RestClient.Builder builder = RestClient.builder()
                .baseUrl(judge0Url);

        if (authToken != null && !authToken.isBlank()) {
            builder.defaultHeader("X-Auth-Token", authToken);
        }

        this.restClient = builder.build();
    }

    public Optional<Judge0SubmissionResponse> submitAndAwait(Judge0SubmissionRequest request) {
        try {
            Judge0SubmissionResponse response = restClient.post()
                    .uri("/submissions?base64_encoded=false&wait=true")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(Judge0SubmissionResponse.class);

            return Optional.ofNullable(response);
        } catch (Exception e) {
            log.warn("⚠️ Judge0 submission error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Builder
    public record Judge0SubmissionRequest(
            String source_code,
            int language_id,
            String stdin,
            String expected_output,
            Double cpu_time_limit,
            Integer memory_limit
    ) {}

    public record Judge0SubmissionResponse(
            String stdout,
            String stderr,
            String compile_output,
            String message,
            String time,
            Double memory,
            Judge0Status status
    ) {}

    public record Judge0Status(
            int id,
            String description
    ) {}
}
