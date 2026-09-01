package com.interviewos.ai.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.interviewos.ai.dto.GenerateQuestionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Component
public class ProblemCatalogClient {

    private final RestClient restClient;

    public ProblemCatalogClient(
            @Value("${question.bank.url:http://question-bank-service:8086}") String questionBankUrl
    ) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .baseUrl(questionBankUrl)
                .build();
    }

    public Optional<QuestionMatchResult> matchQuestion(
            String track,
            String difficulty,
            List<String> resumeSkills,
            String jdText,
            String provider,
            String apiKey
    ) {
        try {
            Map<String, Object> body = Map.of(
                    "track", track != null ? track : "ALGORITHMS_DATA_STRUCTURES",
                    "difficulty", difficulty != null ? difficulty : "JUNIOR",
                    "resumeSkills", resumeSkills != null ? resumeSkills : List.of(),
                    "jdText", jdText != null ? jdText : "",
                    "provider", provider != null ? provider : "",
                    "apiKey", apiKey != null ? apiKey : ""
            );

            QuestionMatchResult resp = restClient.post()
                    .uri("/api/v1/questions/match")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(QuestionMatchResult.class);

            return Optional.ofNullable(resp);
        } catch (Exception e) {
            log.warn("⚠️ Failed to match question from Question Bank: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<QuestionFullDetail> getFullQuestionDetail(String slug) {
        try {
            QuestionFullDetail detail = restClient.get()
                    .uri("/internal/v1/questions/{slug}/full", slug)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(QuestionFullDetail.class);
            return Optional.ofNullable(detail);
        } catch (Exception e) {
            log.warn("⚠️ Failed to fetch full question detail for slug '{}': {}", slug, e.getMessage());
            return Optional.empty();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionMatchResult(
            QuestionPublicItem question,
            String rationale,
            boolean llmAssisted
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionPublicItem(
            String slug,
            String title,
            String track,
            String difficulty,
            List<String> tags,
            String problemStatement,
            String starterCode,
            Map<String, String> starterCodeMap,
            Map<String, String> starterFiles,
            List<String> editablePaths,
            List<GenerateQuestionResponse.TestCaseView> sampleTests,
            List<String> constraints,
            List<String> evaluationCriteria
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionFullDetail(
            String slug,
            String title,
            String track,
            String difficulty,
            String problemStatement,
            InterviewerNotesDto interviewerNotes,
            CoachingDto coaching
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record InterviewerNotesDto(
            List<String> expectedConcepts,
            List<String> followUpSeeds,
            List<String> rubricCheckpoints
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CoachingDto(
            List<String> commonMistakes,
            String modelAnswerOutline,
            List<String> presentationTips
    ) {}
}
