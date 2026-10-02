package com.interviewos.session.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record LearnTreeResponse(
        List<TopicNode> topics,
        Map<String, Integer> trackTotals,
        boolean stale
) {
    public record TopicNode(
            String topicId,
            String topicName,
            String track,
            Integer total,
            int attempted,
            int solved,
            int passed,
            int failed,
            String pressureGap,
            List<QuestionNode> questions,
            Integer interviewAttempted,
            Integer interviewPassed
    ) {
        public TopicNode(
                String topicId,
                String topicName,
                String track,
                Integer total,
                int attempted,
                int solved,
                int passed,
                int failed,
                String pressureGap,
                List<QuestionNode> questions
        ) {
            this(topicId, topicName, track, total, attempted, solved, passed, failed, pressureGap, questions, passed + failed, passed);
        }
    }

    public record QuestionNode(
            String slug,
            String title,
            String track,
            String difficulty,
            String verdict,
            Integer practiceAttemptCount,
            Integer practiceSolveCount,
            String lastPracticeVerdict,
            Instant lastPracticedAt,
            Integer interviewAttemptCount,
            Integer interviewPassCount
    ) {
        public QuestionNode(
                String slug,
                String title,
                String track,
                String difficulty,
                String verdict
        ) {
            this(slug, title, track, difficulty, verdict, 0, 0, null, null, 0, 0);
        }
    }
}
