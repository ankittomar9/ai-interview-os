package com.interviewos.session.runner;

import com.github.dockerjava.api.DockerClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class LldMavenRunnerTest {

    @Test
    @DisplayName("supports() should return true for maven-spring and maven-workspace buildProfile")
    void testSupports() {
        LldMavenRunner runner = new LldMavenRunner();

        ProblemDocument mavenProblem = ProblemDocument.builder()
                .buildProfile("maven-spring")
                .build();
        assertTrue(runner.supports(mavenProblem));

        ProblemDocument workspaceProblem = ProblemDocument.builder()
                .buildProfile("maven-workspace")
                .build();
        assertTrue(runner.supports(workspaceProblem));

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
        assertEquals(0, response.droppedWriteCount());
    }

    // ---------------------------------------------------------------------------------
    // V8-01 (SPEC V-2.0.8): editablePaths whitelist policy + staging observability.
    // ---------------------------------------------------------------------------------

    @Test
    @DisplayName("V8-01: isEditablePath matches exact paths and non-empty /** directory prefixes, fail-closed")
    void testIsEditablePathPolicy() {
        Set<String> whitelist = Set.of(
                "src/main/java/com/example/atm/service/AtmService.java",
                "src/main/java/com/example/atm/service/impl/**"
        );

        assertTrue(LldMavenRunner.isEditablePath("src/main/java/com/example/atm/service/AtmService.java", whitelist));
        assertTrue(LldMavenRunner.isEditablePath("src/main/java/com/example/atm/service/impl/AtmServiceImpl.java", whitelist));
        assertTrue(LldMavenRunner.isEditablePath("src/main/java/com/example/atm/service/impl/deep/NewFile.java", whitelist));
        assertTrue(LldMavenRunner.isEditablePath("\\src\\main\\java\\com\\example\\atm\\service\\AtmService.java", whitelist));

        // Fail-closed cases
        assertFalse(LldMavenRunner.isEditablePath("src/main/java/com/example/atm/Atm.java", whitelist));
        assertFalse(LldMavenRunner.isEditablePath("src/main/java/com/example/atm/service/Other.java", whitelist));
        assertFalse(LldMavenRunner.isEditablePath("pom.xml", whitelist));
        assertFalse(LldMavenRunner.isEditablePath("src/main/java/com/example/atm/service/impl", whitelist));
        assertFalse(LldMavenRunner.isEditablePath(null, whitelist));
        assertFalse(LldMavenRunner.isEditablePath("src/main/java/com/example/atm/service/AtmService.java", Set.of()));
        assertFalse(LldMavenRunner.isEditablePath("anything/Any.java", Set.of("/**")));
    }

    @Test
    @DisplayName("V8-01: staging writes whitelisted candidate files and hidden tests, drops rogue writes, keeps skeleton intact")
    void testStageWorkspaceFilesWritesWhitelistedAndHiddenAndDropsRogue(@TempDir Path workspace) throws IOException {
        LldMavenRunner runner = new LldMavenRunner();

        ProblemDocument problem = ProblemDocument.builder()
                .problemSlug("lld-atm-system")
                .buildProfile("maven-spring")
                .starterFiles(Map.of(
                        "pom.xml", "<project>skeleton</project>",
                        "src/main/java/com/example/atm/Atm.java", "public class Atm {}",
                        "src/main/java/com/example/atm/service/AtmService.java", "public interface AtmService {}"
                ))
                .editablePaths(List.of(
                        "src/main/java/com/example/atm/service/AtmService.java",
                        "src/main/java/com/example/atm/service/impl/**"
                ))
                .hiddenTestFiles(Map.of(
                        "src/test/java/com/example/atm/AtmServiceTest.java", "class AtmServiceTest {}"
                ))
                .build();

        Map<String, String> candidateFiles = Map.of(
                "src/main/java/com/example/atm/service/AtmService.java", "candidate service implementation",
                "src/main/java/com/example/atm/service/impl/AtmServiceImpl.java", "candidate impl",
                "pom.xml", "<project>rogue-overwrite</project>",
                "src/main/java/com/example/atm/Atm.java", "rogue skeleton overwrite"
        );

        List<String> dropped = runner.stageWorkspaceFiles(workspace, problem, candidateFiles, 42L);

        assertEquals(2, dropped.size());
        assertTrue(dropped.contains("pom.xml"));
        assertTrue(dropped.contains("src/main/java/com/example/atm/Atm.java"));

        assertEquals("candidate service implementation",
                Files.readString(workspace.resolve("src/main/java/com/example/atm/service/AtmService.java")));
        assertEquals("candidate impl",
                Files.readString(workspace.resolve("src/main/java/com/example/atm/service/impl/AtmServiceImpl.java")));
        assertEquals("class AtmServiceTest {}",
                Files.readString(workspace.resolve("src/test/java/com/example/atm/AtmServiceTest.java")));

        // Skeleton files must survive rogue overwrite attempts untouched
        assertEquals("<project>skeleton</project>", Files.readString(workspace.resolve("pom.xml")));
        assertEquals("public class Atm {}", Files.readString(workspace.resolve("src/main/java/com/example/atm/Atm.java")));
    }

    @Test
    @DisplayName("V8-01: run() in fallback mode surfaces droppedWriteCount for whitelisted-only candidates")
    void testRunFallbackSurfacesDroppedWriteCount() {
        LldMavenRunner runner = new LldMavenRunner((DockerClient) null);

        ProblemDocument problem = ProblemDocument.builder()
                .problemSlug("lld-atm-system")
                .buildProfile("maven-spring")
                .starterFiles(Map.of("pom.xml", "<project/>"))
                .editablePaths(List.of("src/main/java/com/example/atm/service/AtmService.java"))
                .sampleTests(List.of(new ProblemDocument.TestCase("Sample 1", "", "")))
                .build();

        Map<String, String> candidateFiles = Map.of(
                "src/main/java/com/example/atm/service/AtmService.java", "candidate impl",
                "pom.xml", "rogue overwrite"
        );

        ExecutionResultResponse response = runner.run(7L, problem, candidateFiles, "java");

        assertEquals("ENGINE_UNAVAILABLE", response.status());
        assertEquals(1, response.droppedWriteCount());
    }
}
