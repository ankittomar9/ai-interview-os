package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
        var taxonomyRes = resolver.getResource("classpath:content/questions/_taxonomy.yaml");
        assertTrue(taxonomyRes.exists(), "_taxonomy.yaml must exist");
        String taxonomyContent = new String(taxonomyRes.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        Set<String> validTopics = new HashSet<>();
        for (String line : taxonomyContent.split("\\R")) {
            line = line.trim();
            if (line.startsWith("- id:")) {
                validTopics.add(line.substring("- id:".length()).trim());
            }
        }
        assertFalse(validTopics.isEmpty(), "Taxonomy topics must not be empty");

        var dsaResources = resolver.getResources("classpath*:content/questions/dsa/*.md");

        assertTrue(dsaResources.length >= 300,
                "Expected at least 300 DSA questions in catalog, but found: " + dsaResources.length);

        Set<String> seenSlugs = new HashSet<>();
        Set<String> validDifficulties = Set.of("EASY", "MEDIUM", "HARD");

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

            assertNotNull(doc.getTopics(), "Question '" + slug + "' missing topics list");
            assertFalse(doc.getTopics().isEmpty(), "Question '" + slug + "' must have at least 1 topic");
            for (String t : doc.getTopics()) {
                assertTrue(validTopics.contains(t), "Question '" + slug + "' has topic '" + t + "' not in _taxonomy.yaml");
            }

            assertNotNull(doc.getEstMinutes(), "Question '" + slug + "' missing est_minutes");
            assertTrue(doc.getEstMinutes() > 0, "Question '" + slug + "' est_minutes must be > 0, found: " + doc.getEstMinutes());

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

    @Test
    @DisplayName("Assert all catalog questions parse without error, are PUBLISHED, and satisfy track floors")
    void testAllCatalogQuestionsParseAndPublish() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        var allResources = resolver.getResources("classpath*:content/questions/**/*.md");

        assertTrue(allResources.length >= 397,
                "Expected at least 397 total questions in catalog, but found: " + allResources.length);

        Set<String> allSlugs = new HashSet<>();
        int publishedCount = 0;
        Map<String, Integer> familyCounts = new HashMap<>();
        Map<String, Map<String, Integer>> difficultyCounts = new HashMap<>();

        for (var res : allResources) {
            String filename = res.getFilename() != null ? res.getFilename() : "unknown.md";
            String content = new String(res.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            QuestionDocument doc = parser.parse(content, filename);
            assertNotNull(doc, "Parsed doc cannot be null for " + filename);
            assertNotNull(doc.getSlug(), "Slug cannot be null for " + filename);
            assertFalse(allSlugs.contains(doc.getSlug()), "Duplicate slug in catalog: " + doc.getSlug());
            allSlugs.add(doc.getSlug());

            ContentValidator.ValidationResult valResult = validator.validate(doc, content);
            assertTrue(valResult.isValid(),
                    "Question '" + doc.getSlug() + "' failed ContentValidator: " + valResult.errors());
            assertEquals("PUBLISHED", doc.getStatus(),
                    "Question '" + doc.getSlug() + "' must be PUBLISHED");
            publishedCount++;

            String uriStr = res.getURI().toString().replace('\\', '/');
            String family = "dsa";
            if (uriStr.contains("/content/questions/hld/")) family = "hld";
            else if (uriStr.contains("/content/questions/lld/")) family = "lld";
            else if (uriStr.contains("/content/questions/sql/")) family = "sql";
            else if (uriStr.contains("/content/questions/behavioral/")) family = "behavioral";

            familyCounts.put(family, familyCounts.getOrDefault(family, 0) + 1);

            String diff = doc.getDifficulty() != null ? doc.getDifficulty().toUpperCase() : "UNKNOWN";
            difficultyCounts.computeIfAbsent(family, k -> new HashMap<>()).merge(diff, 1, Integer::sum);
        }

        assertEquals(allResources.length, publishedCount, "All questions must be PUBLISHED (ratio = 1.0)");

        // Assert RED track floors (current counts baseline per SPEC-016 §3)
        Map<String, Integer> trackFloors = Map.of(
                "dsa", 341,
                "hld", 27,
                "lld", 19,
                "sql", 8,
                "behavioral", 2
        );

        trackFloors.forEach((track, floor) -> {
            int actual = familyCounts.getOrDefault(track, 0);
            assertTrue(actual >= floor,
                    String.format("Track '%s' floor violation: expected at least %d questions, but found %d", track, floor, actual));
        });

        // Starvation alarms (documented soft warnings per SPEC-016 §3)
        difficultyCounts.forEach((fam, diffs) -> {
            for (String level : List.of("EASY", "MEDIUM", "HARD")) {
                int count = diffs.getOrDefault(level, 0);
                if (count == 0) {
                    System.out.printf("[STARVATION_ALARM] Track family '%s' currently has 0 %s questions%n", fam, level);
                }
            }
        });
    }
}
