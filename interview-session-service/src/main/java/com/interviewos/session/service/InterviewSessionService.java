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
import com.interviewos.session.dto.AbortSessionRequest;
import com.interviewos.session.dto.SessionVerificationRequest;
import com.interviewos.session.dto.SessionVerificationResponse;
import com.interviewos.session.entity.SessionVerification;
import com.interviewos.session.exception.VerificationRequiredException;
import com.interviewos.session.repository.SessionVerificationRepository;
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
public class InterviewSessionService {

    private final InterviewSessionRepository sessionRepository;
    private final SessionMessageRepository messageRepository;
    private final InterviewSessionMongoRepository mongoSessionRepository;
    private final ResumeParsingService resumeParsingService;
    private final SessionPlanService sessionPlanService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final SessionVerificationRepository verificationRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public InterviewSessionService(
            InterviewSessionRepository sessionRepository,
            SessionMessageRepository messageRepository,
            InterviewSessionMongoRepository mongoSessionRepository,
            ResumeParsingService resumeParsingService,
            SessionPlanService sessionPlanService,
            @org.springframework.beans.factory.annotation.Autowired(required = false) com.fasterxml.jackson.databind.ObjectMapper objectMapper,
            @org.springframework.beans.factory.annotation.Autowired(required = false) SessionVerificationRepository verificationRepository
    ) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.mongoSessionRepository = mongoSessionRepository;
        this.resumeParsingService = resumeParsingService;
        this.sessionPlanService = sessionPlanService;
        this.objectMapper = objectMapper != null ? objectMapper : new com.fasterxml.jackson.databind.ObjectMapper();
        this.verificationRepository = verificationRepository;
    }

    public InterviewSessionService(
            InterviewSessionRepository sessionRepository,
            SessionMessageRepository messageRepository,
            InterviewSessionMongoRepository mongoSessionRepository,
            ResumeParsingService resumeParsingService,
            com.interviewos.session.sandbox.client.QuestionBankClient questionBankClient
    ) {
        this(sessionRepository, messageRepository, mongoSessionRepository, resumeParsingService, new SessionPlanService(questionBankClient), new com.fasterxml.jackson.databind.ObjectMapper(), null);
    }

    public InterviewSessionService(
            InterviewSessionRepository sessionRepository,
            SessionMessageRepository messageRepository,
            InterviewSessionMongoRepository mongoSessionRepository,
            ResumeParsingService resumeParsingService,
            SessionPlanService sessionPlanService,
            com.fasterxml.jackson.databind.ObjectMapper objectMapper
    ) {
        this(sessionRepository, messageRepository, mongoSessionRepository, resumeParsingService, sessionPlanService, objectMapper, null);
    }

    @Transactional
    public SessionResponse createSession(CreateSessionRequest request) {
        log.info("Creating new interview session for candidate: {}, role: {}", request.candidateId(), request.roleTitle());

        String effectiveMode = request.getEffectiveMode();
        List<String> plannedSlugs = new ArrayList<>();
        com.interviewos.session.model.SessionPlan plan = null;
        String planJson = null;

        if (!"PLAYGROUND".equalsIgnoreCase(effectiveMode)) {
            long seed = Math.abs((long) (request.candidateId() != null ? request.candidateId().hashCode() : 42) * 31
                    + (request.track() != null ? request.track().name().hashCode() : 0)
                    + (request.difficulty() != null ? request.difficulty().name().hashCode() : 0));
            plan = sessionPlanService.buildPlan(request.track(), request.difficulty(), seed, request.getEffectivePlanSource());
            try {
                planJson = objectMapper.writeValueAsString(plan);
            } catch (Exception e) {
                log.warn("Failed to serialize session plan to JSON: {}", e.getMessage());
            }
            if (plan != null && plan.sections() != null) {
                for (var sec : plan.sections()) {
                    if (sec.problemSlugs() != null) {
                        plannedSlugs.addAll(sec.problemSlugs());
                    }
                }
            }
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
                .planJson(planJson)
                .build();

        InterviewSession saved = sessionRepository.save(session);

        // Sync to MongoDB Document Store (Safe Upsert)
        try {
            List<InterviewSessionDocument.PlannedSectionDocument> planSectionDocs = new ArrayList<>();
            if (plan != null && plan.sections() != null) {
                planSectionDocs = plan.sections().stream()
                        .map(InterviewSessionDocument.PlannedSectionDocument::fromRecord)
                        .toList();
            }

            final List<String> finalPlannedSlugs = plannedSlugs;
            final List<InterviewSessionDocument.PlannedSectionDocument> finalPlanSectionDocs = planSectionDocs;
            InterviewSessionDocument mongoDoc = mongoSessionRepository
                    .findFirstBySessionIdOrderByCreatedAtDesc(saved.getId())
                    .orElseGet(() -> InterviewSessionDocument.builder()
                            .sessionId(saved.getId())
                            .candidateId(request.candidateId())
                            .candidateName(request.candidateName() != null && !request.candidateName().isBlank() ? request.candidateName() : request.candidateId())
                            .targetRoleTitle(request.roleTitle())
                            .interviewTrack(request.track() != null ? request.track().name() : null)
                            .seniorityLevel(request.difficulty() != null ? request.difficulty().name() : null)
                            .targetCompany(request.targetCompany())
                            .status(SessionStatus.INITIALIZED.name())
                            .sessionMode(effectiveMode)
                            .plannedSlugs(finalPlannedSlugs)
                            .planSections(finalPlanSectionDocs)
                            .transcript(new ArrayList<>())
                            .createdAt(LocalDateTime.now())
                            .build());

            mongoDoc.setStatus(SessionStatus.INITIALIZED.name());
            mongoDoc.setSessionMode(effectiveMode);
            mongoDoc.setPlannedSlugs(plannedSlugs);
            mongoDoc.setPlanSections(planSectionDocs);
            mongoSessionRepository.save(mongoDoc);
        } catch (Exception e) {
            log.warn("⚠️ Failed to mirror session to MongoDB: {}", e.getMessage());
        }

        return SessionResponse.fromEntity(saved);
    }

    public String resolveCatalogTrackKey(com.interviewos.session.model.InterviewTrack track) {
        return sessionPlanService.resolveCatalogTrackKey(track);
    }

    public List<String> buildPlannedSlugs(com.interviewos.session.model.InterviewTrack track, com.interviewos.session.model.DifficultyLevel difficulty, long seed) {
        return sessionPlanService.buildPlannedSlugs(track, difficulty, seed);
    }

    @Transactional
    public SessionResponse startSession(Long sessionId) {
        InterviewSession session = findSessionOrThrow(sessionId);

        if (session.getStatus() != SessionStatus.INITIALIZED) {
            throw new IllegalStateException("Cannot start session in status: " + session.getStatus());
        }

        // Server-side verification gate for INTERVIEW sessions (SPEC-SCREEN-1 G2/D4/§6)
        if (session.getSessionMode() == null || !"PLAYGROUND".equalsIgnoreCase(session.getSessionMode())) {
            SessionVerification verification = verificationRepository != null
                    ? verificationRepository.findBySessionId(sessionId).orElse(null)
                    : null;

            boolean validOutcome = verification != null && (
                    "VERIFIED".equalsIgnoreCase(verification.getOutcome()) ||
                    "DEV_BYPASS".equalsIgnoreCase(verification.getOutcome())
            );
            boolean screenOk = verification != null && "OK".equalsIgnoreCase(verification.getScreenStatus());
            boolean consentOk = verification != null && verification.isConsent();
            boolean recent = verification != null && verification.getVerifiedAt() != null &&
                    verification.getVerifiedAt().isAfter(Instant.now().minus(Duration.ofMinutes(10)));

            if (!validOutcome || !screenOk || !consentOk || !recent) {
                log.warn("Start session rejected for session {}: VERIFICATION_REQUIRED (validOutcome={}, screenOk={}, consentOk={}, recent={})",
                        sessionId, validOutcome, screenOk, consentOk, recent);
                throw new VerificationRequiredException("VERIFICATION_REQUIRED: Valid screen share and verification receipt required to start interview session");
            }
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

        if (session.getStatus() == SessionStatus.ABORTED_SHARE) {
            throw new IllegalStateException("Cannot add messages to an aborted session: " + session.getStatus());
        }

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
        SessionResponse resp = SessionResponse.fromEntity(session);
        try {
            var mongoDoc = mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId);
            if (mongoDoc.isPresent() && mongoDoc.get().getSectionProgress() != null) {
                return resp.withSectionProgress(mongoDoc.get().getSectionProgress());
            }
        } catch (Exception ignored) {}
        return resp;
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


    @Transactional
    public SessionVerificationResponse recordVerification(Long sessionId, SessionVerificationRequest request) {
        InterviewSession session = findSessionOrThrow(sessionId);
        if (session.getStatus() == SessionStatus.ABORTED_SHARE) {
            throw new IllegalStateException("Cannot record section transitions for an aborted session: " + session.getStatus());
        }

        if (session.getStatus() != SessionStatus.INITIALIZED) {
            throw new IllegalStateException("Cannot submit verification for session in status: " + session.getStatus() + ". Verification is immutable after start.");
        }

        String scope = request.screenScope() != null ? request.screenScope().trim().toUpperCase() : "UNKNOWN";
        if (!"MONITOR".equals(scope) && !"UNKNOWN".equals(scope)) {
            throw new IllegalArgumentException("Invalid screen scope: " + request.screenScope() + ". Only MONITOR or UNKNOWN is accepted.");
        }
        if ("UNKNOWN".equals(scope) && (request.screenLabel() == null || request.screenLabel().isBlank())) {
            throw new IllegalArgumentException("screenLabel naming the browser environment is required when screenScope is UNKNOWN");
        }

        String outcome = request.outcome() != null && !request.outcome().isBlank()
                ? request.outcome().trim().toUpperCase()
                : (request.screenOk() && request.cameraOk() && request.micOk() && request.consent() ? "VERIFIED" : "FAILED");

        SessionVerification verification = verificationRepository != null
                ? verificationRepository.findBySessionId(sessionId).orElseGet(() -> SessionVerification.builder().sessionId(sessionId).build())
                : SessionVerification.builder().sessionId(sessionId).build();

        verification.setCameraStatus(request.cameraOk() ? "OK" : "FAILED");
        verification.setMicStatus(request.micOk() ? "OK" : "FAILED");
        verification.setScreenStatus(request.screenOk() ? "OK" : "FAILED");
        verification.setScreenScope(scope);
        verification.setScreenLabel(request.screenLabel());
        verification.setConsent(request.consent());
        verification.setOutcome(outcome);
        verification.setUserAgent(request.userAgent());
        verification.setVerifiedAt(Instant.now());

        SessionVerification saved = verificationRepository != null
                ? verificationRepository.save(verification)
                : verification;

        log.info("Recorded verification receipt for session {}: outcome={}, screenScope={}, screenOk={}",
                sessionId, outcome, scope, request.screenOk());
        return SessionVerificationResponse.fromEntity(saved);
    }

    public SessionVerificationResponse getVerification(Long sessionId) {
        findSessionOrThrow(sessionId);
        SessionVerification verification = verificationRepository != null
                ? verificationRepository.findBySessionId(sessionId).orElse(null)
                : null;
        if (verification == null) {
            throw new NoSuchElementException("Verification receipt not found for session: " + sessionId);
        }
        return SessionVerificationResponse.fromEntity(verification);
    }

    @Transactional
    public SessionResponse abortSession(Long sessionId, AbortSessionRequest request) {
        InterviewSession session = findSessionOrThrow(sessionId);

        if (session.getStatus() == SessionStatus.ABORTED_SHARE) {
            log.info("Session {} already in ABORTED_SHARE status (idempotent abort)", sessionId);
            return SessionResponse.fromEntity(session);
        }

        session.setStatus(SessionStatus.ABORTED_SHARE);
        if (session.getCompletedAt() == null) {
            session.setCompletedAt(Instant.now());
        }
        if (session.getStartedAt() != null) {
            session.setDurationSeconds(Duration.between(session.getStartedAt(), session.getCompletedAt()).getSeconds());
        }

        InterviewSession saved = sessionRepository.save(session);

        try {
            mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId).ifPresent(doc -> {
                doc.setStatus(SessionStatus.ABORTED_SHARE.name());
                doc.setCompletedAt(LocalDateTime.now());
                mongoSessionRepository.save(doc);
            });
        } catch (Exception e) {
            log.warn("Failed to sync ABORTED_SHARE to Mongo: {}", e.getMessage());
        }

        log.info("Session {} transitioned to ABORTED_SHARE [reason: {}]",
                sessionId, request != null ? request.reason() : "UNSPECIFIED");
        return SessionResponse.fromEntity(saved);
    }

    private InterviewSession findSessionOrThrow(Long sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Interview session not found with ID: " + sessionId));
    }
}