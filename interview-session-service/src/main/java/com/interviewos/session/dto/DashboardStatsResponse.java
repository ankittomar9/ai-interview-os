package com.interviewos.session.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record DashboardStatsResponse(
        String userId,
        Instant generatedAt,
        PracticeStats practice,
        InterviewStats interview,
        OverallStats overall,
        List<RecentActivityItem> recentActivity
) {
    public record PracticeStats(
            long totalAttempts,
            long passedAttempts,
            long failedAttempts,
            double successRate,
            long questionsAttempted,
            long questionsSolved,
            Map<String, Long> trackBreakdown
    ) {}

    public record InterviewStats(
            long totalSessions,
            long completedSessions,
            long totalQuestions,
            long passedQuestions,
            long failedQuestions,
            long unattemptedQuestions,
            long attemptedQuestions,
            double successRate
    ) {}

    public record OverallStats(
            long totalSolved,
            long totalAttempts,
            double overallSuccessRate,
            String pressureGap
    ) {}

    public record RecentActivityItem(
            String id,
            String source,
            String questionSlug,
            String verdict,
            String track,
            Instant timestamp,
            String details
    ) {}
}
