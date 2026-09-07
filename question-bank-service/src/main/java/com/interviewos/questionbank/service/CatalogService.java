package com.interviewos.questionbank.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.dto.CatalogDtos.*;
import com.interviewos.questionbank.repository.QuestionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogService {

    private final QuestionRepository questionRepository;
    private final List<TopicMetadata> taxonomyTopics = new ArrayList<>();

    public record TopicMetadata(String id, String name, String track) {}

    @PostConstruct
    public void initTaxonomy() {
        try {
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource resource = resolver.getResource("classpath:content/questions/_taxonomy.yaml");
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
                    Map<String, Object> map = yamlMapper.readValue(is, new TypeReference<>() {});
                    if (map.get("topics") instanceof List<?> list) {
                        for (Object item : list) {
                            if (item instanceof Map<?, ?> m) {
                                String id = m.get("id") != null ? m.get("id").toString() : "";
                                String name = m.get("name") != null ? m.get("name").toString() : id;
                                String track = m.get("track") != null ? m.get("track").toString() : "ALGORITHMS_DATA_STRUCTURES";
                                taxonomyTopics.add(new TopicMetadata(id, name, track));
                            }
                        }
                    }
                }
            }
            log.info("Loaded {} taxonomy topics into CatalogService", taxonomyTopics.size());
        } catch (Exception e) {
            log.error("Failed to load _taxonomy.yaml: {}", e.getMessage());
        }
    }

    public List<TopicSummary> getTopics(String track) {
        List<QuestionDocument> allQuestions = questionRepository.findByStatus("PUBLISHED");

        Map<String, Integer> topicCounts = new HashMap<>();
        for (QuestionDocument doc : allQuestions) {
            if (doc.getTopics() != null) {
                for (String t : doc.getTopics()) {
                    topicCounts.put(t, topicCounts.getOrDefault(t, 0) + 1);
                }
            }
        }

        String normalizedTrack = normalizeTrack(track);

        return taxonomyTopics.stream()
                .filter(t -> normalizedTrack == null || normalizedTrack.equalsIgnoreCase(t.track()))
                .map(t -> TopicSummary.builder()
                        .id(t.id())
                        .name(t.name())
                        .track(t.track())
                        .total(topicCounts.getOrDefault(t.id(), 0))
                        .solved(0)
                        .build())
                .toList();
    }

    public PagedResponse<QuestionSummary> getQuestions(
            String track,
            String topic,
            String difficulty,
            String q,
            int page,
            int size
    ) {
        List<QuestionDocument> docs = questionRepository.findByStatus("PUBLISHED");

        // Filter track
        String normalizedTrack = normalizeTrack(track);
        if (normalizedTrack != null && !normalizedTrack.isBlank()) {
            docs = docs.stream()
                    .filter(d -> normalizedTrack.equalsIgnoreCase(d.getTrack()))
                    .toList();
        }

        // Filter topic
        if (topic != null && !topic.isBlank()) {
            String topicTrimmed = topic.trim().toLowerCase();
            docs = docs.stream()
                    .filter(d -> d.getTopics() != null && d.getTopics().stream().anyMatch(t -> t.equalsIgnoreCase(topicTrimmed)))
                    .toList();
        }

        // Filter difficulty
        if (difficulty != null && !difficulty.isBlank()) {
            String diffNorm = normalizeDifficulty(difficulty);
            docs = docs.stream()
                    .filter(d -> {
                        String docDiff = normalizeDifficulty(d.getDifficulty());
                        return diffNorm.equalsIgnoreCase(docDiff);
                    })
                    .toList();
        }

        // Filter search query
        if (q != null && !q.isBlank()) {
            String qLower = q.trim().toLowerCase();
            docs = docs.stream()
                    .filter(d -> (d.getTitle() != null && d.getTitle().toLowerCase().contains(qLower)) ||
                                 (d.getSlug() != null && d.getSlug().toLowerCase().contains(qLower)))
                    .toList();
        }

        int totalElements = docs.size();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, size);
        int totalPages = (int) Math.ceil((double) totalElements / safeSize);

        int fromIndex = safePage * safeSize;
        List<QuestionSummary> content;
        if (fromIndex >= totalElements) {
            content = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + safeSize, totalElements);
            content = docs.subList(fromIndex, toIndex).stream()
                    .map(QuestionSummary::fromDocument)
                    .toList();
        }

        return PagedResponse.<QuestionSummary>builder()
                .content(content)
                .page(safePage)
                .size(safeSize)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .build();
    }

    public Optional<QuestionDetail> getQuestionDetail(String slug, boolean revealSolution) {
        return questionRepository.findBySlug(slug)
                .map(d -> QuestionDetail.fromDocument(d, revealSolution));
    }

    private String normalizeTrack(String track) {
        if (track == null || track.isBlank()) return null;
        String t = track.trim().toUpperCase();
        return switch (t) {
            case "DSA", "ALGORITHMS", "ALGO" -> "ALGORITHMS_DATA_STRUCTURES";
            case "LLD", "SPRING_LLD" -> "SPRING_LLD";
            case "HLD", "SYSTEM_DESIGN" -> "SYSTEM_DESIGN";
            case "SQL" -> "SQL";
            case "BEHAVIORAL", "BEHAVIORAL_STAR" -> "BEHAVIORAL_STAR";
            default -> t;
        };
    }

    private String normalizeDifficulty(String diff) {
        if (diff == null) return "";
        String d = diff.trim().toUpperCase();
        return switch (d) {
            case "JUNIOR", "EASY" -> "EASY";
            case "MID", "MEDIUM" -> "MEDIUM";
            case "SENIOR", "STAFF", "HARD" -> "HARD";
            default -> d;
        };
    }
}
