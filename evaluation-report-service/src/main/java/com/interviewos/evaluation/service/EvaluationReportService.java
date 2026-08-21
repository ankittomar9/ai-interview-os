package com.interviewos.evaluation.service;

import com.interviewos.evaluation.client.ProctorServiceClient;
import com.interviewos.evaluation.client.SessionServiceClient;
import com.interviewos.evaluation.dto.DiagnosticReportResponse;
import com.interviewos.evaluation.entity.EvaluationReport;
import com.interviewos.evaluation.model.HiringVerdict;
import com.interviewos.evaluation.repository.EvaluationReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationReportService {

    private final EvaluationReportRepository reportRepository;
    private final SessionServiceClient sessionClient;
    private final ProctorServiceClient proctorClient;

    @Transactional
    public DiagnosticReportResponse generateReport(Long sessionId) {
        Optional<EvaluationReport> existing = reportRepository.findBySessionId(sessionId);
        if (existing.isPresent()) {
            log.info("Returning cached diagnostic report for session {}", sessionId);
            return DiagnosticReportResponse.fromEntity(existing.get());
        }

        log.info("Starting diagnostic evaluation synthesis for session {}", sessionId);

        // 1. Fetch Session and Transcript
        SessionServiceClient.SessionDetailsDto session = sessionClient.getSessionById(sessionId);
        List<SessionServiceClient.TranscriptMessageDto> transcript = sessionClient.getSessionTranscript(sessionId);

        // 2. Fetch Proctor Telemetry (Fail-neutral, never fail open to 100)
        int integrityScore = 70;
        boolean proctorVerified = false;
        try {
            ProctorServiceClient.ProctorSummaryDto proctor = proctorClient.getSessionSummary(sessionId);
            if (proctor != null) {
                integrityScore = proctor.integrityScore();
                proctorVerified = true;
            }
        } catch (Exception e) {
            log.warn("Proctor service unreachable for session {}, defaulting integrity to NEUTRAL 70 (never fail open): {}", sessionId, e.getMessage());
        }

        long durationSeconds = session.durationSeconds() != null ? session.durationSeconds() : 0;
        long candidateTurns = transcript.stream()
                .filter(m -> "CANDIDATE".equalsIgnoreCase(m.senderRole()))
                .count();

        long codeSubmissions = transcript.stream()
                .filter(m -> "CODE_SUBMISSION".equalsIgnoreCase(m.messageType()) || (m.codeSnippet() != null && m.codeSnippet().length() > 30))
                .count();

        int technicalScore;
        int problemSolvingScore;
        int communicationScore;
        int codeQualityScore;
        HiringVerdict verdict;
        String summary;
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();

        // 🚨 STRICT RULE 1: Premature / Abandoned Session Check (< 3 mins or < 3 responses)
        if (durationSeconds < 180 || candidateTurns < 3) {
            technicalScore = 20;
            problemSolvingScore = 15;
            communicationScore = 25;
            codeQualityScore = codeSubmissions > 0 ? 30 : 0;
            verdict = HiringVerdict.NO_HIRE;
            summary = String.format(
                    "Assessment ended prematurely after only %d seconds with %d candidate responses. Minimum 15-45 minutes of active technical dialogue and code execution is required for hiring consideration.",
                    durationSeconds, candidateTurns
            );
            weaknesses.add("Interview session was aborted prematurely without completing core assessment stages.");
            weaknesses.add("Insufficient verbal or written explanations to gauge engineering seniority.");
            if (codeSubmissions == 0) {
                weaknesses.add("No code implementation was submitted in the IDE workspace.");
            }
            strengths.add("Initiated system check and entered interview environment.");
        } else {
            // Full Genuine Interview Evaluation
            technicalScore = Math.min(95, (int) (40 + (candidateTurns * 5) + (codeSubmissions * 20)));
            problemSolvingScore = Math.min(90, (int) (35 + (candidateTurns * 6)));
            communicationScore = Math.min(92, (int) (40 + (candidateTurns * 7)));
            codeQualityScore = codeSubmissions > 0 ? Math.min(95, (int) (50 + (codeSubmissions * 20))) : 20;

            // Stopgap Honesty Check: Verify real sandbox execution passes
            long verifiedPasses = transcript.stream()
                    .filter(m -> "CODE_EXECUTION".equalsIgnoreCase(m.messageType()) || "CODE_SUBMISSION".equalsIgnoreCase(m.messageType()))
                    .filter(m -> m.content() != null && (m.content().contains("PASSED") || m.content().contains("ALL") || m.content().matches("(?i).*\\b[1-9][0-9]*\\s*/\\s*[1-9][0-9]*\\s*tests?\\s*passed.*")))
                    .count();

            if (verifiedPasses == 0) {
                codeQualityScore = Math.min(codeQualityScore, 40);
                technicalScore = Math.min(technicalScore, 60);
            }

            int aggregateScore = (technicalScore + problemSolvingScore + communicationScore + codeQualityScore + integrityScore) / 5;

            if (aggregateScore >= 85 && integrityScore >= 80 && verifiedPasses >= 1) {
                verdict = HiringVerdict.STRONG_HIRE;
            } else if (aggregateScore >= 70 && integrityScore >= 70 && verifiedPasses >= 1) {
                verdict = HiringVerdict.HIRE;
            } else if (aggregateScore >= 55) {
                verdict = HiringVerdict.LEAN_HIRE;
            } else {
                verdict = HiringVerdict.NO_HIRE;
            }

            summary = String.format(
                    "Candidate completed %d minutes of technical assessment for %s (%s) with %d interactive turns. Overall Score: %d/100. Hiring Verdict: %s.",
                    durationSeconds / 60, session.roleTitle(), session.difficulty(), candidateTurns, aggregateScore, verdict
            );

            if (verifiedPasses == 0) {
                summary += " No verified code execution passed during this session.";
                weaknesses.add("No verified code execution passed in the sandbox environment.");
            }

            if (verifiedPasses > 0) strengths.add("Produced functional code passing verified sandbox test fixtures.");
            if (candidateTurns >= 5) strengths.add("Actively engaged in technical follow-ups with structured explanations.");
            if (integrityScore >= 85) strengths.add("Maintained high integrity with natural browser focus.");

            if (codeSubmissions == 0) weaknesses.add("Did not submit executable code in the editor workspace.");
            if (integrityScore < 75) weaknesses.add("Frequent window blur or paste bursts detected during assessment.");
            weaknesses.add("Could discuss algorithmic Big-O space/time trade-offs more proactively.");
        }

        int overallScore = (technicalScore + problemSolvingScore + communicationScore + codeQualityScore + integrityScore) / 5;

        List<String> studyPlan = List.of(
                "Day 1: Master Java 21 Virtual Threads & Structured Concurrency internals.",
                "Day 2: Deep dive into Spring Boot 3.4 Transactional boundaries and JPA query optimization.",
                "Day 3: Practice 5 High-Frequency LeetCode Mediums on Sliding Window & Monotonic Stack.",
                "Day 4: System Design: Design a distributed rate limiter with Redis Token Bucket & Lua scripts.",
                "Day 5: Behavioral: Refine 3 project stories using the STAR framework (Situation, Task, Action, Result).",
                "Day 6: Mock interview practice under strict 45-minute timed constraints with zero tab switching.",
                "Day 7: Full review of past interview notes, edge case handling, and Big-O complexity proofs."
        );

        EvaluationReport report = EvaluationReport.builder()
                .sessionId(sessionId)
                .candidateId(session.candidateId())
                .roleTitle(session.roleTitle())
                .track(session.track())
                .difficulty(session.difficulty())
                .verdict(verdict)
                .overallScore(overallScore)
                .technicalAccuracyScore(technicalScore)
                .problemSolvingScore(problemSolvingScore)
                .communicationClarityScore(communicationScore)
                .codeQualityScore(codeQualityScore)
                .integrityScore(integrityScore)
                .executiveSummary(summary)
                .keyStrengths(strengths)
                .areasForImprovement(weaknesses)
                .sevenDayStudyPlan(studyPlan)
                .build();

        EvaluationReport saved = reportRepository.save(report);
        return DiagnosticReportResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public DiagnosticReportResponse getReportById(Long reportId) {
        return reportRepository.findById(reportId)
                .map(DiagnosticReportResponse::fromEntity)
                .orElseThrow(() -> new NoSuchElementException("Evaluation report not found with ID: " + reportId));
    }

    @Transactional(readOnly = true)
    public DiagnosticReportResponse getReportBySessionId(Long sessionId) {
        return reportRepository.findBySessionId(sessionId)
                .map(DiagnosticReportResponse::fromEntity)
                .orElseThrow(() -> new NoSuchElementException("Evaluation report not found for session ID: " + sessionId));
    }

    @Transactional(readOnly = true)
    public List<DiagnosticReportResponse> getCandidateReports(String candidateId) {
        return reportRepository.findByCandidateIdOrderByGeneratedAtDesc(candidateId).stream()
                .map(DiagnosticReportResponse::fromEntity)
                .toList();
    }
}