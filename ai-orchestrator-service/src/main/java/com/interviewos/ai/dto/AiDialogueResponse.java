package com.interviewos.ai.dto;

import java.util.List;

/**
 * AI interviewer feedback and conversational follow-up.
 */
public record AiDialogueResponse(
        String interviewerReply,
        String followUpQuestion,
        boolean isSolutionComplete,
        String codeAnalysis,
        List<String> keyStrengths,
        List<String> areasToImprove
) {}