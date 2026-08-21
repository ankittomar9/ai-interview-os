package com.interviewos.session.sandbox.dto;

import jakarta.validation.constraints.NotBlank;

public record ExecuteCodeRequest(
        @NotBlank(message = "Programming language is required")
        String language,

        @NotBlank(message = "Code snippet is required")
        String codeSnippet,

        String problemSlug
) {}
