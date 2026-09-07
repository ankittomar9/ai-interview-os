package com.interviewos.session.dto;

import com.interviewos.session.model.InterviewTrack;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CustomDomainConfig(
        @NotNull(message = "Custom domain track is required")
        InterviewTrack domain,

        @Min(value = 10, message = "Domain duration must be at least 10 minutes")
        @Max(value = 60, message = "Domain duration cannot exceed 60 minutes")
        int durationMinutes
) {}
