package com.interviewos.session.sandbox.document;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * V8-01 / V8-g2 (SPEC V-2.0.8): ProblemDocument is an internal aggregate that carries
 * server-only hidden JUnit test sources. Whatever the public payload story is
 * (ProblemPublicView today), the document itself must never serialize hiddenTestFiles.
 * Defense-in-depth contract: if a future controller ever returns the document directly,
 * Jackson still refuses to emit the hidden tests.
 */
class ProblemDocumentJsonContractTest {

    private final ObjectMapper mapper = new ObjectMapper();

    private static final String SECRET_TEST_PATH = "src/test/java/com/interviewos/atm/AtmSecretTest.java";
    private static final String SECRET_TEST_BODY = "class AtmSecretTest { // SECRET-TEST-BYTES-V8G2 }";

    @Test
    @DisplayName("hiddenTestFiles is never serialized by Jackson (key and content bytes absent)")
    void testHiddenTestFilesNeverSerialized() throws Exception {
        ProblemDocument doc = ProblemDocument.builder()
                .problemSlug("lld-atm-system")
                .title("ATM System")
                .track("SPRING_LLD")
                .difficulty("HARD")
                .problemStatement("Design an ATM system with pin validation and cash dispensing.")
                .hiddenTestFiles(Map.of(SECRET_TEST_PATH, SECRET_TEST_BODY))
                .build();

        String json = mapper.writeValueAsString(doc);

        assertFalse(json.contains("hiddenTestFiles"));
        assertFalse(json.contains("AtmSecretTest"));
        assertFalse(json.contains("SECRET-TEST-BYTES-V8G2"));
    }

    @Test
    @DisplayName("Workspace seed fields remain serialized (guard against over-ignoring)")
    void testWorkspaceSeedFieldsStillSerialized() throws Exception {
        ProblemDocument doc = ProblemDocument.builder()
                .problemSlug("lld-atm-system")
                .track("SPRING_LLD")
                .problemStatement("Design an ATM system with pin validation and cash dispensing.")
                .starterFiles(Map.of("pom.xml", "<project/>"))
                .editablePaths(List.of("src/main/java/com/example/atm/service/**"))
                .hiddenTestFiles(Map.of(SECRET_TEST_PATH, SECRET_TEST_BODY))
                .build();

        String json = mapper.writeValueAsString(doc);

        assertTrue(json.contains("pom.xml"));
        assertTrue(json.contains("editablePaths"));
        assertTrue(json.contains("starterFiles"));
    }
}
