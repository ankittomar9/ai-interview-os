package com.interviewos.session.sandbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record ExecuteProjectRequest(
        @NotBlank(message = "Problem slug is required")
        String problemSlug,

        @NotNull(message = "Candidate project files map is required")
        Map<String, String> files
) {}
