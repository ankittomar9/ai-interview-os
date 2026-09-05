package com.interviewos.session.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record SessionVerificationRequest(
    boolean cameraOk,
    boolean micOk,
    boolean screenOk,
    String screenScope, // MONITOR | UNKNOWN
    String screenLabel,
    boolean consent,
    String outcome,     // VERIFIED | DEV_BYPASS
    String userAgent
) {}
