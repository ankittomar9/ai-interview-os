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
        List<String> evaluationCriteria,
        QuestionDocument.ExecutionLimits limits,
        String buildProfile
) {
    public static QuestionPublicView fromDocument(QuestionDocument doc) {
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
                .evaluationCriteria(doc.getEvaluationCriteria())
                .limits(doc.getLimits())
                .buildProfile(doc.getBuildProfile())
                .build();
    }
}
