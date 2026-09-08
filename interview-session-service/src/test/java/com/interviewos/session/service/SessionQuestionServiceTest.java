package com.interviewos.session.service;

import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.dto.QuestionEncountersResponse;
import com.interviewos.session.dto.SessionQuestionResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.repository.QuestionProgressRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionQuestionServiceTest {

    @Mock
    private SessionQuestionRepository sessionQuestionRepository;

    @Mock
    private QuestionProgressRepository questionProgressRepository;

    @InjectMocks
    private SessionQuestionService sessionQuestionService;

    private InterviewSession testSession;

    @BeforeEach
    void setUp() {
        testSession = InterviewSession.builder()
                .id(100L)
                .candidateId("cand-test")
                .roleTitle("Software Engineer")
                .plannedSlugs(List.of("dsa-two-sum", "dsa-lru-cache", "dsa-valid-parentheses"))
                .build();
    }

    @Test
    @DisplayName("Gate VA-a: Finalize session containing 3 questions (1 passed, 1 failed, 1 unattempted) records exact 3 rows")
    void testRecordSessionQuestionsWithVariedVerdicts() {
        // Given submissions for two-sum (passed) and lru-cache (failed), nothing for valid-parentheses
        List<InterviewSessionDocument.SubmissionEntry> submissions = List.of(
                InterviewSessionDocument.SubmissionEntry.builder()
                        .problemSlug("dsa-two-sum")
                        .status("PASSED")
                        .timestamp(LocalDateTime.now().minusMinutes(10))
                        .build(),
                InterviewSessionDocument.SubmissionEntry.builder()
                        .problemSlug("dsa-lru-cache")
                        .status("FAILED")
                        .timestamp(LocalDateTime.now().minusMinutes(5))
                        .build()
        );

        when(sessionQuestionRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

        // When
        List<SessionQuestion> result = sessionQuestionService.recordSessionQuestions(testSession, submissions);

        // Then
        assertThat(result).hasSize(3);

        // Verify Question 1: two-sum -> PASSED
        SessionQuestion q1 = result.get(0);
        assertThat(q1.getSessionId()).isEqualTo(100L);
        assertThat(q1.getQuestionSlug()).isEqualTo("dsa-two-sum");
        assertThat(q1.getDisplayOrder()).isEqualTo(0);
        assertThat(q1.getVerdict()).isEqualTo("PASSED");
        assertThat(q1.getAttemptedAt()).isNotNull();

        // Verify Question 2: lru-cache -> FAILED
        SessionQuestion q2 = result.get(1);
        assertThat(q2.getSessionId()).isEqualTo(100L);
        assertThat(q2.getQuestionSlug()).isEqualTo("dsa-lru-cache");
        assertThat(q2.getDisplayOrder()).isEqualTo(1);
        assertThat(q2.getVerdict()).isEqualTo("FAILED");
        assertThat(q2.getAttemptedAt()).isNotNull();

        // Verify Question 3: valid-parentheses -> UNATTEMPTED (no backfill)
        SessionQuestion q3 = result.get(2);
        assertThat(q3.getSessionId()).isEqualTo(100L);
        assertThat(q3.getQuestionSlug()).isEqualTo("dsa-valid-parentheses");
        assertThat(q3.getDisplayOrder()).isEqualTo(2);
        assertThat(q3.getVerdict()).isEqualTo("UNATTEMPTED");
        assertThat(q3.getAttemptedAt()).isNull();

        verify(sessionQuestionRepository).deleteBySessionId(100L);
    }

    @Test
    @DisplayName("Gate VA-d (ledger arithmetic): 3 practice solves, 2 interview attempts (1 pass) renders Practice ×3 · Interview 1/2")
    void testGateVAdLedgerArithmetic() {
        String slug = "dsa-lru-cache";

        // 3 practice solves in question_progress
        QuestionProgress progress = QuestionProgress.builder()
                .userId("local")
                .questionId(slug)
                .attemptCount(5)
                .solveCount(3)
                .build();
        when(questionProgressRepository.findByUserIdAndQuestionId("local", slug))
                .thenReturn(Optional.of(progress));

        // 2 interview encounters in session_questions: 1 PASSED, 1 FAILED
        List<SessionQuestion> encounters = List.of(
                SessionQuestion.builder()
                        .sessionId(201L)
                        .questionSlug(slug)
                        .verdict("PASSED")
                        .attemptedAt(Instant.now().minusSeconds(3600))
                        .build(),
                SessionQuestion.builder()
                        .sessionId(101L)
                        .questionSlug(slug)
                        .verdict("FAILED")
                        .attemptedAt(Instant.now().minusSeconds(7200))
                        .build()
        );
        when(sessionQuestionRepository.findByQuestionSlugOrderByAttemptedAtDesc(slug))
                .thenReturn(encounters);

        // When
        QuestionEncountersResponse response = sessionQuestionService.getQuestionEncounters(slug, "local");

        // Then
        assertThat(response.questionSlug()).isEqualTo(slug);
        assertThat(response.practiceSolveCount()).isEqualTo(3);
        assertThat(response.interviewPassCount()).isEqualTo(1);
        assertThat(response.interviewAttemptCount()).isEqualTo(2);
        assertThat(response.pressureGap()).isEqualTo("Practice ×3 · Interview 1/2");
        assertThat(response.encounters()).hasSize(2);
    }

    @Test
    @DisplayName("UNATTEMPTED encounters are excluded from interviewAttemptCount in pressure-gap")
    void testUnattemptedEncountersExcludedFromAttemptCount() {
        String slug = "dsa-two-sum";

        when(questionProgressRepository.findByUserIdAndQuestionId("local", slug))
                .thenReturn(Optional.empty());

        // 2 encounters: 1 PASSED, 1 UNATTEMPTED
        List<SessionQuestion> encounters = List.of(
                SessionQuestion.builder()
                        .sessionId(301L)
                        .questionSlug(slug)
                        .verdict("PASSED")
                        .attemptedAt(Instant.now())
                        .build(),
                SessionQuestion.builder()
                        .sessionId(302L)
                        .questionSlug(slug)
                        .verdict("UNATTEMPTED")
                        .attemptedAt(null)
                        .build()
        );
        when(sessionQuestionRepository.findByQuestionSlugOrderByAttemptedAtDesc(slug))
                .thenReturn(encounters);

        QuestionEncountersResponse response = sessionQuestionService.getQuestionEncounters(slug, "local");

        assertThat(response.practiceSolveCount()).isEqualTo(0);
        assertThat(response.interviewPassCount()).isEqualTo(1);
        assertThat(response.interviewAttemptCount()).isEqualTo(1); // UNATTEMPTED not counted as attempt
        assertThat(response.pressureGap()).isEqualTo("Practice ×0 · Interview 1/1");
        assertThat(response.encounters()).hasSize(2);
    }

    @Test
    @DisplayName("getSessionQuestions returns mapped response list ordered by displayOrder")
    void testGetSessionQuestions() {
        List<SessionQuestion> entities = List.of(
                SessionQuestion.builder().id(1L).sessionId(100L).questionSlug("q1").displayOrder(0).verdict("PASSED").build(),
                SessionQuestion.builder().id(2L).sessionId(100L).questionSlug("q2").displayOrder(1).verdict("UNATTEMPTED").build()
        );
        when(sessionQuestionRepository.findBySessionIdOrderByDisplayOrderAsc(100L)).thenReturn(entities);

        List<SessionQuestionResponse> responses = sessionQuestionService.getSessionQuestions(100L);

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).questionSlug()).isEqualTo("q1");
        assertThat(responses.get(0).verdict()).isEqualTo("PASSED");
        assertThat(responses.get(1).questionSlug()).isEqualTo("q2");
        assertThat(responses.get(1).verdict()).isEqualTo("UNATTEMPTED");
    }
}
