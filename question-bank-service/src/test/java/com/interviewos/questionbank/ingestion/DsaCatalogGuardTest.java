package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class DsaCatalogGuardTest {

    private QuestionMarkdownParser parser;
    private ContentValidator validator;

    @BeforeEach
    void setUp() {
        parser = new QuestionMarkdownParser();
        validator = new ContentValidator();
    }

    @Test
    @DisplayName("Assert DSA catalog has >= 300 questions and 100% pass content validation")
    void testDsaCatalogIntegrityAndGuards() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        var dsaResources = resolver.getResources("classpath*:content/questions/dsa/*.md");

        assertTrue(dsaResources.length >= 300,
                "Expected at least 300 DSA questions in catalog, but found: " + dsaResources.length);

        Set<String> seenSlugs = new HashSet<>();
        Set<String> validDifficulties = Set.of("JUNIOR", "MID", "SENIOR", "STAFF");

        for (var res : dsaResources) {
            String filename = res.getFilename() != null ? res.getFilename() : "unknown.md";
            String content = new String(res.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            QuestionDocument doc = parser.parse(content, filename);
            assertNotNull(doc, "Parsed doc cannot be null for " + filename);

            String slug = doc.getSlug();
            assertNotNull(slug, "Slug cannot be null for " + filename);
            assertFalse(seenSlugs.contains(slug), "Duplicate slug found in catalog: " + slug);
            seenSlugs.add(slug);

            assertEquals("ALGORITHMS_DATA_STRUCTURES", doc.getTrack(),
                    "Question '" + slug + "' must have track ALGORITHMS_DATA_STRUCTURES");

            assertTrue(validDifficulties.contains(doc.getDifficulty()),
                    "Question '" + slug + "' has invalid difficulty: " + doc.getDifficulty());

            assertNotNull(doc.getStarterCode(), "Question '" + slug + "' missing starterCode");
            assertFalse(doc.getStarterCode().trim().isEmpty(), "Question '" + slug + "' starterCode is empty");

            assertNotNull(doc.getSolutionCode(), "Question '" + slug + "' missing solutionCode");
            assertFalse(doc.getSolutionCode().trim().isEmpty(), "Question '" + slug + "' solutionCode is empty");
            assertTrue(doc.getSolutionCode().contains("class Main"),
                    "Question '" + slug + "' solutionCode must declare class Main");

            int sampleCount = doc.getSampleTests() != null ? doc.getSampleTests().size() : 0;
            int hiddenCount = doc.getHiddenTests() != null ? doc.getHiddenTests().size() : 0;

            assertTrue(sampleCount >= 1,
                    "Question '" + slug + "' must have at least 1 sample test, found: " + sampleCount);
            assertTrue(hiddenCount >= 1,
                    "Question '" + slug + "' must have at least 1 hidden test, found: " + hiddenCount);
            assertTrue(sampleCount + hiddenCount >= 2,
                    "Question '" + slug + "' must have at least 2 total tests, found: " + (sampleCount + hiddenCount));

            ContentValidator.ValidationResult valResult = validator.validate(doc, content);
            assertTrue(valResult.isValid(),
                    "Question '" + slug + "' failed ContentValidator: " + valResult.errors());
            assertEquals("PUBLISHED", doc.getStatus(),
                    "Question '" + slug + "' should be PUBLISHED in document");
            assertEquals("PUBLISHED", valResult.status(),
                    "Question '" + slug + "' should be marked PUBLISHED by ContentValidator");
        }

        assertTrue(seenSlugs.size() >= 300,
                "Expected at least 300 unique DSA slugs, found: " + seenSlugs.size());
    }
}
