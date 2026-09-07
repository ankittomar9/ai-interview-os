package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class QuestionMarkdownParserTest {

    private QuestionMarkdownParser parser;

    @BeforeEach
    void setUp() {
        parser = new QuestionMarkdownParser();
    }

    @Test
    @DisplayName("Parse valid DSA markdown with sample and hidden tests")
    void testParseValidDsaMarkdown() {
        String md = """
                ---
                slug: dsa-test-two-sum
                title: Two Sum Test
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: MID
                tags: [arrays, two-pointers]
                buildProfile: judge0
                source: inspired-by:academy/two-sum
                status: PUBLISHED
                sampleTests:
                  - name: "Sample 1"
                    input: "4 9\\n2 7 11 15"
                    expectedOutput: "0 1"
                hiddenTests:
                  - name: "Hidden 1"
                    input: "2 6\\n3 3"
                    expectedOutput: "0 1"
                    weight: 50
                hints:
                  - "Use a hash map."
                solutionCode: |
                  public class Main {
                      public static void main(String[] args) {}
                  }
                ---
                ### Problem Statement
                Find two indices that sum to target.
                """;

        QuestionDocument doc = parser.parse(md, "test.md");

        assertNotNull(doc);
        assertEquals("dsa-test-two-sum", doc.getSlug());
        assertEquals("Two Sum Test", doc.getTitle());
        assertEquals("ALGORITHMS_DATA_STRUCTURES", doc.getTrack());
        assertEquals("MID", doc.getDifficulty());
        assertEquals(1, doc.getSampleTests().size());
        assertEquals("Sample 1", doc.getSampleTests().get(0).name());
        assertEquals(1, doc.getHiddenTests().size());
        assertEquals(50, doc.getHiddenTests().get(0).weight());
        assertEquals(1, doc.getHints().size());
        assertNotNull(doc.getSolutionCode());
        assertTrue(doc.getProblemStatement().contains("Find two indices"));
    }

    @Test
    @DisplayName("Parse valid SQL markdown with setup and solution SQL")
    void testParseValidSqlMarkdown() {
        String md = """
                ---
                slug: sql-test-cohorts
                title: Customer Cohorts Test
                track: SQL
                difficulty: SENIOR
                buildProfile: sql-postgres
                setupSql: |
                  CREATE TABLE users (id INT);
                expectedCsv: |
                  month,count
                  2026-01,5
                ordered: true
                solutionSql: |
                  SELECT * FROM users;
                ---
                ### Cohorts Analysis
                Write a query for customer cohorts.
                """;

        QuestionDocument doc = parser.parse(md, "sql-test.md");

        assertNotNull(doc);
        assertEquals("sql-test-cohorts", doc.getSlug());
        assertEquals("SQL", doc.getTrack());
        assertTrue(doc.isOrdered());
        assertNotNull(doc.getSetupSql());
        assertNotNull(doc.getSolutionSql());
        assertNotNull(doc.getExpectedCsv());
    }

    @Test
    @DisplayName("Throw exception on invalid frontmatter")
    void testInvalidFrontmatterThrows() {
        String md = "No frontmatter at all";
        assertThrows(IllegalArgumentException.class, () -> parser.parse(md, "invalid.md"));
    }

    @Test
    @DisplayName("Canary: Parse and validate HLD and LLD ingested questions from classpath")
    void testParseCanaryQuestions() throws Exception {
        ContentValidator validator = new ContentValidator();
        var resolver = new org.springframework.core.io.support.PathMatchingResourcePatternResolver();

        // 1. Canary HLD
        var hldRes = resolver.getResource("classpath:content/questions/hld/hld-consistent-hashing.md");
        assertTrue(hldRes.exists(), "Canary HLD question file must exist on classpath");
        String hldContent = new String(hldRes.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        QuestionDocument hldDoc = parser.parse(hldContent, "hld-consistent-hashing.md");
        assertNotNull(hldDoc);
        assertEquals("hld-consistent-hashing", hldDoc.getSlug());
        assertEquals("SYSTEM_DESIGN", hldDoc.getTrack());
        assertEquals("MID", hldDoc.getDifficulty());
        var hldVal = validator.validate(hldDoc, hldContent);
        assertTrue(hldVal.isValid(), "Canary HLD must pass ContentValidator: " + hldVal.errors());
        assertEquals("PUBLISHED", hldVal.status());

        // 2. Canary LLD
        var lldRes = resolver.getResource("classpath:content/questions/lld/lld-parking-lot.md");
        assertTrue(lldRes.exists(), "Canary LLD question file must exist on classpath");
        String lldContent = new String(lldRes.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        QuestionDocument lldDoc = parser.parse(lldContent, "lld-parking-lot.md");
        assertNotNull(lldDoc);
        assertEquals("lld-parking-lot", lldDoc.getSlug());
        assertEquals("SPRING_LLD", lldDoc.getTrack());
        assertEquals("MID", lldDoc.getDifficulty());
        assertNotNull(lldDoc.getStarterCode(), "LLD requires starterCode");
        assertNotNull(lldDoc.getSolutionCode(), "LLD requires solutionCode");
        var lldVal = validator.validate(lldDoc, lldContent);
        assertTrue(lldVal.isValid(), "Canary LLD must pass ContentValidator: " + lldVal.errors());
        assertEquals("PUBLISHED", lldVal.status());
    }

    @Test
    @DisplayName("Guard: All HLD and LLD catalog markdown questions parse, validate, and have unique slugs")
    void testAllCatalogMarkdownQuestionsPassValidation() throws Exception {
        ContentValidator validator = new ContentValidator();
        var resolver = new org.springframework.core.io.support.PathMatchingResourcePatternResolver();
        var hldResources = resolver.getResources("classpath*:content/questions/hld/*.md");
        var lldResources = resolver.getResources("classpath*:content/questions/lld/*.md");

        assertEquals(27, hldResources.length, "Expected exactly 27 HLD questions in catalog");
        assertEquals(11, lldResources.length, "Expected exactly 11 LLD questions in catalog");

        java.util.Set<String> seenSlugs = new java.util.HashSet<>();

        for (var res : hldResources) {
            String filename = res.getFilename() != null ? res.getFilename() : "unknown.md";
            String content = new String(res.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);

            QuestionDocument doc = parser.parse(content, filename);
            assertNotNull(doc, "Parsed doc cannot be null for " + filename);
            assertFalse(seenSlugs.contains(doc.getSlug()), "Duplicate slug found in catalog: " + doc.getSlug());
            seenSlugs.add(doc.getSlug());

            ContentValidator.ValidationResult valResult = validator.validate(doc, content);
            assertTrue(valResult.isValid(), "Question '" + doc.getSlug() + "' failed validation: " + valResult.errors());
            assertEquals("PUBLISHED", doc.getStatus(), "Question '" + doc.getSlug() + "' should be PUBLISHED");
            assertEquals("SYSTEM_DESIGN", doc.getTrack());
        }

        for (var res : lldResources) {
            String filename = res.getFilename() != null ? res.getFilename() : "unknown.md";
            String content = new String(res.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);

            QuestionDocument doc = parser.parse(content, filename);
            assertNotNull(doc, "Parsed doc cannot be null for " + filename);
            assertFalse(seenSlugs.contains(doc.getSlug()), "Duplicate slug found in catalog: " + doc.getSlug());
            seenSlugs.add(doc.getSlug());

            ContentValidator.ValidationResult valResult = validator.validate(doc, content);
            assertTrue(valResult.isValid(), "Question '" + doc.getSlug() + "' failed validation: " + valResult.errors());
            assertEquals("PUBLISHED", doc.getStatus(), "Question '" + doc.getSlug() + "' should be PUBLISHED");
            assertEquals("SPRING_LLD", doc.getTrack());
            assertNotNull(doc.getStarterCode(), "LLD requires starterCode for " + doc.getSlug());
            assertNotNull(doc.getSolutionCode(), "LLD requires solutionCode for " + doc.getSlug());
        }

        assertEquals(38, seenSlugs.size(), "Expected exactly 38 unique HLD + LLD slugs");
    }
}
