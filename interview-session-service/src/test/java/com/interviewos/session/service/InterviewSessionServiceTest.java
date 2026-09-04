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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
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

    private InterviewSessionService serviceWithFallbackOnly;
    private InterviewSessionService serviceWithRemote;

    @BeforeEach
    void setUp() {
        serviceWithFallbackOnly = new InterviewSessionService(
                sessionRepository,
                messageRepository,
                mongoSessionRepository,
                resumeParsingService,
                null
        );

        serviceWithRemote = new InterviewSessionService(
                sessionRepository,
                messageRepository,
                mongoSessionRepository,
                resumeParsingService,
                questionBankClient
        );
    }

    static Stream<Arguments> all28Combinations() {
        List<Arguments> args = new ArrayList<>();
        for (InterviewTrack track : InterviewTrack.values()) {
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
}
