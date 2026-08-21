package com.interviewos.ai.client;

import com.interviewos.ai.dto.GenerateQuestionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class ProblemCatalogClient {

    private final RestClient restClient;

    public ProblemCatalogClient(
            @Value("${session.service.url:http://interview-session-service:8081}") String sessionServiceUrl
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(sessionServiceUrl)
                .build();
    }

    public List<ProblemCatalogItem> fetchProblems(String track, String difficulty) {
        try {
            return restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/v1/problems")
                            .queryParam("track", track != null ? track : "")
                            .queryParam("difficulty", difficulty != null ? difficulty : "")
                            .build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<ProblemCatalogItem>>() {});
        } catch (Exception e) {
            log.warn("⚠️ Failed to fetch problem catalog from session service: {}", e.getMessage());
            return List.of();
        }
    }

    public Optional<ProblemCatalogItem> getProblemBySlug(String slug) {
        try {
            ProblemCatalogItem item = restClient.get()
                    .uri("/api/v1/problems/{slug}", slug)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(ProblemCatalogItem.class);
            return Optional.ofNullable(item);
        } catch (Exception e) {
            log.warn("⚠️ Failed to fetch problem by slug '{}': {}", slug, e.getMessage());
            return Optional.empty();
        }
    }

    public record ProblemCatalogItem(
            String problemSlug,
            String title,
            String track,
            String difficulty,
            String problemStatement,
            Map<String, String> starterCode,
            List<GenerateQuestionResponse.TestCaseView> sampleTests
    ) {}
}
