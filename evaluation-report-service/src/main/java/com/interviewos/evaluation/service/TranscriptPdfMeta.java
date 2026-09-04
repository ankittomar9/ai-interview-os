package com.interviewos.evaluation.service;

import com.interviewos.evaluation.entity.EvaluationReport;

public record TranscriptPdfMeta(
        String candidateId,
        Long sessionId,
        String track,
        int overallScore,
        String verdict,
        Integer echoFilteredCount,
        Integer droppedChunks,
        Integer consentDowngrades,
        String workspaceProvenance
) {
    public TranscriptPdfMeta(String candidateId, Long sessionId, String track, int overallScore, String verdict) {
        this(candidateId, sessionId, track, overallScore, verdict, 0, 0, 0, "LOCAL_SANDBOX");
    }

    public static TranscriptPdfMeta fromEntity(EvaluationReport report) {
        if (report == null) {
            return new TranscriptPdfMeta("N/A", null, "N/A", 0, "PENDING", 0, 0, 0, "LOCAL_SANDBOX");
        }
        return new TranscriptPdfMeta(
                report.getCandidateId() != null ? report.getCandidateId() : "N/A",
                report.getSessionId(),
                report.getTrack() != null ? report.getTrack() : "N/A",
                report.getOverallScore(),
                report.getVerdict() != null ? report.getVerdict().name() : "PENDING",
                report.getEchoFilteredCount() != null ? report.getEchoFilteredCount() : 0,
                report.getDroppedChunks() != null ? report.getDroppedChunks() : 0,
                report.getConsentDowngrades() != null ? report.getConsentDowngrades() : 0,
                report.getWorkspaceProvenance() != null ? report.getWorkspaceProvenance() : "LOCAL_SANDBOX"
        );
    }
}
