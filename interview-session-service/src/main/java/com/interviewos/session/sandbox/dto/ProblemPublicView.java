package com.interviewos.session.sandbox.dto;

import com.interviewos.session.sandbox.document.ProblemDocument;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record ProblemPublicView(
        String problemSlug,
        String title,
        String track,
        String difficulty,
        String problemStatement,
        Map<String, String> starterCode,
        Map<String, String> starterFiles,
        List<String> editablePaths,
        String buildProfile,
        List<ProblemDocument.TestCase> sampleTests,
        ProblemDocument.ExecutionLimits limits
) {
    public static ProblemPublicView fromDocument(ProblemDocument doc) {
        return ProblemPublicView.builder()
                .problemSlug(doc.getProblemSlug())
                .title(doc.getTitle())
                .track(doc.getTrack())
                .difficulty(doc.getDifficulty())
                .problemStatement(doc.getProblemStatement())
                .starterCode(doc.getStarterCode())
                .starterFiles(doc.getStarterFiles())
                .editablePaths(doc.getEditablePaths())
                .buildProfile(doc.getBuildProfile())
                .sampleTests(doc.getSampleTests())
                .limits(doc.getLimits())
                .build();
    }
}
