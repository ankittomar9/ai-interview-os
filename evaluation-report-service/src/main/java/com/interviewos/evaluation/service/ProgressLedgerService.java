package com.interviewos.evaluation.service;

import com.interviewos.evaluation.entity.EvaluationReport;
import com.interviewos.evaluation.entity.ProgressLedger;
import com.interviewos.evaluation.repository.ProgressLedgerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProgressLedgerService {

    private final ProgressLedgerRepository progressLedgerRepository;

    @Transactional
    public void recordSession(EvaluationReport report) {
        if (report == null || report.getCandidateId() == null) return;

        try {
            ProgressLedger ledger = ProgressLedger.builder()
                    .candidateId(report.getCandidateId())
                    .track(report.getTrack() != null ? report.getTrack() : "GENERAL")
                    .sessionId(report.getSessionId() != null ? report.getSessionId() : 0L)
                    .sessionDate(LocalDate.now())
                    .rubricSchema("CODING")
                    .overallScore(report.getOverallScore())
                    .dimensionScores(report.getRubricJson())
                    .algorithmicReasoningScore(report.getTechnicalAccuracyScore())
                    .codeQualityScore(report.getCodeQualityScore())
                    .executionEfficiencyScore(report.getProblemSolvingScore())
                    .communicationScore(report.getCommunicationClarityScore())
                    .professionalismScore(report.getIntegrityScore())
                    .build();

            progressLedgerRepository.save(ledger);
            log.info("📈 Saved session {} to candidate {} progress ledger with overall score {}/100",
                    report.getSessionId(), report.getCandidateId(), report.getOverallScore());
        } catch (Exception e) {
            log.warn("⚠️ Failed to record progress ledger for session {}: {}", report.getSessionId(), e.getMessage());
        }
    }

    public List<ProgressLedger> getCandidateProgress(String candidateId, String track) {
        if (track != null && !track.isBlank() && !"ALL".equalsIgnoreCase(track)) {
            return progressLedgerRepository.findByCandidateIdAndTrackOrderBySessionDateAsc(candidateId, track);
        }
        return progressLedgerRepository.findByCandidateIdOrderBySessionDateAsc(candidateId);
    }

    public ProgressAnalytics getCandidateAnalytics(String candidateId, String track) {
        List<ProgressLedger> progress = getCandidateProgress(candidateId, track);
        if (progress.size() < 2) {
            int currentScore = progress.isEmpty() ? 0 : progress.get(0).getOverallScore();
            return new ProgressAnalytics(0, currentScore, List.of(), progress.size());
        }

        int totalSessions = progress.size();
        int recentCount = Math.min(3, totalSessions);
        int earlierCount = totalSessions - recentCount;

        double recentAvg = progress.subList(totalSessions - recentCount, totalSessions).stream()
                .mapToInt(ProgressLedger::getOverallScore)
                .average()
                .orElse(0.0);

        double earlierAvg = earlierCount > 0
                ? progress.subList(0, earlierCount).stream()
                        .mapToInt(ProgressLedger::getOverallScore)
                        .average()
                        .orElse(recentAvg)
                : recentAvg;

        int scoreDelta = (int) Math.round(recentAvg - earlierAvg);

        // Identify dimensions below 70 in multiple sessions
        List<String> weakDimensions = new ArrayList<>();
        long lowCodeQuality = progress.stream()
                .filter(p -> p.getCodeQualityScore() != null && p.getCodeQualityScore() < 70)
                .count();
        if (lowCodeQuality >= 2) weakDimensions.add("Code Quality");

        long lowAlgorithmic = progress.stream()
                .filter(p -> p.getAlgorithmicReasoningScore() != null && p.getAlgorithmicReasoningScore() < 70)
                .count();
        if (lowAlgorithmic >= 2) weakDimensions.add("Algorithmic Reasoning");

        long lowCommunication = progress.stream()
                .filter(p -> p.getCommunicationScore() != null && p.getCommunicationScore() < 70)
                .count();
        if (lowCommunication >= 2) weakDimensions.add("Communication Clarity");

        return new ProgressAnalytics(scoreDelta, (int) Math.round(recentAvg), weakDimensions, totalSessions);
    }

    public record ProgressAnalytics(
            int scoreDelta,
            int recentAverageScore,
            List<String> weakDimensions,
            int totalSessions
    ) {}
}
