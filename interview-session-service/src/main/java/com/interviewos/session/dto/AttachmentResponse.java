package com.interviewos.session.dto;

public record AttachmentResponse(
        String attachmentId,
        String kind,
        long sizeBytes
) {}
