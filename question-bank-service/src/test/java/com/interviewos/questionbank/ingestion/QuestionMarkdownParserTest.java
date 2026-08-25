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
}
