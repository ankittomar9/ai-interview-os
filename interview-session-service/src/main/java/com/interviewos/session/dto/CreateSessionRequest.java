package com.interviewos.session.dto;

import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSessionRequest(
        @NotBlank(message = "Candidate ID is required")
        String candidateId,

        String candidateName,

        @NotBlank(message = "Role title is required")
        String roleTitle,

        @NotNull(message = "Interview track is required")
        InterviewTrack track,

        @NotNull(message = "Difficulty level is required")
        DifficultyLevel difficulty,

        String targetCompany,
        String jobDescription,
        String mode,
        String planSource
) {
    public CreateSessionRequest(
            String candidateId,
            String candidateName,
            String roleTitle,
            InterviewTrack track,
            DifficultyLevel difficulty,
            String targetCompany,
            String jobDescription,
            String mode
    ) {
        this(candidateId, candidateName, roleTitle, track, difficulty, targetCompany, jobDescription, mode, "SETUP_SELECTION");
    }

    public CreateSessionRequest(
            String candidateId,
            String candidateName,
            String roleTitle,
            InterviewTrack track,
            DifficultyLevel difficulty,
            String targetCompany,
            String jobDescription
    ) {
        this(candidateId, candidateName, roleTitle, track, difficulty, targetCompany, jobDescription, "INTERVIEW", "SETUP_SELECTION");
    }

    public String getEffectiveMode() {
        return (mode != null && !mode.isBlank()) ? mode.trim().toUpperCase() : "INTERVIEW";
    }

    public String getEffectivePlanSource() {
        return (planSource != null && !planSource.isBlank()) ? planSource.trim() : "SETUP_SELECTION";
    }
}