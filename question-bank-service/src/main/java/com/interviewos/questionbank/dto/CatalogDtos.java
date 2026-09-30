package com.interviewos.questionbank.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.document.ReferenceSolution;
import lombok.Builder;

import java.util.List;
import java.util.Map;

public class CatalogDtos {

    @Builder
    public record TopicSummary(
            String id,
            String name,
            String track,
            int total,
            int solved,
            List<QuestionDocument.ResourceItem> resources
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
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record QuestionDetail(
            String slug,
            String title,
            String track,
            String difficulty,
            List<String> topics,
            Integer estMinutes,
            String problemStatement,
            String statement,
            String starterCode,
            Map<String, String> starterFiles,
            List<QuestionDocument.TestCase> sampleTests,
            List<HiddenTestCaseMeta> hiddenTests,
            String solutionVideoUrl,
            String solutionCode,
            String solution,
            String solutionSql,
            Map<String, String> solutionFiles,
            List<ReferenceSolution> referenceSolutions,
            String editorialMarkdown,
            String buildProfile,
            List<String> hints,
            List<String> constraints,
            List<QuestionDocument.ResourceItem> resources
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
                    .statement(doc.getProblemStatement())
                    .starterCode(doc.getStarterCode())
                    .starterFiles(doc.getStarterFiles())
                    .sampleTests(doc.getSampleTests())
                    .hiddenTests(hiddenMetas)
                    .solutionVideoUrl(revealSolution ? doc.getSolutionVideoUrl() : null)
                    .solutionCode(revealSolution ? doc.getSolutionCode() : null)
                    .solution(revealSolution ? doc.getSolutionCode() : null)
                    .solutionSql(revealSolution ? doc.getSolutionSql() : null)
                    .solutionFiles(revealSolution ? doc.getSolutionFiles() : null)
                    .referenceSolutions(revealSolution ? ReferenceSolutionAdapter.resolve(doc) : null)
                    .editorialMarkdown(revealSolution ? doc.getEditorialMarkdown() : null)
                    .buildProfile(doc.getBuildProfile())
                    .hints(doc.getHints())
                    .constraints(doc.getConstraints())
                    .resources(doc.getResources() != null ? doc.getResources() : List.of())
                    .build();
        }
    }
}
