package com.interviewos.session.dto;

import com.interviewos.session.entity.SessionQuestion;

import java.time.Instant;

public record SessionQuestionResponse(
        Long id,
        Long sessionId,
        String questionSlug,
        Integer displayOrder,
        String verdict,
        Instant attemptedAt,
        Instant updatedAt
) {
    public static SessionQuestionResponse fromEntity(SessionQuestion entity) {
        return new SessionQuestionResponse(
                entity.getId(),
                entity.getSessionId(),
                entity.getQuestionSlug(),
                entity.getDisplayOrder(),
                entity.getVerdict(),
                entity.getAttemptedAt(),
                entity.getUpdatedAt()
        );
    }
}
