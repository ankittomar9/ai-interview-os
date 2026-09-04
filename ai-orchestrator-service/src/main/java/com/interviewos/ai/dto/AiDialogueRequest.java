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

        ExecutionDto latestExecution,

        String sessionMode,

        IntegritySignals integritySignals,

        String candidateName,

        String currentStage,

        String sectionType,

        Integer sectionIndex,

        Integer totalSections,

        Integer softTimeBudgetMinutes,

        String sectionNote
) {
    public String getEffectiveMode() {
        return (sessionMode != null && !sessionMode.isBlank()) ? sessionMode.trim().toUpperCase() : "INTERVIEW";
    }

    public AiDialogueRequest(
            String questionContext,
            Long sessionId,
            String problemSlug,
            String candidateExplanation,
            String candidateCode,
            List<ChatMessageDto> chatHistory,
            ModelProvider modelProvider,
            String apiKey,
            String modelName,
            ExecutionDto latestExecution,
            String sessionMode,
            IntegritySignals integritySignals,
            String candidateName,
            String currentStage
    ) {
        this(questionContext, sessionId, problemSlug, candidateExplanation, candidateCode, chatHistory, modelProvider, apiKey, modelName, latestExecution, sessionMode, integritySignals, candidateName, currentStage, null, null, null, null, null);
    }

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
        this(questionContext, null, null, candidateExplanation, candidateCode, chatHistory, modelProvider, apiKey, modelName, null, "INTERVIEW", null, null, null, null, null, null, null, null);
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
        this(questionContext, null, problemSlug, candidateExplanation, candidateCode, chatHistory, modelProvider, apiKey, modelName, latestExecution, "INTERVIEW", null, null, null, null, null, null, null, null);
    }

    public AiDialogueRequest(
            String questionContext,
            Long sessionId,
            String problemSlug,
            String candidateExplanation,
            String candidateCode,
            List<ChatMessageDto> chatHistory,
            ModelProvider modelProvider,
            String apiKey,
            String modelName,
            ExecutionDto latestExecution
    ) {
        this(questionContext, sessionId, problemSlug, candidateExplanation, candidateCode, chatHistory, modelProvider, apiKey, modelName, latestExecution, "INTERVIEW", null, null, null, null, null, null, null, null);
    }

    public record ChatMessageDto(
            String role,     // "interviewer" or "candidate"
            String content
    ) {}

    public record IntegritySignals(
            Integer keystrokeCount,
            Integer avgKeystrokeIntervalMs,
            Integer keystrokeVariance,
            Integer estimatedWpm,
            Boolean suspiciousTyping,
            Integer copyCount,
            Integer pasteCount,
            Integer tabSwitchCount,
            Integer echoFilteredCount
    ) {}
}