package com.interviewos.session.runner;

import com.github.dockerjava.api.DockerClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SqlPostgresRunnerTest {

    @Test
    @DisplayName("Supports only sql-postgres build profile")
    void testSupports() {
        SqlPostgresRunner runner = new SqlPostgresRunner();

        ProblemDocument sqlProblem = ProblemDocument.builder()
                .buildProfile("sql-postgres")
                .build();
        assertTrue(runner.supports(sqlProblem));

        ProblemDocument dsaProblem = ProblemDocument.builder()
                .buildProfile("judge0")
                .build();
        assertFalse(runner.supports(dsaProblem));

        ProblemDocument lldProblem = ProblemDocument.builder()
                .buildProfile("maven-spring")
                .build();
        assertFalse(runner.supports(lldProblem));
    }

    @Test
    @DisplayName("Empty candidate query returns SYNTAX_ERROR status")
    void testEmptyQueryReturnsSyntaxError() {
        DockerClient mockDocker = Mockito.mock(DockerClient.class);
        SqlPostgresRunner runner = new SqlPostgresRunner(mockDocker);

        ProblemDocument problem = ProblemDocument.builder()
                .problemSlug("sql-test")
                .buildProfile("sql-postgres")
                .build();

        ExecutionResultResponse result = runner.run(101L, problem, Map.of("solution.sql", "   "));
        assertEquals("SYNTAX_ERROR", result.status());
        assertEquals(0, result.passedTests());
        assertTrue(result.stderr().contains("empty") || result.stderr().contains("No SQL"));
    }
}
