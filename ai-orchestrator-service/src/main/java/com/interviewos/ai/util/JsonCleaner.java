package com.interviewos.ai.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Robust JSON extraction utility that extracts valid JSON payloads from LLM outputs
 * even when surrounded by markdown fences, commentary, or conversational prefixes,
 * and recovers double-encoded or escaped JSON strings.
 */
public final class JsonCleaner {

    private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile("```(?:[a-zA-Z0-9_-]+)?\\s*([\\s\\S]*?)\\s*```", Pattern.CASE_INSENSITIVE);

    private JsonCleaner() {}

    public static String extractPureJson(String rawOutput) {
        if (rawOutput == null || rawOutput.isBlank()) {
            return "{}";
        }

        String candidate = rawOutput.trim();

        // 1. Try markdown code block extraction
        Matcher matcher = JSON_BLOCK_PATTERN.matcher(candidate);
        if (matcher.find()) {
            String extracted = matcher.group(1).trim();
            int firstBrace = extracted.indexOf('{');
            int lastBrace = extracted.lastIndexOf('}');
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                candidate = extracted.substring(firstBrace, lastBrace + 1).trim();
            } else {
                candidate = extracted;
            }
        }

        // 2. Ensure outermost JSON curly braces { ... } are extracted if present
        int firstBrace = candidate.indexOf('{');
        int lastBrace = candidate.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            candidate = candidate.substring(firstBrace, lastBrace + 1).trim();
        }

        // 3. Cheap heuristic check for double-encoded JSON:
        // payload contains \" at a field-name position, e.g. starts {\" or contains \":\" or starts with "{\"
        if (isDoubleEncoded(candidate)) {
            candidate = unescapeDoubleEncoded(candidate);
        }

        return candidate.trim();
    }

    /**
     * Pure-string recovery pass for double-encoded / escaped JSON strings.
     */
    public static String unescapeDoubleEncoded(String raw) {
        if (raw == null || raw.isBlank()) {
            return raw != null ? raw : "{}";
        }

        String payload = raw.trim();

        // If the payload is wrapped in a layer of literal quotes (starts "{" and ends "}" after trim), strip one wrapper layer
        if (payload.startsWith("\"{") && payload.endsWith("}\"") && payload.length() >= 4) {
            payload = payload.substring(1, payload.length() - 1).trim();
        } else if (payload.startsWith("\"") && payload.endsWith("\"") && payload.length() >= 2) {
            String inner = payload.substring(1, payload.length() - 1).trim();
            if (inner.startsWith("{") && inner.endsWith("}")) {
                payload = inner;
            }
        }

        // Replace \" -> ", then \\\\ -> \\ (order matters; do not naive-replace all backslashes)
        payload = payload.replace("\\\"", "\"");
        payload = payload.replace("\\\\", "\\");

        // Re-run brace slicing (indexOf('{') ... lastIndexOf('}'))
        int firstBrace = payload.indexOf('{');
        int lastBrace = payload.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return payload.substring(firstBrace, lastBrace + 1).trim();
        }

        return payload.trim();
    }

    private static boolean isDoubleEncoded(String s) {
        if (s == null) return false;
        return s.startsWith("{\\\"")
                || s.startsWith("\"{\\\"")
                || s.contains("\":\"")
                || s.matches("(?s).*\\{\\s*\\\\\".*");
    }
}
