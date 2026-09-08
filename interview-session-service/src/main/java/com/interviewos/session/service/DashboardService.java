package com.interviewos.session.service;

import com.interviewos.session.dto.DashboardStatsResponse;
import com.interviewos.session.entity.InterviewSession;
import com.interviewos.session.entity.PracticeAttempt;
import com.interviewos.session.entity.QuestionProgress;
import com.interviewos.session.entity.SessionQuestion;
import com.interviewos.session.model.SessionStatus;
import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.repository.PracticeAttemptRepository;
import com.interviewos.session.repository.QuestionProgressRepository;
import com.interviewos.session.repository.SessionQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final QuestionProgressRepository questionProgressRepository;
    private final PracticeAttemptRepository practiceAttemptRepository;
    private final SessionQuestionRepository sessionQuestionRepository;
    private final InterviewSessionRepository interviewSessionRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(String userId) {
        String effectiveUserId = (userId != null && !userId.isBlank()) ? userId : "local";
        Instant now = Instant.now();

        // 1. Practice Progress aggregates (question_progress)
        List<QuestionProgress> progressList = questionProgressRepository.findByUserId(effectiveUserId);
        long questionsAttempted = progressList.stream().filter(p -> p.getAttemptCount() > 0).count();
        long questionsSolved = progressList.stream().filter(p -> p.getSolveCount() > 0).count();

        // 2. Practice Attempts aggregates (practice_attempts)
        List<PracticeAttempt> attempts = practiceAttemptRepository.findByUserIdOrderByCreatedAtDesc(effectiveUserId);
        long totalPracticeAttempts = attempts.size();
        long passedPracticeAttempts = attempts.stream().filter(a -> "PASSED".equalsIgnoreCase(a.getVerdict())).count();
        long failedPracticeAttempts = attempts.stream().filter(a -> !"PASSED".equalsIgnoreCase(a.getVerdict())).count();
        double practiceSuccessRate = totalPracticeAttempts > 0
                ? Math.round((double) passedPracticeAttempts / totalPracticeAttempts * 1000.0) / 10.0
                : 0.0;

        Map<String, Long> trackBreakdown = attempts.stream()
                .filter(a -> a.getTrack() != null)
                .collect(Collectors.groupingBy(PracticeAttempt::getTrack, Collectors.counting()));

        DashboardStatsResponse.PracticeStats practiceStats = new DashboardStatsResponse.PracticeStats(
                totalPracticeAttempts,
                passedPracticeAttempts,
                failedPracticeAttempts,
                practiceSuccessRate,
                questionsAttempted,
                questionsSolved,
                trackBreakdown
        );

        // 3. Interview Questions aggregates (interview_sessions + session_questions)
        List<InterviewSession> sessions = interviewSessionRepository.findByCandidateIdOrderByCreatedAtDesc(effectiveUserId);
        if (sessions.isEmpty() && "local".equals(effectiveUserId)) {
            sessions = interviewSessionRepository.findAllByOrderByCreatedAtDesc();
        }

        long totalSessions = sessions.size();
        long completedSessions = sessions.stream().filter(s -> s.getStatus() == SessionStatus.COMPLETED).count();

        List<Long> sessionIds = sessions.stream().map(InterviewSession::getId).toList();
        List<SessionQuestion> sessionQuestions = sessionIds.isEmpty()
                ? List.of()
                : sessionQuestionRepository.findBySessionIdInOrderByAttemptedAtDesc(sessionIds);

        long totalInterviewQuestions = sessionQuestions.size();
        long passedInterviewQuestions = sessionQuestions.stream().filter(sq -> "PASSED".equalsIgnoreCase(sq.getVerdict())).count();
        long failedInterviewQuestions = sessionQuestions.stream().filter(sq -> "FAILED".equalsIgnoreCase(sq.getVerdict())).count();
        long unattemptedInterviewQuestions = sessionQuestions.stream().filter(sq -> "UNATTEMPTED".equalsIgnoreCase(sq.getVerdict())).count();
        long attemptedInterviewQuestions = passedInterviewQuestions + failedInterviewQuestions;

        double interviewSuccessRate = attemptedInterviewQuestions > 0
                ? Math.round((double) passedInterviewQuestions / attemptedInterviewQuestions * 1000.0) / 10.0
                : 0.0;

        DashboardStatsResponse.InterviewStats interviewStats = new DashboardStatsResponse.InterviewStats(
                totalSessions,
                completedSessions,
                totalInterviewQuestions,
                passedInterviewQuestions,
                failedInterviewQuestions,
                unattemptedInterviewQuestions,
                attemptedInterviewQuestions,
                interviewSuccessRate
        );

        // 4. Overall aggregates
        long totalSolved = questionsSolved + passedInterviewQuestions;
        long totalOverallAttempts = totalPracticeAttempts + attemptedInterviewQuestions;
        long totalPassedOverall = passedPracticeAttempts + passedInterviewQuestions;
        double overallSuccessRate = totalOverallAttempts > 0
                ? Math.round((double) totalPassedOverall / totalOverallAttempts * 1000.0) / 10.0
                : 0.0;

        String pressureGap = String.format("Practice ×%d · Interview %d/%d",
                questionsSolved, passedInterviewQuestions, attemptedInterviewQuestions);

        DashboardStatsResponse.OverallStats overallStats = new DashboardStatsResponse.OverallStats(
                totalSolved,
                totalOverallAttempts,
                overallSuccessRate,
                pressureGap
        );

        // 5. Recent Activity Ledger
        List<DashboardStatsResponse.RecentActivityItem> recentActivity = new ArrayList<>();

        for (PracticeAttempt a : attempts) {
            recentActivity.add(new DashboardStatsResponse.RecentActivityItem(
                    "PRACTICE-" + a.getId(),
                    "PRACTICE",
                    a.getQuestionId(),
                    a.getVerdict(),
                    a.getTrack(),
                    a.getCreatedAt(),
                    String.format("%d/%d tests passed (%s)",
                            a.getTestsPassed(),
                            a.getTestsTotal(),
                            a.getRuntimeMs() != null ? a.getRuntimeMs() + "ms" : "n/a")
            ));
        }

        for (SessionQuestion sq : sessionQuestions) {
            Instant ts = sq.getAttemptedAt() != null ? sq.getAttemptedAt() : sq.getUpdatedAt();
            recentActivity.add(new DashboardStatsResponse.RecentActivityItem(
                    "INTERVIEW-" + sq.getId(),
                    "INTERVIEW",
                    sq.getQuestionSlug(),
                    sq.getVerdict(),
                    "INTERVIEW",
                    ts,
                    "Session #" + sq.getSessionId() + " (order: " + (sq.getDisplayOrder() + 1) + ")"
            ));
        }

        recentActivity.sort((a, b) -> {
            Instant tA = a.timestamp() != null ? a.timestamp() : Instant.EPOCH;
            Instant tB = b.timestamp() != null ? b.timestamp() : Instant.EPOCH;
            return tB.compareTo(tA);
        });

        if (recentActivity.size() > 25) {
            recentActivity = new ArrayList<>(recentActivity.subList(0, 25));
        }

        return new DashboardStatsResponse(
                effectiveUserId,
                now,
                practiceStats,
                interviewStats,
                overallStats,
                recentActivity
        );
    }
}
