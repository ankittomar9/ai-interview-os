package com.interviewos.session.dto;

import java.time.Instant;

public record RetryQueueItem(
        String slug,
        String title,
        String topic,
        String lastVerdict,
        int failCount,
        Instant lastAttemptAt
) {}
