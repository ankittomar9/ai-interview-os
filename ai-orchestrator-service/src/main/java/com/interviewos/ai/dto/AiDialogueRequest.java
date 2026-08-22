package com.interviewos.ai.dto;

import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.rubric.dto.ExecutionDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.List;

/**
 * Candidate interaction turn payload.
 */
@Builder
public record AiDialogueRequest(
        @NotBlank(message = "Question context is required")
        String questionContext,

        String problemSlug,

        String candidateExplanation,

        String candidateCode,

        List<ChatMessageDto> chatHistory,

        @NotNull(message = "Model provider is required")
        ModelProvider modelProvider,

        String apiKey,

        String modelName,

        ExecutionDto latestExecution
) {
    // Backwards-compatible constructor for testing
    public AiDialogueRequest(
            String questionContext,
            String candidateExplanation,
            String candidateCode,
            List<ChatMessageDto> chatHistory,
            ModelProvider modelProvider,
            String apiKey,
            String modelName
    ) {
        this(questionContext, null, candidateExplanation, candidateCode, chatHistory, modelProvider, apiKey, modelName, null);
    }

    public record ChatMessageDto(
            String role,     // "interviewer" or "candidate"
            String content
    ) {}
}