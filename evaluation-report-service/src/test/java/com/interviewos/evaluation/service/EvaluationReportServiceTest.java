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
}
