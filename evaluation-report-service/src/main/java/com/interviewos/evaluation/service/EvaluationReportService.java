package com.interviewos.evaluation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.evaluation.client.AiRubricClient;
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

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationReportService {

    private final EvaluationReportRepository reportRepository;
    private final SessionServiceClient sessionClient;
    private final ProctorServiceClient proctorClient;
    private final AiRubricClient aiRubricClient;
    private final ObjectMapper objectMapper;
    private final HumanTranscriptPdfGenerator pdfGenerator;
    private final ProgressLedgerService progressLedgerService;

    @Transactional
    public DiagnosticReportResponse generateReport(Long sessionId) {
        Optional<EvaluationReport> existing = reportRepository.findBySessionId(sessionId);
        if (existing.isPresent()) {
            log.info("Returning cached diagnostic report for session {}", sessionId);
            return DiagnosticReportResponse.fromEntity(existing.get());
        }

        log.info("Starting qualitative diagnostic evaluation synthesis for session {}", sessionId);

        // 1. Fetch Session Details & MongoDB Transcript Turns
        SessionServiceClient.SessionDetailsDto session = sessionClient.getSessionById(sessionId);
        List<SessionServiceClient.TranscriptMessageDto> transcript = sessionClient.getSessionTranscript(sessionId);

        // 2. Fetch Proctor Telemetry (Fail-neutral 70 default)
        int integrityScore = 70;
        try {
            ProctorServiceClient.ProctorSummaryDto proctor = proctorClient.getSessionSummary(sessionId);
            if (proctor != null) {
                integrityScore = proctor.integrityScore();
            }
        } catch (Exception e) {
            log.warn("Proctor service unreachable for session {}, defaulting integrity to NEUTRAL 70: {}", sessionId, e.getMessage());
        }

        long durationSeconds = session.durationSeconds() != null ? session.durationSeconds() : 0;
        long candidateTurns = transcript.stream()
                .filter(m -> "CANDIDATE".equalsIgnoreCase(m.senderRole()))
                .count();

        // 3. Deterministic Ground Truth Execution Score & Problem Extraction
        List<SessionServiceClient.TranscriptMessageDto> executionTurns = transcript.stream()
                .filter(m -> "CODE_EXECUTION".equalsIgnoreCase(m.messageType()))
                .toList();

        List<SessionServiceClient.TranscriptMessageDto> engineErrorTurns = transcript.stream()
                .filter(m -> "ENGINE_ERROR".equalsIgnoreCase(m.messageType()) ||
                        (m.content() != null && m.content().contains("ENGINE_UNAVAILABLE")))
                .toList();

        double bestRatio = 0.0;
        int compileErrorCount = 0;
        boolean hasTimeout = false;
        int totalExecutionRuns = executionTurns.size();
        int totalEngineErrors = engineErrorTurns.size();
        boolean allExecutionsFailedByEngine = totalExecutionRuns == 0 && totalEngineErrors > 0;
        List<AiRubricClient.ExecutionDto> executionDtos = new ArrayList<>();
        String latestCodeSnippet = "";
        String extractedProblemSlug = null;

        Pattern execPattern = Pattern.compile("(?i)(\\d+)/(\\d+)\\s*tests?\\s*passed\\s*\\(([^)]+)\\)(?:\\s*in\\s*([\\d.]+)ms)?");
        Pattern slugPattern = Pattern.compile("\\[problem:([^\\]]+)\\]");

        for (SessionServiceClient.TranscriptMessageDto turn : transcript) {
            if (turn.codeSnippet() != null && !turn.codeSnippet().isBlank()) {
                latestCodeSnippet = turn.codeSnippet();
            }

            if (turn.content() != null) {
                Matcher sm = slugPattern.matcher(turn.content());
                if (sm.find()) {
                    extractedProblemSlug = sm.group(1).trim();
                }
            }

            if ("CODE_EXECUTION".equalsIgnoreCase(turn.messageType())) {
                String content = turn.content() != null ? turn.content() : "";
                int passed = 0;
                int total = 0;
                String status = "UNKNOWN";
                double execTimeMs = 0.0;

                Matcher m = execPattern.matcher(content);
                if (m.find()) {
                    passed = Integer.parseInt(m.group(1));
                    total = Integer.parseInt(m.group(2));
                    status = m.group(3);
                    if (m.group(4) != null) {
                        try {
                            execTimeMs = Double.parseDouble(m.group(4));
                        } catch (NumberFormatException ignored) {}
                    }
                }

                if ("COMPILE_ERROR".equalsIgnoreCase(status) || content.contains("COMPILE_ERROR")) {
                    compileErrorCount++;
                }
                if ("TIMEOUT".equalsIgnoreCase(status) || content.contains("TIMEOUT")) {
                    hasTimeout = true;
                }

                if (total > 0) {
                    double ratio = (double) passed / total;
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                    }
                }

                executionDtos.add(new AiRubricClient.ExecutionDto(status, passed, total, execTimeMs, 0.0));
            }
        }

        int executionScore = (int) Math.round(bestRatio * 100);
        if (totalExecutionRuns == 0) {
            executionScore = 0;
        } else if (compileErrorCount == totalExecutionRuns) {
            executionScore = Math.min(executionScore, 35);
        } else if (hasTimeout) {
            executionScore = Math.min(executionScore, 50);
        }

        long verifiedPasses = executionDtos.stream()
                .filter(e -> e.passedTests() > 0 && ("PASSED".equalsIgnoreCase(e.status()) || e.passedTests() == e.totalTests()))
                .count();

        // 4. Resolve Canonical Problem Details (P1 Fix)
        String canonicalProblemSlug = extractedProblemSlug != null ? extractedProblemSlug :
                (session.roleTitle() != null ? session.roleTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-") : "technical-assessment");
        String canonicalProblemStatement = "Technical assessment for " + session.roleTitle() + " (" + session.difficulty() + ")";

        if (extractedProblemSlug != null && !extractedProblemSlug.isBlank()) {
            try {
                SessionServiceClient.ProblemDetailsDto prob = sessionClient.getProblemBySlug(extractedProblemSlug);
                if (prob != null && prob.problemStatement() != null && !prob.problemStatement().isBlank()) {
                    canonicalProblemStatement = prob.problemStatement();
                }
            } catch (Exception e) {
                log.warn("Could not retrieve problem details for slug '{}': {}", extractedProblemSlug, e.getMessage());
            }
        }

        // 5. Request Qualitative Multi-Rubric from AI Orchestrator
        List<AiRubricClient.TurnDto> turnDtos = transcript.stream()
                .map(t -> new AiRubricClient.TurnDto(t.senderRole(), t.messageType(), t.content(), t.codeSnippet(), t.metadata()))
                .toList();

        AiRubricClient.RubricEvaluationRequestDto rubricRequest = AiRubricClient.RubricEvaluationRequestDto.builder()
                .problemSlug(canonicalProblemSlug)
                .problemStatement(canonicalProblemStatement)
                .track(session.track())
                .difficulty(session.difficulty())
                .transcript(turnDtos)
                .executions(executionDtos)
                .finalCode(latestCodeSnippet)
                .language("java")
                .build();

        Optional<AiRubricClient.RubricResponseDto> rubricOpt = aiRubricClient.evaluateRubric(rubricRequest);

        int technicalScore;
        int problemSolvingScore;
        int communicationScore;
        int codeQualityScore;
        int requirementsClarityScore;
        boolean rubricLlmGenerated = false;

        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();
        List<String> studyPlan = new ArrayList<>();
        String executiveSummary;
        String rubricJson = null;

        if (rubricOpt.isPresent() && rubricOpt.get().llmGenerated() && rubricOpt.get().dimensions() != null && !rubricOpt.get().dimensions().isEmpty()) {
            AiRubricClient.RubricResponseDto rubric = rubricOpt.get();
            rubricLlmGenerated = true;

            Map<String, Integer> dimScores = new HashMap<>();
            for (AiRubricClient.DimensionScoreDto d : rubric.dimensions()) {
                dimScores.put(d.dimension().toUpperCase(), d.score());
            }

            String trackUpper = session.track() != null ? session.track().toUpperCase() : "CODING";
            int reqScore;
            int algoScore;
            int edgeScore;
            int commScore;
            int codeScore;

            if (trackUpper.contains("BEHAVIORAL") || trackUpper.contains("LEADERSHIP")) {
                algoScore = dimScores.getOrDefault("LEADERSHIP", 60);
                codeScore = dimScores.getOrDefault("CONFLICT_RESOLUTION", 60);
                edgeScore = dimScores.getOrDefault("ADAPTABILITY", 60);
                commScore = dimScores.getOrDefault("COMMUNICATION_BEHAVIORAL", 60);
                reqScore = dimScores.getOrDefault("TEAMWORK", 60);
            } else if (trackUpper.contains("RESUME")) {
                algoScore = dimScores.getOrDefault("TECHNICAL_DEPTH", 60);
                codeScore = dimScores.getOrDefault("PROJECT_IMPACT", 60);
                edgeScore = dimScores.getOrDefault("PROBLEM_SOLVING", 60);
                commScore = dimScores.getOrDefault("COMMUNICATION_RESUME", 60);
                reqScore = dimScores.getOrDefault("PROFESSIONALISM_RESUME", 60);
            } else if (trackUpper.contains("SYSTEM_DESIGN") || trackUpper.contains("ARCHITECTURE") || trackUpper.contains("HLD")) {
                algoScore = dimScores.getOrDefault("ARCHITECTURE", 60);
                codeScore = dimScores.getOrDefault("SCALABILITY", 60);
                edgeScore = dimScores.getOrDefault("TRADE_OFFS", 60);
                commScore = dimScores.getOrDefault("COMMUNICATION_DESIGN", 60);
                reqScore = dimScores.getOrDefault("RIGOR", 60);
            } else {
                reqScore = dimScores.getOrDefault("REQUIREMENTS_CLARIFICATION", 40);
                algoScore = dimScores.getOrDefault("ALGORITHMIC_REASONING", 40);
                edgeScore = dimScores.getOrDefault("EDGE_CASE_THOROUGHNESS", 40);
                commScore = dimScores.getOrDefault("COMMUNICATION_CLARITY", 40);
                codeScore = dimScores.getOrDefault("CODE_QUALITY", 40);
            }

            boolean isCodingTrack = !trackUpper.contains("BEHAVIORAL") && !trackUpper.contains("RESUME") && !trackUpper.contains("SYSTEM_DESIGN");
            if (!isCodingTrack || allExecutionsFailedByEngine) {
                technicalScore = algoScore;
                codeQualityScore = codeScore;
            } else {
                technicalScore = (int) Math.round(0.5 * executionScore + 0.5 * algoScore);
                codeQualityScore = (int) Math.round(0.5 * executionScore + 0.5 * codeScore);
            }
            problemSolvingScore = edgeScore;
            communicationScore = commScore;
            requirementsClarityScore = reqScore;

            strengths.addAll(rubric.strengths());
            weaknesses.addAll(rubric.weaknesses());
            studyPlan.addAll(rubric.studyPlan());
            executiveSummary = rubric.executiveSummary();
            if (allExecutionsFailedByEngine) {
                executiveSummary = String.format("Execution not verifiable (engine offline ×%d). %s", totalEngineErrors, executiveSummary);
            }

            try {
                rubricJson = objectMapper.writeValueAsString(rubric.dimensions());
            } catch (Exception e) {
                log.warn("Failed to serialize rubric dimensions to JSON: {}", e.getMessage());
            }
        } else {
            // Deterministic Fallback Score Math
            if (allExecutionsFailedByEngine) {
                technicalScore = Math.min(80, 50 + (int) candidateTurns * 5);
                codeQualityScore = Math.min(80, 55 + (int) candidateTurns * 3);
            } else {
                technicalScore = Math.min(executionScore, 60);
                codeQualityScore = Math.min(executionScore, (int) Math.round(40 + 0.2 * executionScore));
            }
            problemSolvingScore = Math.min(70, 30 + executionScore / 2);
            communicationScore = Math.min(75, 30 + (int) candidateTurns * 5);
            requirementsClarityScore = Math.min(60, 40);

            // Dynamic Fallback Narratives based on lowest dimensions & execution stats
            if (allExecutionsFailedByEngine) {
                strengths.add(String.format("Demonstrated technical composure during sandbox offline notice (%d attempt(s)).", totalEngineErrors));
            } else if (verifiedPasses > 0) {
                strengths.add(String.format("Verified %d sandbox execution runs with passing test suites in the IDE.", verifiedPasses));
            }
            if (candidateTurns >= 4) {
                strengths.add(String.format("Engaged actively with %d conversational dialogue turns across the assessment.", candidateTurns));
            }
            if (integrityScore >= 80) {
                strengths.add(String.format("Demonstrated high exam integrity (%d%%) with focused browser environment.", integrityScore));
            }

            if (verifiedPasses == 0 && totalExecutionRuns > 0) {
                weaknesses.add(String.format("Weak ALGORITHMIC_REASONING: 0 verified test suites passed (Execution Score: %d/100).", executionScore));
            }
            if (candidateTurns < 4) {
                weaknesses.add(String.format("Low COMMUNICATION_CLARITY: Only %d candidate responses recorded before session completion.", candidateTurns));
            }

            studyPlan.add("Day 1: Core algorithmic complexity and Big-O trade-offs.");
            studyPlan.add("Day 2: Edge-case boundary conditions and invariants.");
            studyPlan.add("Day 3: Idiomatic structure and modular decomposition.");
            studyPlan.add("Day 4: Socratic problem clarification under ambiguity.");
            studyPlan.add("Day 5: Production error handling and defensive coding.");
            studyPlan.add("Day 6: Live code explanation and architectural reasoning.");
            studyPlan.add("Day 7: Mock Diagnostic Review: Re-attempt failed assessment tracks with comprehensive verification.");

            if (allExecutionsFailedByEngine) {
                executiveSummary = String.format(
                        "Candidate completed %d minutes of technical assessment for %s (%s) across %d interactive turns. Execution not verifiable (engine offline ×%d). Technical Accuracy scored from code structure and dialogue evidence.",
                        durationSeconds / 60, session.roleTitle(), session.difficulty(), candidateTurns, totalEngineErrors
                );
            } else {
                executiveSummary = String.format(
                        "Candidate completed %d minutes of technical assessment for %s (%s) across %d interactive turns. Execution Score: %d/100. Deterministic evaluation generated.",
                        durationSeconds / 60, session.roleTitle(), session.difficulty(), candidateTurns, executionScore
                );
                if (verifiedPasses == 0) {
                    executiveSummary += " No verified code execution passed during this session.";
                }
            }
        }

        // Clamp Scores to 0..100
        technicalScore = Math.max(0, Math.min(100, technicalScore));
        problemSolvingScore = Math.max(0, Math.min(100, problemSolvingScore));
        communicationScore = Math.max(0, Math.min(100, communicationScore));
        codeQualityScore = Math.max(0, Math.min(100, codeQualityScore));
        requirementsClarityScore = Math.max(0, Math.min(100, requirementsClarityScore));

        int overallScore = (technicalScore + problemSolvingScore + communicationScore + codeQualityScore + integrityScore) / 5;

        // Hiring Verdict Thresholds (M1.5 Rule: verifiedPasses >= 1 required for HIRE / STRONG_HIRE, unless all runs were engine errors)
        HiringVerdict verdict;
        if (allExecutionsFailedByEngine) {
            if (overallScore >= 70 && integrityScore >= 70) {
                verdict = HiringVerdict.HIRE;
            } else if (overallScore >= 55) {
                verdict = HiringVerdict.LEAN_HIRE;
            } else {
                verdict = HiringVerdict.NO_HIRE;
            }
        } else if (overallScore >= 85 && integrityScore >= 80 && verifiedPasses >= 1) {
            verdict = HiringVerdict.STRONG_HIRE;
        } else if (overallScore >= 70 && integrityScore >= 70 && verifiedPasses >= 1) {
            verdict = HiringVerdict.HIRE;
        } else if (overallScore >= 55) {
            verdict = HiringVerdict.LEAN_HIRE;
        } else {
            verdict = HiringVerdict.NO_HIRE;
        }

        // P2 Fix: Premature / Abandoned Session Guard (< 180 seconds or < 3 candidate turns)
        if (durationSeconds < 180 || candidateTurns < 3) {
            verdict = HiringVerdict.NO_HIRE;
            executiveSummary += String.format(" Assessment ended prematurely (%ds, %d turns); minimum viable interview not reached.", durationSeconds, candidateTurns);
        }

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
                .requirementsClarificationScore(requirementsClarityScore)
                .executiveSummary(executiveSummary)
                .rubricJson(rubricJson)
                .rubricLlmGenerated(rubricLlmGenerated)
                .keyStrengths(strengths)
                .areasForImprovement(weaknesses)
                .sevenDayStudyPlan(studyPlan)
                .build();

        EvaluationReport saved = reportRepository.save(report);
        progressLedgerService.recordSession(saved);
        return DiagnosticReportResponse.fromEntity(saved);
    }

    public byte[] generateTranscriptPdf(Long sessionId) throws java.io.IOException {
        EvaluationReport report = reportRepository.findBySessionId(sessionId).orElse(null);
        List<SessionServiceClient.TranscriptMessageDto> transcript = Collections.emptyList();
        try {
            transcript = sessionClient.getSessionTranscript(sessionId);
        } catch (Exception e) {
            log.warn("Could not fetch transcript turns for PDF: {}", e.getMessage());
        }
        return pdfGenerator.generateTranscriptPdf(report, transcript);
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