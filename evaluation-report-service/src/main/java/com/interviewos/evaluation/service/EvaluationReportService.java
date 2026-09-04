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

import java.time.Duration;
import java.time.Instant;
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

        // A18: Calculate elapsed duration honestly from first to last transcript turn timestamp
        long durationSeconds = 0;
        if (transcript.size() >= 2) {
            Instant firstTurnTime = null;
            Instant lastTurnTime = null;
            for (SessionServiceClient.TranscriptMessageDto turn : transcript) {
                if (turn.timestamp() != null) {
                    if (firstTurnTime == null || turn.timestamp().isBefore(firstTurnTime)) {
                        firstTurnTime = turn.timestamp();
                    }
                    if (lastTurnTime == null || turn.timestamp().isAfter(lastTurnTime)) {
                        lastTurnTime = turn.timestamp();
                    }
                }
            }
            if (firstTurnTime != null && lastTurnTime != null && !firstTurnTime.equals(lastTurnTime)) {
                durationSeconds = Duration.between(firstTurnTime, lastTurnTime).toSeconds();
            }
        }
        if (durationSeconds <= 0 && session.durationSeconds() != null) {
            durationSeconds = session.durationSeconds();
        }
        int executedMinutes = transcript.size() >= 2 ? Math.max(1, (int) Math.round(durationSeconds / 60.0)) : (int) (durationSeconds / 60);

        // A13: Gather Integrity Signals
        int echoFilteredCount = transcript.stream()
                .mapToInt(t -> t.echoFilteredCount() != null ? t.echoFilteredCount() : 0)
                .max()
                .orElse(0);

        int droppedChunks = 0;
        try {
            SessionServiceClient.RecordingManifestDto manifest = sessionClient.getRecordingManifest(sessionId);
            if (manifest != null && manifest.droppedChunks() != null) {
                droppedChunks = manifest.droppedChunks().size();
            }
        } catch (Exception e) {
            log.debug("No recording manifest found for session {}: {}", sessionId, e.getMessage());
        }

        int consentDowngrades = (int) transcript.stream()
                .filter(t -> t.metadata() != null && ("true".equalsIgnoreCase(t.metadata().get("consentDowngrade")) || "CONSENT_DOWNGRADE".equalsIgnoreCase(t.metadata().get("action"))))
                .count();

        String workspaceProvenance = transcript.stream()
                .filter(t -> t.metadata() != null && t.metadata().containsKey("workspaceProvenance"))
                .map(t -> t.metadata().get("workspaceProvenance"))
                .findFirst()
                .orElse("LOCAL_SANDBOX");

        int plannedMinutes = 45;
        if (session.plan() != null && session.plan().plannedTotalMinutes() > 0) {
            plannedMinutes = session.plan().plannedTotalMinutes();
        }

        long candidateTurns = transcript.stream()
                .filter(m -> "CANDIDATE".equalsIgnoreCase(m.senderRole()))
                .count();

        // C4: Build Plan-vs-Actual Assessment Breakdown
        List<DiagnosticReportResponse.PlanVsActualEntryDto> planVsActualList = buildPlanVsActual(
                session, transcript, executedMinutes, candidateTurns, plannedMinutes
        );

        Set<String> executedSectionTypes = planVsActualList.stream()
                .filter(entry -> "COMPLETED".equalsIgnoreCase(entry.status()) || entry.turnCount() > 0)
                .map(entry -> entry.sectionType().toUpperCase())
                .collect(java.util.stream.Collectors.toSet());

        String touchedSections = transcript.stream()
                .filter(t -> t.metadata() != null && (t.metadata().containsKey("sectionType") || t.metadata().containsKey("stage")))
                .map(t -> t.metadata().containsKey("sectionType") ? t.metadata().get("sectionType") : t.metadata().get("stage"))
                .distinct()
                .collect(java.util.stream.Collectors.joining(", "));
        if (touchedSections.isBlank()) {
            touchedSections = planVsActualList.stream()
                    .filter(entry -> "COMPLETED".equalsIgnoreCase(entry.status()) || entry.turnCount() > 0)
                    .map(DiagnosticReportResponse.PlanVsActualEntryDto::sectionType)
                    .collect(java.util.stream.Collectors.joining(", "));
        }
        if (touchedSections.isBlank()) {
            touchedSections = session.track() != null ? session.track() : "CORE";
        }

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
            String headline = String.format("Candidate executed %d of %d planned minutes across %d interactive turns in [%s]. Sandbox Execution Sub-Score: %d/100.",
                    executedMinutes, plannedMinutes, candidateTurns, touchedSections, executionScore);
            executiveSummary = rubric.executiveSummary();
            if (allExecutionsFailedByEngine) {
                executiveSummary = String.format("%s Execution not verifiable (engine offline ×%d). %s", headline, totalEngineErrors, executiveSummary);
            } else {
                executiveSummary = headline + " " + executiveSummary;
            }

            List<AiRubricClient.DimensionScoreDto> filteredDimensions = rubric.dimensions().stream()
                    .filter(d -> isDimensionApplicable(d.dimension(), executedSectionTypes, session.track()))
                    .toList();

            try {
                rubricJson = objectMapper.writeValueAsString(filteredDimensions);
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
                weaknesses.add(String.format("Weak ALGORITHMIC_REASONING: 0 verified test suites passed (Sandbox Execution Sub-Score: %d/100).", executionScore));
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

            String headline = String.format("Candidate executed %d of %d planned minutes across %d interactive turns in [%s]. Sandbox Execution Sub-Score: %d/100.",
                    executedMinutes, plannedMinutes, candidateTurns, touchedSections, executionScore);
            if (allExecutionsFailedByEngine) {
                executiveSummary = String.format(
                        "%s Execution not verifiable (engine offline ×%d). Technical Accuracy scored from code structure and dialogue evidence.",
                        headline, totalEngineErrors
                );
            } else {
                executiveSummary = String.format(
                        "%s Deterministic evaluation generated.",
                        headline
                );
                if (verifiedPasses == 0) {
                    executiveSummary += " No verified code execution passed during this session.";
                }
            }
        }

        String requestedSections = session.plan() != null && session.plan().sections() != null && !session.plan().sections().isEmpty()
                ? session.plan().sections().stream().map(SessionServiceClient.PlannedSectionDto::sectionType).collect(java.util.stream.Collectors.joining(", "))
                : touchedSections;

        String executedSections = planVsActualList.stream()
                .filter(entry -> "COMPLETED".equalsIgnoreCase(entry.status()) || entry.turnCount() > 0)
                .map(DiagnosticReportResponse.PlanVsActualEntryDto::sectionType)
                .collect(java.util.stream.Collectors.joining(", "));
        if (executedSections.isBlank()) {
            executedSections = "NONE";
        }

        String planDisclosure = String.format(
                "Plan requested {%s}; executed {%s}; verdict reflects executed only. Disclosure: Scorecard reflects executed assessment sections only; unreached sections are not penalized.",
                requestedSections, executedSections
        );
        executiveSummary += " " + planDisclosure;

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
            executiveSummary += String.format(" Assessment ended prematurely (%d min, %d turns); minimum viable interview threshold (minimum 3 minutes and at least 3 candidate turns) was not reached.", executedMinutes, candidateTurns);
        }

        String planVsActualJson = null;
        try {
            planVsActualJson = objectMapper.writeValueAsString(planVsActualList);
        } catch (Exception e) {
            log.warn("Failed to serialize plan-vs-actual to JSON: {}", e.getMessage());
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
                .echoFilteredCount(echoFilteredCount)
                .droppedChunks(droppedChunks)
                .consentDowngrades(consentDowngrades)
                .workspaceProvenance(workspaceProvenance)
                .planVsActualJson(planVsActualJson)
                .build();

        EvaluationReport saved = reportRepository.save(report);
        progressLedgerService.recordSession(saved);
        return DiagnosticReportResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public byte[] generateTranscriptPdf(Long sessionId) throws java.io.IOException {
        EvaluationReport report = reportRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new NoSuchElementException("Evaluation report not found for session ID: " + sessionId));
        TranscriptPdfMeta meta = TranscriptPdfMeta.fromEntity(report);
        List<SessionServiceClient.TranscriptMessageDto> transcript = Collections.emptyList();
        try {
            transcript = sessionClient.getSessionTranscript(sessionId);
        } catch (Exception e) {
            log.warn("Could not fetch transcript turns for PDF: {}", e.getMessage());
        }
        return pdfGenerator.generateTranscriptPdf(meta, transcript);
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

    private List<DiagnosticReportResponse.PlanVsActualEntryDto> buildPlanVsActual(
            SessionServiceClient.SessionDetailsDto session,
            List<SessionServiceClient.TranscriptMessageDto> transcript,
            int executedMinutes,
            long candidateTurns,
            int plannedMinutes
    ) {
        List<SessionServiceClient.PlannedSectionDto> plannedSections = new ArrayList<>();
        if (session.plan() != null && session.plan().sections() != null && !session.plan().sections().isEmpty()) {
            plannedSections = session.plan().sections();
        } else {
            List<String> transcriptSections = transcript.stream()
                    .filter(t -> t.metadata() != null && (t.metadata().containsKey("sectionType") || t.metadata().containsKey("stage")))
                    .map(t -> t.metadata().containsKey("sectionType") ? t.metadata().get("sectionType") : t.metadata().get("stage"))
                    .distinct()
                    .toList();
            if (!transcriptSections.isEmpty()) {
                for (String tSec : transcriptSections) {
                    plannedSections.add(new SessionServiceClient.PlannedSectionDto(tSec, session.track() != null ? session.track() : tSec, 1, plannedMinutes, "Assessment Section"));
                }
            } else {
                String defTrack = session.track() != null ? session.track() : "CORE";
                plannedSections.add(new SessionServiceClient.PlannedSectionDto(defTrack, defTrack, 1, plannedMinutes, "Standard Assessment"));
            }
        }

        List<SessionServiceClient.SectionProgressDto> progressList = session.sectionProgress();
        if (progressList == null || progressList.isEmpty()) {
            try {
                progressList = sessionClient.getSectionProgress(session.id());
            } catch (Exception ignored) {}
        }
        if (progressList == null) {
            progressList = List.of();
        }

        List<DiagnosticReportResponse.PlanVsActualEntryDto> result = new ArrayList<>();

        for (int i = 0; i < plannedSections.size(); i++) {
            SessionServiceClient.PlannedSectionDto ps = plannedSections.get(i);
            final int secIdx = i;

            long turnsInSec = transcript.stream()
                    .filter(t -> "CANDIDATE".equalsIgnoreCase(t.senderRole()))
                    .filter(t -> {
                        if (t.metadata() == null) return false;
                        String idxStr = t.metadata().get("sectionIndex");
                        if (idxStr != null && idxStr.equals(String.valueOf(secIdx))) return true;
                        return matchesSection(ps.sectionType(), t.metadata());
                    })
                    .count();

            SessionServiceClient.SectionProgressDto matchingProgress = progressList.stream()
                    .filter(p -> (p.index() != null && p.index().equals(secIdx)) ||
                                 (p.sectionType() != null && p.sectionType().equalsIgnoreCase(ps.sectionType())))
                    .findFirst()
                    .orElse(null);

            int effectiveTurnCount = (int) turnsInSec;
            if (matchingProgress != null && matchingProgress.turnCount() != null && matchingProgress.turnCount() > effectiveTurnCount) {
                effectiveTurnCount = matchingProgress.turnCount();
            }

            // Fallback for single section sessions without per-turn section metadata
            if (plannedSections.size() == 1 && effectiveTurnCount == 0 && candidateTurns > 0) {
                effectiveTurnCount = (int) candidateTurns;
            }

            int secElapsedMin = 0;
            if (effectiveTurnCount > 0) {
                Instant firstSecTime = null;
                Instant lastSecTime = null;
                for (SessionServiceClient.TranscriptMessageDto t : transcript) {
                    if (t.timestamp() != null) {
                        boolean match = false;
                        if (t.metadata() != null) {
                            String idxStr = t.metadata().get("sectionIndex");
                            match = (idxStr != null && idxStr.equals(String.valueOf(secIdx))) || matchesSection(ps.sectionType(), t.metadata());
                        } else if (plannedSections.size() == 1) {
                            match = true;
                        }
                        if (match) {
                            if (firstSecTime == null || t.timestamp().isBefore(firstSecTime)) firstSecTime = t.timestamp();
                            if (lastSecTime == null || t.timestamp().isAfter(lastSecTime)) lastSecTime = t.timestamp();
                        }
                    }
                }
                if (firstSecTime != null && lastSecTime != null && !firstSecTime.equals(lastSecTime)) {
                    secElapsedMin = Math.max(1, (int) Math.round(Duration.between(firstSecTime, lastSecTime).toSeconds() / 60.0));
                } else if (plannedSections.size() == 1 && executedMinutes > 0) {
                    secElapsedMin = executedMinutes;
                } else {
                    secElapsedMin = Math.max(1, Math.min(ps.softTimeBudgetMinutes(), effectiveTurnCount * 2));
                }
            }

            String status;
            if (effectiveTurnCount >= 1) {
                status = "COMPLETED";
            } else if (matchingProgress != null && ("SKIPPED_BY_USER".equalsIgnoreCase(matchingProgress.reason()) || "SKIPPED".equalsIgnoreCase(matchingProgress.reason()))) {
                status = "SKIPPED";
            } else if (matchingProgress != null) {
                status = "ADVANCED_PAST";
            } else {
                status = "NOT_REACHED";
            }

            result.add(new DiagnosticReportResponse.PlanVsActualEntryDto(
                    ps.sectionType(),
                    ps.track(),
                    secIdx,
                    status,
                    effectiveTurnCount,
                    secElapsedMin,
                    ps.softTimeBudgetMinutes(),
                    ps.note() != null ? ps.note() : ""
            ));
        }

        return result;
    }

    private boolean matchesSection(String sectionType, Map<String, String> metadata) {
        if (sectionType == null || metadata == null) return false;
        String sType = metadata.get("sectionType");
        String stage = metadata.get("stage");
        if (sType != null) {
            if (sType.equalsIgnoreCase(sectionType)) return true;
            if (sectionType.equalsIgnoreCase("DSA") && (sType.equalsIgnoreCase("CODING_DSA") || sType.equalsIgnoreCase("CORE_TECH") || sType.toUpperCase().contains("DSA"))) return true;
            if (sectionType.equalsIgnoreCase("CODING_DSA") && (sType.equalsIgnoreCase("DSA") || sType.toUpperCase().contains("DSA"))) return true;
            if (sectionType.equalsIgnoreCase("LLD") && (sType.equalsIgnoreCase("LOW_LEVEL_DESIGN") || sType.toUpperCase().contains("LLD"))) return true;
            if (sectionType.equalsIgnoreCase("INTRODUCTION") && (sType.equalsIgnoreCase("INTRO") || sType.toUpperCase().contains("INTRO"))) return true;
            if (sectionType.equalsIgnoreCase("INTRO") && (sType.equalsIgnoreCase("INTRODUCTION") || sType.toUpperCase().contains("INTRO"))) return true;
            if (sectionType.equalsIgnoreCase("SYSTEM_DESIGN") && (sType.equalsIgnoreCase("ARCHITECTURE") || sType.toUpperCase().contains("SYSTEM_DESIGN") || sType.toUpperCase().contains("HLD"))) return true;
            if (sectionType.equalsIgnoreCase("BEHAVIORAL") && sType.toUpperCase().contains("BEHAVIORAL")) return true;
            if (sectionType.equalsIgnoreCase("RESUME") && sType.toUpperCase().contains("RESUME")) return true;
        }
        if (stage != null) {
            if (stage.equalsIgnoreCase(sectionType)) return true;
            if (sectionType.equalsIgnoreCase("DSA") && (stage.equalsIgnoreCase("CODING_DSA") || stage.equalsIgnoreCase("CORE_TECH") || stage.toUpperCase().contains("DSA"))) return true;
            if (sectionType.equalsIgnoreCase("LLD") && (stage.equalsIgnoreCase("LOW_LEVEL_DESIGN") || stage.toUpperCase().contains("LLD"))) return true;
            if (sectionType.equalsIgnoreCase("INTRODUCTION") && (stage.equalsIgnoreCase("INTRO") || stage.toUpperCase().contains("INTRO"))) return true;
            if (sectionType.equalsIgnoreCase("INTRO") && (stage.equalsIgnoreCase("INTRODUCTION") || stage.toUpperCase().contains("INTRO"))) return true;
            if (sectionType.equalsIgnoreCase("SYSTEM_DESIGN") && (stage.equalsIgnoreCase("ARCHITECTURE") || stage.toUpperCase().contains("SYSTEM_DESIGN") || stage.toUpperCase().contains("HLD"))) return true;
            if (sectionType.equalsIgnoreCase("BEHAVIORAL") && stage.toUpperCase().contains("BEHAVIORAL")) return true;
            if (sectionType.equalsIgnoreCase("RESUME") && stage.toUpperCase().contains("RESUME")) return true;
        }
        return false;
    }

    private boolean isDimensionApplicable(String dimName, Set<String> executedSectionTypes, String track) {
        if (dimName == null) return true;
        String upper = dimName.toUpperCase();

        // LLD dimensions: require LLD executed
        if (upper.contains("LLD") || upper.contains("LOW_LEVEL") || upper.contains("OBJECT_ORIENTED") || upper.contains("DESIGN_PATTERNS")) {
            return executedSectionTypes.stream().anyMatch(s -> s.contains("LLD") || s.contains("LOW_LEVEL"));
        }
        // SYSTEM_DESIGN dimensions: require SYSTEM_DESIGN executed or standalone track
        if (upper.contains("ARCHITECTURE") || upper.contains("SCALABILITY") || upper.contains("TRADE_OFFS") || upper.contains("SYSTEM_DESIGN") || upper.contains("COMMUNICATION_DESIGN") || upper.contains("RIGOR")) {
            if (track != null && (track.toUpperCase().contains("SYSTEM_DESIGN") || track.toUpperCase().contains("ARCHITECTURE"))) {
                return true;
            }
            return executedSectionTypes.stream().anyMatch(s -> s.contains("SYSTEM_DESIGN") || s.contains("ARCHITECTURE") || s.contains("HLD"));
        }
        // BEHAVIORAL dimensions: require BEHAVIORAL executed or standalone track
        if (upper.contains("LEADERSHIP") || upper.contains("CONFLICT_RESOLUTION") || upper.contains("TEAMWORK") || upper.contains("ADAPTABILITY") || upper.contains("COMMUNICATION_BEHAVIORAL")) {
            if (track != null && (track.toUpperCase().contains("BEHAVIORAL") || track.toUpperCase().contains("LEADERSHIP"))) {
                return true;
            }
            return executedSectionTypes.stream().anyMatch(s -> s.contains("BEHAVIORAL") || s.contains("LEADERSHIP"));
        }
        // RESUME dimensions: require RESUME executed or standalone track
        if (upper.contains("TECHNICAL_DEPTH") || upper.contains("PROJECT_IMPACT") || upper.contains("COMMUNICATION_RESUME") || upper.contains("PROFESSIONALISM_RESUME")) {
            if (track != null && track.toUpperCase().contains("RESUME")) {
                return true;
            }
            return executedSectionTypes.stream().anyMatch(s -> s.contains("RESUME"));
        }
        // DSA / CODING dimensions: require DSA / CORE_TECH / CODING executed or standalone track
        if (upper.contains("ALGORITHMIC_REASONING") || upper.contains("EDGE_CASE_THOROUGHNESS")) {
            if (track != null && (track.toUpperCase().contains("DSA") || track.toUpperCase().contains("ALGORITHM") || track.toUpperCase().contains("JAVA") || track.toUpperCase().contains("PYTHON") || track.toUpperCase().contains("CODING"))) {
                return true;
            }
            return executedSectionTypes.stream().anyMatch(s -> s.contains("DSA") || s.contains("CORE") || s.contains("CODING"));
        }
        return true;
    }
}