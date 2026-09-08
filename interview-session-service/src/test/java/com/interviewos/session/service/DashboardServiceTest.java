package com.interviewos.session.service;

import com.interviewos.session.dto.DashboardStatsResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.model.DifficultyLevel;
import com.interviewos.session.model.InterviewTrack;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.QuestionProgressRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private QuestionProgressRepository questionProgressRepository;

    @Mock
    private PracticeAttemptRepository practiceAttemptRepository;

    @Mock
    private SessionQuestionRepository sessionQuestionRepository;

    @Mock
    private InterviewSessionRepository interviewSessionRepository;

    @InjectMocks
    private DashboardService dashboardService;

    private final String testUserId = "vp10-candidate";

    @Test
    @DisplayName("Empty state returns clean zero counts without division by zero errors")
    void testEmptyStateReturnsCleanZeroes() {
        when(questionProgressRepository.findByUserId(testUserId)).thenReturn(List.of());
        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of());
        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of());

        DashboardStatsResponse stats = dashboardService.getDashboardStats(testUserId);

        assertThat(stats.userId()).isEqualTo(testUserId);
        assertThat(stats.practice().totalAttempts()).isEqualTo(0);
        assertThat(stats.practice().passedAttempts()).isEqualTo(0);
        assertThat(stats.practice().failedAttempts()).isEqualTo(0);
        assertThat(stats.practice().successRate()).isEqualTo(0.0);
        assertThat(stats.practice().questionsAttempted()).isEqualTo(0);
        assertThat(stats.practice().questionsSolved()).isEqualTo(0);
        assertThat(stats.practice().trackBreakdown()).isEmpty();

        assertThat(stats.interview().totalSessions()).isEqualTo(0);
        assertThat(stats.interview().totalQuestions()).isEqualTo(0);
        assertThat(stats.interview().passedQuestions()).isEqualTo(0);
        assertThat(stats.interview().failedQuestions()).isEqualTo(0);
        assertThat(stats.interview().successRate()).isEqualTo(0.0);

        assertThat(stats.overall().totalSolved()).isEqualTo(0);
        assertThat(stats.overall().totalAttempts()).isEqualTo(0);
        assertThat(stats.overall().overallSuccessRate()).isEqualTo(0.0);
        assertThat(stats.recentActivity()).isEmpty();
    }

    @Test
    @DisplayName("Gate VP10: scripted activity (solve 3, fail 1; interview 1 pass, 1 fail) matches DB truth exactly")
    void testGateVP10ScriptedActivityMatchesTruthExactly() {
        // Practice: 3 solved, 1 failed across questions
        QuestionProgress qp1 = QuestionProgress.builder().userId(testUserId).questionId("two-sum").attemptCount(1).solveCount(1).build();
        QuestionProgress qp2 = QuestionProgress.builder().userId(testUserId).questionId("valid-parentheses").attemptCount(1).solveCount(1).build();
        QuestionProgress qp3 = QuestionProgress.builder().userId(testUserId).questionId("merge-intervals").attemptCount(1).solveCount(1).build();
        QuestionProgress qp4 = QuestionProgress.builder().userId(testUserId).questionId("trapping-rain-water").attemptCount(1).solveCount(0).build();

        when(questionProgressRepository.findByUserId(testUserId)).thenReturn(List.of(qp1, qp2, qp3, qp4));

        PracticeAttempt pa1 = PracticeAttempt.builder().id(1L).userId(testUserId).questionId("two-sum").track("ALGORITHMS_DATA_STRUCTURES").verdict("PASSED").testsPassed(3).testsTotal(3).createdAt(Instant.now().minusSeconds(100)).build();
        PracticeAttempt pa2 = PracticeAttempt.builder().id(2L).userId(testUserId).questionId("valid-parentheses").track("ALGORITHMS_DATA_STRUCTURES").verdict("PASSED").testsPassed(3).testsTotal(3).createdAt(Instant.now().minusSeconds(80)).build();
        PracticeAttempt pa3 = PracticeAttempt.builder().id(3L).userId(testUserId).questionId("merge-intervals").track("ALGORITHMS_DATA_STRUCTURES").verdict("PASSED").testsPassed(3).testsTotal(3).createdAt(Instant.now().minusSeconds(60)).build();
        PracticeAttempt pa4 = PracticeAttempt.builder().id(4L).userId(testUserId).questionId("trapping-rain-water").track("ALGORITHMS_DATA_STRUCTURES").verdict("FAILED").testsPassed(1).testsTotal(3).createdAt(Instant.now().minusSeconds(40)).build();

        when(practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of(pa4, pa3, pa2, pa1));

        // Interview: 1 session with 1 PASSED, 1 FAILED
        InterviewSession session = InterviewSession.builder()
                .id(101L)
                .candidateId(testUserId)
                .roleTitle("Senior Java Engineer")
                .track(InterviewTrack.ALGORITHMS_DATA_STRUCTURES)
                .difficulty(DifficultyLevel.SENIOR)
                .status(SessionStatus.COMPLETED)
                .build();

        when(interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(testUserId)).thenReturn(List.of(session));

        SessionQuestion sq1 = SessionQuestion.builder().id(201L).sessionId(101L).questionSlug("dsa-two-sum").verdict("PASSED").attemptedAt(Instant.now().minusSeconds(30)).build();
        SessionQuestion sq2 = SessionQuestion.builder().id(202L).sessionId(101L).questionSlug("dsa-lru-cache").verdict("FAILED").attemptedAt(Instant.now().minusSeconds(10)).build();

        when(sessionQuestionRepository.findBySessionIdInOrderByAttemptedAtDesc(List.of(101L))).thenReturn(List.of(sq2, sq1));

        // When
        DashboardStatsResponse stats = dashboardService.getDashboardStats(testUserId);

        // Then - Assert Practice Metrics (3 solved, 1 failed => 4 attempts, 75.0%)
        assertThat(stats.practice().totalAttempts()).isEqualTo(4);
        assertThat(stats.practice().passedAttempts()).isEqualTo(3);
        assertThat(stats.practice().failedAttempts()).isEqualTo(1);
        assertThat(stats.practice().successRate()).isEqualTo(75.0);
        assertThat(stats.practice().questionsAttempted()).isEqualTo(4);
        assertThat(stats.practice().questionsSolved()).isEqualTo(3);
        assertThat(stats.practice().trackBreakdown()).containsEntry("ALGORITHMS_DATA_STRUCTURES", 4L);

        // Then - Assert Interview Metrics (1 pass, 1 fail => 2 attempted, 50.0%)
        assertThat(stats.interview().totalSessions()).isEqualTo(1);
        assertThat(stats.interview().completedSessions()).isEqualTo(1);
        assertThat(stats.interview().totalQuestions()).isEqualTo(2);
        assertThat(stats.interview().passedQuestions()).isEqualTo(1);
        assertThat(stats.interview().failedQuestions()).isEqualTo(1);
        assertThat(stats.interview().unattemptedQuestions()).isEqualTo(0);
        assertThat(stats.interview().attemptedQuestions()).isEqualTo(2);
        assertThat(stats.interview().successRate()).isEqualTo(50.0);

        // Then - Assert Overall Metrics
        // Total solved: 3 practice solved questions + 1 interview passed question = 4
        assertThat(stats.overall().totalSolved()).isEqualTo(4);
        // Total attempts across modes: 4 practice + 2 interview = 6
        assertThat(stats.overall().totalAttempts()).isEqualTo(6);
        // Total passed: 3 practice + 1 interview = 4 / 6 = 66.7%
        assertThat(stats.overall().overallSuccessRate()).isEqualTo(66.7);
        assertThat(stats.overall().pressureGap()).isEqualTo("Practice ×3 · Interview 1/2");

        // Then - Recent Activity contains all 6 entries sorted descending
        assertThat(stats.recentActivity()).hasSize(6);
        assertThat(stats.recentActivity().get(0).questionSlug()).isEqualTo("dsa-lru-cache");
        assertThat(stats.recentActivity().get(0).verdict()).isEqualTo("FAILED");
        assertThat(stats.recentActivity().get(0).source()).isEqualTo("INTERVIEW");
    }
}
