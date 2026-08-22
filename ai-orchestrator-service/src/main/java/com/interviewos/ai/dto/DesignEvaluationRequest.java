package com.interviewos.ai.dto;

import com.interviewos.ai.model.ModelProvider;
import jakarta.validation.constraints.NotNull;

public record DesignEvaluationRequest(
        @NotNull(message = "sessionId is required")
        Long sessionId,

        String canvasJsonAttachmentId,
        String pngAttachmentId,
        DesignRequirements requirements,
        ModelProvider modelProvider,
        String apiKey
) {
    public record DesignRequirements(
            String dau,
            String peakFactor,
            String readWriteRatio
    ) {}
}
