package com.interviewos.session.service;

import com.interviewos.session.dto.AddMessageRequest;
import com.interviewos.session.dto.CreateSessionRequest;
import com.interviewos.session.dto.SessionResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.SessionMessage;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.SessionMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final SessionMessageRepository messageRepository;

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

        return SessionResponse.fromEntity(sessionRepository.save(session));
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

        return SessionResponse.MessageResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public SessionResponse getSessionById(Long sessionId) {
        InterviewSession session = findSessionOrThrow(sessionId);
        return SessionResponse.fromEntity(session);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse.MessageResponse> getSessionTranscript(Long sessionId) {
        findSessionOrThrow(sessionId); // Verify exists
        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId).stream()
                .map(SessionResponse.MessageResponse::fromEntity)
                .toList();
    }

    @Transactional
    public SessionResponse completeSession(Long sessionId) {
        InterviewSession session = findSessionOrThrow(sessionId);

        if (session.getStatus() == SessionStatus.COMPLETED || session.getStatus() == SessionStatus.EVALUATED) {
            log.info("Session {} already completed", sessionId);
            return SessionResponse.fromEntity(session);
        }

        session.setStatus(SessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());

        if (session.getStartedAt() != null) {
            session.setDurationSeconds(Duration.between(session.getStartedAt(), session.getCompletedAt()).getSeconds());
        } else {
            session.setDurationSeconds(0L);
        }

        log.info("Session {} marked as COMPLETED. Duration: {} seconds", sessionId, session.getDurationSeconds());
        return SessionResponse.fromEntity(sessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getCandidateSessions(String candidateId) {
        return sessionRepository.findByCandidateIdOrderByCreatedAtDesc(candidateId).stream()
                .map(SessionResponse::fromEntity)
                .toList();
    }

    private InterviewSession findSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Interview session not found with ID: " + sessionId));
    }
}