package com.interviewos.questionbank.dto;

import com.interviewos.questionbank.document.QuestionDocument;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record QuestionFullView(
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
        List<QuestionDocument.TestCase> sampleTests,
        List<QuestionDocument.HiddenTestCase> hiddenTests,
        Map<String, String> hiddenTestFiles,
        String buildProfile,
        String dbEngine,
        String setupSql,
        String schemaMarkdown,
        String expectedCsv,
        boolean ordered,
        String solutionSql,
        QuestionDocument.ExecutionLimits limits,
        List<String> evaluationCriteria,
        QuestionDocument.InterviewerNotes interviewerNotes,
        QuestionDocument.CoachingContent coaching,
        String version,
        String status,
        String source
) {
    public static QuestionFullView fromDocument(QuestionDocument doc) {
        if (doc == null) return null;
        return QuestionFullView.builder()
                .id(doc.getId())
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
                .hiddenTests(doc.getHiddenTests())
                .hiddenTestFiles(doc.getHiddenTestFiles())
                .buildProfile(doc.getBuildProfile())
                .dbEngine(doc.getDbEngine())
                .setupSql(doc.getSetupSql())
                .schemaMarkdown(doc.getSchemaMarkdown())
                .expectedCsv(doc.getExpectedCsv())
                .ordered(doc.isOrdered())
                .solutionSql(doc.getSolutionSql())
                .limits(doc.getLimits())
                .evaluationCriteria(doc.getEvaluationCriteria())
                .interviewerNotes(doc.getInterviewerNotes())
                .coaching(doc.getCoaching())
                .version(doc.getVersion())
                .status(doc.getStatus())
                .source(doc.getSource())
                .build();
    }

    public QuestionDocument toDocument() {
        return QuestionDocument.builder()
                .id(this.id)
                .slug(this.slug)
                .title(this.title)
                .track(this.track)
                .difficulty(this.difficulty)
                .tags(this.tags)
                .problemStatement(this.problemStatement)
                .starterCode(this.starterCode)
                .starterCodeMap(this.starterCodeMap)
                .starterFiles(this.starterFiles)
                .editablePaths(this.editablePaths)
                .sampleTests(this.sampleTests)
                .hiddenTests(this.hiddenTests)
                .hiddenTestFiles(this.hiddenTestFiles)
                .buildProfile(this.buildProfile)
                .dbEngine(this.dbEngine)
                .setupSql(this.setupSql)
                .schemaMarkdown(this.schemaMarkdown)
                .expectedCsv(this.expectedCsv)
                .ordered(this.ordered)
                .solutionSql(this.solutionSql)
                .limits(this.limits)
                .evaluationCriteria(this.evaluationCriteria)
                .interviewerNotes(this.interviewerNotes)
                .coaching(this.coaching)
                .version(this.version != null ? this.version : "1.0.0")
                .status(this.status != null ? this.status : "PUBLISHED")
                .source(this.source != null ? this.source : "CORE")
                .build();
    }
}
