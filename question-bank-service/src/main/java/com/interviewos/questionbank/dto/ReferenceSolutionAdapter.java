package com.interviewos.questionbank.dto;

import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.document.ReferenceSolution;

import java.util.List;

/**
 * Backward-compatibility adapter for ReferenceSolution (view layer only).
 * If a QuestionDocument contains referenceSolutions, they are returned in order.
 * If empty but legacy solutionCode, solutionSql, or solutionFiles exist, synthesizes exactly one PRIMARY approach.
 * Stored documents are never modified.
 */
public class ReferenceSolutionAdapter {

    public static List<ReferenceSolution> resolve(QuestionDocument doc) {
        if (doc == null) {
            return List.of();
        }
        if (doc.getReferenceSolutions() != null && !doc.getReferenceSolutions().isEmpty()) {
            return doc.getReferenceSolutions();
        }

        ReferenceSolution synthesized = synthesizeFromLegacy(doc);
        return synthesized != null ? List.of(synthesized) : List.of();
    }

    public static ReferenceSolution synthesizeFromLegacy(QuestionDocument doc) {
        if (doc == null) {
            return null;
        }

        if (doc.getSolutionSql() != null && !doc.getSolutionSql().isBlank()) {
            return ReferenceSolution.builder()
                    .approachId("canonical-sql")
                    .label("Canonical SQL Query")
                    .approachClass(ReferenceSolution.ApproachClass.PRIMARY)
                    .kind(ReferenceSolution.Kind.SQL)
                    .summary("Legacy canonical SQL query from question bank.")
                    .keyIdea("Declarative relational query solution.")
                    .tradeoffs(List.of())
                    .whenToUse(null)
                    .timeComplexity(null)
                    .spaceComplexity(null)
                    .sql(doc.getSolutionSql())
                    .build();
        }

        if (doc.getSolutionFiles() != null && !doc.getSolutionFiles().isEmpty()) {
            return ReferenceSolution.builder()
                    .approachId("canonical-solution")
                    .label("Canonical Implementation")
                    .approachClass(ReferenceSolution.ApproachClass.PRIMARY)
                    .kind(ReferenceSolution.Kind.CODE)
                    .summary("Legacy canonical modular implementation from question bank.")
                    .keyIdea("Multi-file reference implementation.")
                    .tradeoffs(List.of())
                    .whenToUse(null)
                    .timeComplexity(null)
                    .spaceComplexity(null)
                    .files(doc.getSolutionFiles())
                    .build();
        }

        if (doc.getSolutionCode() != null && !doc.getSolutionCode().isBlank()) {
            return ReferenceSolution.builder()
                    .approachId("canonical-solution")
                    .label("Canonical Implementation")
                    .approachClass(ReferenceSolution.ApproachClass.PRIMARY)
                    .kind(ReferenceSolution.Kind.CODE)
                    .summary("Legacy canonical solution from question bank.")
                    .keyIdea("Reference implementation from question bank.")
                    .tradeoffs(List.of())
                    .whenToUse(null)
                    .timeComplexity(null)
                    .spaceComplexity(null)
                    .code(doc.getSolutionCode())
                    .build();
        }

        return null;
    }
}
