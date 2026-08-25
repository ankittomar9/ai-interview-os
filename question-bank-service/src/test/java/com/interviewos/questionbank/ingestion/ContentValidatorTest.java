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
                .sampleTests(List.of(new QuestionDocument.TestCase("Sample 1", "1 2", "3")))
                .build();

        ContentValidator.ValidationResult result = validator.validate(doc, "markdown");

        assertFalse(result.isValid());
        assertEquals("DRAFT", result.status());
        assertFalse(result.errors().isEmpty());
    }
}
