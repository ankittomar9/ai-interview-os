package com.interviewos.ai.dto;

import java.util.List;

public record DesignEvaluationResponse(
        List<String> feedback,
        Integer score,
        String evidence,
        boolean llmGenerated
) {
    public static DesignEvaluationResponse fallback(String reason) {
        return new DesignEvaluationResponse(
                List.of(
                        "Architecture contains standard client-server components with preliminary routing layers.",
                        "Consider decoupling write traffic with a distributed messaging queue (e.g. Kafka / RabbitMQ).",
                        "Evaluate database replication and cache eviction strategies for high-read peak loads."
                ),
                70,
                reason != null ? reason : "Deterministic baseline architectural evaluation",
                false
        );
    }
}
