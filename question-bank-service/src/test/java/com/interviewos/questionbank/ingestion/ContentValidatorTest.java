package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ContentValidatorTest {

    private ContentValidator validator;

    @BeforeEach
    void setUp() {
        validator = new ContentValidator();
    }

    @Test
    @DisplayName("Valid DSA question passes validation and marks PUBLISHED")
    void testValidDsaQuestion() {
        QuestionDocument doc = QuestionDocument.builder()
                .slug("dsa-valid-sum")
                .title("Valid Sum")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("MID")
                .problemStatement("Given an array of integers, find the sum of all elements.")
                .solutionCode("public class Main { public static void main(String[] args) {} }")
                .starterCode("public class Main { public static void main(String[] args) {} }")
                .sampleTests(List.of(new QuestionDocument.TestCase("Sample 1", "1 2", "3")))
                .hiddenTests(List.of(new QuestionDocument.HiddenTestCase("Hidden 1", "0 0", "0", 50)))
                .build();

        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertTrue(result.isValid());
        assertEquals("PUBLISHED", result.status());
        assertTrue(result.errors().isEmpty());
    }

    @Test
    @DisplayName("Question with missing solution lands in DRAFT status")
    void testMissingSolutionLandsInDraft() {
        QuestionDocument doc = QuestionDocument.builder()
                .slug("dsa-broken-sum")
                .title("Broken Sum")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("MID")
                .problemStatement("Given an array of integers, find the sum of all elements.")
                .starterCode("public class Main { public static void main(String[] args) {} }")
                .sampleTests(List.of(new QuestionDocument.TestCase("Sample 1", "1 2", "3")))
                .build();

        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertFalse(result.errors().isEmpty());
    }

    @Test
    @DisplayName("DSA question with missing starterCode lands in DRAFT status")
    void testMissingStarterCodeLandsInDraft() {
        QuestionDocument doc = QuestionDocument.builder()
                .slug("dsa-no-starter")
                .title("No Starter")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .difficulty("MID")
                .problemStatement("Given an array of integers, find the sum of all elements.")
                .solutionCode("public class Main { public static void main(String[] args) {} }")
                .sampleTests(List.of(new QuestionDocument.TestCase("Sample 1", "1 2", "3")))
                .hiddenTests(List.of(new QuestionDocument.HiddenTestCase("Hidden 1", "0 0", "0", 50)))
                .build();

        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("starterCode")));
    }

    // --- V8-02 / Gate V8-g1: Workspace Profile Validation Tests ---

    private QuestionDocument.QuestionDocumentBuilder createValidWorkspaceQuestionBuilder() {
        return QuestionDocument.builder()
                .slug("lld-valid-atm")
                .title("Design ATM System")
                .track("SPRING_LLD")
                .difficulty("MID")
                .buildProfile("maven-workspace")
                .problemStatement("Design and implement an ATM banking system with cash dispenser and card reader.")
                .starterFiles(java.util.Map.of(
                        "pom.xml", "<project>...</project>",
                        "src/main/java/com/example/Atm.java", "public class Atm {}"
                ))
                .editablePaths(List.of("src/main/java/com/example/Atm.java"))
                .hiddenTestFiles(java.util.Map.of(
                        "src/test/java/com/example/AtmTest.java", "public class AtmTest {}"
                ));
    }

    @Test
    @DisplayName("V8-02 / V8-g1: Valid workspace question passes validation and marks PUBLISHED")
    void testValidWorkspaceQuestionPassesValidation() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder().build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertTrue(result.isValid(), "Valid workspace question must pass: " + result.errors());
        assertEquals("PUBLISHED", result.status());
        assertTrue(result.errors().isEmpty());
    }

    @Test
    @DisplayName("V8-02 / V8-g1 Negative: Workspace question missing starterFiles fails validation")
    void testWorkspaceMissingStarterFilesFails() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .starterFiles(null)
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("requires non-empty starterFiles")));
    }

    @Test
    @DisplayName("V8-02 / V8-g1 Negative: Workspace question starterFiles missing pom.xml fails validation")
    void testWorkspaceMissingPomXmlFails() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .starterFiles(java.util.Map.of("README.md", "# ATM"))
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("must contain 'pom.xml'")));
    }

    @Test
    @DisplayName("V8-02 / V8-g1 Negative: Workspace question missing editablePaths fails validation")
    void testWorkspaceMissingEditablePathsFails() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .editablePaths(null)
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("requires non-empty editablePaths")));
    }

    @Test
    @DisplayName("V8-02 / V8-g1 Negative: Workspace editablePaths entry not matching starterFiles and not /** prefix fails")
    void testWorkspaceInvalidEditablePathFails() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .editablePaths(List.of("src/main/java/UnknownService.java"))
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("does not match any starterFiles path")));
    }

    @Test
    @DisplayName("V8-02 / V8-g1 Positive: Workspace editablePaths with /** directory prefix passes validation")
    void testWorkspaceDirectoryPrefixEditablePathPasses() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .editablePaths(List.of("src/main/java/com/example/**"))
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertTrue(result.isValid(), "Directory prefix '/**' in editablePaths must pass: " + result.errors());
        assertEquals("PUBLISHED", result.status());
    }

    @Test
    @DisplayName("V8-02 / V8-g1 Negative: Workspace question missing hiddenTestFiles fails validation")
    void testWorkspaceMissingHiddenTestFilesFails() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .hiddenTestFiles(null)
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("requires non-empty hiddenTestFiles")));
    }

    @Test
    @DisplayName("V8-02 / V8-g1 Negative: Workspace question with hiddenTestFiles outside src/test/java/ fails")
    void testWorkspaceHiddenTestFilesNotInSrcTestJavaFails() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .hiddenTestFiles(java.util.Map.of("tests/AtmTest.java", "class AtmTest {}"))
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("must be located under 'src/test/java/'")));
    }

    @Test
    @DisplayName("V8-05 / V8-g5 Negative: SPRING_LLD question with non-maven-workspace buildProfile fails")
    void testWorkspaceSpringLldMismatchedBuildProfileFails() {
        QuestionDocument doc = createValidWorkspaceQuestionBuilder()
                .track("SPRING_LLD")
                .buildProfile("judge0")
                .build();
        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertTrue(result.errors().stream().anyMatch(e -> e.contains("Track SPRING_LLD requires buildProfile 'maven-workspace'")));
    }
}

