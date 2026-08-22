package com.interviewos.session.dto;

import jakarta.validation.constraints.NotBlank;

public record CanvasJsonAttachmentRequest(
        @NotBlank(message = "kind is required")
        String kind,

        @NotBlank(message = "canvasData is required")
        String canvasData
) {}
