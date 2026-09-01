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
        List<String> plannedSlugs,
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
        this(id, candidateId, roleTitle, track, difficulty, targetCompany, jobDescription, status, createdAt, startedAt, completedAt, durationSeconds, "INTERVIEW", List.of(), messages);
    }

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
            String sessionMode,
            List<MessageResponse> messages
    ) {
        this(id, candidateId, roleTitle, track, difficulty, targetCompany, jobDescription, status, createdAt, startedAt, completedAt, durationSeconds, sessionMode, List.of(), messages);
    }
    public record MessageResponse(
            Long id,
            String senderRole,
            MessageType messageType,
            String content,
            String codeSnippet,
            Instant timestamp,
            Map<String, String> metadata,
            Integer keystrokeCount,
            Integer avgKeystrokeIntervalMs,
            Integer keystrokeVariance,
            Integer estimatedWpm,
            Boolean suspiciousTyping,
            Integer copyCount,
            Integer pasteCount,
            Integer tabSwitchCount
    ) {
        public MessageResponse(Long id, String senderRole, MessageType messageType, String content, String codeSnippet, Instant timestamp, Map<String, String> metadata) {
            this(id, senderRole, messageType, content, codeSnippet, timestamp, metadata, null, null, null, null, null, null, null, null);
        }

        public MessageResponse(Long id, String senderRole, MessageType messageType, String content, String codeSnippet, Instant timestamp) {
            this(id, senderRole, messageType, content, codeSnippet, timestamp, null, null, null, null, null, null, null, null, null);
        }

        public static MessageResponse fromEntity(SessionMessage entity) {
            return new MessageResponse(
                    entity.getId(),
                    entity.getSenderRole(),
                    entity.getMessageType(),
                    entity.getContent(),
                    entity.getCodeSnippet(),
                    entity.getTimestamp(),
                    null,
                    entity.getKeystrokeCount(),
                    entity.getAvgKeystrokeIntervalMs(),
                    entity.getKeystrokeVariance(),
                    entity.getEstimatedWpm(),
                    entity.getSuspiciousTyping(),
                    entity.getCopyCount(),
                    entity.getPasteCount(),
                    entity.getTabSwitchCount()
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
                session.getPlannedSlugs() != null ? session.getPlannedSlugs() : List.of(),
                messageResponses
        );
    }
}