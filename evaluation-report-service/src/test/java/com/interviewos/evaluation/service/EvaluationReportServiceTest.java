package com.interviewos.evaluation.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.evaluation.client.AiRubricClient;
import com.interviewos.evaluation.client.ProctorServiceClient;
import com.interviewos.evaluation.client.SessionServiceClient;
import com.interviewos.evaluation.dto.DiagnosticReportResponse;
import com.interviewos.evaluation.entity.EvaluationReport;
import com.interviewos.evaluation.model.HiringVerdict;
import com.interviewos.evaluation.repository.EvaluationReportRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EvaluationReportServiceTest {

    @Mock
    private EvaluationReportRepository reportRepository;

    @Mock
    private SessionServiceClient sessionClient;

    @Mock
    private ProctorServiceClient proctorClient;

    @Mock
    private AiRubricClient aiRubricClient;

    @Mock
    private HumanTranscriptPdfGenerator pdfGenerator;

    @Mock
    private ProgressLedgerService progressLedgerService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private EvaluationReportService evaluationReportService;

    private SessionServiceClient.SessionDetailsDto sampleSession;

    @BeforeEach
    void setUp() {
        sampleSession = new SessionServiceClient.SessionDetailsDto(
                1L, "candidate-01", "Senior Java Developer", "JAVA_SPRING_BOOT", "SENIOR",
                "Acme Corp", "COMPLETED", 1200L
        );
        lenient().when(reportRepository.findBySessionId(1L)).thenReturn(Optional.empty());
        lenient().when(reportRepository.save(any(EvaluationReport.class))).thenAnswer(invocation -> {
            EvaluationReport r = invocation.getArgument(0);
            r.setId(100L);
            return r;
        });
        lenient().when(sessionClient.getSessionById(1L)).thenReturn(sampleSession);
        lenient().when(proctorClient.getSessionSummary(1L)).thenReturn(
                new ProctorServiceClient.ProctorSummaryDto(1L, 95, "LOW", "CLEAN", 10L, 0, 0, List.of())
        );
    }

    @Test
    @DisplayName("Zero code executions -> executionScore is 0 and verdict is capped at NO_HIRE/LEAN_HIRE")
    void testExecutionScoreWithNoExecutions() {
        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "EXPLANATION", "Hello", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(2L, "AI", "FEEDBACK", "Welcome", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(3L, "CANDIDATE", "EXPLANATION", "Discussing approach", null, Instant.now())
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);
        when(aiRubricClient.evaluateRubric(any())).thenReturn(Optional.empty());

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.scorecard().technicalAccuracy()).isLessThanOrEqualTo(60);
        assertThat(report.scorecard().codeQuality()).isLessThanOrEqualTo(40);
        assertThat(report.verdict()).isNotEqualTo(HiringVerdict.STRONG_HIRE);
        assertThat(report.verdict()).isNotEqualTo(HiringVerdict.HIRE);
        assertThat(report.llmGenerated()).isFalse();
    }

    @Test
    @DisplayName("Compile error only -> executionScore is capped at <= 35")
    void testExecutionScoreWithCompileErrorOnly() {
        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "CODE_EXECUTION", "Candidate executed code: 0/4 tests passed (COMPILE_ERROR) in 0.0ms. [problem:two-sum]", "class Main {}", Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(2L, "CANDIDATE", "EXPLANATION", "I made a syntax error.", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(3L, "CANDIDATE", "EXPLANATION", "Fixing it now.", null, Instant.now())
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);
        when(aiRubricClient.evaluateRubric(any())).thenReturn(Optional.empty());

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.scorecard().technicalAccuracy()).isLessThanOrEqualTo(35);
        assertThat(report.llmGenerated()).isFalse();
    }

    @Test
    @DisplayName("Timeout execution -> executionScore is capped at <= 50")
    void testExecutionScoreWithTimeout() {
        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "CODE_EXECUTION", "Candidate executed code: 2/4 tests passed (TIMEOUT) in 5000.0ms. [problem:lru-cache]", "class Main {}", Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(2L, "CANDIDATE", "EXPLANATION", "Loop hung on edge case.", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(3L, "CANDIDATE", "EXPLANATION", "Checking termination condition.", null, Instant.now())
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);
        when(aiRubricClient.evaluateRubric(any())).thenReturn(Optional.empty());

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.scorecard().technicalAccuracy()).isLessThanOrEqualTo(50);
        assertThat(report.llmGenerated()).isFalse();
    }

    @Test
    @DisplayName("Premature / Abandoned session (<180s or <3 candidate turns) -> NO_HIRE with premature note")
    void testPrematureSessionGuard() {
        SessionServiceClient.SessionDetailsDto shortSession = new SessionServiceClient.SessionDetailsDto(
                1L, "candidate-01", "Senior Java Developer", "JAVA_SPRING_BOOT", "SENIOR",
                "Acme Corp", "COMPLETED", 100L // < 180s
        );
        when(sessionClient.getSessionById(1L)).thenReturn(shortSession);
        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "EXPLANATION", "Hello", null, Instant.now())
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);
        when(aiRubricClient.evaluateRubric(any())).thenReturn(Optional.empty());

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.verdict()).isEqualTo(HiringVerdict.NO_HIRE);
        assertThat(report.executiveSummary()).contains("Assessment ended prematurely");
    }

    @Test
    @DisplayName("4/4 Passing execution + LLM Rubric -> Verified HIRE with canonical problem fetched from catalog")
    void testPassingExecutionWithLlmRubricAndProblemLookup() {
        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "EXPLANATION", "We can use a two-pointer approach for O(N) time and O(1) space.", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(2L, "CANDIDATE", "EXPLANATION", "Checking bounds and nulls.", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(3L, "CANDIDATE", "CODE_EXECUTION", "Candidate executed code: 4/4 tests passed (PASSED) in 120.0ms. [problem:reverse-a-string]", "class Main {}", Instant.now())
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);
        when(sessionClient.getProblemBySlug("reverse-a-string")).thenReturn(
                new SessionServiceClient.ProblemDetailsDto("p1", "reverse-a-string", "Reverse a String", "ALGORITHMS_DATA_STRUCTURES", "JUNIOR", "Write a standard I/O program to reverse characters.")
        );

        AiRubricClient.RubricResponseDto mockRubric = new AiRubricClient.RubricResponseDto(
                List.of(
                        new AiRubricClient.DimensionScoreDto("REQUIREMENTS_CLARIFICATION", 85, "Asked about null inputs", "Can input be null?"),
                        new AiRubricClient.DimensionScoreDto("ALGORITHMIC_REASONING", 90, "Accurate Big-O analysis", "two-pointer approach for O(N) time and O(1) space"),
                        new AiRubricClient.DimensionScoreDto("EDGE_CASE_THOROUGHNESS", 80, "Handled single-char strings", "while (left < right)"),
                        new AiRubricClient.DimensionScoreDto("COMMUNICATION_CLARITY", 85, "Clear articulation", "We can use a two-pointer approach"),
                        new AiRubricClient.DimensionScoreDto("CODE_QUALITY", 90, "Idiomatic Java", "class Main")
                ),
                List.of("Strong Big-O awareness"),
                List.of("Could add unit test coverage"),
                List.of(
                        "Day 1: Master Two-Pointer patterns",
                        "Day 2: Binary Search Drills",
                        "Day 3: Sliding Window",
                        "Day 4: Tree Traversal",
                        "Day 5: Dynamic Programming",
                        "Day 6: System Design",
                        "Day 7: Mock Replay"
                ),
                "Strong candidate demonstrating senior engineering execution.",
                true
        );
        when(aiRubricClient.evaluateRubric(any())).thenReturn(Optional.of(mockRubric));

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.llmGenerated()).isTrue();
        assertThat(report.scorecard().technicalAccuracy()).isEqualTo(95); // 0.5*100 + 0.5*90 = 95
        assertThat(report.scorecard().codeQuality()).isEqualTo(95); // 0.5*100 + 0.5*90 = 95
        assertThat(report.scorecard().requirementsClarification()).isEqualTo(85);
        assertThat(report.dimensions()).hasSize(5);
        assertThat(report.dimensions().get(0).evidence()).isEqualTo("Can input be null?");
        assertThat(report.verdict()).isEqualTo(HiringVerdict.STRONG_HIRE);

        ArgumentCaptor<AiRubricClient.RubricEvaluationRequestDto> captor = ArgumentCaptor.forClass(AiRubricClient.RubricEvaluationRequestDto.class);
        verify(aiRubricClient).evaluateRubric(captor.capture());
        assertThat(captor.getValue().problemSlug()).isEqualTo("reverse-a-string");
        assertThat(captor.getValue().problemStatement()).isEqualTo("Write a standard I/O program to reverse characters.");
    }

    @Test
    @DisplayName("session with only engine-error executions -> report shows not-verifiable and technical score is not zeroed")
    void testSessionWithOnlyEngineErrorsShowsNotVerifiable() {
        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "MESSAGE", "I plan to implement reverse string using two pointers.", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(2L, "SYSTEM", "ENGINE_ERROR", "SYSTEM NOTICE: Code execution sandbox offline (ENGINE_UNAVAILABLE) for problem 'reverse-a-string'. Run was not executed; candidate is not penalized.", "class Main {}", Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(3L, "CANDIDATE", "MESSAGE", "Since the engine is offline, I'll explain my code: left pointer at 0, right at length - 1, swapping characters until they meet.", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(4L, "INTERVIEWER", "MESSAGE", "That makes sense. What is the Big-O complexity?", null, Instant.now()),
                new SessionServiceClient.TranscriptMessageDto(5L, "CANDIDATE", "MESSAGE", "Time complexity is O(N) and space complexity is O(1).", null, Instant.now())
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);

        AiRubricClient.RubricResponseDto mockRubric = new AiRubricClient.RubricResponseDto(
                List.of(
                        new AiRubricClient.DimensionScoreDto("REQUIREMENTS_CLARIFICATION", 80, "Understood requirements", "I plan to implement"),
                        new AiRubricClient.DimensionScoreDto("ALGORITHMIC_REASONING", 85, "Correct two-pointer reasoning", "Time complexity is O(N)"),
                        new AiRubricClient.DimensionScoreDto("EDGE_CASE_THOROUGHNESS", 75, "Considered boundaries", "until they meet"),
                        new AiRubricClient.DimensionScoreDto("COMMUNICATION_CLARITY", 85, "Clear explanation", "Since the engine is offline"),
                        new AiRubricClient.DimensionScoreDto("CODE_QUALITY", 80, "Clean Java structure", "class Main {}")
                ),
                List.of("Clear two-pointer conceptual grasp"),
                List.of("Practice concurrency"),
                List.of("Day 1: Concurrency"),
                "Candidate articulated an optimal two-pointer solution.",
                true
        );
        when(aiRubricClient.evaluateRubric(any())).thenReturn(Optional.of(mockRubric));

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.llmGenerated()).isTrue();
        // Technical accuracy must NOT be zeroed (0.5 * 0 + 0.5 * 85 = 42), it should be scored from algorithmic reasoning (85)!
        assertThat(report.scorecard().technicalAccuracy()).isEqualTo(85);
        assertThat(report.scorecard().codeQuality()).isEqualTo(80);
        assertThat(report.executiveSummary()).contains("Execution not verifiable (engine offline ×1)");
        assertThat(report.verdict()).isNotEqualTo(HiringVerdict.NO_HIRE);
    }

    @Test
    @DisplayName("A13 + A18: Report gathers integrity signals and renders honest headline with disclosure")
    void testReportIntegritySignalsAndHonestHeadline() {
        Instant t0 = Instant.parse("2026-09-01T10:00:00Z");
        Instant t1 = t0.plusSeconds(300);
        Instant t2 = t0.plusSeconds(600); // 10 minutes total

        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(
                        1L, "CANDIDATE", "EXPLANATION", "Starting DSA section", null, t0,
                        java.util.Map.of("sectionType", "DSA_PROBLEM_SOLVING", "workspaceProvenance", "ISOLATED_CONTAINER"), 2
                ),
                new SessionServiceClient.TranscriptMessageDto(
                        2L, "AI", "FEEDBACK", "Understood. Please continue.", null, t1,
                        java.util.Map.of("sectionType", "DSA_PROBLEM_SOLVING"), 3
                ),
                new SessionServiceClient.TranscriptMessageDto(
                        3L, "CANDIDATE", "EXPLANATION", "Candidate explanation with consent downgrade", null, t1.plusSeconds(60),
                        java.util.Map.of("sectionType", "DSA_PROBLEM_SOLVING", "consentDowngrade", "true"), 1
                ),
                new SessionServiceClient.TranscriptMessageDto(
                        4L, "CANDIDATE", "CODE_EXECUTION", "Candidate executed code: 4/4 tests passed (PASSED) in 15.0ms. [problem:two-sum]", "class Main {}", t2,
                        java.util.Map.of("sectionType", "DSA_PROBLEM_SOLVING"), 0
                )
        );

        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);
        when(sessionClient.getRecordingManifest(1L)).thenReturn(new SessionServiceClient.RecordingManifestDto(
                1L, 10, List.of(
                        new SessionServiceClient.RecordingManifestDto.DroppedChunkDto(2, "screen", "PAYLOAD_TOO_LARGE_413"),
                        new SessionServiceClient.RecordingManifestDto.DroppedChunkDto(5, "camera", "PAYLOAD_TOO_LARGE_413")
                )
        ));

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        // A13 Integrity verification
        assertThat(report.integrity()).isNotNull();
        assertThat(report.integrity().echoFilteredCount()).isEqualTo(3);
        assertThat(report.integrity().droppedChunks()).isEqualTo(2);
        assertThat(report.integrity().consentDowngrades()).isEqualTo(1);
        assertThat(report.integrity().workspaceProvenance()).isEqualTo("ISOLATED_CONTAINER");

        // A18 Headline & Disclosure verification
        assertThat(report.executiveSummary())
                .startsWith("Candidate executed 10 of 45 planned minutes across 3 interactive turns in [DSA_PROBLEM_SOLVING]. Sandbox Execution Sub-Score: 100/100.")
                .contains("Disclosure: Scorecard reflects executed assessment sections only; unreached sections are not penalized.");

        // Verify entity persisted with integrity values
        ArgumentCaptor<EvaluationReport> captor = ArgumentCaptor.forClass(EvaluationReport.class);
        verify(reportRepository).save(captor.capture());
        EvaluationReport saved = captor.getValue();
        assertThat(saved.getEchoFilteredCount()).isEqualTo(3);
        assertThat(saved.getDroppedChunks()).isEqualTo(2);
        assertThat(saved.getConsentDowngrades()).isEqualTo(1);
        assertThat(saved.getWorkspaceProvenance()).isEqualTo("ISOLATED_CONTAINER");
    }

    @Test
    @DisplayName("A18: Premature session explicitly discloses 3 min and 3 candidate turns threshold")
    void testPrematureSessionDisclosesThreshold() {
        Instant t0 = Instant.parse("2026-09-01T10:00:00Z");
        Instant t1 = t0.plusSeconds(75); // 75 seconds (< 180s)

        SessionServiceClient.SessionDetailsDto shortSession = new SessionServiceClient.SessionDetailsDto(
                1L, "candidate-01", "Senior Java Developer", "JAVA_SPRING_BOOT", "SENIOR",
                "Acme Corp", "COMPLETED", 75L
        );
        when(sessionClient.getSessionById(1L)).thenReturn(shortSession);

        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "EXPLANATION", "Hi", null, t0),
                new SessionServiceClient.TranscriptMessageDto(2L, "AI", "FEEDBACK", "Hello", null, t1)
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.verdict()).isEqualTo(HiringVerdict.NO_HIRE);
        assertThat(report.executiveSummary())
                .contains("Assessment ended prematurely (1 min, 1 turns); minimum viable interview threshold (minimum 3 minutes and at least 3 candidate turns) was not reached.");
    }

    @Test
    @DisplayName("C4 AC: plan [INTRO,DSA,LLD] with INTRO+DSA transcript -> LLD NOT_REACHED, disclosure present, zero LLD dimensions")
    void testPlanVsActual_UnreachedSection_ExcludesDimensionsAndAddsDisclosure() {
        SessionServiceClient.SessionPlanDto plan = new SessionServiceClient.SessionPlanDto(
                "MANUAL_PRESET",
                "MID",
                List.of(
                        new SessionServiceClient.PlannedSectionDto("INTRODUCTION", "CORE", 1, 5, "Warm-up"),
                        new SessionServiceClient.PlannedSectionDto("DSA", "ALGORITHMS_DATA_STRUCTURES", 2, 30, "Coding problem"),
                        new SessionServiceClient.PlannedSectionDto("LLD", "LOW_LEVEL_DESIGN", 1, 20, "Design class hierarchy")
                ),
                55
        );

        SessionServiceClient.SessionDetailsDto sessionWithPlan = new SessionServiceClient.SessionDetailsDto(
                1L, "candidate-c4", "Software Engineer", "FULL_LOOP", "MID",
                "Acme Corp", "COMPLETED", 1500L, plan, List.of()
        );
        when(sessionClient.getSessionById(1L)).thenReturn(sessionWithPlan);

        Instant t0 = Instant.parse("2026-09-01T10:00:00Z");
        Instant t1 = t0.plusSeconds(300);
        Instant t2 = t1.plusSeconds(600);

        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "EXPLANATION", "Hello, I am ready.", null, t0, java.util.Map.of("sectionType", "INTRODUCTION", "sectionIndex", "0"), 0),
                new SessionServiceClient.TranscriptMessageDto(2L, "AI", "QUESTION", "Tell me about your background.", null, t0.plusSeconds(30), java.util.Map.of("sectionType", "INTRODUCTION", "sectionIndex", "0"), 0),
                new SessionServiceClient.TranscriptMessageDto(3L, "CANDIDATE", "EXPLANATION", "I have 4 years of experience building distributed systems.", null, t0.plusSeconds(60), java.util.Map.of("sectionType", "INTRODUCTION", "sectionIndex", "0"), 0),
                new SessionServiceClient.TranscriptMessageDto(4L, "CANDIDATE", "EXPLANATION", "For the two sum problem, we use a hash map for O(N) lookup.", null, t1, java.util.Map.of("sectionType", "DSA", "sectionIndex", "1"), 0),
                new SessionServiceClient.TranscriptMessageDto(5L, "CANDIDATE", "CODE_EXECUTION", "Candidate executed code: 4/4 tests passed (PASSED) in 12.0ms. [problem:two-sum]", "class Solution {}", t2, java.util.Map.of("sectionType", "DSA", "sectionIndex", "1"), 0)
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);

        AiRubricClient.RubricResponseDto mockRubric = new AiRubricClient.RubricResponseDto(
                List.of(
                        new AiRubricClient.DimensionScoreDto("REQUIREMENTS_CLARIFICATION", 85, "Good clarification", "ready"),
                        new AiRubricClient.DimensionScoreDto("ALGORITHMIC_REASONING", 90, "Optimal hash map approach", "hash map for O(N) lookup"),
                        new AiRubricClient.DimensionScoreDto("CODE_QUALITY", 85, "Clean structure", "class Solution"),
                        new AiRubricClient.DimensionScoreDto("LLD_ARCHITECTURE", 40, "No evidence", "No observable evidence in transcript.")
                ),
                List.of("Strong algorithmic fundamentals"),
                List.of("LLD section not reached"),
                List.of("Day 1: System and Low-Level Design"),
                "Candidate performed strongly in DSA and Introduction.",
                true
        );
        when(aiRubricClient.evaluateRubric(any())).thenReturn(Optional.of(mockRubric));

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        // 1. Plan-vs-Actual entries: LLD must be NOT_REACHED
        assertThat(report.planVsActual()).hasSize(3);
        assertThat(report.planVsActual().get(0).sectionType()).isEqualTo("INTRODUCTION");
        assertThat(report.planVsActual().get(0).status()).isEqualTo("COMPLETED");
        assertThat(report.planVsActual().get(0).turnCount()).isGreaterThanOrEqualTo(2);

        assertThat(report.planVsActual().get(1).sectionType()).isEqualTo("DSA");
        assertThat(report.planVsActual().get(1).status()).isEqualTo("COMPLETED");
        assertThat(report.planVsActual().get(1).turnCount()).isGreaterThanOrEqualTo(2);

        assertThat(report.planVsActual().get(2).sectionType()).isEqualTo("LLD");
        assertThat(report.planVsActual().get(2).status()).isEqualTo("NOT_REACHED");
        assertThat(report.planVsActual().get(2).turnCount()).isEqualTo(0);
        assertThat(report.planVsActual().get(2).elapsedMinutes()).isEqualTo(0);
        assertThat(report.planVsActual().get(2).softBudgetMinutes()).isEqualTo(20);

        // 2. Zero LLD dimensions in report (unreached section dimensions filtered out)
        assertThat(report.dimensions())
                .noneMatch(d -> d.dimension().toUpperCase().contains("LLD"));
        assertThat(report.dimensions()).hasSize(3);

        // 3. Disclosure present in executive summary
        assertThat(report.executiveSummary())
                .contains("Plan requested {INTRODUCTION, DSA, LLD}; executed {INTRODUCTION, DSA}; verdict reflects executed only.")
                .contains("Scorecard reflects executed assessment sections only; unreached sections are not penalized.");

        // 4. No "too slow" judgments
        assertThat(report.executiveSummary().toLowerCase()).doesNotContain("too slow");
        assertThat(report.executiveSummary().toLowerCase()).doesNotContain("over budget");
        assertThat(report.executiveSummary().toLowerCase()).doesNotContain("took too long");
    }

    @Test
    @DisplayName("C4: FULL_LOOP report shows elapsed and soft budget columns without pacing judgment")
    void testPlanVsActual_FullLoop_ShowsElapsedAndBudgetColumns_NoTooSlowJudgments() {
        SessionServiceClient.SessionPlanDto plan = new SessionServiceClient.SessionPlanDto(
                "SETUP_SELECTION",
                "SENIOR",
                List.of(
                        new SessionServiceClient.PlannedSectionDto("INTRODUCTION", "CORE", 1, 5, "Warmup"),
                        new SessionServiceClient.PlannedSectionDto("DSA", "ALGORITHMS_DATA_STRUCTURES", 1, 15, "Algorithms"),
                        new SessionServiceClient.PlannedSectionDto("LLD", "LOW_LEVEL_DESIGN", 1, 15, "Low Level Design"),
                        new SessionServiceClient.PlannedSectionDto("SYSTEM_DESIGN", "SYSTEM_DESIGN", 1, 18, "Architecture")
                ),
                53
        );

        SessionServiceClient.SessionDetailsDto session = new SessionServiceClient.SessionDetailsDto(
                1L, "candidate-full-loop", "Senior Engineer", "FULL_LOOP", "SENIOR",
                "Stripe", "COMPLETED", 3600L, plan, List.of()
        );
        when(sessionClient.getSessionById(1L)).thenReturn(session);

        Instant t0 = Instant.parse("2026-09-01T10:00:00Z");
        List<SessionServiceClient.TranscriptMessageDto> transcript = List.of(
                new SessionServiceClient.TranscriptMessageDto(1L, "CANDIDATE", "EXPLANATION", "Intro turn 1", null, t0, java.util.Map.of("sectionType", "INTRODUCTION", "sectionIndex", "0"), 0),
                new SessionServiceClient.TranscriptMessageDto(2L, "CANDIDATE", "EXPLANATION", "Intro turn 2", null, t0.plusSeconds(60), java.util.Map.of("sectionType", "INTRODUCTION", "sectionIndex", "0"), 0),
                new SessionServiceClient.TranscriptMessageDto(3L, "CANDIDATE", "EXPLANATION", "DSA solution", null, t0.plusSeconds(300), java.util.Map.of("sectionType", "DSA", "sectionIndex", "1"), 0),
                new SessionServiceClient.TranscriptMessageDto(4L, "CANDIDATE", "CODE_EXECUTION", "Candidate executed code: 3/3 tests passed (PASSED) in 5.0ms. [problem:lru-cache]", "class LRU {}", t0.plusSeconds(600), java.util.Map.of("sectionType", "DSA", "sectionIndex", "1"), 0)
        );
        when(sessionClient.getSessionTranscript(1L)).thenReturn(transcript);

        DiagnosticReportResponse report = evaluationReportService.generateReport(1L);

        assertThat(report.planVsActual()).hasSize(4);
        assertThat(report.planVsActual().get(0).status()).isEqualTo("COMPLETED");
        assertThat(report.planVsActual().get(1).status()).isEqualTo("COMPLETED");
        assertThat(report.planVsActual().get(2).status()).isEqualTo("NOT_REACHED");
        assertThat(report.planVsActual().get(3).status()).isEqualTo("NOT_REACHED");

        for (var entry : report.planVsActual()) {
            assertThat(entry.softBudgetMinutes()).isGreaterThan(0);
            assertThat(entry.elapsedMinutes()).isGreaterThanOrEqualTo(0);
        }

        assertThat(report.executiveSummary().toLowerCase()).doesNotContain("too slow");
    }
}
