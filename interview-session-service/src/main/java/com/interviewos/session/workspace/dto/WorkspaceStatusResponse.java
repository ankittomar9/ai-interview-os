package com.interviewos.session.workspace.dto;

import lombok.Builder;

@Builder
public record WorkspaceStatusResponse(
        String workspaceId,
        String url,
        WorkspaceStatus status,
        String volumeName
) {}
