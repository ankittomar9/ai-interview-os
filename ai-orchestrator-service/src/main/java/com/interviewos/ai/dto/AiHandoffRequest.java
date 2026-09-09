package com.interviewos.ai.dto;

import com.interviewos.ai.model.ModelProvider;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record AiHandoffRequest(
        @NotNull(message = "Session ID is required")
        Long sessionId,

        String fromSectionType,

        @NotNull(message = "To section type is required")
        String toSectionType,

        String toSectionTitle,

        Boolean toSectionGated,

        String candidateName,

        String apiKey,

        ModelProvider modelProvider,

        String modelName
) {}
