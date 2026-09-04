package com.interviewos.evaluation.service;

import com.interviewos.evaluation.entity.EvaluationReport;

public record TranscriptPdfMeta(
        String candidateId,
        Long sessionId,
        String track,
        int overallScore,
        String verdict
) {
    public static TranscriptPdfMeta fromEntity(EvaluationReport report) {
        if (report == null) {
            return new TranscriptPdfMeta("N/A", null, "N/A", 0, "PENDING");
        }
        return new TranscriptPdfMeta(
                report.getCandidateId() != null ? report.getCandidateId() : "N/A",
                report.getSessionId(),
                report.getTrack() != null ? report.getTrack() : "N/A",
                report.getOverallScore(),
                report.getVerdict() != null ? report.getVerdict().name() : "PENDING"
        );
    }
}
