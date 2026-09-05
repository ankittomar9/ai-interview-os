package com.interviewos.session.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.SectionTransitionRequest;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.SessionMessageRepository;
import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.dto.CreateSessionRequest;
import com.interviewos.session.dto.SessionResponse;
import com.interviewos.session.model.PlannedSection;
import com.interviewos.session.model.SectionType;
import com.interviewos.session.model.SessionPlan;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InterviewSessionServiceTest {

    @Mock
    private InterviewSessionRepository sessionRepository;

    @Mock
    private SessionMessageRepository messageRepository;

    @Mock
    private InterviewSessionMongoRepository mongoSessionRepository;

    @Mock
    private ResumeParsingService resumeParsingService;

    @Mock
    private QuestionBankClient questionBankClient;
    @Mock
    private com.interviewos.session.repository.SessionVerificationRepository verificationRepository;

    private SessionPlanService sessionPlanService;
    private InterviewSessionService serviceWithFallbackOnly;
    private InterviewSessionService serviceWithRemote;
    private InterviewSessionService serviceWithVerification;

    @BeforeEach
    void setUp() {
        sessionPlanService = new SessionPlanService(null);
        serviceWithFallbackOnly = new InterviewSessionService(
                sessionRepository,
                messageRepository,
                mongoSessionRepository,
                resumeParsingService,
                sessionPlanService,
                new com.fasterxml.jackson.databind.ObjectMapper()
        );

        serviceWithRemote = new InterviewSessionService(
                sessionRepository,
                messageRepository,
                mongoSessionRepository,
                resumeParsingService,
                new SessionPlanService(questionBankClient),
                new com.fasterxml.jackson.databind.ObjectMapper()
        );

        serviceWithVerification = new InterviewSessionService(
                sessionRepository,
                messageRepository,
                mongoSessionRepository,
                resumeParsingService,
                sessionPlanService,
                new com.fasterxml.jackson.databind.ObjectMapper(),
                verificationRepository
        );
    }

    static Stream<Arguments> all28Combinations() {
        List<Arguments> args = new ArrayList<>();
        for (InterviewTrack track : InterviewTrack.values()) {
            if (track == InterviewTrack.FULL_LOOP || track == InterviewTrack.DSA_LLD || track == InterviewTrack.DSA_LLD_HLD || track == InterviewTrack.LLD_HLD) continue; // 7 focused tracks x 4 difficulties = 28 combinations
            for (DifficultyLevel diff : DifficultyLevel.values()) {
                args.add(Arguments.of(track, diff));
            }
        }
        return args.stream();
    }

    private static final Set<String> DSA_SLUGS = Set.of(
            "two-sum", "reverse-a-string", "valid-parentheses",
            "longest-substring-without-repeating-characters", "search-in-rotated-sorted-array",
            "lru-cache", "merge-k-sorted-lists", "trapping-rain-water", "topo-course-schedule"
    );

    private static final Set<String> JUNIOR_DSA_SLUGS = Set.of(
            "two-sum", "reverse-a-string", "valid-parentheses"
    );

    @ParameterizedTest(name = "[A9 28-Combo Fallback] {0} x {1}")
    @MethodSource("all28Combinations")
    @DisplayName("Deterministic 28-combo ladder test (fallback mode): preserves track integrity and ladder progression")
    void testAll28Combinations_FallbackMode(InterviewTrack track, DifficultyLevel difficulty) {
        long seed = 42L + track.ordinal() * 100L + difficulty.ordinal();
        List<String> planned = serviceWithFallbackOnly.buildPlannedSlugs(track, difficulty, seed);

        // 1. Exactly 3 questions planned
        assertThat(planned).hasSize(3);

        // 2. Track integrity: Non-DSA tracks must NOT fall back to DSA questions
        if (track == InterviewTrack.SQL) {
            assertThat(planned).noneMatch(DSA_SLUGS::contains);
        } else if (track == InterviewTrack.SPRING_LLD || track == InterviewTrack.JAVA_SPRING_BOOT) {
            assertThat(planned).noneMatch(DSA_SLUGS::contains);
        } else if (track == InterviewTrack.SYSTEM_DESIGN) {
            assertThat(planned).noneMatch(DSA_SLUGS::contains);
        } else if (track == InterviewTrack.BEHAVIORAL_STAR) {
            assertThat(planned).noneMatch(DSA_SLUGS::contains);
        } else if (track == InterviewTrack.RESUME_BASED) {
            assertThat(planned).noneMatch(DSA_SLUGS::contains);
        }

        // 3. Rung Contract: Rung 3 (high rung) must NEVER be JUNIOR when requested difficulty is MID, SENIOR, or STAFF
        String q3 = planned.get(2);
        if (track == InterviewTrack.ALGORITHMS_DATA_STRUCTURES) {
            if (difficulty != DifficultyLevel.JUNIOR) {
                assertThat(JUNIOR_DSA_SLUGS).as("Q3 at rung 3 must not be JUNIOR for difficulty %s", difficulty).doesNotContain(q3);
            }
        }
    }

    @ParameterizedTest(name = "[A9 28-Combo Remote] {0} x {1}")
    @MethodSource("all28Combinations")
    @DisplayName("Deterministic 28-combo ladder test (remote mode): consumes remote bank when available")
    void testAll28Combinations_RemoteMode(InterviewTrack track, DifficultyLevel difficulty) {
        String canonicalKey = serviceWithRemote.resolveCatalogTrackKey(track);

        when(questionBankClient.listProblems(anyString(), anyString())).thenAnswer(invocation -> {
            String tr = invocation.getArgument(0);
            String diff = invocation.getArgument(1);
            return List.of(ProblemDocument.builder()
                    .problemSlug("remote-" + tr.toLowerCase() + "-" + diff.toLowerCase())
                    .track(tr)
                    .difficulty(diff)
                    .build());
        });

        long seed = 12345L;
        List<String> planned = serviceWithRemote.buildPlannedSlugs(track, difficulty, seed);

        assertThat(planned).hasSize(3);
        assertThat(planned.get(0)).startsWith("remote-" + canonicalKey.toLowerCase());
        assertThat(planned.get(1)).startsWith("remote-" + canonicalKey.toLowerCase());
        assertThat(planned.get(2)).startsWith("remote-" + canonicalKey.toLowerCase());
    }

    @Test
    @DisplayName("A9: Non-existent remote question bank gracefully falls back to adjacent track rungs without cross-track pollution")
    void testAdjacentRungFallback_NoCrossTrackPollution() {
        org.mockito.Mockito.lenient().when(questionBankClient.listProblems("SQL", "STAFF")).thenReturn(Collections.emptyList());
        org.mockito.Mockito.lenient().when(questionBankClient.listProblems("SQL", "SENIOR")).thenReturn(List.of(
                ProblemDocument.builder().problemSlug("remote-sql-senior-1").track("SQL").difficulty("SENIOR").build()
        ));
        org.mockito.Mockito.lenient().when(questionBankClient.listProblems("SQL", "MID")).thenReturn(List.of(
                ProblemDocument.builder().problemSlug("remote-sql-mid-1").track("SQL").difficulty("MID").build()
        ));

        List<String> planned = serviceWithRemote.buildPlannedSlugs(InterviewTrack.SQL, DifficultyLevel.STAFF, 42L);

        assertThat(planned).hasSize(3);
        assertThat(planned).noneMatch(DSA_SLUGS::contains);
    }

    @Test
    @DisplayName("A12: Manual 1->3 jump records skipped intermediate stage as MANUAL_JUMP with turnCount=0 and counts stage 1 turns")
    void testManualJump_recordsIntermediateStageWithZeroTurns() {
        Long sessionId = 100L;
        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .status(SessionStatus.IN_PROGRESS)
                .build();
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        InterviewSessionDocument.TranscriptTurn turn1 = InterviewSessionDocument.TranscriptTurn.builder()
                .senderRole("CANDIDATE")
                .metadata(Map.of("stage", "INTRODUCTION", "sectionType", "INTRODUCTION"))
                .content("Hello, I am ready.")
                .build();
        InterviewSessionDocument.TranscriptTurn turn2 = InterviewSessionDocument.TranscriptTurn.builder()
                .senderRole("CANDIDATE")
                .metadata(Map.of("stage", "INTRODUCTION", "sectionType", "INTRODUCTION"))
                .content("I have 5 years experience.")
                .build();
        InterviewSessionDocument.TranscriptTurn aiTurn = InterviewSessionDocument.TranscriptTurn.builder()
                .senderRole("AI")
                .metadata(Map.of("stage", "INTRODUCTION", "sectionType", "INTRODUCTION"))
                .content("Great to meet you.")
                .build();

        InterviewSessionDocument doc = InterviewSessionDocument.builder()
                .sessionId(sessionId)
                .status("IN_PROGRESS")
                .transcript(new ArrayList<>(List.of(turn1, aiTurn, turn2)))
                .sectionProgress(new ArrayList<>())
                .build();
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(sessionId)).thenReturn(Optional.of(doc));

        // Candidate on Stage 1 (INTRODUCTION, idx 0) jumps directly to Stage 3 (CODING_DSA, idx 2)
        SectionTransitionRequest request = new SectionTransitionRequest("INTRODUCTION", "CODING_DSA", 0, "MANUAL_JUMP");
        List<InterviewSessionDocument.SectionProgress> progressList = serviceWithFallbackOnly.recordSectionTransition(sessionId, request);

        // Assert that both stage 0 (INTRODUCTION) and skipped intermediate stage 1 (CORE_TECH) are recorded
        assertThat(progressList).hasSize(2);

        InterviewSessionDocument.SectionProgress intro = progressList.get(0);
        assertThat(intro.getSectionType()).isEqualTo("INTRODUCTION");
        assertThat(intro.getIndex()).isEqualTo(0);
        assertThat(intro.getReason()).isEqualTo("MANUAL_JUMP");
        assertThat(intro.getTurnCount()).isEqualTo(2); // 2 candidate turns in introduction

        InterviewSessionDocument.SectionProgress coreTech = progressList.get(1);
        assertThat(coreTech.getSectionType()).isEqualTo("CORE_TECH");
        assertThat(coreTech.getIndex()).isEqualTo(1);
        assertThat(coreTech.getReason()).isEqualTo("MANUAL_JUMP");
        assertThat(coreTech.getTurnCount()).isEqualTo(0); // 0 turns because it was jumped past!

        // Idempotency: re-invoking does not produce duplicates
        List<InterviewSessionDocument.SectionProgress> progressListAgain = serviceWithFallbackOnly.recordSectionTransition(sessionId, request);
        assertThat(progressListAgain).hasSize(2);
    }

    @ParameterizedTest(name = "[C1 Plan 28-Combo] {0} x {1}")
    @MethodSource("all28Combinations")
    @DisplayName("C1: Deterministic 28-combo plan resolver: 2 sections (INTRO + domain), valid budgets, zero DSA bleed")
    void testSessionPlan_All28Combinations(InterviewTrack track, DifficultyLevel difficulty) {
        SessionPlan plan = sessionPlanService.buildPlan(track, difficulty, 42L);

        assertThat(plan).isNotNull();
        assertThat(plan.source()).isEqualTo("SETUP_SELECTION");
        assertThat(plan.level()).isEqualTo(difficulty);
        assertThat(plan.sections()).hasSize(2);

        PlannedSection intro = plan.sections().get(0);
        assertThat(intro.sectionType()).isEqualTo(SectionType.INTRODUCTION);
        assertThat(intro.softTimeBudgetMinutes()).isEqualTo(5);
        assertThat(intro.itemCount()).isEqualTo(1);

        PlannedSection domain = plan.sections().get(1);
        assertThat(domain.track()).isEqualTo(track);
        assertThat(domain.problemSlugs()).isNotEmpty();
        assertThat(domain.problemSlugs()).hasSize(domain.itemCount());

        int expectedTotal = intro.softTimeBudgetMinutes() + domain.softTimeBudgetMinutes();
        assertThat(plan.plannedTotalMinutes()).isEqualTo(expectedTotal);

        // Zero DSA bleed for non-DSA tracks
        if (track != InterviewTrack.ALGORITHMS_DATA_STRUCTURES) {
            assertThat(domain.problemSlugs()).noneMatch(DSA_SLUGS::contains);
        }
    }

    @Test
    @DisplayName("C1: FULL_LOOP presets implement exact multi-stage progression and budgets")
    void testSessionPlan_FullLoop_Presets() {
        // JUNIOR: INTRO(5) + DSA(30, 2 items) + LLD(15, 1 item) = 52 min
        SessionPlan junior = sessionPlanService.buildPlan(InterviewTrack.FULL_LOOP, DifficultyLevel.JUNIOR, 42L);
        assertThat(junior.plannedTotalMinutes()).isEqualTo(52);
        assertThat(junior.sections()).hasSize(3);
        assertThat(junior.sections().get(0).sectionType()).isEqualTo(SectionType.INTRODUCTION);
        assertThat(junior.sections().get(1).sectionType()).isEqualTo(SectionType.DSA);
        assertThat(junior.sections().get(1).itemCount()).isEqualTo(2);
        assertThat(junior.sections().get(2).sectionType()).isEqualTo(SectionType.LLD);
        assertThat(junior.sections().get(2).itemCount()).isEqualTo(1);

        // MID: INTRO(5) + DSA(30, 2 items) + LLD(20, 2 items) = 58 min
        SessionPlan mid = sessionPlanService.buildPlan(InterviewTrack.FULL_LOOP, DifficultyLevel.MID, 42L);
        assertThat(mid.plannedTotalMinutes()).isEqualTo(58);
        assertThat(mid.sections()).hasSize(3);
        assertThat(mid.sections().get(0).sectionType()).isEqualTo(SectionType.INTRODUCTION);
        assertThat(mid.sections().get(1).sectionType()).isEqualTo(SectionType.DSA);
        assertThat(mid.sections().get(1).itemCount()).isEqualTo(2);
        assertThat(mid.sections().get(2).sectionType()).isEqualTo(SectionType.LLD);
        assertThat(mid.sections().get(2).itemCount()).isEqualTo(2);

        // SENIOR: INTRO(5) + DSA(15, 1 item) + LLD(15, 1 item) + SD(18, 1 item) = 55 min
        SessionPlan senior = sessionPlanService.buildPlan(InterviewTrack.FULL_LOOP, DifficultyLevel.SENIOR, 42L);
        assertThat(senior.plannedTotalMinutes()).isEqualTo(55);
        assertThat(senior.sections()).hasSize(4);
        assertThat(senior.sections().get(0).sectionType()).isEqualTo(SectionType.INTRODUCTION);
        assertThat(senior.sections().get(1).sectionType()).isEqualTo(SectionType.DSA);
        assertThat(senior.sections().get(2).sectionType()).isEqualTo(SectionType.LLD);
        assertThat(senior.sections().get(3).sectionType()).isEqualTo(SectionType.SYSTEM_DESIGN);

        // STAFF: INTRO(5) + LLD(15, 1 item) + SD(18, 1 item) + RESUME(12, 1 item) = 52 min
        SessionPlan staff = sessionPlanService.buildPlan(InterviewTrack.FULL_LOOP, DifficultyLevel.STAFF, 42L);
        assertThat(staff.plannedTotalMinutes()).isEqualTo(52);
        assertThat(staff.sections()).hasSize(4);
        assertThat(staff.sections().get(0).sectionType()).isEqualTo(SectionType.INTRODUCTION);
        assertThat(staff.sections().get(1).sectionType()).isEqualTo(SectionType.LLD);
        assertThat(staff.sections().get(2).sectionType()).isEqualTo(SectionType.SYSTEM_DESIGN);
        assertThat(staff.sections().get(3).sectionType()).isEqualTo(SectionType.RESUME);
        assertThat(staff.sections().get(3).problemSlugs()).noneMatch(DSA_SLUGS::contains);
    }

    @Test
    @DisplayName("C1: createSession in INTERVIEW mode populates plan in entity, Mongo doc, and response")
    void testCreateSession_InterviewMode_PersistsPlan() {
        CreateSessionRequest request = new CreateSessionRequest(
                "cand-1",
                "Alice Candidate",
                "Software Engineer",
                InterviewTrack.SQL,
                DifficultyLevel.MID,
                "Acme Corp",
                "Job Desc",
                "INTERVIEW"
        );

        when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(inv -> {
            InterviewSession s = inv.getArgument(0);
            s.setId(200L);
            return s;
        });
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(200L)).thenReturn(Optional.empty());

        SessionResponse response = serviceWithFallbackOnly.createSession(request);

        assertThat(response).isNotNull();
        assertThat(response.sessionMode()).isEqualTo("INTERVIEW");
        assertThat(response.plan()).isNotNull();
        assertThat(response.plan().sections()).hasSize(2);
        assertThat(response.plan().level()).isEqualTo(DifficultyLevel.MID);
    }

    @Test
    @DisplayName("C1: createSession in PLAYGROUND mode leaves plan null")
    void testCreateSession_PlaygroundMode_LeavesPlanNull() {
        CreateSessionRequest request = new CreateSessionRequest(
                "cand-2",
                "Bob Playground",
                "Software Engineer",
                InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                DifficultyLevel.JUNIOR,
                "Acme Corp",
                "Job Desc",
                "PLAYGROUND"
        );

        when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(inv -> {
            InterviewSession s = inv.getArgument(0);
            s.setId(201L);
            return s;
        });
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(201L)).thenReturn(Optional.empty());

        SessionResponse response = serviceWithFallbackOnly.createSession(request);

        assertThat(response).isNotNull();
        assertThat(response.sessionMode()).isEqualTo("PLAYGROUND");
        assertThat(response.plan()).isNull();
        assertThat(response.plannedSlugs()).isEmpty();
    }

    @Test
    @DisplayName("C3: createSession respects planSource from request (RESUME_INFERRED_CONFIRMED vs SETUP_SELECTION)")
    void testCreateSession_PlanSourcePropagation() {
        // Request with RESUME_INFERRED_CONFIRMED
        CreateSessionRequest reqInferred = new CreateSessionRequest(
                "cand-inferred",
                "Alice Inferred",
                "Backend Engineer",
                InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                DifficultyLevel.MID,
                "Acme",
                "Desc",
                "INTERVIEW",
                "RESUME_INFERRED_CONFIRMED"
        );

        when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(inv -> {
            InterviewSession s = inv.getArgument(0);
            s.setId(202L);
            return s;
        });
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(202L)).thenReturn(Optional.empty());

        SessionResponse resInferred = serviceWithFallbackOnly.createSession(reqInferred);
        assertThat(resInferred.plan()).isNotNull();
        assertThat(resInferred.plan().source()).isEqualTo("RESUME_INFERRED_CONFIRMED");

        // Request with manual override / default
        CreateSessionRequest reqManual = new CreateSessionRequest(
                "cand-manual",
                "Alice Manual",
                "Backend Engineer",
                InterviewTrack.ALGORITHMS_DATA_STRUCTURES,
                DifficultyLevel.JUNIOR,
                "Acme",
                "Desc",
                "INTERVIEW",
                "SETUP_SELECTION"
        );

        when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(inv -> {
            InterviewSession s = inv.getArgument(0);
            s.setId(203L);
            return s;
        });
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(203L)).thenReturn(Optional.empty());

        SessionResponse resManual = serviceWithFallbackOnly.createSession(reqManual);
        assertThat(resManual.plan()).isNotNull();
        assertThat(resManual.plan().source()).isEqualTo("SETUP_SELECTION");
    }

    @Test
    @DisplayName("startSession in INTERVIEW mode without receipt throws VerificationRequiredException (409)")
    void testStartSession_InterviewMode_WithoutReceipt_ThrowsVerificationRequiredException() {
        InterviewSession session = InterviewSession.builder()
                .id(1L)
                .candidateId("cand-1")
                .roleTitle("Engineer")
                .track(InterviewTrack.SQL)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.INITIALIZED)
                .sessionMode("INTERVIEW")
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(verificationRepository.findBySessionId(1L)).thenReturn(Optional.empty());

        assertThrows(com.interviewos.session.exception.VerificationRequiredException.class,
                () -> serviceWithVerification.startSession(1L));
    }

    @Test
    @DisplayName("startSession in INTERVIEW mode with valid receipt succeeds and transitions to IN_PROGRESS")
    void testStartSession_InterviewMode_WithValidReceipt_Succeeds() {
        InterviewSession session = InterviewSession.builder()
                .id(1L)
                .candidateId("cand-1")
                .roleTitle("Engineer")
                .track(InterviewTrack.SQL)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.INITIALIZED)
                .sessionMode("INTERVIEW")
                .build();

        com.interviewos.session.entity.SessionVerification verification = com.interviewos.session.entity.SessionVerification.builder()
                .id(10L)
                .sessionId(1L)
                .cameraStatus("OK")
                .micStatus("OK")
                .screenStatus("OK")
                .screenScope("MONITOR")
                .consent(true)
                .outcome("VERIFIED")
                .verifiedAt(Instant.now())
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(verificationRepository.findBySessionId(1L)).thenReturn(Optional.of(verification));

        SessionResponse resp = serviceWithVerification.startSession(1L);
        assertEquals(SessionStatus.IN_PROGRESS, resp.status());
        assertNotNull(resp.startedAt());
    }

    @Test
    @DisplayName("startSession in PLAYGROUND mode without receipt succeeds directly")
    void testStartSession_PlaygroundMode_WithoutReceipt_Succeeds() {
        InterviewSession session = InterviewSession.builder()
                .id(2L)
                .candidateId("cand-2")
                .roleTitle("Engineer")
                .track(InterviewTrack.SQL)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.INITIALIZED)
                .sessionMode("PLAYGROUND")
                .build();

        when(sessionRepository.findById(2L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionResponse resp = serviceWithVerification.startSession(2L);
        assertEquals(SessionStatus.IN_PROGRESS, resp.status());
    }

    @Test
    @DisplayName("recordVerification on already started session throws IllegalStateException")
    void testRecordVerification_AlreadyStarted_ThrowsConflict() {
        InterviewSession session = InterviewSession.builder()
                .id(1L)
                .candidateId("cand-1")
                .roleTitle("Engineer")
                .track(InterviewTrack.SQL)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.IN_PROGRESS)
                .sessionMode("INTERVIEW")
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        com.interviewos.session.dto.SessionVerificationRequest req = new com.interviewos.session.dto.SessionVerificationRequest(
                true, true, true, "MONITOR", "Primary", true, "VERIFIED", "UA"
        );

        assertThrows(IllegalStateException.class, () -> serviceWithVerification.recordVerification(1L, req));
    }

    @Test
    @DisplayName("abortSession transitions status to ABORTED_SHARE idempotently")
    void testAbortSession_Idempotent() {
        InterviewSession session = InterviewSession.builder()
                .id(1L)
                .candidateId("cand-1")
                .roleTitle("Engineer")
                .track(InterviewTrack.SQL)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now().minusSeconds(30))
                .sessionMode("INTERVIEW")
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        com.interviewos.session.dto.AbortSessionRequest req = new com.interviewos.session.dto.AbortSessionRequest("SHARE_LOST_EXPIRED");
        SessionResponse resp1 = serviceWithVerification.abortSession(1L, req);
        assertEquals(SessionStatus.ABORTED_SHARE, resp1.status());

        SessionResponse resp2 = serviceWithVerification.abortSession(1L, req);
        assertEquals(SessionStatus.ABORTED_SHARE, resp2.status());
    }

    @Test
    @DisplayName("addMessage on session in ABORTED_SHARE status throws IllegalStateException")
    void testAddMessage_WhenAborted_ThrowsIllegalStateException() {
        InterviewSession session = InterviewSession.builder()
                .id(1L)
                .candidateId("cand-1")
                .roleTitle("Engineer")
                .track(InterviewTrack.SQL)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.ABORTED_SHARE)
                .sessionMode("INTERVIEW")
                .build();

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(session));

        com.interviewos.session.dto.AddMessageRequest msgReq = new com.interviewos.session.dto.AddMessageRequest(
                "CANDIDATE", com.interviewos.session.model.MessageType.EXPLANATION, "Hello", null
        );

        assertThrows(IllegalStateException.class, () -> serviceWithVerification.addMessage(1L, msgReq));
    }
}
