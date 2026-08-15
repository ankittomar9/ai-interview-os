package com.interviewos.session.dto;

import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.SessionMessage;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.MessageType;
import com.interviewos.session.model.SessionStatus;

import java.time.Instant;
import java.util.List;

public record SessionResponse(
        Long id,
        String candidateId,
        String roleTitle,
        InterviewTrack track,
        DifficultyLevel difficulty,
        String targetCompany,
        String jobDescription,
        SessionStatus status,
        Instant createdAt,
        Instant startedAt,
        Instant completedAt,
        Long durationSeconds,
        List<MessageResponse> messages
) {
    public record MessageResponse(
            Long id,
            String senderRole,
            MessageType messageType,
            String content,
            String codeSnippet,
            Instant timestamp
    ) {
        public static MessageResponse fromEntity(SessionMessage entity) {
            return new MessageResponse(
                    entity.getId(),
                    entity.getSenderRole(),
                    entity.getMessageType(),
                    entity.getContent(),
                    entity.getCodeSnippet(),
                    entity.getTimestamp()
            );
        }
    }

    public static SessionResponse fromEntity(InterviewSession session) {
        List<MessageResponse> messageResponses = session.getMessages() != null
                ? session.getMessages().stream().map(MessageResponse::fromEntity).toList()
                : List.of();

        return new SessionResponse(
                session.getId(),
                session.getCandidateId(),
                session.getRoleTitle(),
                session.getTrack(),
                session.getDifficulty(),
                session.getTargetCompany(),
                session.getJobDescription(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getStartedAt(),
                session.getCompletedAt(),
                session.getDurationSeconds(),
                messageResponses
        );
    }
}