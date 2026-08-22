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
        String recommendedAction
) {
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
                "PROBE_DEEPER"
        );
    }
}