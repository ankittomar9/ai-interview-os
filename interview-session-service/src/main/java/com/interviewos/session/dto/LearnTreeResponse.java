package com.interviewos.session.dto;

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
            List<QuestionNode> questions
    ) {}

    public record QuestionNode(
            String slug,
            String title,
            String track,
            String difficulty,
            String verdict
    ) {}
}
