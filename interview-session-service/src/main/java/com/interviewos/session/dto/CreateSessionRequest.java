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
        String mode
) {
    public CreateSessionRequest(
            String candidateId,
            String candidateName,
            String roleTitle,
            InterviewTrack track,
            DifficultyLevel difficulty,
            String targetCompany,
            String jobDescription
    ) {
        this(candidateId, candidateName, roleTitle, track, difficulty, targetCompany, jobDescription, "INTERVIEW");
    }

    public String getEffectiveMode() {
        return (mode != null && !mode.isBlank()) ? mode.trim().toUpperCase() : "INTERVIEW";
    }
}