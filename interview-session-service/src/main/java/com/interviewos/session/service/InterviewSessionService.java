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
import com.interviewos.session.document.ResumeDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@Slf4j
@Service
@RequiredArgsConstructor
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final SessionMessageRepository messageRepository;
    private final InterviewSessionMongoRepository mongoSessionRepository;
    private final ResumeParsingService resumeParsingService;
    private final com.interviewos.session.sandbox.client.QuestionBankClient questionBankClient;

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        log.info("Creating new interview session for candidate: {}, role: {}", request.candidateId(), request.roleTitle());

        String effectiveMode = request.getEffectiveMode();
        List<String> plannedSlugs = new ArrayList<>();
        if ("INTERVIEW".equalsIgnoreCase(effectiveMode)) {
            long seed = Math.abs((long) (request.candidateId() != null ? request.candidateId().hashCode() : 42) * 31
                    + (request.track() != null ? request.track().name().hashCode() : 0)
                    + (request.difficulty() != null ? request.difficulty().name().hashCode() : 0));
            plannedSlugs = buildPlannedSlugs(request.track(), request.difficulty(), seed);
        }

        InterviewSession session = InterviewSession.builder()
                .candidateId(request.candidateId())
                .roleTitle(request.roleTitle())
                .track(request.track())
                .difficulty(request.difficulty())
                .targetCompany(request.targetCompany())
                .jobDescription(request.jobDescription())
                .status(SessionStatus.INITIALIZED)
                .sessionMode(effectiveMode)
                .plannedSlugs(plannedSlugs)
                .build();

        InterviewSession saved = sessionRepository.save(session);

        // Sync to MongoDB Document Store (Safe Upsert)
        try {
            final List<String> finalPlannedSlugs = plannedSlugs;
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
                            .sessionMode(effectiveMode)
                            .plannedSlugs(finalPlannedSlugs)
                            .transcript(new ArrayList<>())
                            .createdAt(LocalDateTime.now())
                            .build());

            mongoDoc.setStatus(SessionStatus.INITIALIZED.name());
            mongoDoc.setSessionMode(effectiveMode);
            mongoDoc.setPlannedSlugs(plannedSlugs);
            mongoSessionRepository.save(mongoDoc);
        } catch (Exception e) {
            log.warn("⚠️ Failed to mirror session to MongoDB: {}", e.getMessage());
        }

        return SessionResponse.fromEntity(saved);
    }

    public List<String> buildPlannedSlugs(com.interviewos.session.model.InterviewTrack track, com.interviewos.session.model.DifficultyLevel difficulty, long seed) {
        if (track == null) track = com.interviewos.session.model.InterviewTrack.ALGORITHMS_DATA_STRUCTURES;
        if (difficulty == null) difficulty = com.interviewos.session.model.DifficultyLevel.MID;

        com.interviewos.session.model.DifficultyLevel low = switch (difficulty) {
            case JUNIOR -> com.interviewos.session.model.DifficultyLevel.JUNIOR;
            case MID -> com.interviewos.session.model.DifficultyLevel.JUNIOR;
            case SENIOR -> com.interviewos.session.model.DifficultyLevel.MID;
            case STAFF -> com.interviewos.session.model.DifficultyLevel.SENIOR;
        };
        com.interviewos.session.model.DifficultyLevel mid = difficulty;
        com.interviewos.session.model.DifficultyLevel high = switch (difficulty) {
            case JUNIOR -> com.interviewos.session.model.DifficultyLevel.MID;
            case MID -> com.interviewos.session.model.DifficultyLevel.SENIOR;
            case SENIOR, STAFF -> com.interviewos.session.model.DifficultyLevel.STAFF;
        };

        List<com.interviewos.session.model.DifficultyLevel> ladder = List.of(low, mid, high);
        List<String> planned = new ArrayList<>();
        java.util.Set<String> seen = new java.util.HashSet<>();

        Map<String, Map<com.interviewos.session.model.DifficultyLevel, List<String>>> fallbackCatalog = Map.of(
                "ALGORITHMS_DATA_STRUCTURES", Map.of(
                        com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("two-sum", "reverse-a-string"),
                        com.interviewos.session.model.DifficultyLevel.MID, List.of("search-in-rotated-sorted-array", "lru-cache"),
                        com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("trapping-rain-water", "topo-course-schedule"),
                        com.interviewos.session.model.DifficultyLevel.STAFF, List.of("trapping-rain-water", "topo-course-schedule")
                ),
                "SQL_DATABASE", Map.of(
                        com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("monthly-active-users", "sql-user-cohort-retention"),
                        com.interviewos.session.model.DifficultyLevel.MID, List.of("sql-user-cohort-retention", "department-top-salaries"),
                        com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("department-top-salaries", "complex-financial-rollup"),
                        com.interviewos.session.model.DifficultyLevel.STAFF, List.of("department-top-salaries", "complex-financial-rollup")
                ),
                "SYSTEM_DESIGN_LLD", Map.of(
                        com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("parking-lot-system"),
                        com.interviewos.session.model.DifficultyLevel.MID, List.of("rate-limiter-service", "cache-eviction-service"),
                        com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("distributed-task-scheduler", "cache-eviction-service"),
                        com.interviewos.session.model.DifficultyLevel.STAFF, List.of("distributed-task-scheduler", "cache-eviction-service")
                ),
                "SYSTEM_DESIGN_HLD", Map.of(
                        com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("url-shortener"),
                        com.interviewos.session.model.DifficultyLevel.MID, List.of("distributed-cache", "ride-sharing-dispatch"),
                        com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("real-time-chat", "distributed-cache"),
                        com.interviewos.session.model.DifficultyLevel.STAFF, List.of("real-time-chat", "distributed-cache")
                ),
                "BEHAVIORAL", Map.of(
                        com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("leadership-conflict"),
                        com.interviewos.session.model.DifficultyLevel.MID, List.of("critical-bug-production", "leadership-conflict"),
                        com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("cross-team-collaboration", "critical-bug-production"),
                        com.interviewos.session.model.DifficultyLevel.STAFF, List.of("cross-team-collaboration", "critical-bug-production")
                )
        );

        String trackKey = track.name();
        Map<com.interviewos.session.model.DifficultyLevel, List<String>> trackMap = fallbackCatalog.getOrDefault(trackKey, fallbackCatalog.get("ALGORITHMS_DATA_STRUCTURES"));

        java.util.Random random = new java.util.Random(seed);
        for (int i = 0; i < ladder.size(); i++) {
            com.interviewos.session.model.DifficultyLevel rung = ladder.get(i);
            List<String> candidates = new ArrayList<>();
            if (questionBankClient != null) {
                try {
                    var remote = questionBankClient.listProblems(track.name(), rung.name());
                    if (remote != null && !remote.isEmpty()) {
                        remote.forEach(p -> candidates.add(p.getProblemSlug()));
                    }
                } catch (Exception e) {
                    log.debug("Notice on remote question bank lookup for ladder: {}", e.getMessage());
                }
            }
            if (candidates.isEmpty()) {
                candidates.addAll(trackMap.getOrDefault(rung, List.of("two-sum", "reverse-a-string", "lru-cache")));
            }

            List<String> unseen = candidates.stream().filter(s -> !seen.contains(s)).toList();
            String chosen;
            if (!unseen.isEmpty()) {
                chosen = unseen.get(random.nextInt(unseen.size()));
            } else if (!candidates.isEmpty()) {
                chosen = candidates.get(random.nextInt(candidates.size()));
            } else {
                chosen = "q-" + (i + 1);
            }
            seen.add(chosen);
            planned.add(chosen);
        }

        return planned;
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

        if (request.integritySignals() != null) {
            var signals = request.integritySignals();
            message.setKeystrokeCount(signals.keystrokeCount());
            message.setAvgKeystrokeIntervalMs(signals.avgKeystrokeIntervalMs());
            message.setKeystrokeVariance(signals.keystrokeVariance());
            message.setEstimatedWpm(signals.estimatedWpm());
            message.setSuspiciousTyping(signals.suspiciousTyping());
            message.setCopyCount(signals.copyCount());
            message.setPasteCount(signals.pasteCount());
            message.setTabSwitchCount(signals.tabSwitchCount());
        }

        SessionMessage saved = messageRepository.save(message);
        log.info("Added {} message to session {}", request.senderRole(), sessionId);

        // Sync turn to Mongo document transcript safely
        try {
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                if (doc.getTranscript() == null) {
                    doc.setTranscript(new ArrayList<>());
                }
                InterviewSessionDocument.TranscriptTurn.TranscriptTurnBuilder turnBuilder = InterviewSessionDocument.TranscriptTurn.builder()
                        .turnNumber(doc.getTranscript().size() + 1)
                        .senderRole(request.senderRole().toUpperCase())
                        .messageType(request.messageType().name())
                        .content(request.content())
                        .codeSnippet(request.codeSnippet())
                        .metadata(request.metadata())
                        .timestamp(LocalDateTime.now());

                if (request.integritySignals() != null) {
                    var signals = request.integritySignals();
                    turnBuilder.keystrokeCount(signals.keystrokeCount())
                            .avgKeystrokeIntervalMs(signals.avgKeystrokeIntervalMs())
                            .keystrokeVariance(signals.keystrokeVariance())
                            .estimatedWpm(signals.estimatedWpm())
                            .suspiciousTyping(signals.suspiciousTyping())
                            .copyCount(signals.copyCount())
                            .pasteCount(signals.pasteCount())
                            .tabSwitchCount(signals.tabSwitchCount());
                }

                doc.getTranscript().add(turnBuilder.build());
                mongoSessionRepository.save(doc);
            });
        } catch (Exception e) {
            log.warn("⚠️ MongoDB sync warning on addMessage: {}", e.getMessage());
        }

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
                                t.getMetadata(),
                                t.getKeystrokeCount(),
                                t.getAvgKeystrokeIntervalMs(),
                                t.getKeystrokeVariance(),
                                t.getEstimatedWpm(),
                                t.getSuspiciousTyping(),
                                t.getCopyCount(),
                                t.getPasteCount(),
                                t.getTabSwitchCount()
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

    @Transactional
    public ResumeDocument updateSessionResume(Long sessionId, Map<String, String> payload) {
        findSessionOrThrow(sessionId);
        String candidateName = payload.getOrDefault("candidateName", "Candidate");
        String resumeText = payload.getOrDefault("resumeText", "");
        String resumeTitle = payload.getOrDefault("resumeTitle", "Session Resume");

        ResumeDocument doc = resumeParsingService.parseAndSaveText(String.valueOf(sessionId), candidateName, resumeTitle, resumeText);

        try {
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(mongoDoc -> {
                mongoDoc.setParsedResume(doc);
                mongoDoc.setResumeId(doc.getId());
                mongoSessionRepository.save(mongoDoc);
                log.info("Attached updated parsed resume ({}) to session {}", doc.getId(), sessionId);
            });
        } catch (Exception e) {
            log.warn("⚠️ Failed to mirror resume to mongo session doc: {}", e.getMessage());
        }

        return doc;
    }

    @Transactional
    public ResumeDocument updateSessionResumeFile(Long sessionId, MultipartFile file, String candidateName) {
        findSessionOrThrow(sessionId);
        String cName = candidateName != null && !candidateName.isBlank() ? candidateName : "Candidate";

        try {
            ResumeDocument doc = resumeParsingService.parseAndSaveResume(String.valueOf(sessionId), cName, "Session Uploaded Resume", file);
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(mongoDoc -> {
                mongoDoc.setParsedResume(doc);
                mongoDoc.setResumeId(doc.getId());
                mongoSessionRepository.save(mongoDoc);
                log.info("Attached updated parsed resume file ({}) to session {}", doc.getId(), sessionId);
            });
            return doc;
        } catch (Exception e) {
            log.error("⚠️ Failed to parse uploaded resume file for session {}: {}", sessionId, e.getMessage(), e);
            throw new RuntimeException("Failed to parse uploaded resume: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public ResumeDocument getSessionResume(Long sessionId) {
        findSessionOrThrow(sessionId);
        return mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .map(InterviewSessionDocument::getParsedResume)
                .orElse(null);
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