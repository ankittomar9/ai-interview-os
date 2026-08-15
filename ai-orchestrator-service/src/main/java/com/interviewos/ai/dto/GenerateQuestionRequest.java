package com.interviewos.ai.dto;

import com.interviewos.ai.model.DifficultyLevel;
import com.interviewos.ai.model.InterviewTrack;
import com.interviewos.ai.model.ModelProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * Request payload to synthesize a new interview question.
 */
public record GenerateQuestionRequest(
        @NotBlank(message = "Role title is required (e.g. Senior Java Backend Engineer)")
        String roleTitle,

        @NotNull(message = "Interview track is required")
        InterviewTrack track,

        @NotNull(message = "Difficulty level is required")
        DifficultyLevel difficulty,

        String jobDescription,

        List<String> previousQuestions,

        @NotNull(message = "Model provider is required")
        ModelProvider modelProvider,

        String apiKey,

        String modelName
) {}