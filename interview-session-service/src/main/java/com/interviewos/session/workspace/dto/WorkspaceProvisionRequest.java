package com.interviewos.session.workspace.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkspaceProvisionRequest(
        @NotBlank(message = "Problem slug is required")
        String problemSlug
) {}
