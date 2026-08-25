package com.interviewos.session.sandbox.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.interviewos.session.sandbox.document.ProblemDocument;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class QuestionBankClient {

    private final RestClient restClient;
    private final Map<String, CachedProblem> problemCache = new ConcurrentHashMap<>();
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    public QuestionBankClient(
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

    public Optional<ProblemDocument> fetchProblemBySlug(String slug) {
        if (slug == null || slug.isBlank()) return Optional.empty();

        CachedProblem cached = problemCache.get(slug.toLowerCase());
        if (cached != null && Duration.between(cached.cachedAt(), Instant.now()).compareTo(CACHE_TTL) < 0) {
            return Optional.of(cached.problem());
        }

        try {
            log.info("Fetching full question metadata from Question Bank for slug: '{}'", slug);
            QuestionFullViewDto dto = restClient.get()
                    .uri("/internal/v1/questions/{slug}/full", slug)
                    .retrieve()
                    .body(QuestionFullViewDto.class);

            if (dto != null && dto.slug() != null) {
                ProblemDocument problem = toProblemDocument(dto);
                problemCache.put(slug.toLowerCase(), new CachedProblem(Instant.now(), problem));
                return Optional.of(problem);
            }
        } catch (Exception e) {
            log.warn("⚠️ Question Bank retrieval failed for slug '{}': {}", slug, e.getMessage());
        }

        return Optional.empty();
    }

    public List<ProblemDocument> listProblems(String track, String difficulty) {
        try {
            List<QuestionPublicViewDto> list = restClient.get()
                    .uri(uriBuilder -> {
                        var b = uriBuilder.path("/api/v1/questions");
                        if (track != null && !track.isBlank()) b.queryParam("track", track);
                        if (difficulty != null && !difficulty.isBlank()) b.queryParam("difficulty", difficulty);
                        return b.build();
                    })
                    .retrieve()
                    .body(new ParameterizedTypeReference<List<QuestionPublicViewDto>>() {});

            if (list != null) {
                return list.stream().map(this::toPublicProblemDocument).toList();
            }
        } catch (Exception e) {
            log.warn("⚠️ Question Bank list failed: {}", e.getMessage());
        }
        return List.of();
    }

    private ProblemDocument toProblemDocument(QuestionFullViewDto dto) {
        Map<String, String> starterCode = new HashMap<>();
        if (dto.starterCodeMap() != null && !dto.starterCodeMap().isEmpty()) {
            starterCode.putAll(dto.starterCodeMap());
        } else if (dto.starterCode() != null && !dto.starterCode().isBlank()) {
            starterCode.put("java", dto.starterCode());
        }

        List<ProblemDocument.TestCase> sampleTests = new ArrayList<>();
        if (dto.sampleTests() != null) {
            dto.sampleTests().forEach(st -> sampleTests.add(new ProblemDocument.TestCase(st.name(), st.input(), st.expectedOutput())));
        }

        List<ProblemDocument.HiddenTestCase> hiddenTests = new ArrayList<>();
        if (dto.hiddenTests() != null) {
            dto.hiddenTests().forEach(ht -> hiddenTests.add(new ProblemDocument.HiddenTestCase(ht.name(), ht.input(), ht.expectedOutput(), ht.weight())));
        }

        ProblemDocument.ExecutionLimits limits = (dto.limits() != null)
                ? new ProblemDocument.ExecutionLimits(dto.limits().memoryLimitMb(), dto.limits().timeLimitMs())
                : new ProblemDocument.ExecutionLimits(512, 2000);

        return ProblemDocument.builder()
                .id(dto.id())
                .problemSlug(dto.slug())
                .title(dto.title())
                .track(dto.track())
                .difficulty(dto.difficulty())
                .problemStatement(dto.problemStatement())
                .starterCode(starterCode)
                .starterFiles(dto.starterFiles() != null ? dto.starterFiles() : Map.of())
                .editablePaths(dto.editablePaths() != null ? dto.editablePaths() : List.of())
                .hiddenTestFiles(dto.hiddenTestFiles() != null ? dto.hiddenTestFiles() : Map.of())
                .buildProfile(dto.buildProfile() != null ? dto.buildProfile() : "judge0")
                .dbEngine(dto.dbEngine() != null ? dto.dbEngine() : "postgres-13")
                .setupSql(dto.setupSql())
                .schemaMarkdown(dto.schemaMarkdown())
                .expectedCsv(dto.expectedCsv())
                .ordered(dto.ordered())
                .solutionSql(dto.solutionSql())
                .sampleTests(sampleTests)
                .hiddenTests(hiddenTests)
                .limits(limits)
                .build();
    }

    private ProblemDocument toPublicProblemDocument(QuestionPublicViewDto dto) {
        Map<String, String> starterCode = new HashMap<>();
        if (dto.starterCodeMap() != null && !dto.starterCodeMap().isEmpty()) {
            starterCode.putAll(dto.starterCodeMap());
        } else if (dto.starterCode() != null && !dto.starterCode().isBlank()) {
            starterCode.put("java", dto.starterCode());
        }

        List<ProblemDocument.TestCase> sampleTests = new ArrayList<>();
        if (dto.sampleTests() != null) {
            dto.sampleTests().forEach(st -> sampleTests.add(new ProblemDocument.TestCase(st.name(), st.input(), st.expectedOutput())));
        }

        ProblemDocument.ExecutionLimits limits = (dto.limits() != null)
                ? new ProblemDocument.ExecutionLimits(dto.limits().memoryLimitMb(), dto.limits().timeLimitMs())
                : new ProblemDocument.ExecutionLimits(512, 2000);

        return ProblemDocument.builder()
                .problemSlug(dto.slug())
                .title(dto.title())
                .track(dto.track())
                .difficulty(dto.difficulty())
                .problemStatement(dto.problemStatement())
                .starterCode(starterCode)
                .starterFiles(dto.starterFiles() != null ? dto.starterFiles() : Map.of())
                .editablePaths(dto.editablePaths() != null ? dto.editablePaths() : List.of())
                .buildProfile(dto.buildProfile() != null ? dto.buildProfile() : "judge0")
                .dbEngine(dto.dbEngine() != null ? dto.dbEngine() : "postgres-13")
                .schemaMarkdown(dto.schemaMarkdown())
                .expectedCsv(dto.expectedCsv())
                .ordered(dto.ordered())
                .solutionSql(dto.solutionSql())
                .sampleTests(sampleTests)
                .limits(limits)
                .build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionFullViewDto(
            String id,
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
            List<TestCaseDto> sampleTests,
            List<HiddenTestCaseDto> hiddenTests,
            Map<String, String> hiddenTestFiles,
            String buildProfile,
            String dbEngine,
            String setupSql,
            String schemaMarkdown,
            String expectedCsv,
            boolean ordered,
            String solutionSql,
            ExecutionLimitsDto limits
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record QuestionPublicViewDto(
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
            List<TestCaseDto> sampleTests,
            String buildProfile,
            String dbEngine,
            String schemaMarkdown,
            String expectedCsv,
            boolean ordered,
            String solutionSql,
            ExecutionLimitsDto limits
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TestCaseDto(String name, String input, String expectedOutput, String description) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record HiddenTestCaseDto(String name, String input, String expectedOutput, int weight) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ExecutionLimitsDto(int memoryLimitMb, int timeLimitMs) {}

    private record CachedProblem(Instant cachedAt, ProblemDocument problem) {}
}
