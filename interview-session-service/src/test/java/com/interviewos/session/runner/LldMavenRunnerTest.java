package com.interviewos.session.runner;

import com.github.dockerjava.api.DockerClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class LldMavenRunnerTest {

    @Test
    @DisplayName("supports() should return true only for maven-spring buildProfile")
    void testSupports() {
        LldMavenRunner runner = new LldMavenRunner();

        ProblemDocument mavenProblem = ProblemDocument.builder()
                .buildProfile("maven-spring")
                .build();
        assertTrue(runner.supports(mavenProblem));

        ProblemDocument judgeProblem = ProblemDocument.builder()
                .buildProfile("judge0")
                .build();
        assertFalse(runner.supports(judgeProblem));
    }

    @Test
    @DisplayName("parseExecutionOutput should parse successful maven test logs with Surefire reports")
    void testParseExecutionOutputSuccess() {
        LldMavenRunner runner = new LldMavenRunner();

        String rawOutput = """
                [INFO] Scanning for projects...
                [INFO] Running com.example.orderservice.OrderServiceIntegrationTest
                [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
                [INFO] BUILD SUCCESS
                MVN_EXIT:0
                ===SUREFIRE_START
                ===FILE:target/surefire-reports/TEST-com.example.orderservice.OrderServiceIntegrationTest.xml
                <?xml version="1.0" encoding="UTF-8"?>
                <testsuite name="com.example.orderservice.OrderServiceIntegrationTest" time="0.50" tests="2" errors="0" skipped="0" failures="0">
                    <testcase name="testCreateOrderPersistsWithCreatedStatus()" classname="com.example.orderservice.OrderServiceIntegrationTest" time="0.30"/>
                    <testcase name="testDeleteExistingOrderTrue()" classname="com.example.orderservice.OrderServiceIntegrationTest" time="0.20"/>
                </testsuite>
                ===SUREFIRE_END
                """;

        ExecutionResultResponse response = runner.parseExecutionOutput(rawOutput);

        assertEquals("PASSED", response.status());
        assertEquals(2, response.totalTests());
        assertEquals(2, response.passedTests());
        assertEquals(500.0, response.executionTimeMs());
        assertEquals(2, response.testResults().size());
        assertEquals("PASS", response.testResults().get(0).status());
    }

    @Test
    @DisplayName("parseExecutionOutput should identify COMPILE_ERROR on non-zero exit code without tests")
    void testParseExecutionOutputCompileError() {
        LldMavenRunner runner = new LldMavenRunner();

        String rawOutput = """
                [INFO] -------------------------------------------------------------
                [ERROR] COMPILATION ERROR : 
                [INFO] -------------------------------------------------------------
                [ERROR] /workspace/src/main/java/com/example/orderservice/service/OrderService.java:[15,30] cannot find symbol
                  symbol:   class NonExistent
                [INFO] 1 error
                [INFO] BUILD FAILURE
                MVN_EXIT:1
                ===SUREFIRE_START
                ===SUREFIRE_END
                """;

        ExecutionResultResponse response = runner.parseExecutionOutput(rawOutput);

        assertEquals("COMPILE_ERROR", response.status());
        assertEquals(0, response.totalTests());
        assertEquals(0, response.passedTests());
        assertTrue(response.compilerOutput().contains("COMPILATION ERROR"));
    }

    @Test
    @DisplayName("run() in fallback mode should return honest ENGINE_UNAVAILABLE status when Docker is missing")
    void testFallbackExecution() {
        LldMavenRunner runner = new LldMavenRunner((DockerClient) null); // Explicitly null Docker client -> fallback mode

        ProblemDocument problem = ProblemDocument.builder()
                .problemSlug("lld-order-service")
                .buildProfile("maven-spring")
                .starterFiles(Map.of("pom.xml", "<project></project>"))
                .editablePaths(List.of("src/main/java/com/example/orderservice/service/OrderService.java"))
                .sampleTests(List.of(new ProblemDocument.TestCase("Sample 1", "", "")))
                .build();

        Map<String, String> candidateFiles = Map.of(
                "src/main/java/com/example/orderservice/service/OrderService.java",
                "package com.example.orderservice.service;\npublic class OrderService {\n// TODO: implement\n}"
        );

        ExecutionResultResponse response = runner.run(1L, problem, candidateFiles, "java");

        assertNotNull(response);
        assertEquals("ENGINE_UNAVAILABLE", response.status());
        assertEquals(1, response.totalTests());
        assertEquals(0, response.passedTests());
        assertTrue(response.stderr().contains("Docker daemon unavailable"));
    }
}
