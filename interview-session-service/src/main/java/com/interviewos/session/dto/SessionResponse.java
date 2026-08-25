package com.interviewos.session.dto;

import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.SessionMessage;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.MessageType;
import com.interviewos.session.model.SessionStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

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
        String sessionMode,
        List<MessageResponse> messages
) {
    public SessionResponse(
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
        this(id, candidateId, roleTitle, track, difficulty, targetCompany, jobDescription, status, createdAt, startedAt, completedAt, durationSeconds, "INTERVIEW", messages);
    }
    public record MessageResponse(
            Long id,
            String senderRole,
            MessageType messageType,
            String content,
            String codeSnippet,
            Instant timestamp,
            Map<String, String> metadata
    ) {
        public MessageResponse(Long id, String senderRole, MessageType messageType, String content, String codeSnippet, Instant timestamp) {
            this(id, senderRole, messageType, content, codeSnippet, timestamp, null);
        }

        public static MessageResponse fromEntity(SessionMessage entity) {
            return new MessageResponse(
                    entity.getId(),
                    entity.getSenderRole(),
                    entity.getMessageType(),
                    entity.getContent(),
                    entity.getCodeSnippet(),
                    entity.getTimestamp(),
                    null
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
                session.getSessionMode() != null ? session.getSessionMode() : "INTERVIEW",
                messageResponses
        );
    }
}