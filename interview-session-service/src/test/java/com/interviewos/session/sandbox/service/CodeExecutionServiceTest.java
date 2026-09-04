package com.interviewos.session.sandbox.service;

import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.document.InterviewSessionDocument;
import com.interviewos.session.repository.InterviewSessionMongoRepository;
import com.interviewos.session.runner.TrackRunner;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecuteCodeRequest;
import com.interviewos.session.sandbox.dto.ExecuteProjectRequest;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodeExecutionServiceTest {

    @Mock
    private TrackRunner trackRunner;

    @Mock
    private QuestionBankClient questionBankClient;

    @Mock
    private InterviewSessionMongoRepository sessionMongoRepository;

    @Mock
    private org.springframework.beans.factory.ObjectProvider<com.interviewos.session.workspace.service.WorkspaceProvisionerService> workspaceProvisionerProvider;

    private CodeExecutionService codeExecutionService;

    @BeforeEach
    void setUp() {
        codeExecutionService = new CodeExecutionService(
                List.of(trackRunner),
                questionBankClient,
                sessionMongoRepository,
                workspaceProvisionerProvider
        );
    }

    @Test
    @DisplayName("AC-3.1: executeCode with submit=false must NOT record a turn in transcript")
    void testExecuteCode_whenSubmitFalse_doesNotRecordSessionMessage() {
        ExecuteCodeRequest request = new ExecuteCodeRequest(
                "java",
                "public class Sol { public int solve() { return 42; } }",
                "problem-slug",
                false
        );

        when(questionBankClient.fetchProblemBySlug("problem-slug"))
                .thenReturn(Optional.of(ProblemDocument.builder().buildProfile("STANDALONE_DSA").build()));
        when(trackRunner.supports(any())).thenReturn(true);
        when(trackRunner.run(eq(1L), any(), any(), eq("java")))
                .thenReturn(ExecutionResultResponse.builder()
                        .status("PASSED")
                        .passedTests(3)
                        .totalTests(3)
                        .executionTimeMs(15.0)
                        .build());

        ExecutionResultResponse response = codeExecutionService.executeCode(1L, request);

        assertNotNull(response);
        assertEquals("PASSED", response.status());
        verify(sessionMongoRepository, never()).findFirstBySessionIdOrderByCreatedAtDesc(any());
        verify(sessionMongoRepository, never()).save(any());
    }

    @Test
    @DisplayName("AC-3.1: executeCode with submit=true must record exactly one CODE_EXECUTION turn with code snapshot")
    void testExecuteCode_whenSubmitTrue_recordsCodeExecutionTurnWithCodeSnapshot() {
        String code = "public class Sol { public int solve() { return 42; } }";
        ExecuteCodeRequest request = new ExecuteCodeRequest(
                "java",
                code,
                "two-sum",
                true
        );

        InterviewSessionDocument sessionDoc = InterviewSessionDocument.builder()
                .sessionId(1L)
                .transcript(new ArrayList<>())
                .build();

        when(questionBankClient.fetchProblemBySlug("two-sum"))
                .thenReturn(Optional.of(ProblemDocument.builder().buildProfile("STANDALONE_DSA").build()));
        when(trackRunner.supports(any())).thenReturn(true);
        when(trackRunner.run(eq(1L), any(), any(), eq("java")))
                .thenReturn(ExecutionResultResponse.builder()
                        .status("PASSED")
                        .passedTests(5)
                        .totalTests(5)
                        .executionTimeMs(24.5)
                        .build());
        when(sessionMongoRepository.findFirstBySessionIdOrderByCreatedAtDesc(1L))
                .thenReturn(Optional.of(sessionDoc));

        ExecutionResultResponse response = codeExecutionService.executeCode(1L, request);

        assertNotNull(response);
        assertEquals("PASSED", response.status());

        ArgumentCaptor<InterviewSessionDocument> captor = ArgumentCaptor.forClass(InterviewSessionDocument.class);
        verify(sessionMongoRepository, times(1)).save(captor.capture());

        InterviewSessionDocument saved = captor.getValue();
        assertEquals(1, saved.getTranscript().size());
        InterviewSessionDocument.TranscriptTurn turn = saved.getTranscript().get(0);
        assertEquals("CODE_EXECUTION", turn.getMessageType());
        assertEquals("CANDIDATE", turn.getSenderRole());
        assertEquals(code, turn.getCodeSnippet());
        assertTrue(turn.getContent().contains("5/5 tests passed"));
    }

    @Test
    @DisplayName("AC-3.3: executeCode with submit=true and ENGINE_UNAVAILABLE records ENGINE_ERROR notice")
    void testExecuteCode_whenSubmitTrueAndEngineUnavailable_recordsEngineErrorTurn() {
        ExecuteCodeRequest request = new ExecuteCodeRequest(
                "java",
                "int x = 1;",
                "two-sum",
                true
        );

        InterviewSessionDocument sessionDoc = InterviewSessionDocument.builder()
                .sessionId(1L)
                .transcript(new ArrayList<>())
                .build();

        when(questionBankClient.fetchProblemBySlug("two-sum"))
                .thenReturn(Optional.of(ProblemDocument.builder().buildProfile("STANDALONE_DSA").build()));
        when(trackRunner.supports(any())).thenReturn(true);
        when(trackRunner.run(eq(1L), any(), any(), eq("java")))
                .thenReturn(ExecutionResultResponse.builder()
                        .status("ENGINE_UNAVAILABLE")
                        .passedTests(0)
                        .totalTests(0)
                        .executionTimeMs(0.0)
                        .stderr("Docker daemon unreachable")
                        .build());
        when(sessionMongoRepository.findFirstBySessionIdOrderByCreatedAtDesc(1L))
                .thenReturn(Optional.of(sessionDoc));

        ExecutionResultResponse response = codeExecutionService.executeCode(1L, request);

        assertNotNull(response);
        assertEquals("ENGINE_UNAVAILABLE", response.status());

        ArgumentCaptor<InterviewSessionDocument> captor = ArgumentCaptor.forClass(InterviewSessionDocument.class);
        verify(sessionMongoRepository, times(1)).save(captor.capture());

        InterviewSessionDocument saved = captor.getValue();
        assertEquals(1, saved.getTranscript().size());
        InterviewSessionDocument.TranscriptTurn turn = saved.getTranscript().get(0);
        assertEquals("ENGINE_ERROR", turn.getMessageType());
        assertEquals("SYSTEM", turn.getSenderRole());
        assertTrue(turn.getContent().contains("ENGINE_UNAVAILABLE"));
    }

    @Test
    @DisplayName("AC-3.1: executeProject with submit=false must NOT record a turn in transcript")
    void testExecuteProject_whenSubmitFalse_doesNotRecordSessionMessage() {
        ExecuteProjectRequest request = new ExecuteProjectRequest(
                "lld-order-service",
                Map.of("Service.java", "class Service {}"),
                "inline",
                null,
                false
        );

        when(questionBankClient.fetchProblemBySlug("lld-order-service"))
                .thenReturn(Optional.of(ProblemDocument.builder().buildProfile("MULTI_FILE_PROJECT").build()));
        when(trackRunner.supports(any())).thenReturn(true);
        when(trackRunner.run(eq(1L), any(), any()))
                .thenReturn(ExecutionResultResponse.builder()
                        .status("PASSED")
                        .passedTests(4)
                        .totalTests(4)
                        .build());

        ExecutionResultResponse response = codeExecutionService.executeProject(1L, request);

        assertNotNull(response);
        verify(sessionMongoRepository, never()).findFirstBySessionIdOrderByCreatedAtDesc(any());
        verify(sessionMongoRepository, never()).save(any());
    }
}
