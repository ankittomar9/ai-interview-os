package com.interviewos.ai.util;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Robust JSON extraction utility that extracts valid JSON payloads from LLM outputs
 * even when surrounded by markdown fences, commentary, or conversational prefixes.
 */
public final class JsonCleaner {

    private static final Pattern JSON_BLOCK_PATTERN = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)\\s*```", Pattern.CASE_INSENSITIVE);

    private JsonCleaner() {}

    public static String extractPureJson(String rawOutput) {
        if (rawOutput == null || rawOutput.isBlank()) {
            return "{}";
        }

        // 1. Try markdown code block extraction
        Matcher matcher = JSON_BLOCK_PATTERN.matcher(rawOutput);
        if (matcher.find()) {
            String extracted = matcher.group(1).trim();
            int firstBrace = extracted.indexOf('{');
            int lastBrace = extracted.lastIndexOf('}');
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
                return extracted.substring(firstBrace, lastBrace + 1).trim();
            }
            return extracted;
        }

        // 2. Try finding outermost JSON curly braces { ... }
        int firstBrace = rawOutput.indexOf('{');
        int lastBrace = rawOutput.lastIndexOf('}');
        if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace) {
            return rawOutput.substring(firstBrace, lastBrace + 1).trim();
        }

        return rawOutput.trim();
    }
}