package com.interviewos.session.dto;

public record OpenGateRequest(
        String reason,
        Long turnId
) {}
