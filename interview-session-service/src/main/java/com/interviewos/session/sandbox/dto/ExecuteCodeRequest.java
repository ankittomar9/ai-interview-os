package com.interviewos.session.sandbox.dto;

import jakarta.validation.constraints.NotBlank;

public record ExecuteCodeRequest(
        @NotBlank(message = "Programming language is required")
        String language,

        @NotBlank(message = "Code snippet is required")
        String codeSnippet,

        String problemSlug,

        Boolean submit
) {
    public ExecuteCodeRequest(String language, String codeSnippet, String problemSlug) {
        this(language, codeSnippet, problemSlug, false);
    }

    public boolean isSubmit() {
        return Boolean.TRUE.equals(submit);
    }
}
