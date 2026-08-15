package com.interviewos.ai.util;

/**
 * Utility to strip markdown fences (```json ... ```) produced by LLMs.
 */
public final class JsonCleaner {

    private JsonCleaner() {}

    public static String extractPureJson(String rawOutput) {
        if (rawOutput == null || rawOutput.isBlank()) {
            return "{}";
        }
        String clean = rawOutput.trim();
        if (clean.startsWith("```json")) {
            clean = clean.substring(7);
        } else if (clean.startsWith("```")) {
            clean = clean.substring(3);
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }
}