package com.interviewos.ai.dto;

import java.util.List;

/**
 * AI interviewer feedback, conversational follow-up, and intent metadata.
 */
public record AiDialogueResponse(
        String interviewerReply,
        String followUpQuestion,
        boolean isSolutionComplete,
        String codeAnalysis,
        List<String> keyStrengths,
        List<String> areasToImprove,
        String detectedIntent,
        String turnSummary,
        String recommendedAction,
        String approachAssessment,
        List<Integer> usedFollowUpSeedIds
) {
    public AiDialogueResponse {
        if (usedFollowUpSeedIds == null) {
            usedFollowUpSeedIds = List.of();
        }
        if (approachAssessment == null || approachAssessment.isBlank()) {
            approachAssessment = "NOT_APPLICABLE";
        }
    }

    // 10-argument constructor for backwards compatibility
    public AiDialogueResponse(
            String interviewerReply,
            String followUpQuestion,
            boolean isSolutionComplete,
            String codeAnalysis,
            List<String> keyStrengths,
            List<String> areasToImprove,
            String detectedIntent,
            String turnSummary,
            String recommendedAction,
            String approachAssessment
    ) {
        this(
                interviewerReply,
                followUpQuestion,
                isSolutionComplete,
                codeAnalysis,
                keyStrengths,
                areasToImprove,
                detectedIntent,
                turnSummary,
                recommendedAction,
                approachAssessment,
                List.of()
        );
    }

    // 9-argument constructor for backwards compatibility
    public AiDialogueResponse(
            String interviewerReply,
            String followUpQuestion,
            boolean isSolutionComplete,
            String codeAnalysis,
            List<String> keyStrengths,
            List<String> areasToImprove,
            String detectedIntent,
            String turnSummary,
            String recommendedAction
    ) {
        this(
                interviewerReply,
                followUpQuestion,
                isSolutionComplete,
                codeAnalysis,
                keyStrengths,
                areasToImprove,
                detectedIntent,
                turnSummary,
                recommendedAction,
                "NOT_APPLICABLE",
                List.of()
        );
    }

    // Backwards-compatible 6-argument constructor
    public AiDialogueResponse(
            String interviewerReply,
            String followUpQuestion,
            boolean isSolutionComplete,
            String codeAnalysis,
            List<String> keyStrengths,
            List<String> areasToImprove
    ) {
        this(
                interviewerReply,
                followUpQuestion,
                isSolutionComplete,
                codeAnalysis,
                keyStrengths,
                areasToImprove,
                "EXPLAINING_APPROACH",
                "Candidate provided technical explanation.",
                "PROBE_DEEPER",
                "NOT_APPLICABLE",
                List.of()
        );
    }
}
