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
        Instant generatedAt
) {
    public record ScorecardBreakdown(
            int technicalAccuracy,
            int problemSolving,
            int communicationClarity,
            int codeQuality,
            int integrityScore,
            int requirementsClarification
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
                r.getGeneratedAt()
        );
    }
}