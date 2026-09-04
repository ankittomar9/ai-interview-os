package com.interviewos.session.sandbox.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

public record ExecuteProjectRequest(
        @NotBlank(message = "Problem slug is required")
        String problemSlug,

        Map<String, String> files,

        String source,

        String workspaceVolume,

        Boolean submit
) {
    public ExecuteProjectRequest(String problemSlug, Map<String, String> files) {
        this(problemSlug, files, "inline", null, false);
    }

    public ExecuteProjectRequest(String problemSlug, Map<String, String> files, String source, String workspaceVolume) {
        this(problemSlug, files, source, workspaceVolume, false);
    }

    public boolean isWorkspaceSource() {
        return "workspace".equalsIgnoreCase(source);
    }

    public boolean isSubmit() {
        return Boolean.TRUE.equals(submit);
    }
}
