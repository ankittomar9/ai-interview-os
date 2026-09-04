package com.interviewos.session.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.AddMessageRequest;
import com.interviewos.session.dto.CreateSessionRequest;
import com.interviewos.session.dto.SectionTransitionRequest;
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

    public String resolveCatalogTrackKey(com.interviewos.session.model.InterviewTrack track) {
        if (track == null) return "ALGORITHMS_DATA_STRUCTURES";
        return switch (track) {
            case SQL -> "SQL";
            case SPRING_LLD, JAVA_SPRING_BOOT -> "SPRING_LLD";
            case SYSTEM_DESIGN -> "SYSTEM_DESIGN";
            case BEHAVIORAL_STAR -> "BEHAVIORAL_STAR";
            case RESUME_BASED, ALGORITHMS_DATA_STRUCTURES -> "ALGORITHMS_DATA_STRUCTURES";
        };
    }

    private List<String> findAdjacentRungCandidates(
            Map<com.interviewos.session.model.DifficultyLevel, List<String>> trackMap,
            com.interviewos.session.model.DifficultyLevel rung
    ) {
        com.interviewos.session.model.DifficultyLevel[] order = switch (rung) {
            case STAFF -> new com.interviewos.session.model.DifficultyLevel[]{
                    com.interviewos.session.model.DifficultyLevel.SENIOR,
                    com.interviewos.session.model.DifficultyLevel.MID,
                    com.interviewos.session.model.DifficultyLevel.JUNIOR
            };
            case SENIOR -> new com.interviewos.session.model.DifficultyLevel[]{
                    com.interviewos.session.model.DifficultyLevel.MID,
                    com.interviewos.session.model.DifficultyLevel.STAFF,
                    com.interviewos.session.model.DifficultyLevel.JUNIOR
            };
            case MID -> new com.interviewos.session.model.DifficultyLevel[]{
                    com.interviewos.session.model.DifficultyLevel.SENIOR,
                    com.interviewos.session.model.DifficultyLevel.JUNIOR,
                    com.interviewos.session.model.DifficultyLevel.STAFF
            };
            case JUNIOR -> new com.interviewos.session.model.DifficultyLevel[]{
                    com.interviewos.session.model.DifficultyLevel.MID,
                    com.interviewos.session.model.DifficultyLevel.SENIOR,
                    com.interviewos.session.model.DifficultyLevel.STAFF
            };
        };

        for (com.interviewos.session.model.DifficultyLevel alt : order) {
            List<String> found = trackMap.get(alt);
            if (found != null && !found.isEmpty()) {
                return found;
            }
        }
        return List.of();
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

        Map<com.interviewos.session.model.DifficultyLevel, List<String>> dsaMap = Map.of(
                com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("two-sum", "reverse-a-string", "valid-parentheses"),
                com.interviewos.session.model.DifficultyLevel.MID, List.of("longest-substring-without-repeating-characters", "search-in-rotated-sorted-array", "lru-cache"),
                com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("lru-cache", "merge-k-sorted-lists", "trapping-rain-water"),
                com.interviewos.session.model.DifficultyLevel.STAFF, List.of("trapping-rain-water", "topo-course-schedule", "merge-k-sorted-lists")
        );

        Map<com.interviewos.session.model.DifficultyLevel, List<String>> sqlMap = Map.of(
                com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("monthly-active-users", "sql-user-cohort-retention", "sql-running-revenue"),
                com.interviewos.session.model.DifficultyLevel.MID, List.of("sql-running-revenue", "sql-funnel-ratios", "sql-dedup-keep-latest", "department-top-salaries"),
                com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("sql-top-n-per-group", "sql-sessionization", "sql-7d-moving-average", "sql-month-over-month"),
                com.interviewos.session.model.DifficultyLevel.STAFF, List.of("sql-top-n-per-group", "sql-spend-quartiles", "complex-financial-rollup")
        );

        Map<com.interviewos.session.model.DifficultyLevel, List<String>> lldMap = Map.of(
                com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("parking-lot-system", "lld-order-service"),
                com.interviewos.session.model.DifficultyLevel.MID, List.of("lld-order-service", "rate-limiter-service", "cache-eviction-service"),
                com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("distributed-task-scheduler", "cache-eviction-service"),
                com.interviewos.session.model.DifficultyLevel.STAFF, List.of("distributed-task-scheduler", "cache-eviction-service")
        );

        Map<com.interviewos.session.model.DifficultyLevel, List<String>> hldMap = Map.of(
                com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("url-shortener", "url-shortener-system-design"),
                com.interviewos.session.model.DifficultyLevel.MID, List.of("url-shortener-system-design", "distributed-cache", "ride-sharing-dispatch"),
                com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("distributed-rate-limiter", "real-time-chat", "distributed-cache"),
                com.interviewos.session.model.DifficultyLevel.STAFF, List.of("distributed-rate-limiter", "real-time-chat")
        );

        Map<com.interviewos.session.model.DifficultyLevel, List<String>> behavioralMap = Map.of(
                com.interviewos.session.model.DifficultyLevel.JUNIOR, List.of("leadership-conflict", "behavioral-technical-conflict"),
                com.interviewos.session.model.DifficultyLevel.MID, List.of("critical-bug-production", "leadership-conflict", "behavioral-technical-conflict"),
                com.interviewos.session.model.DifficultyLevel.SENIOR, List.of("behavioral-technical-conflict", "cross-team-collaboration", "critical-bug-production"),
                com.interviewos.session.model.DifficultyLevel.STAFF, List.of("behavioral-technical-conflict", "cross-team-collaboration")
        );

        Map<String, Map<com.interviewos.session.model.DifficultyLevel, List<String>>> fallbackCatalog = Map.ofEntries(
                Map.entry("ALGORITHMS_DATA_STRUCTURES", dsaMap),
                Map.entry("SQL", sqlMap),
                Map.entry("SQL_DATABASE", sqlMap),
                Map.entry("SPRING_LLD", lldMap),
                Map.entry("JAVA_SPRING_BOOT", lldMap),
                Map.entry("SYSTEM_DESIGN_LLD", lldMap),
                Map.entry("SYSTEM_DESIGN", hldMap),
                Map.entry("SYSTEM_DESIGN_HLD", hldMap),
                Map.entry("BEHAVIORAL_STAR", behavioralMap),
                Map.entry("BEHAVIORAL", behavioralMap),
                Map.entry("RESUME_BASED", dsaMap)
        );

        String canonicalKey = resolveCatalogTrackKey(track);
        Map<com.interviewos.session.model.DifficultyLevel, List<String>> trackMap = fallbackCatalog.getOrDefault(
                canonicalKey,
                fallbackCatalog.get("ALGORITHMS_DATA_STRUCTURES")
        );

        java.util.Random random = new java.util.Random(seed);
        for (int i = 0; i < ladder.size(); i++) {
            com.interviewos.session.model.DifficultyLevel rung = ladder.get(i);
            List<String> candidates = new ArrayList<>();
            String source = "FALLBACK";
            com.interviewos.session.model.DifficultyLevel chosenDifficulty = rung;

            if (questionBankClient != null) {
                try {
                    var remote = questionBankClient.listProblems(canonicalKey, rung.name());
                    if (remote != null && !remote.isEmpty()) {
                        remote.forEach(p -> candidates.add(p.getProblemSlug()));
                        if (!candidates.isEmpty()) {
                            source = "REMOTE";
                        }
                    }
                } catch (Exception e) {
                    log.debug("Notice on remote question bank lookup for ladder: {}", e.getMessage());
                }
            }

            if (candidates.isEmpty()) {
                source = "FALLBACK";
                List<String> rungCandidates = trackMap.get(rung);
                if (rungCandidates != null && !rungCandidates.isEmpty()) {
                    candidates.addAll(rungCandidates);
                } else {
                    candidates.addAll(findAdjacentRungCandidates(trackMap, rung));
                }
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

            log.info("Ladder pick: {}|{}|{}|source={}", chosen, rung, chosenDifficulty, source);
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
            message.setEchoFilteredCount(signals.echoFilteredCount());
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
                            .tabSwitchCount(signals.tabSwitchCount())
                            .echoFilteredCount(signals.echoFilteredCount());
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
                                t.getMessageType() != null ? com.interviewos.session.model.MessageType.fromString(t.getMessageType()) : com.interviewos.session.model.MessageType.EXPLANATION,
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
                                t.getTabSwitchCount(),
                                t.getEchoFilteredCount()
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

    public List<InterviewSessionDocument.SubmissionEntry> getSubmissions(Long sessionId) {
        return mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .map(InterviewSessionDocument::getSubmissionsLedger)
                .orElse(List.of());
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

    private static final List<String> DEFAULT_SECTION_SEQUENCE = List.of("INTRODUCTION", "CORE_TECH", "CODING_DSA", "SYSTEM_DESIGN");

    @Transactional
    public List<InterviewSessionDocument.SectionProgress> recordSectionTransition(Long sessionId, SectionTransitionRequest request) {
        findSessionOrThrow(sessionId);
        log.info("Recording section transition for session {}: from='{}' to='{}' idx={} reason='{}'",
                sessionId, request.fromSectionType(), request.toSectionType(), request.sectionIndex(), request.reason());

        InterviewSessionDocument doc = mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Mongo document not found for session: " + sessionId));

        if (doc.getSectionProgress() == null) {
            doc.setSectionProgress(new ArrayList<>());
        }

        LocalDateTime now = LocalDateTime.now();
        int sectionIdx = request.sectionIndex() != null ? request.sectionIndex() : doc.getSectionProgress().size();

        // Calculate startedAt
        LocalDateTime startedAt = doc.getStartedAt() != null ? doc.getStartedAt() : doc.getCreatedAt();
        if (sectionIdx > 0 && !doc.getSectionProgress().isEmpty()) {
            startedAt = doc.getSectionProgress().get(doc.getSectionProgress().size() - 1).getEndedAt();
        }

        // Calculate turn count server-side from transcript candidate turns
        int serverCandidateTurns = 0;
        if (doc.getTranscript() != null) {
            for (InterviewSessionDocument.TranscriptTurn turn : doc.getTranscript()) {
                if ("CANDIDATE".equalsIgnoreCase(turn.getSenderRole())) {
                    if (turn.getMetadata() != null) {
                        String sType = turn.getMetadata().get("sectionType");
                        String stage = turn.getMetadata().get("stage");
                        if (request.fromSectionType().equalsIgnoreCase(sType) || request.fromSectionType().equalsIgnoreCase(stage)) {
                            serverCandidateTurns++;
                        }
                    }
                }
            }
        }
        int effectiveTurns = serverCandidateTurns;
        if (request.turnCount() != null && request.turnCount() > effectiveTurns) {
            effectiveTurns = request.turnCount();
        }
        if ("MANUAL_JUMP".equalsIgnoreCase(request.reason()) && request.turnCount() != null && request.turnCount() == 0) {
            effectiveTurns = 0;
        }

        InterviewSessionDocument.SectionProgress progress = InterviewSessionDocument.SectionProgress.builder()
                .sectionType(request.fromSectionType())
                .index(sectionIdx)
                .reason(request.reason())
                .startedAt(startedAt)
                .endedAt(now)
                .turnCount(effectiveTurns)
                .build();

        // Idempotency: update existing progress entry if same index or sectionType already exists
        boolean updated = false;
        for (int i = 0; i < doc.getSectionProgress().size(); i++) {
            InterviewSessionDocument.SectionProgress existing = doc.getSectionProgress().get(i);
            if (existing.getIndex() != null && existing.getIndex().equals(sectionIdx)) {
                doc.getSectionProgress().set(i, progress);
                updated = true;
                break;
            } else if (existing.getSectionType() != null && existing.getSectionType().equalsIgnoreCase(request.fromSectionType())) {
                doc.getSectionProgress().set(i, progress);
                updated = true;
                break;
            }
        }
        if (!updated) {
            doc.getSectionProgress().add(progress);
        }

        // If this transition jumped forward across intermediate sections (e.g. 1 -> 3), record intermediate sections as MANUAL_JUMP with turnCount=0
        if (request.toSectionType() != null) {
            int fromSeqIdx = DEFAULT_SECTION_SEQUENCE.indexOf(request.fromSectionType());
            int toSeqIdx = DEFAULT_SECTION_SEQUENCE.indexOf(request.toSectionType());
            if (fromSeqIdx >= 0 && toSeqIdx > fromSeqIdx + 1) {
                for (int skipped = fromSeqIdx + 1; skipped < toSeqIdx; skipped++) {
                    String skippedSection = DEFAULT_SECTION_SEQUENCE.get(skipped);
                    int skippedIdx = skipped;
                    boolean alreadyPresent = doc.getSectionProgress().stream()
                            .anyMatch(p -> skippedSection.equalsIgnoreCase(p.getSectionType()) || (p.getIndex() != null && p.getIndex().equals(skippedIdx)));
                    if (!alreadyPresent) {
                        doc.getSectionProgress().add(InterviewSessionDocument.SectionProgress.builder()
                                .sectionType(skippedSection)
                                .index(skippedIdx)
                                .reason("MANUAL_JUMP")
                                .startedAt(now)
                                .endedAt(now)
                                .turnCount(0)
                                .build());
                        log.info("Recorded intermediate skipped section '{}' as MANUAL_JUMP with 0 turns for session {}", skippedSection, sessionId);
                    }
                }
            }
        }

        mongoSessionRepository.save(doc);
        log.info("Saved section transition for session {}. Total sections recorded: {}", sessionId, doc.getSectionProgress().size());
        return doc.getSectionProgress();
    }

    @Transactional(readOnly = true)
    public List<InterviewSessionDocument.SectionProgress> getSectionProgress(Long sessionId) {
        findSessionOrThrow(sessionId);
        return mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)
                .map(InterviewSessionDocument::getSectionProgress)
                .orElse(List.of());
    }

    private InterviewSession findSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Interview session not found with ID: " + sessionId));
    }
}