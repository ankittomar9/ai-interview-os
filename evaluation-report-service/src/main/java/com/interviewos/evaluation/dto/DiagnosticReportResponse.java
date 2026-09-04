package com.interviewos.evaluation.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.evaluation.client.AiRubricClient.DimensionScoreDto;
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
        List<DimensionScoreDto> dimensions,
        boolean llmGenerated,
        Integer requirementsClarityScore,
        Instant generatedAt,
        IntegritySummaryDto integrity
) {
    public DiagnosticReportResponse(
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
            List<DimensionScoreDto> dimensions,
            boolean llmGenerated,
            Integer requirementsClarityScore,
            Instant generatedAt
    ) {
        this(reportId, sessionId, candidateId, roleTitle, track, difficulty, verdict, overallScore, scorecard,
                executiveSummary, keyStrengths, areasForImprovement, sevenDayStudyPlan, dimensions, llmGenerated,
                requirementsClarityScore, generatedAt, new IntegritySummaryDto(0, 0, 0, "LOCAL_SANDBOX"));
    }

    public record ScorecardBreakdown(
            int technicalAccuracy,
            int problemSolving,
            int communicationClarity,
            int codeQuality,
            int integrityScore,
            int requirementsClarification
    ) {}

    public record IntegritySummaryDto(
            int echoFilteredCount,
            int droppedChunks,
            int consentDowngrades,
            String workspaceProvenance
    ) {}

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static DiagnosticReportResponse fromEntity(EvaluationReport r) {
        int reqScore = r.getRequirementsClarificationScore() != null ? r.getRequirementsClarificationScore() : 40;
        ScorecardBreakdown breakdown = new ScorecardBreakdown(
                r.getTechnicalAccuracyScore(),
                r.getProblemSolvingScore(),
                r.getCommunicationClarityScore(),
                r.getCodeQualityScore(),
                r.getIntegrityScore(),
                reqScore
        );

        List<DimensionScoreDto> dimensions = List.of();
        if (r.getRubricJson() != null && !r.getRubricJson().isBlank()) {
            try {
                dimensions = MAPPER.readValue(r.getRubricJson(), new TypeReference<List<DimensionScoreDto>>() {});
            } catch (Exception ignored) {}
        }

        IntegritySummaryDto integrity = new IntegritySummaryDto(
                r.getEchoFilteredCount() != null ? r.getEchoFilteredCount() : 0,
                r.getDroppedChunks() != null ? r.getDroppedChunks() : 0,
                r.getConsentDowngrades() != null ? r.getConsentDowngrades() : 0,
                r.getWorkspaceProvenance() != null ? r.getWorkspaceProvenance() : "LOCAL_SANDBOX"
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
                dimensions,
                Boolean.TRUE.equals(r.getRubricLlmGenerated()),
                r.getRequirementsClarificationScore(),
                r.getGeneratedAt(),
                integrity
        );
    }
}