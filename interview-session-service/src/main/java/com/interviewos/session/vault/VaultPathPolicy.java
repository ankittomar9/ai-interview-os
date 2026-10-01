package com.interviewos.session.vault;

import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Component
public class VaultPathPolicy {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("uuuu-MM-dd").withZone(ZoneOffset.UTC);
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HHmm").withZone(ZoneOffset.UTC);

    /**
     * Sanitizes input strings so they strictly contain only uppercase alphanumeric characters [A-Z0-9].
     * Any non-alphanumeric character is removed.
     */
    public String sanitizeToken(String input, String defaultValue) {
        if (input == null || input.isBlank()) {
            return defaultValue;
        }
        String sanitized = input.toUpperCase().replaceAll("[^A-Z0-9]", "");
        return sanitized.isEmpty() ? defaultValue : sanitized;
    }

    /**
     * Builds the UTC date folder name: YYYY-MM-DD.
     */
    public String buildDateFolderName(Instant timestamp) {
        Instant time = timestamp != null ? timestamp : Instant.now();
        return DATE_FORMATTER.format(time);
    }

    /**
     * Normalizes track to standard short token (e.g. ALGORITHMS_DATA_STRUCTURES -> DSA).
     */
    public String normalizeTrack(String track) {
        if (track == null || track.isBlank()) return "UNKNOWN";
        String upper = track.trim().toUpperCase();
        if (upper.equals("ALGORITHMS_DATA_STRUCTURES") || upper.equals("DSA")) return "DSA";
        if (upper.equals("SPRING_LLD") || upper.equals("LLD")) return "LLD";
        if (upper.equals("SYSTEM_DESIGN") || upper.equals("HLD")) return "HLD";
        if (upper.equals("BEHAVIORAL_STAR") || upper.equals("BEHAVIORAL")) return "BEHAVIORAL";
        return sanitizeToken(upper, "UNKNOWN");
    }

    /**
     * Normalizes difficulty level (e.g. MID -> MEDIUM).
     */
    public String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) return "UNKNOWN";
        String upper = difficulty.trim().toUpperCase();
        if (upper.equals("MID") || upper.equals("MEDIUM")) return "MEDIUM";
        return sanitizeToken(upper, "UNKNOWN");
    }

    /**
     * Builds the session folder name: {HHmm}_{TRACK}_{DIFFICULTY}_{sessionId}.
     * Notice: No colons in time, alphanumeric track and difficulty, unique sessionId.
     */
    public String buildSessionFolderName(Instant timestamp, String track, String difficulty, Long sessionId) {
        Instant time = timestamp != null ? timestamp : Instant.now();
        String hhmm = TIME_FORMATTER.format(time);
        String safeTrack = normalizeTrack(track);
        String safeDifficulty = normalizeDifficulty(difficulty);
        long id = sessionId != null ? sessionId : 0L;
        return String.format("%s_%s_%s_%d", hhmm, safeTrack, safeDifficulty, id);
    }

    /**
     * Builds the relative folder path: YYYY-MM-DD/{HHmm}_{TRACK}_{DIFFICULTY}_{sessionId}.
     */
    public String buildRelativePath(Instant timestamp, String track, String difficulty, Long sessionId) {
        return buildDateFolderName(timestamp) + "/" + buildSessionFolderName(timestamp, track, difficulty, sessionId);
    }

    /**
     * Resolves the full filesystem path for the session vault folder.
     */
    public Path resolveSessionPath(String rootDir, Instant timestamp, String track, String difficulty, Long sessionId) {
        String dateFolder = buildDateFolderName(timestamp);
        String sessionFolder = buildSessionFolderName(timestamp, track, difficulty, sessionId);
        return Paths.get(rootDir, dateFolder, sessionFolder);
    }
}
