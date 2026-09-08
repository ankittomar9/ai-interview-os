package com.interviewos.session.dto;

import com.interviewos.session.entity.UserNote;

import java.time.Instant;

public record UserNoteResponse(
        Long id,
        String userId,
        String questionSlug,
        String body,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserNoteResponse fromEntity(UserNote note) {
        if (note == null) return null;
        return new UserNoteResponse(
                note.getId(),
                note.getUserId(),
                note.getQuestionSlug(),
                note.getBody(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
