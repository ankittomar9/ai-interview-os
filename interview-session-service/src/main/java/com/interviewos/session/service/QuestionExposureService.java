package com.interviewos.session.service;

import com.interviewos.session.repository.SessionQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/**
 * Service to query historical question exposure per candidate and track (SPEC-016 §2.1).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionExposureService {

    private final SessionQuestionRepository sessionQuestionRepository;

    /**
     * Look up previous question exposure for a candidate on a specific track.
     * Blank or "local" candidateId returns an empty map (pure nonce-rotation for anonymous users).
     *
     * @param candidateId Candidate identifier
     * @param trackKey    InterviewTrack name or track key (can be null for all tracks)
     * @return Map of question slug -> ExposureRecord
     */
    public Map<String, ExposureRecord> exposureForCandidate(String candidateId, String trackKey) {
        if (candidateId == null || candidateId.isBlank() || "local".equalsIgnoreCase(candidateId.trim())) {
            return Map.of();
        }

        try {
            String resolvedTrack = (trackKey != null && !trackKey.isBlank()) ? trackKey.trim() : null;
            var projections = sessionQuestionRepository.findExposureByCandidateAndTrack(
                    candidateId.trim(),
                    resolvedTrack
            );

            if (projections == null || projections.isEmpty()) {
                return Map.of();
            }

            Map<String, ExposureRecord> result = new HashMap<>();
            for (var proj : projections) {
                if (proj.getSlug() != null && !proj.getSlug().isBlank()) {
                    long count = proj.getTimesServed() != null ? proj.getTimesServed() : 1L;
                    result.put(proj.getSlug(), new ExposureRecord(proj.getSlug(), count, proj.getLastServedAt()));
                }
            }
            return Collections.unmodifiableMap(result);
        } catch (Exception e) {
            log.warn("Notice looking up question exposure for candidate {} on track {}: {}", candidateId, trackKey, e.getMessage());
            return Map.of();
        }
    }
}
