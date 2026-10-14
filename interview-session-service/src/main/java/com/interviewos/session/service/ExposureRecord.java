package com.interviewos.session.service;

import java.time.Instant;

/**
 * Historical question exposure record for a candidate on a specific track (SPEC-016 §2.1).
 */
public record ExposureRecord(
        String slug,
        long timesServed,
        Instant lastServedAt
) {}
