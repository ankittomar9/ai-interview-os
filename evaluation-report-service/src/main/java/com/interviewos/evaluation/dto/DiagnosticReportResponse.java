package com.interviewos.evaluation.dto;

import com.interviewos.evaluation.entity.EvaluationReport;
import com.interviewos.evaluation.model.HiringVerdict;

import java.time.Instant;
import java.util.List;

public record DiagnosticReportResponse(
        Long reportId,
        Long sessionId,
        String candidateId,
        String roleTitle,
        String track,
        String difficulty,
        HiringVerdict verdict,
        int overallScore,
        ScorecardBreakdown scorecard,
        String executiveSummary,
        List<String> keyStrengths,
        List<String> areasForImprovement,
        List<String> sevenDayStudyPlan,
        Instant generatedAt
) {
    public record ScorecardBreakdown(
            int technicalAccuracy,
            int problemSolving,
            int communicationClarity,
            int codeQuality,
            int integrityScore
    ) {}

    public static DiagnosticReportResponse fromEntity(EvaluationReport r) {
        ScorecardBreakdown breakdown = new ScorecardBreakdown(
                r.getTechnicalAccuracyScore(),
                r.getProblemSolvingScore(),
                r.getCommunicationClarityScore(),
                r.getCodeQualityScore(),
                r.getIntegrityScore()
        );

        return new DiagnosticReportResponse(
                r.getId(),
                r.getSessionId(),
                r.getCandidateId(),
                r.getRoleTitle(),
                r.getTrack(),
                r.getDifficulty(),
                r.getVerdict(),
                r.getOverallScore(),
                breakdown,
                r.getExecutiveSummary(),
                r.getKeyStrengths(),
                r.getAreasForImprovement(),
                r.getSevenDayStudyPlan(),
                r.getGeneratedAt()
        );
    }
}