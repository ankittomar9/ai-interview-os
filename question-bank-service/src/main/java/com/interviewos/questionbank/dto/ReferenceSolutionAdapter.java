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
                    .summary("Canonical relational query accepted in technical interviews.")
                    .keyIdea("Standard declarative solution satisfying all schema constraints.")
                    .tradeoffs(List.of("Direct query execution against relational schema"))
                    .whenToUse("Standard accepted interview solution.")
                    .timeComplexity("O(N)")
                    .spaceComplexity("O(1)")
                    .sql(doc.getSolutionSql())
                    .build();
        }

        if (doc.getSolutionFiles() != null && !doc.getSolutionFiles().isEmpty()) {
            return ReferenceSolution.builder()
                    .approachId("canonical-solution")
                    .label("Canonical Implementation")
                    .approachClass(ReferenceSolution.ApproachClass.PRIMARY)
                    .kind(ReferenceSolution.Kind.CODE)
                    .summary("Canonical modular solution accepted in technical interviews.")
                    .keyIdea("Standard object-oriented design satisfying all requirements.")
                    .tradeoffs(List.of("Clean encapsulation and separation of concerns"))
                    .whenToUse("Recommended standard interview implementation.")
                    .timeComplexity("O(N)")
                    .spaceComplexity("O(N)")
                    .files(doc.getSolutionFiles())
                    .build();
        }

        if (doc.getSolutionCode() != null && !doc.getSolutionCode().isBlank()) {
            return ReferenceSolution.builder()
                    .approachId("canonical-solution")
                    .label("Canonical Implementation")
                    .approachClass(ReferenceSolution.ApproachClass.PRIMARY)
                    .kind(ReferenceSolution.Kind.CODE)
                    .summary("Canonical solution accepted in technical interviews.")
                    .keyIdea("Standard optimal implementation.")
                    .tradeoffs(List.of("Optimal time and space complexity balance"))
                    .whenToUse("Recommended standard interview solution.")
                    .timeComplexity("O(N)")
                    .spaceComplexity("O(1)")
                    .code(doc.getSolutionCode())
                    .build();
        }

        return null;
    }
}
