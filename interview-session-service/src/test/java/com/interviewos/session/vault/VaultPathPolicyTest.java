package com.interviewos.session.vault;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class VaultPathPolicyTest {

    private final VaultPathPolicy policy = new VaultPathPolicy();

    @Test
    @DisplayName("sanitizeToken removes non-alphanumeric characters and uppercases")
    void testSanitizeToken() {
        assertEquals("DSA", policy.sanitizeToken("dsa", "DEF"));
        assertEquals("SPRINGBOOT", policy.sanitizeToken("spring-boot", "DEF"));
        assertEquals("DEF", policy.sanitizeToken("", "DEF"));
        assertEquals("DEF", policy.sanitizeToken("   ", "DEF"));
        assertEquals("DEF", policy.sanitizeToken("!@#$", "DEF"));
        assertEquals("SYSTEMDESIGN", policy.sanitizeToken("system_design", "DEF"));
        assertEquals("SYSTEMDESIGN10", policy.sanitizeToken("system_design 1.0", "DEF"));
    }

    @Test
    @DisplayName("buildDateFolderName formats UTC date as YYYY-MM-DD")
    void testBuildDateFolderName() {
        Instant t = Instant.parse("2026-10-01T14:32:00Z");
        assertEquals("2026-10-01", policy.buildDateFolderName(t));
    }

    @Test
    @DisplayName("buildSessionFolderName formats without colons and includes uppercase tokens and sessionId")
    void testBuildSessionFolderName() {
        Instant t = Instant.parse("2026-10-01T14:32:15Z");
        String folder = policy.buildSessionFolderName(t, "dsa", "medium", 1042L);
        assertEquals("1432_DSA_MEDIUM_1042", folder);
        assertFalse(folder.contains(":"), "Folder name must never contain colons");
        assertFalse(folder.matches(".*[<>\"/\\\\|?*].*"), "Folder name must never contain Windows reserved characters");
    }

    @Test
    @DisplayName("buildRelativePath produces long-path-safe depth-2 relative path")
    void testBuildRelativePath() {
        Instant t = Instant.parse("2026-10-01T08:15:00Z");
        String relPath = policy.buildRelativePath(t, "lld", "senior", 42L);
        assertEquals("2026-10-01/0815_LLD_SENIOR_42", relPath);
    }

    @Test
    @DisplayName("resolveSessionPath produces valid depth-3 path within configured root")
    void testResolveSessionPath() {
        Instant t = Instant.parse("2026-10-01T14:32:00Z");
        Path root = Paths.get("/tmp/vault");
        Path fullPath = policy.resolveSessionPath(root.toString(), t, "dsa", "medium", 1042L);

        assertEquals(root.resolve("2026-10-01").resolve("1432_DSA_MEDIUM_1042"), fullPath);
    }

    @Test
    @DisplayName("Same minute distinct session IDs produce distinct folder paths (idempotency/anti-collision)")
    void testCollisionResilience() {
        Instant t = Instant.parse("2026-10-01T14:32:00Z");
        String folder1 = policy.buildSessionFolderName(t, "dsa", "medium", 1042L);
        String folder2 = policy.buildSessionFolderName(t, "dsa", "medium", 1043L);

        assertNotEquals(folder1, folder2);
    }
}
