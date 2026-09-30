package com.interviewos.session.workspace.service;

import com.interviewos.session.repository.InterviewSessionRepository;
import com.interviewos.session.sandbox.client.QuestionBankClient;
import com.interviewos.session.sandbox.document.ProblemDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WorkspaceProvisionerServiceTest {

    @Mock
    private QuestionBankClient questionBankClient;

    @Mock
    private GridFsTemplate gridFsTemplate;

    @Mock
    private InterviewSessionRepository sessionRepository;

    private WorkspaceProvisionerService service;

    @BeforeEach
    void setUp() {
        service = new WorkspaceProvisionerService(questionBankClient, gridFsTemplate, sessionRepository);
    }

    @Test
    @DisplayName("V8-06: resolveStarterFiles returns problem starter files when present")
    void testResolveStarterFilesWithExistingStarterFiles() {
        Map<String, String> expectedFiles = Map.of(
                "pom.xml", "<project>...</project>",
                "src/main/java/App.java", "public class App {}"
        );
        ProblemDocument doc = ProblemDocument.builder()
                .problemSlug("lld-parking-lot")
                .starterFiles(expectedFiles)
                .build();

        when(questionBankClient.fetchProblemBySlug("lld-parking-lot")).thenReturn(Optional.of(doc));

        Map<String, String> result = service.resolveStarterFiles("lld-parking-lot");
        assertEquals(expectedFiles, result);
        assertFalse(result.isEmpty());
    }

    @Test
    @DisplayName("V8-06: resolveStarterFiles returns fallback scaffold when starter files are empty")
    void testResolveStarterFilesWhenProblemHasEmptyStarterFiles() {
        ProblemDocument doc = ProblemDocument.builder()
                .problemSlug("lld-empty-question")
                .starterFiles(Map.of())
                .build();

        when(questionBankClient.fetchProblemBySlug("lld-empty-question")).thenReturn(Optional.of(doc));

        Map<String, String> result = service.resolveStarterFiles("lld-empty-question");
        assertNotNull(result);
        assertFalse(result.isEmpty(), "Starter files must never be empty");
        assertTrue(result.containsKey("pom.xml"), "Fallback must include pom.xml");
        assertTrue(result.containsKey("README.md"), "Fallback must include README.md");
        assertTrue(result.containsKey("src/main/java/com/interviewos/workspace/Solution.java"),
                "Fallback must include Solution.java");
        assertTrue(result.get("pom.xml").contains("<release>21</release>"));
    }

    @Test
    @DisplayName("V8-06: resolveStarterFiles returns fallback scaffold when problem not found")
    void testResolveStarterFilesWhenProblemNotFound() {
        when(questionBankClient.fetchProblemBySlug("non-existent-slug")).thenReturn(Optional.empty());

        Map<String, String> result = service.resolveStarterFiles("non-existent-slug");
        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertTrue(result.containsKey("pom.xml"));
        assertTrue(result.containsKey("README.md"));
        assertTrue(result.containsKey("src/main/java/com/interviewos/workspace/Solution.java"));
    }

    @Test
    @DisplayName("V8-06: resolveStarterFiles returns fallback scaffold when slug is null or blank")
    void testResolveStarterFilesWhenSlugIsNullOrBlank() {
        Map<String, String> resultNull = service.resolveStarterFiles(null);
        assertNotNull(resultNull);
        assertFalse(resultNull.isEmpty());
        assertTrue(resultNull.containsKey("pom.xml"));

        Map<String, String> resultBlank = service.resolveStarterFiles("   ");
        assertNotNull(resultBlank);
        assertFalse(resultBlank.isEmpty());
        assertTrue(resultBlank.containsKey("pom.xml"));
    }

    @Test
    @DisplayName("V8-06: resolveStarterFiles returns fallback scaffold when QuestionBankClient throws")
    void testResolveStarterFilesWhenClientThrowsException() {
        when(questionBankClient.fetchProblemBySlug("error-slug")).thenThrow(new RuntimeException("Connection refused"));

        Map<String, String> result = service.resolveStarterFiles("error-slug");
        assertNotNull(result);
        assertFalse(result.isEmpty());
        assertTrue(result.containsKey("pom.xml"));
        assertTrue(result.containsKey("README.md"));
        assertTrue(result.containsKey("src/main/java/com/interviewos/workspace/Solution.java"));
    }

    @Test
    @DisplayName("V8-06: createFallbackScaffold produces complete valid Java 21 project structure")
    void testCreateFallbackScaffoldStructure() {
        Map<String, String> fallback = service.createFallbackScaffold("custom-test-slug");
        assertNotNull(fallback);
        assertEquals(3, fallback.size());

        String pom = fallback.get("pom.xml");
        assertNotNull(pom);
        assertTrue(pom.contains("<groupId>com.interviewos.workspace</groupId>"));
        assertTrue(pom.contains("<artifactId>workspace-solution</artifactId>"));
        assertTrue(pom.contains("<release>21</release>"));
        assertTrue(pom.contains("junit-jupiter"));

        String readme = fallback.get("README.md");
        assertNotNull(readme);
        assertTrue(readme.contains("custom-test-slug"));

        String solution = fallback.get("src/main/java/com/interviewos/workspace/Solution.java");
        assertNotNull(solution);
        assertTrue(solution.contains("package com.interviewos.workspace;"));
        assertTrue(solution.contains("public class Solution"));
    }
}
