package com.interviewos.session.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.CreateSessionRequest;
import com.interviewos.session.dto.SessionResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.model.*;
import com.interviewos.session.repository.*;
import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.vault.VaultArchiveService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QuestionRotationIntegrationTest {

    @Mock
    private InterviewSessionRepository sessionRepository;
    @Mock
    private SessionMessageRepository messageRepository;
    @Mock
    private InterviewSessionMongoRepository mongoSessionRepository;
    @Mock
    private ResumeParsingService resumeParsingService;
    @Mock
    private SessionVerificationRepository verificationRepository;
    @Mock
    private SessionQuestionRepository sessionQuestionRepository;
    @Mock
    private QuestionBankClient questionBankClient;
    @Mock
    private CandidateProfileService candidateProfileService;
    @Mock
    private VaultArchiveService vaultArchiveService;

    private SessionPlanService sessionPlanService;
    private SessionQuestionService sessionQuestionService;
    private QuestionExposureService questionExposureService;
    private InterviewSessionService interviewSessionService;

    private final AtomicLong sessionIdGen = new AtomicLong(100L);

    @BeforeEach
    void setUp() {
        sessionPlanService = new SessionPlanService(questionBankClient);
        sessionQuestionService = new SessionQuestionService(sessionQuestionRepository, null);
        questionExposureService = new QuestionExposureService(sessionQuestionRepository);

        interviewSessionService = new InterviewSessionService(
                sessionRepository,
                messageRepository,
                mongoSessionRepository,
                resumeParsingService,
                sessionPlanService,
                new com.fasterxml.jackson.databind.ObjectMapper(),
                verificationRepository,
                sessionQuestionService,
                candidateProfileService,
                vaultArchiveService,
                questionExposureService
        );

        when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(inv -> {
            InterviewSession s = inv.getArgument(0);
            if (s.getId() == null) {
                s.setId(sessionIdGen.incrementAndGet());
            }
            return s;
        });
        when(mongoSessionRepository.findFirstBySessionIdOrderByCreatedAtDesc(anyLong()))
                .thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("VP-01: Same candidate+track+difficulty across 2 sessions produces disjoint planned question sets")
    void testVP01_NoRepeat_DisjointPlansAcrossSessions() {
        String candidateId = "cand-alice-01";
        InterviewTrack track = InterviewTrack.ALGORITHMS_DATA_STRUCTURES;
        DifficultyLevel difficulty = DifficultyLevel.MID;

        // Session 1: No prior exposure
        when(sessionQuestionRepository.findExposureByCandidateAndTrack(eq(candidateId), eq(track.name())))
                .thenReturn(List.of());

        interviewSessionService.setSessionNonceSupplier(() -> 1000L);
        CreateSessionRequest req1 = new CreateSessionRequest(
                candidateId, "Alice", "Software Engineer", track, difficulty, "TechCorp", "Desc", "INTERVIEW"
        );
        SessionResponse resp1 = interviewSessionService.createSession(req1);
        List<String> planned1 = resp1.plannedSlugs();
        assertThat(planned1).hasSize(2);

        // Simulate Session 1 having exposed these questions
        List<SessionQuestionRepository.ExposureProjection> exposureAfterS1 = List.of(
                createExposureProj(planned1.get(0), 1L, Instant.now().minusSeconds(3600)),
                createExposureProj(planned1.get(1), 1L, Instant.now().minusSeconds(3600))
        );
        when(sessionQuestionRepository.findExposureByCandidateAndTrack(eq(candidateId), eq(track.name())))
                .thenReturn(exposureAfterS1);

        // Session 2: Different nonce, exposure lookup active
        interviewSessionService.setSessionNonceSupplier(() -> 2000L);
        CreateSessionRequest req2 = new CreateSessionRequest(
                candidateId, "Alice", "Software Engineer", track, difficulty, "TechCorp", "Desc", "INTERVIEW"
        );
        SessionResponse resp2 = interviewSessionService.createSession(req2);
        List<String> planned2 = resp2.plannedSlugs();
        assertThat(planned2).hasSize(2);

        // Disjoint check: planned2 must not contain any questions from planned1
        assertThat(planned2).doesNotContainAnyElementsOf(planned1);
        assertThat(resp2.plan().rotationPolicy()).isEqualTo("STRICT");
    }

    @Test
    @DisplayName("VP-02: Nonce determinism: fixed nonce yields stable plan; differing nonce yields divergent plan")
    void testVP02_NonceDeterminismAndDivergence() {
        String candidateId = "cand-bob-02";
        InterviewTrack track = InterviewTrack.SQL;
        DifficultyLevel difficulty = DifficultyLevel.MID;

        // Mock remote question pool with 10 questions to allow distinct random walks
        when(questionBankClient.listProblems(eq("SQL_DATABASE"), anyString())).thenReturn(List.of(
                createProblemDoc("sql-q1", "SQL_DATABASE", "MID"),
                createProblemDoc("sql-q2", "SQL_DATABASE", "MID"),
                createProblemDoc("sql-q3", "SQL_DATABASE", "MID"),
                createProblemDoc("sql-q4", "SQL_DATABASE", "MID"),
                createProblemDoc("sql-q5", "SQL_DATABASE", "MID"),
                createProblemDoc("sql-q6", "SQL_DATABASE", "MID"),
                createProblemDoc("sql-q7", "SQL_DATABASE", "MID"),
                createProblemDoc("sql-q8", "SQL_DATABASE", "MID")
        ));

        // Fixed nonce 5555L run twice
        interviewSessionService.setSessionNonceSupplier(() -> 5555L);
        CreateSessionRequest reqA = new CreateSessionRequest(candidateId, "Bob", "DBA", track, difficulty, "Co", "D", "INTERVIEW");
        SessionResponse respA1 = interviewSessionService.createSession(reqA);

        interviewSessionService.setSessionNonceSupplier(() -> 5555L);
        CreateSessionRequest reqB = new CreateSessionRequest(candidateId, "Bob", "DBA", track, difficulty, "Co", "D", "INTERVIEW");
        SessionResponse respA2 = interviewSessionService.createSession(reqB);

        // Assert plan stability under fixed nonce
        assertThat(respA1.plannedSlugs()).isEqualTo(respA2.plannedSlugs());

        // Differing nonce 9999L
        interviewSessionService.setSessionNonceSupplier(() -> 9999L);
        SessionResponse respA3 = interviewSessionService.createSession(reqA);

        // Assert plan divergence under differing nonce
        assertThat(respA3.plannedSlugs()).isNotEqualTo(respA1.plannedSlugs());
    }

    @Test
    @DisplayName("VP-03: Candidate isolation: Candidate B's plan is unaffected by Candidate A's exposure")
    void testVP03_CandidateIsolation() {
        String candA = "cand-alice";
        String candB = "cand-bob";
        InterviewTrack track = InterviewTrack.ALGORITHMS_DATA_STRUCTURES;
        DifficultyLevel diff = DifficultyLevel.MID;

        // Candidate A has seen two-sum and lru-cache
        when(sessionQuestionRepository.findExposureByCandidateAndTrack(eq(candA), eq(track.name())))
                .thenReturn(List.of(
                        createExposureProj("two-sum", 2L, Instant.now()),
                        createExposureProj("lru-cache", 1L, Instant.now())
                ));
        // Candidate B has no exposure
        when(sessionQuestionRepository.findExposureByCandidateAndTrack(eq(candB), eq(track.name())))
                .thenReturn(List.of());

        interviewSessionService.setSessionNonceSupplier(() -> 42L);
        CreateSessionRequest reqB = new CreateSessionRequest(candB, "Bob", "SE", track, diff, "Co", "D", "INTERVIEW");
        SessionResponse respB = interviewSessionService.createSession(reqB);

        // Candidate B can receive any question including those seen by Candidate A
        assertThat(respB.plan().rotationPolicy()).isEqualTo("STRICT");
        assertThat(respB.plannedSlugs()).isNotEmpty();
    }

    @Test
    @DisplayName("VP-04: Degradation ladder: synthetic pool exhausted -> D2 LRU reuse with [ROTATION_DEGRADED] policy")
    void testVP04_DegradationLadder_LruReuse() {
        String candidateId = "cand-d2-test";
        InterviewTrack track = InterviewTrack.BEHAVIORAL_STAR;
        DifficultyLevel diff = DifficultyLevel.SENIOR;

        // Remote has only 2 behavioral questions total
        when(questionBankClient.listProblems(eq("BEHAVIORAL"), anyString())).thenReturn(List.of(
                createProblemDoc("beh-q1", "BEHAVIORAL", "SENIOR"),
                createProblemDoc("beh-q2", "BEHAVIORAL", "SENIOR")
        ));

        // Candidate has already seen beh-q1 twice, and beh-q2 once
        Instant now = Instant.now();
        when(sessionQuestionRepository.findExposureByCandidateAndTrack(eq(candidateId), eq(track.name())))
                .thenReturn(List.of(
                        createExposureProj("beh-q1", 2L, now.minusSeconds(100)),
                        createExposureProj("beh-q2", 1L, now.minusSeconds(500))
                ));

        // BEHAVIORAL requests 2 items in focused plan
        interviewSessionService.setSessionNonceSupplier(() -> 1234L);
        CreateSessionRequest req = new CreateSessionRequest(candidateId, "Dave", "EM", track, diff, "Co", "D", "INTERVIEW");
        SessionResponse resp = interviewSessionService.createSession(req);

        // Verify session was created successfully (never throw)
        assertThat(resp).isNotNull();
        assertThat(resp.plannedSlugs()).hasSize(2);
        // Verify degradation to DEGRADED_LRU
        assertThat(resp.plan().rotationPolicy()).isEqualTo("DEGRADED_LRU");
        assertThat(resp.plan().reusedSlugs()).isNotEmpty();
    }

    @Test
    @DisplayName("VP-05: Exposure write path retained: session_questions rows == planned slugs per session")
    void testVP05_ExposureWritePathRetained() {
        InterviewSession session = InterviewSession.builder()
                .id(999L)
                .candidateId("cand-write-test")
                .roleTitle("Engineer")
                .track(InterviewTrack.SQL)
                .difficulty(DifficultyLevel.MID)
                .status(SessionStatus.INITIALIZED)
                .plannedSlugs(List.of("sql-running-revenue", "sql-funnel-ratios"))
                .build();

        when(sessionQuestionRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        List<SessionQuestion> savedRows = sessionQuestionService.recordSessionQuestions(session, List.of());

        assertThat(savedRows).hasSize(2);
        assertThat(savedRows.get(0).getQuestionSlug()).isEqualTo("sql-running-revenue");
        assertThat(savedRows.get(0).getVerdict()).isEqualTo("UNATTEMPTED");
        assertThat(savedRows.get(1).getQuestionSlug()).isEqualTo("sql-funnel-ratios");
        verify(sessionQuestionRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("VP-06: Multi-track loop uniqueness: section slugs globally unique within multi-track session")
    void testVP06_MultiTrackLoopUniqueness() {
        String candidateId = "cand-loop-test";
        InterviewTrack track = InterviewTrack.DSA_LLD_HLD;
        DifficultyLevel diff = DifficultyLevel.MID;

        when(sessionQuestionRepository.findExposureByCandidateAndTrack(eq(candidateId), anyString()))
                .thenReturn(List.of());

        interviewSessionService.setSessionNonceSupplier(() -> 777L);
        CreateSessionRequest req = new CreateSessionRequest(candidateId, "LoopUser", "FullStack", track, diff, "Co", "D", "INTERVIEW");
        SessionResponse resp = interviewSessionService.createSession(req);

        List<String> planned = resp.plannedSlugs();
        assertThat(planned).isNotEmpty();
        // Global uniqueness across sections within session
        Set<String> uniqueSlugs = new HashSet<>(planned);
        assertThat(uniqueSlugs).hasSameSizeAs(planned);
    }

    private SessionQuestionRepository.ExposureProjection createExposureProj(String slug, long timesServed, Instant lastServedAt) {
        return new SessionQuestionRepository.ExposureProjection() {
            @Override
            public String getSlug() {
                return slug;
            }

            @Override
            public Long getTimesServed() {
                return timesServed;
            }

            @Override
            public Instant getLastServedAt() {
                return lastServedAt;
            }
        };
    }

    private ProblemDocument createProblemDoc(String slug, String track, String difficulty) {
        return ProblemDocument.builder()
                .problemSlug(slug)
                .track(track)
                .difficulty(difficulty)
                .build();
    }
}
