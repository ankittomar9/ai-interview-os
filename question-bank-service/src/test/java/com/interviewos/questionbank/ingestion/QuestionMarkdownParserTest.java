package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import com.interviewos.questionbank.document.ReferenceSolution;
import com.interviewos.questionbank.dto.ReferenceSolutionAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

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
    @DisplayName("Parse resources frontmatter block")
    void testParseResourcesBlock() {
        String md = """
                ---
                slug: dsa-resources-test
                title: Resources Test
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: EASY
                resources:
                  - label: "Official Documentation"
                    url: "https://example.com/docs"
                  - label: "Video Guide"
                    url: "https://example.com/video"
                ---
                Problem body
                """;

        QuestionDocument doc = parser.parse(md, "resources-test.md");

        assertNotNull(doc);
        assertNotNull(doc.getResources());
        assertEquals(2, doc.getResources().size());
        assertEquals("Official Documentation", doc.getResources().get(0).label());
        assertEquals("https://example.com/docs", doc.getResources().get(0).url());
        assertEquals("Video Guide", doc.getResources().get(1).label());
        assertEquals("https://example.com/video", doc.getResources().get(1).url());
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
    @DisplayName("V7-01: Parse fixture with 2 valid reference solutions in order")
    void testParseValidReferenceSolutionsTwoApproaches() {
        String md = """
                ---
                slug: dsa-test-two-sum-approaches
                title: Two Sum Multi Approach
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: MID
                buildProfile: judge0
                referenceSolutions:
                  - approachId: "canonical-hashmap"
                    label: "Canonical — Hash Map"
                    approachClass: "PRIMARY"
                    kind: "CODE"
                    summary: "Use a hash table to find complement in one pass."
                    keyIdea: "Map value to index to achieve O(N) lookup."
                    timeComplexity: "O(N)"
                    spaceComplexity: "O(N)"
                    tradeoffs:
                      - "Single pass O(N) runtime"
                      - "Requires O(N) memory"
                    whenToUse: "Default expected interview solution."
                    code: |
                      public class Main {
                          public static void main(String[] args) {}
                      }
                  - approachId: "sort-two-pointers"
                    label: "Alternate — Sort & Two Pointers"
                    approachClass: "ALTERNATE"
                    kind: "CODE"
                    summary: "Sort pairs and use two pointers meeting in middle."
                    keyIdea: "Avoid hash table allocation by sorting."
                    timeComplexity: "O(N log N)"
                    spaceComplexity: "O(1)"
                    tradeoffs:
                      - "Constant extra space"
                      - "Slower O(N log N) runtime"
                    whenToUse: "When memory is strictly constrained."
                    code: |
                      public class Main2 {
                          public static void main(String[] args) {}
                      }
                ---
                Problem body
                """;

        QuestionDocument doc = parser.parse(md, "test-approaches.md");
        assertNotNull(doc);
        assertNotNull(doc.getReferenceSolutions());
        assertEquals(2, doc.getReferenceSolutions().size());

        ReferenceSolution app1 = doc.getReferenceSolutions().get(0);
        assertEquals("canonical-hashmap", app1.approachId());
        assertEquals("Canonical — Hash Map", app1.label());
        assertEquals(ReferenceSolution.ApproachClass.PRIMARY, app1.approachClass());
        assertEquals(ReferenceSolution.Kind.CODE, app1.kind());
        assertEquals("O(N)", app1.timeComplexity());
        assertEquals("O(N)", app1.spaceComplexity());
        assertTrue(app1.code().contains("public class Main"));

        ReferenceSolution app2 = doc.getReferenceSolutions().get(1);
        assertEquals("sort-two-pointers", app2.approachId());
        assertEquals("Alternate — Sort & Two Pointers", app2.label());
        assertEquals(ReferenceSolution.ApproachClass.ALTERNATE, app2.approachClass());
        assertEquals(ReferenceSolution.Kind.CODE, app2.kind());
        assertEquals("O(N log N)", app2.timeComplexity());
        assertEquals("O(1)", app2.spaceComplexity());

        // PRIMARY code is exposed through legacy getter for backward compat
        assertNotNull(doc.getSolutionCode());
        assertTrue(doc.getSolutionCode().contains("public class Main"));
    }

    @Test
    @DisplayName("V7-01: Backward-compat adapter synthesizes 1 PRIMARY approach when referenceSolutions absent")
    void testBackwardCompatAdapterSynthesizesPrimary() {
        String md = """
                ---
                slug: dsa-test-legacy-solution
                title: Legacy Solution Question
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: MID
                solutionCode: |
                  public class Main {
                      public static void main(String[] args) {
                          System.out.println("legacy");
                      }
                  }
                ---
                Legacy question body
                """;

        QuestionDocument doc = parser.parse(md, "legacy.md");
        assertNotNull(doc);
        assertNull(doc.getReferenceSolutions());

        List<ReferenceSolution> resolved = ReferenceSolutionAdapter.resolve(doc);
        assertNotNull(resolved);
        assertEquals(1, resolved.size());

        ReferenceSolution primary = resolved.get(0);
        assertEquals(ReferenceSolution.ApproachClass.PRIMARY, primary.approachClass());
        assertEquals(ReferenceSolution.Kind.CODE, primary.kind());
        assertEquals("canonical-solution", primary.approachId());
        assertEquals(doc.getSolutionCode(), primary.code());
    }

    @Test
    @DisplayName("V7-01: Ingestion validation fails on bogus approachClass, multiple PRIMARY, duplicate approachId, or payload mismatch")
    void testIngestionValidationFailures() {
        // 1. Bogus approachClass
        String bogusClassMd = """
                ---
                slug: bad-class
                title: Bad Class
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: MID
                referenceSolutions:
                  - approachId: "bad-app"
                    label: "Bad Approach"
                    approachClass: "BOGUS"
                    kind: "CODE"
                    summary: "Summary"
                    keyIdea: "Idea"
                    timeComplexity: "O(1)"
                    spaceComplexity: "O(1)"
                    code: "class Main {}"
                ---
                Body
                """;
        Exception ex1 = assertThrows(RuntimeException.class, () -> parser.parse(bogusClassMd, "bad-class.md"));
        assertTrue(ex1.getMessage().contains("unknown approachClass 'BOGUS' in slug bad-class"),
                "Expected unknown approachClass error, got: " + ex1.getMessage());

        // 2. Multiple PRIMARY
        String twoPrimaryMd = """
                ---
                slug: two-primary
                title: Two Primary
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: MID
                referenceSolutions:
                  - approachId: "prim-1"
                    label: "Primary One"
                    approachClass: "PRIMARY"
                    kind: "CODE"
                    summary: "Summary"
                    keyIdea: "Idea"
                    timeComplexity: "O(1)"
                    spaceComplexity: "O(1)"
                    code: "class Main1 {}"
                  - approachId: "prim-2"
                    label: "Primary Two"
                    approachClass: "PRIMARY"
                    kind: "CODE"
                    summary: "Summary"
                    keyIdea: "Idea"
                    timeComplexity: "O(1)"
                    spaceComplexity: "O(1)"
                    code: "class Main2 {}"
                ---
                Body
                """;
        Exception ex2 = assertThrows(RuntimeException.class, () -> parser.parse(twoPrimaryMd, "two-primary.md"));
        assertTrue(ex2.getMessage().contains("missing or multiple PRIMARY approaches in slug two-primary: expected exactly 1, found 2"),
                "Expected multiple PRIMARY error, got: " + ex2.getMessage());

        // 3. Duplicate approachId
        String dupIdMd = """
                ---
                slug: dup-id
                title: Dup Id
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: MID
                referenceSolutions:
                  - approachId: "same-id"
                    label: "Primary"
                    approachClass: "PRIMARY"
                    kind: "CODE"
                    summary: "Summary"
                    keyIdea: "Idea"
                    timeComplexity: "O(1)"
                    spaceComplexity: "O(1)"
                    code: "class Main1 {}"
                  - approachId: "same-id"
                    label: "Alternate"
                    approachClass: "ALTERNATE"
                    kind: "CODE"
                    summary: "Summary"
                    keyIdea: "Idea"
                    timeComplexity: "O(1)"
                    spaceComplexity: "O(1)"
                    code: "class Main2 {}"
                ---
                Body
                """;
        Exception ex3 = assertThrows(RuntimeException.class, () -> parser.parse(dupIdMd, "dup-id.md"));
        assertTrue(ex3.getMessage().contains("duplicate approachId 'same-id' in slug dup-id"),
                "Expected duplicate approachId error, got: " + ex3.getMessage());

        // 4. Kind / payload mismatch
        String mismatchMd = """
                ---
                slug: mismatch-payload
                title: Mismatch Payload
                track: ALGORITHMS_DATA_STRUCTURES
                difficulty: MID
                referenceSolutions:
                  - approachId: "app-mismatch"
                    label: "Mismatch"
                    approachClass: "PRIMARY"
                    kind: "CODE"
                    summary: "Summary"
                    keyIdea: "Idea"
                    timeComplexity: "O(1)"
                    spaceComplexity: "O(1)"
                    sql: "SELECT 1"
                ---
                Body
                """;
        Exception ex4 = assertThrows(RuntimeException.class, () -> parser.parse(mismatchMd, "mismatch.md"));
        assertTrue(ex4.getMessage().contains("kind/payload mismatch: CODE approach 'app-mismatch' in slug mismatch-payload"),
                "Expected kind/payload mismatch error, got: " + ex4.getMessage());
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
        assertEquals("MEDIUM", hldDoc.getDifficulty());
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
        assertEquals("MEDIUM", lldDoc.getDifficulty());
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
