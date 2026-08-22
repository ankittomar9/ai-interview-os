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
}
