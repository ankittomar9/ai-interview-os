package com.interviewos.evaluation.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.evaluation.dto.DiagnosticReportResponse.PlanVsActualEntryDto;
import com.interviewos.evaluation.entity.EvaluationReport;

import java.util.List;

public record TranscriptPdfMeta(
        String candidateId,
        Long sessionId,
        String track,
        int overallScore,
        String verdict,
        Integer echoFilteredCount,
        Integer droppedChunks,
        Integer consentDowngrades,
        String workspaceProvenance,
        List<PlanVsActualEntryDto> planVsActual
) {
    public TranscriptPdfMeta(
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
        this(candidateId, sessionId, track, overallScore, verdict, echoFilteredCount, droppedChunks, consentDowngrades, workspaceProvenance, List.of());
    }

    public TranscriptPdfMeta(String candidateId, Long sessionId, String track, int overallScore, String verdict) {
        this(candidateId, sessionId, track, overallScore, verdict, 0, 0, 0, "LOCAL_SANDBOX", List.of());
    }

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static TranscriptPdfMeta fromEntity(EvaluationReport report) {
        if (report == null) {
            return new TranscriptPdfMeta("N/A", null, "N/A", 0, "PENDING", 0, 0, 0, "LOCAL_SANDBOX", List.of());
        }
        List<PlanVsActualEntryDto> planVsActual = List.of();
        if (report.getPlanVsActualJson() != null && !report.getPlanVsActualJson().isBlank()) {
            try {
                planVsActual = MAPPER.readValue(report.getPlanVsActualJson(), new TypeReference<List<PlanVsActualEntryDto>>() {});
            } catch (Exception ignored) {}
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
                report.getWorkspaceProvenance() != null ? report.getWorkspaceProvenance() : "LOCAL_SANDBOX",
                planVsActual
        );
    }
}
