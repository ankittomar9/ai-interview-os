package com.interviewos.session.service;

import com.interviewos.session.repository.SessionQuestionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QuestionExposureServiceTest {

    @Mock
    private SessionQuestionRepository sessionQuestionRepository;

    @InjectMocks
    private QuestionExposureService questionExposureService;

    @Test
    @DisplayName("Blank or local candidateId returns empty exposure map without querying DB")
    void testBlankOrLocalCandidateId_ReturnsEmptyMap() {
        assertThat(questionExposureService.exposureForCandidate(null, "SQL")).isEmpty();
        assertThat(questionExposureService.exposureForCandidate("", "SQL")).isEmpty();
        assertThat(questionExposureService.exposureForCandidate("   ", "SQL")).isEmpty();
        assertThat(questionExposureService.exposureForCandidate("local", "SQL")).isEmpty();
        assertThat(questionExposureService.exposureForCandidate("LOCAL", "SQL")).isEmpty();
    }

    @Test
    @DisplayName("Candidate with history returns correctly mapped ExposureRecord entries")
    void testCandidateWithHistory_ReturnsExposureRecords() {
        Instant t1 = Instant.parse("2026-10-14T10:00:00Z");
        Instant t2 = Instant.parse("2026-10-14T11:00:00Z");

        when(sessionQuestionRepository.findExposureByCandidateAndTrack(eq("cand-42"), eq("ALGORITHMS_DATA_STRUCTURES")))
                .thenReturn(List.of(
                        new SessionQuestionRepository.ExposureProjection() {
                            @Override public String getSlug() { return "two-sum"; }
                            @Override public Long getTimesServed() { return 3L; }
                            @Override public Instant getLastServedAt() { return t1; }
                        },
                        new SessionQuestionRepository.ExposureProjection() {
                            @Override public String getSlug() { return "lru-cache"; }
                            @Override public Long getTimesServed() { return 1L; }
                            @Override public Instant getLastServedAt() { return t2; }
                        }
                ));

        Map<String, ExposureRecord> result = questionExposureService.exposureForCandidate("cand-42", "ALGORITHMS_DATA_STRUCTURES");

        assertThat(result).hasSize(2);
        assertThat(result.get("two-sum").slug()).isEqualTo("two-sum");
        assertThat(result.get("two-sum").timesServed()).isEqualTo(3L);
        assertThat(result.get("two-sum").lastServedAt()).isEqualTo(t1);

        assertThat(result.get("lru-cache").slug()).isEqualTo("lru-cache");
        assertThat(result.get("lru-cache").timesServed()).isEqualTo(1L);
        assertThat(result.get("lru-cache").lastServedAt()).isEqualTo(t2);
    }

    @Test
    @DisplayName("Repository exception is handled gracefully, returning empty map")
    void testRepositoryException_ReturnsEmptyMapGracefully() {
        when(sessionQuestionRepository.findExposureByCandidateAndTrack(anyString(), anyString()))
                .thenThrow(new RuntimeException("DB Connection Timeout"));

        Map<String, ExposureRecord> result = questionExposureService.exposureForCandidate("cand-err", "SQL");
        assertThat(result).isNotNull().isEmpty();
    }
}
