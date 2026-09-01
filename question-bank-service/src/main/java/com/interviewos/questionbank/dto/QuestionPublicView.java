package com.interviewos.questionbank.dto;

import com.interviewos.questionbank.document.QuestionDocument;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record QuestionPublicView(
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
        List<QuestionDocument.TestCase> sampleTests,
        List<QuestionDocument.HiddenTestCase> hiddenTests,
        List<String> evaluationCriteria,
        List<String> constraints,
        List<String> hints,
        QuestionDocument.CoachingContent coaching,
        String editorialMarkdown,
        String solutionCode,
        QuestionDocument.ExecutionLimits limits,
        String buildProfile,
        String dbEngine,
        String schemaMarkdown,
        String expectedCsv,
        boolean ordered,
        String solutionSql
) {
    public static QuestionPublicView fromDocument(QuestionDocument doc) {
        return fromDocument(doc, false);
    }

    public static QuestionPublicView fromDocument(QuestionDocument doc, boolean isInterviewMode) {
        if (doc == null) return null;
        return QuestionPublicView.builder()
                .slug(doc.getSlug())
                .title(doc.getTitle())
                .track(doc.getTrack())
                .difficulty(doc.getDifficulty())
                .tags(doc.getTags())
                .problemStatement(doc.getProblemStatement())
                .starterCode(doc.getStarterCode())
                .starterCodeMap(doc.getStarterCodeMap())
                .starterFiles(doc.getStarterFiles())
                .editablePaths(doc.getEditablePaths())
                .sampleTests(doc.getSampleTests())
                .hiddenTests(isInterviewMode ? List.of() : doc.getHiddenTests())
                .evaluationCriteria(doc.getEvaluationCriteria())
                .constraints(doc.getConstraints())
                .hints(doc.getHints())
                .coaching(doc.getCoaching())
                .editorialMarkdown(isInterviewMode ? null : doc.getEditorialMarkdown())
                .solutionCode(isInterviewMode ? null : doc.getSolutionCode())
                .limits(doc.getLimits())
                .buildProfile(doc.getBuildProfile())
                .dbEngine(doc.getDbEngine())
                .schemaMarkdown(doc.getSchemaMarkdown())
                .expectedCsv(doc.getExpectedCsv())
                .ordered(doc.isOrdered())
                .solutionSql(isInterviewMode ? null : doc.getSolutionSql())
                .build();
    }
}
