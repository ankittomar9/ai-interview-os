package com.interviewos.ai.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JsonCleanerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    @DisplayName("GA1-a: Literal double-encoded JSON with escaped quotes parses successfully")
    void testLiteralDoubleEncodedJsonParses() throws Exception {
        String input = "{\\\"interviewerReply\\\": \\\"x\\\", \\\"followUpQuestion\\\": \\\"y\\\"}";
        String cleaned = JsonCleaner.extractPureJson(input);
        JsonNode node = objectMapper.readTree(cleaned);
        assertEquals("x", node.get("interviewerReply").asText());
        assertEquals("y", node.get("followUpQuestion").asText());
    }

    @Test
    @DisplayName("GA1-b: Normal clean JSON passes through unchanged")
    void testNormalCleanJsonPassesThrough() throws Exception {
        String input = "{\"interviewerReply\": \"clean hello\", \"followUpQuestion\": \"clean what\"}";
        String cleaned = JsonCleaner.extractPureJson(input);
        assertEquals(input, cleaned);
        JsonNode node = objectMapper.readTree(cleaned);
        assertEquals("clean hello", node.get("interviewerReply").asText());
    }

    @Test
    @DisplayName("GA1-c: Markdown-fenced clean JSON still extracts and parses cleanly")
    void testMarkdownFencedCleanJson() throws Exception {
        String input = "```json\n{\"interviewerReply\": \"fenced\", \"isSolutionComplete\": false}\n```";
        String cleaned = JsonCleaner.extractPureJson(input);
        JsonNode node = objectMapper.readTree(cleaned);
        assertEquals("fenced", node.get("interviewerReply").asText());
        assertFalse(node.get("isSolutionComplete").asBoolean());
    }

    @Test
    @DisplayName("GA1-d: Unrecoverable gibberish surfaces exception and does not silently produce {}")
    void testUnrecoverablePayloadSurfacesException() {
        String input = "Completely invalid non-json response from crashed model";
        String cleaned = JsonCleaner.extractPureJson(input);
        assertNotEquals("{}", cleaned);
        assertThrows(Exception.class, () -> objectMapper.readTree(cleaned));
    }

    @Test
    @DisplayName("GA1-e: Backslash-order case \\\\ survives as \\")
    void testBackslashOrderSurvives() throws Exception {
        // In double-encoded JSON, a literal backslash is represented as \\\\
        // e.g. {\"path\": \"a\\\\b\"}
        String input = "{\\\"path\\\": \\\"a\\\\\\\\b\\\"}";
        String cleaned = JsonCleaner.extractPureJson(input);
        JsonNode node = objectMapper.readTree(cleaned);
        assertEquals("a\\b", node.get("path").asText());
    }

    @Test
    @DisplayName("GA1-extra: Wrapped quotes and escaped JSON is also unescaped directly")
    void testWrappedQuotesDoubleEncoded() throws Exception {
        String input = "\"{\\\"interviewerReply\\\": \\\"wrapped\\\"}\"";
        String unescaped = JsonCleaner.unescapeDoubleEncoded(input);
        JsonNode node = objectMapper.readTree(unescaped);
        assertEquals("wrapped", node.get("interviewerReply").asText());
    }

    @Test
    @DisplayName("GA1-f: JSON with embedded markdown code block in interviewerReply is preserved intact")
    void testJsonWithEmbeddedMarkdownCodeBlockInField() throws Exception {
        String input = """
                {
                  "interviewerReply": "Here is the code:\\n```java\\npublic class Solution {\\n    public boolean isPrime(int n) {\\n        return true;\\n    }\\n}\\n```",
                  "followUpQuestion": "What is the time complexity?"
                }
                """;
        String cleaned = JsonCleaner.extractPureJson(input);
        JsonNode node = objectMapper.readTree(cleaned);
        assertTrue(node.get("interviewerReply").asText().contains("public class Solution"));
        assertTrue(node.get("interviewerReply").asText().contains("```java"));
        assertEquals("What is the time complexity?", node.get("followUpQuestion").asText());
    }

    @Test
    @DisplayName("GA1-g: Conversational prefix before markdown-fenced JSON extracts fenced JSON correctly")
    void testConversationalPrefixBeforeMarkdownFencedJson() throws Exception {
        String input = """
                Sure! Here is the JSON response:
                ```json
                {
                  "interviewerReply": "Hello from model",
                  "followUpQuestion": "Next step?"
                }
                ```
                Hope this helps!
                """;
        String cleaned = JsonCleaner.extractPureJson(input);
        JsonNode node = objectMapper.readTree(cleaned);
        assertEquals("Hello from model", node.get("interviewerReply").asText());
        assertEquals("Next step?", node.get("followUpQuestion").asText());
    }
}
