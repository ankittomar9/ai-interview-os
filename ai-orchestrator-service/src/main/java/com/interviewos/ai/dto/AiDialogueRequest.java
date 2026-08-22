package com.interviewos.ai.dto;

import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.rubric.dto.ExecutionDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.List;

/**
 * Candidate interaction turn payload with session memory linkage.
 */
@Builder
public record AiDialogueRequest(
        @NotBlank(message = "Question context is required")
        String questionContext,

        Long sessionId,

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
    // Backwards-compatible constructor for testing & older callers
    public AiDialogueRequest(
            String questionContext,
            String candidateExplanation,
            String candidateCode,
            List<ChatMessageDto> chatHistory,
            ModelProvider modelProvider,
            String apiKey,
            String modelName
    ) {
        this(questionContext, null, null, candidateExplanation, candidateCode, chatHistory, modelProvider, apiKey, modelName, null);
    }

    public AiDialogueRequest(
            String questionContext,
            String problemSlug,
            String candidateExplanation,
            String candidateCode,
            List<ChatMessageDto> chatHistory,
            ModelProvider modelProvider,
            String apiKey,
            String modelName,
            ExecutionDto latestExecution
    ) {
        this(questionContext, null, problemSlug, candidateExplanation, candidateCode, chatHistory, modelProvider, apiKey, modelName, latestExecution);
    }

    public record ChatMessageDto(
            String role,     // "interviewer" or "candidate"
            String content
    ) {}
}