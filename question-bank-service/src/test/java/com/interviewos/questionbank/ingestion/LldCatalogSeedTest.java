package com.interviewos.questionbank.ingestion;

import com.interviewos.questionbank.document.QuestionDocument;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class LldCatalogSeedTest {

    private QuestionMarkdownParser parser;
    private ContentValidator validator;

    private static final Set<String> EXPECTED_SLUGS = Set.of(
            "lld-logging-framework",
            "lld-traffic-signal",
            "lld-task-management",
            "lld-pubsub",
            "lld-hotel-management",
            "lld-digital-wallet",
            "lld-ride-booking",
            "lld-music-streaming"
    );

    @BeforeEach
    void setUp() {
        parser = new QuestionMarkdownParser();
        validator = new ContentValidator();
    }

    @Test
    @DisplayName("Assert all 8 SPEC-011 LLD questions parse cleanly, validate, and publish")
    void testSpec011LldCatalogQuestions() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath*:content/questions/lld/lld-*.md");

        int spec011Count = 0;

        for (Resource res : resources) {
            String filename = res.getFilename() != null ? res.getFilename() : "unknown.md";
            String content = new String(res.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

            QuestionDocument doc = parser.parse(content, filename);
            assertNotNull(doc, "Parsed doc cannot be null for " + filename);

            if (EXPECTED_SLUGS.contains(doc.getSlug())) {
                spec011Count++;

                // Track and Build Profile
                assertEquals("SPRING_LLD", doc.getTrack(), "Track must be SPRING_LLD for " + doc.getSlug());
                assertEquals("maven-workspace", doc.getBuildProfile(), "Build profile must be maven-workspace for " + doc.getSlug());

                // starterFiles
                assertNotNull(doc.getStarterFiles(), "starterFiles must be non-null for " + doc.getSlug());
                assertTrue(doc.getStarterFiles().containsKey("pom.xml"), "starterFiles must contain pom.xml for " + doc.getSlug());
                assertTrue(doc.getStarterFiles().size() >= 8, "starterFiles must contain pom, readme, and skeletons for " + doc.getSlug());

                // editablePaths
                assertNotNull(doc.getEditablePaths(), "editablePaths must be non-null for " + doc.getSlug());
                assertFalse(doc.getEditablePaths().isEmpty(), "editablePaths must be non-empty for " + doc.getSlug());
                for (String path : doc.getEditablePaths()) {
                    assertTrue(doc.getStarterFiles().containsKey(path), "editablePath " + path + " must be in starterFiles");
                    assertFalse(path.startsWith("src/test/java/"), "editablePath cannot be test file: " + path);
                }

                // hiddenTestFiles
                assertNotNull(doc.getHiddenTestFiles(), "hiddenTestFiles must be non-null for " + doc.getSlug());
                assertEquals(3, doc.getHiddenTestFiles().size(), "hiddenTestFiles must have exactly 3 test classes for " + doc.getSlug());
                for (String testKey : doc.getHiddenTestFiles().keySet()) {
                    assertTrue(testKey.startsWith("src/test/java/"), "hiddenTestFiles key must be under src/test/java/: " + testKey);
                }

                // topics & est_minutes
                assertEquals(List.of("lld"), doc.getTopics(), "Topics must be exactly ['lld'] for " + doc.getSlug());
                assertNotNull(doc.getEstMinutes(), "est_minutes must be present for " + doc.getSlug());
                assertTrue(doc.getEstMinutes() > 0, "est_minutes must be > 0 for " + doc.getSlug());

                // Validation
                ContentValidator.ValidationResult valResult = validator.validate(doc, content);
                assertTrue(valResult.isValid(), "Question " + doc.getSlug() + " failed validation: " + valResult.errors());
                assertEquals("PUBLISHED", doc.getStatus(), "Question " + doc.getSlug() + " must be PUBLISHED");
            }
        }

        assertEquals(8, spec011Count, "Expected exactly 8 SPEC-011 LLD questions to be found and validated");
    }
}
