package com.interviewos.ai.dto;

import com.interviewos.ai.model.ModelProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Candidate interaction turn payload.
 */
public record AiDialogueRequest(
        @NotBlank(message = "Question context is required")
        String questionContext,

        String candidateExplanation,

        String candidateCode,

        List<ChatMessageDto> chatHistory,

        @NotNull(message = "Model provider is required")
        ModelProvider modelProvider,

        String apiKey,

        String modelName
) {
    public record ChatMessageDto(
            String role,     // "interviewer" or "candidate"
            String content
    ) {}
}