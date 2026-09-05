package com.interviewos.session.dto;

import com.interviewos.session.entity.SessionVerification;
import java.time.Instant;

public record SessionVerificationResponse(
    Long id,
    Long sessionId,
    String cameraStatus,
    String micStatus,
    String screenStatus,
    String screenScope,
    String screenLabel,
    boolean consent,
    String outcome,
    String userAgent,
    Instant verifiedAt
) {
    public static SessionVerificationResponse fromEntity(SessionVerification entity) {
        if (entity == null) return null;
        return new SessionVerificationResponse(
            entity.getId(),
            entity.getSessionId(),
            entity.getCameraStatus(),
            entity.getMicStatus(),
            entity.getScreenStatus(),
            entity.getScreenScope(),
            entity.getScreenLabel(),
            entity.isConsent(),
            entity.getOutcome(),
            entity.getUserAgent(),
            entity.getVerifiedAt()
        );
    }
}
