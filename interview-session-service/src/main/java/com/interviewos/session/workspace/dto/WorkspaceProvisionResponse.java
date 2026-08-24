package com.interviewos.session.workspace.dto;

import lombok.Builder;

@Builder
public record WorkspaceProvisionResponse(
        String workspaceId,
        String url,
        WorkspaceStatus status,
        String volumeName,
        String message
) {}
