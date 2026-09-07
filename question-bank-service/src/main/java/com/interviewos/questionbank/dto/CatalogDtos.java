package com.interviewos.questionbank.dto;

import com.interviewos.questionbank.document.QuestionDocument;
import lombok.Builder;

import java.util.List;

public class CatalogDtos {

    @Builder
    public record TopicSummary(
            String id,
            String name,
            String track,
            int total,
            int solved
    ) {}

    @Builder
    public record QuestionSummary(
            String slug,
            String title,
            String track,
            String difficulty,
            List<String> topics,
            Integer estMinutes,
            String solutionVideoUrl
    ) {
        public static QuestionSummary fromDocument(QuestionDocument doc) {
            return QuestionSummary.builder()
                    .slug(doc.getSlug())
                    .title(doc.getTitle())
                    .track(doc.getTrack())
                    .difficulty(doc.getDifficulty())
                    .topics(doc.getTopics() != null ? doc.getTopics() : List.of())
                    .estMinutes(doc.getEstMinutes())
                    .solutionVideoUrl(doc.getSolutionVideoUrl())
                    .build();
        }
    }

    @Builder
    public record PagedResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {}

    @Builder
    public record QuestionDetail(
            String slug,
            String title,
            String track,
            String difficulty,
            List<String> topics,
            Integer estMinutes,
            String problemStatement,
            String starterCode,
            List<QuestionDocument.TestCase> sampleTests,
            List<HiddenTestCaseMeta> hiddenTests,
            String solutionVideoUrl,
            String solutionCode,
            String buildProfile,
            List<String> hints,
            List<String> constraints
    ) {
        public record HiddenTestCaseMeta(String name, int weight) {}

        public static QuestionDetail fromDocument(QuestionDocument doc, boolean revealSolution) {
            List<HiddenTestCaseMeta> hiddenMetas = doc.getHiddenTests() != null ?
                    doc.getHiddenTests().stream()
                            .map(ht -> new HiddenTestCaseMeta(ht.name(), ht.weight()))
                            .toList() : List.of();

            return QuestionDetail.builder()
                    .slug(doc.getSlug())
                    .title(doc.getTitle())
                    .track(doc.getTrack())
                    .difficulty(doc.getDifficulty())
                    .topics(doc.getTopics() != null ? doc.getTopics() : List.of())
                    .estMinutes(doc.getEstMinutes())
                    .problemStatement(doc.getProblemStatement())
                    .starterCode(doc.getStarterCode())
                    .sampleTests(doc.getSampleTests())
                    .hiddenTests(hiddenMetas)
                    .solutionVideoUrl(doc.getSolutionVideoUrl())
                    .solutionCode(revealSolution ? doc.getSolutionCode() : null)
                    .buildProfile(doc.getBuildProfile())
                    .hints(doc.getHints())
                    .constraints(doc.getConstraints())
                    .build();
        }
    }
}
