package com.interviewos.session.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.AddMessageRequest;
import com.interviewos.session.dto.CreateSessionRequest;
import com.interviewos.session.dto.SessionResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.SessionMessage;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.SessionMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final SessionMessageRepository messageRepository;
    private final InterviewSessionMongoRepository mongoSessionRepository;

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        log.info("Creating new interview session for candidate: {}, role: {}", request.candidateId(), request.roleTitle());

        InterviewSession session = InterviewSession.builder()
                .candidateId(request.candidateId())
                .roleTitle(request.roleTitle())
                .track(request.track())
                .difficulty(request.difficulty())
                .targetCompany(request.targetCompany())
                .jobDescription(request.jobDescription())
                .status(SessionStatus.INITIALIZED)
                .build();

        InterviewSession saved = sessionRepository.save(session);

        // Sync to MongoDB Document Store (Safe Upsert)
        try {
            InterviewSessionDocument mongoDoc = mongoSessionRepository
                    .findFirstBySessionIdOrderByCreatedAtDesc(saved.getId())
                    .orElseGet(() -> InterviewSessionDocument.builder()
                            .sessionId(saved.getId())
                            .candidateId(request.candidateId())
                            .candidateName(request.candidateName() != null && !request.candidateName().isBlank() ? request.candidateName() : request.candidateId())
                            .targetRoleTitle(request.roleTitle())
                            .interviewTrack(request.track().name())
                            .seniorityLevel(request.difficulty().name())
                            .targetCompany(request.targetCompany())
                            .status(SessionStatus.INITIALIZED.name())
                            .transcript(new ArrayList<>())
                            .createdAt(LocalDateTime.now())
                            .build());

            mongoDoc.setStatus(SessionStatus.INITIALIZED.name());
            mongoSessionRepository.save(mongoDoc);
        } catch (Exception e) {
            log.warn("⚠️ Failed to mirror session to MongoDB: {}", e.getMessage());
        }

        return SessionResponse.fromEntity(saved);
    }

    @Transactional
    public SessionResponse startSession(Long sessionId) {
        InterviewSession session = findSessionOrThrow(sessionId);

        if (session.getStatus() != SessionStatus.INITIALIZED) {
            throw new IllegalStateException("Cannot start session in status: " + session.getStatus());
        }

        session.setStatus(SessionStatus.IN_PROGRESS);
        session.setStartedAt(Instant.now());
        log.info("Session {} transitioned to IN_PROGRESS", sessionId);

        InterviewSession saved = sessionRepository.save(session);

        // Update Mongo document safely
        try {
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                doc.setStatus(SessionStatus.IN_PROGRESS.name());
                doc.setStartedAt(LocalDateTime.now());
                mongoSessionRepository.save(doc);
            });
        } catch (Exception e) {
            log.warn("⚠️ MongoDB sync warning on startSession: {}", e.getMessage());
        }

        return SessionResponse.fromEntity(saved);
    }

    @Transactional
    public SessionResponse.MessageResponse addMessage(Long sessionId, AddMessageRequest request) {
        InterviewSession session = findSessionOrThrow(sessionId);

        if (session.getStatus() != SessionStatus.IN_PROGRESS && session.getStatus() != SessionStatus.INITIALIZED) {
            throw new IllegalStateException("Cannot add messages to a session in status: " + session.getStatus());
        }

        SessionMessage message = SessionMessage.builder()
                .session(session)
                .senderRole(request.senderRole().toUpperCase())
                .messageType(request.messageType())
                .content(request.content())
                .codeSnippet(request.codeSnippet())
                .timestamp(Instant.now())
                .build();

        SessionMessage saved = messageRepository.save(message);
        log.info("Added {} message to session {}", request.senderRole(), sessionId);

        // Sync turn to Mongo document transcript safely
        try {
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                if (doc.getTranscript() == null) {
                    doc.setTranscript(new ArrayList<>());
                }
                InterviewSessionDocument.TranscriptTurn turn = InterviewSessionDocument.TranscriptTurn.builder()
                        .turnNumber(doc.getTranscript().size() + 1)
                        .senderRole(request.senderRole().toUpperCase())
                        .messageType(request.messageType().name())
                        .content(request.content())
                        .codeSnippet(request.codeSnippet())
                        .metadata(request.metadata())
                        .timestamp(LocalDateTime.now())
                        .build();
                doc.getTranscript().add(turn);
                mongoSessionRepository.save(doc);
            });
        } catch (Exception e) {
            log.warn("⚠️ MongoDB sync warning on addMessage: {}", e.getMessage());
        }

        return new SessionResponse.MessageResponse(
                saved.getId(),
                saved.getSenderRole(),
                saved.getMessageType(),
                saved.getContent(),
                saved.getCodeSnippet(),
                saved.getTimestamp(),
                request.metadata()
        );
    }

    @Transactional(readOnly = true)
    public SessionResponse getSessionById(Long sessionId) {
        InterviewSession session = findSessionOrThrow(sessionId);
        return SessionResponse.fromEntity(session);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse.MessageResponse> getSessionTranscript(Long sessionId) {
        findSessionOrThrow(sessionId); // Verify exists
        try {
            var mongoDocOpt = mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId);
            if (mongoDocOpt.isPresent() && mongoDocOpt.get().getTranscript() != null && !mongoDocOpt.get().getTranscript().isEmpty()) {
                return mongoDocOpt.get().getTranscript().stream()
                        .map(t -> new SessionResponse.MessageResponse(
                                (long) t.getTurnNumber(),
                                t.getSenderRole(),
                                t.getMessageType() != null ? com.interviewos.session.model.MessageType.valueOf(t.getMessageType()) : com.interviewos.session.model.MessageType.EXPLANATION,
                                t.getContent(),
                                t.getCodeSnippet(),
                                t.getTimestamp() != null ? t.getTimestamp().atZone(java.time.ZoneId.systemDefault()).toInstant() : Instant.now(),
                                t.getMetadata()
                        ))
                        .toList();
            }
        } catch (Exception e) {
            log.warn("⚠️ MongoDB transcript fetch fallback: {}", e.getMessage());
        }

        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId).stream()
                .map(SessionResponse.MessageResponse::fromEntity)
                .toList();
    }

    @Transactional
    public SessionResponse completeSession(Long sessionId) {
        InterviewSession session = findSessionOrThrow(sessionId);

        if (session.getStatus() == SessionStatus.COMPLETED) {
            return SessionResponse.fromEntity(session);
        }

        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());

        if (session.getStartedAt() != null) {
            session.setDurationSeconds(Duration.between(session.getStartedAt(), session.getCompletedAt()).toSeconds());
        }

        log.info("Session {} COMPLETED. Total duration: {}s", sessionId, session.getDurationSeconds());
        InterviewSession saved = sessionRepository.save(session);

        // Sync completion to MongoDB safely
        try {
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                doc.setStatus(SessionStatus.COMPLETED.name());
                doc.setCompletedAt(LocalDateTime.now());
                mongoSessionRepository.save(doc);
            });
        } catch (Exception e) {
            log.warn("⚠️ MongoDB sync warning on completeSession: {}", e.getMessage());
        }

        return SessionResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getCandidateSessions(String candidateId) {
        return sessionRepository.findByCandidateId(candidateId).stream()
                .map(SessionResponse::fromEntity)
                .toList();
    }

    private InterviewSession findSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Interview session not found with ID: " + sessionId));
    }
}