package com.interviewos.session.runner;

import com.interviewos.session.sandbox.document.ProblemDocument;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DsaJudge0RunnerTest {

    @Test
    @DisplayName("resolveLanguageId should correctly map language strings to Judge0 language IDs")
    void testResolveLanguageId() {
        DsaJudge0Runner runner = new DsaJudge0Runner(null);

        assertEquals(62, runner.resolveLanguageId("java"));
        assertEquals(62, runner.resolveLanguageId("Java"));
        assertEquals(62, runner.resolveLanguageId(null));

        assertEquals(71, runner.resolveLanguageId("python"));
        assertEquals(71, runner.resolveLanguageId("python3"));
        assertEquals(71, runner.resolveLanguageId("py"));

        assertEquals(63, runner.resolveLanguageId("javascript"));
        assertEquals(63, runner.resolveLanguageId("js"));
        assertEquals(63, runner.resolveLanguageId("node"));

        assertEquals(54, runner.resolveLanguageId("cpp"));
        assertEquals(54, runner.resolveLanguageId("c++"));

        assertEquals(50, runner.resolveLanguageId("c"));
    }

    @Test
    @DisplayName("supports() should return true for standard Judge0 problems")
    void testSupports() {
        DsaJudge0Runner runner = new DsaJudge0Runner(null);

        ProblemDocument dsaProblem = ProblemDocument.builder()
                .buildProfile("judge0")
                .build();
        assertTrue(runner.supports(dsaProblem));

        ProblemDocument nullProfile = ProblemDocument.builder().build();
        assertTrue(runner.supports(nullProfile));

        ProblemDocument mavenProblem = ProblemDocument.builder()
                .buildProfile("maven-spring")
                .build();
        assertFalse(runner.supports(mavenProblem));
    }

    @Test
    @DisplayName("run() recovers after transient failure on attempt 2")
    void testTransientRetryRecovery() {
        com.interviewos.session.sandbox.client.Judge0Client mockClient = org.mockito.Mockito.mock(com.interviewos.session.sandbox.client.Judge0Client.class);
        DsaJudge0Runner runner = new DsaJudge0Runner(mockClient);

        com.interviewos.session.sandbox.client.Judge0Client.Judge0SubmissionResponse successResp =
                new com.interviewos.session.sandbox.client.Judge0Client.Judge0SubmissionResponse(
                        "stdout output\n", null, null, null,
                        "0.05", 12000.0,
                        new com.interviewos.session.sandbox.client.Judge0Client.Judge0Status(3, "Accepted")
                );

        // First attempt fails (empty), second attempt succeeds
        org.mockito.Mockito.when(mockClient.submitAndAwait(org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.Optional.empty())
                .thenReturn(java.util.Optional.of(successResp));

        ProblemDocument problem = ProblemDocument.builder()
                .problemSlug("test-problem")
                .limits(new ProblemDocument.ExecutionLimits(128, 2000))
                .sampleTests(java.util.List.of(new ProblemDocument.TestCase("Sample 1", "5", "stdout output")))
                .build();

        com.interviewos.session.sandbox.dto.ExecutionResultResponse result =
                runner.run(1L, problem, java.util.Map.of("solution.java", "class Main {}"), "java");

        assertNotNull(result);
        assertEquals("PASSED", result.status());
        assertEquals(1, result.passedTests());
        org.mockito.Mockito.verify(mockClient, org.mockito.Mockito.times(2)).submitAndAwait(org.mockito.ArgumentMatchers.any());
    }

    @Test
    @DisplayName("run() marks ENGINE_UNAVAILABLE after 3 failed retry attempts")
    void testRetryExhaustionMarksEngineUnavailable() {
        com.interviewos.session.sandbox.client.Judge0Client mockClient = org.mockito.Mockito.mock(com.interviewos.session.sandbox.client.Judge0Client.class);
        DsaJudge0Runner runner = new DsaJudge0Runner(mockClient);

        // All 3 attempts fail
        org.mockito.Mockito.when(mockClient.submitAndAwait(org.mockito.ArgumentMatchers.any()))
                .thenReturn(java.util.Optional.empty());

        ProblemDocument problem = ProblemDocument.builder()
                .problemSlug("test-problem")
                .limits(new ProblemDocument.ExecutionLimits(128, 2000))
                .sampleTests(java.util.List.of(new ProblemDocument.TestCase("Sample 1", "5", "5")))
                .build();

        com.interviewos.session.sandbox.dto.ExecutionResultResponse result =
                runner.run(1L, problem, java.util.Map.of("solution.java", "class Main {}"), "java");

        assertNotNull(result);
        assertEquals("ENGINE_UNAVAILABLE", result.status());
        assertTrue(result.stderr().contains("unreachable after 3 attempts"));
        org.mockito.Mockito.verify(mockClient, org.mockito.Mockito.times(3)).submitAndAwait(org.mockito.ArgumentMatchers.any());
    }
}
