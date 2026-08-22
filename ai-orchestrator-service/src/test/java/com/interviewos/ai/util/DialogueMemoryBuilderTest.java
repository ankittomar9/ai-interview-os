package com.interviewos.ai.util;

import com.interviewos.ai.dto.TranscriptTurnDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class DialogueMemoryBuilderTest {

    @Test
    @DisplayName("Empty transcript should produce graceful default memory view")
    void testEmptyTranscript() {
        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(List.of(), "Hello", null);

        assertNotNull(memory);
        assertEquals("None", memory.recentVerbatim());
        assertEquals("n/a", memory.runningSummary());
        assertTrue(memory.intentHistory().isEmpty());
        assertEquals(0, memory.stuckCount());
        assertNull(memory.previousIntent());
        assertTrue(memory.adaptiveDirective().contains("PROBE_DEEPER"));
    }

    @Test
    @DisplayName("Null transcript should be handled safely without NPE")
    void testNullTranscript() {
        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(null, null, null);

        assertNotNull(memory);
        assertEquals("None", memory.recentVerbatim());
        assertEquals("n/a", memory.runningSummary());
        assertEquals(0, memory.stuckCount());
    }

    @Test
    @DisplayName("Recent verbatim extracts exactly last 3 turns and truncates at 400 chars")
    void testRecentVerbatimLastThree() {
        String longText = "A".repeat(500);
        List<TranscriptTurnDto> turns = List.of(
                new TranscriptTurnDto(1L, "CANDIDATE", "EXPLANATION", "Turn 1", null, null),
                new TranscriptTurnDto(2L, "AI", "FEEDBACK", "Turn 2", null, Map.of("turnSummary", "Turn 2 summary")),
                new TranscriptTurnDto(3L, "CANDIDATE", "EXPLANATION", longText, null, null),
                new TranscriptTurnDto(4L, "AI", "FEEDBACK", "Turn 4", null, Map.of("turnSummary", "Turn 4 summary"))
        );

        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(turns, "Latest candidate input", null);

        // Should only contain turns 2, 3, 4
        assertFalse(memory.recentVerbatim().contains("Turn 1"));
        assertTrue(memory.recentVerbatim().contains("Turn 2"));
        assertTrue(memory.recentVerbatim().contains("Turn 4"));
        assertTrue(memory.recentVerbatim().contains("... [truncated]"));
    }

    @Test
    @DisplayName("Running summary joins all metadata turnSummaries")
    void testRunningSummaryJoin() {
        List<TranscriptTurnDto> turns = List.of(
                new TranscriptTurnDto(1L, "CANDIDATE", "EXPLANATION", "My approach is binary search.", null, null),
                new TranscriptTurnDto(2L, "AI", "FEEDBACK", "Good.", null, Map.of("turnSummary", "Candidate proposed binary search", "detectedIntent", "EXPLAINING_APPROACH")),
                new TranscriptTurnDto(3L, "CANDIDATE", "EXPLANATION", "Now implementing bounds.", null, null),
                new TranscriptTurnDto(4L, "AI", "FEEDBACK", "Watch out for overflow.", null, Map.of("turnSummary", "Candidate refined bounds", "detectedIntent", "CODING"))
        );

        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(turns, "What about mid calculation?", null);

        assertEquals("So far: Candidate proposed binary search; Candidate refined bounds", memory.runningSummary());
        assertEquals(List.of("EXPLAINING_APPROACH", "CODING"), memory.intentHistory());
        assertEquals("CODING", memory.previousIntent());
    }

    @Test
    @DisplayName("StuckCount accurately calculates consecutive STUCK turns (0, 1, 3)")
    void testStuckCountCalculation() {
        // Case 1: 0 stuck
        List<TranscriptTurnDto> turns0 = List.of(
                new TranscriptTurnDto(1L, "AI", "FEEDBACK", "Hi", null, Map.of("detectedIntent", "EXPLAINING_APPROACH"))
        );
        assertEquals(0, DialogueMemoryBuilder.buildMemory(turns0, "My code", null).stuckCount());

        // Case 2: 1 stuck at end
        List<TranscriptTurnDto> turns1 = List.of(
                new TranscriptTurnDto(1L, "AI", "FEEDBACK", "Hi", null, Map.of("detectedIntent", "EXPLAINING_APPROACH")),
                new TranscriptTurnDto(2L, "AI", "FEEDBACK", "Think about pointer", null, Map.of("detectedIntent", "STUCK"))
        );
        assertEquals(1, DialogueMemoryBuilder.buildMemory(turns1, "Still trying", null).stuckCount());

        // Case 3: 3 consecutive STUCK at end
        List<TranscriptTurnDto> turns3 = List.of(
                new TranscriptTurnDto(1L, "AI", "FEEDBACK", "Hi", null, Map.of("detectedIntent", "EXPLAINING_APPROACH")),
                new TranscriptTurnDto(2L, "AI", "FEEDBACK", "Help 1", null, Map.of("detectedIntent", "STUCK")),
                new TranscriptTurnDto(3L, "AI", "FEEDBACK", "Help 2", null, Map.of("detectedIntent", "STUCK")),
                new TranscriptTurnDto(4L, "AI", "FEEDBACK", "Help 3", null, Map.of("detectedIntent", "STUCK"))
        );
        DialogueMemoryBuilder.MemoryView memory3 = DialogueMemoryBuilder.buildMemory(turns3, "I don't know how to do this", "Use a sentinel head node.");
        assertEquals(3, memory3.stuckCount());
        assertTrue(memory3.adaptiveDirective().startsWith("OFFER_HINT:"));
        assertTrue(memory3.adaptiveDirective().contains("Use a sentinel head node."));
    }

    @Test
    @DisplayName("Adaptive directives select ADVANCE_STAGE when previousIntent is COMPLETE")
    void testAdvanceStageDirective() {
        List<TranscriptTurnDto> turns = List.of(
                new TranscriptTurnDto(1L, "AI", "FEEDBACK", "All tests pass!", null, Map.of("detectedIntent", "COMPLETE"))
        );

        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(turns, "I'm finished with the implementation.", null);
        assertTrue(memory.adaptiveDirective().startsWith("ADVANCE_STAGE:"));
    }

    @Test
    @DisplayName("Adaptive directives select ANSWER_CLARIFICATION when candidate asks question")
    void testClarifyingDirective() {
        List<TranscriptTurnDto> turns = List.of(
                new TranscriptTurnDto(1L, "AI", "FEEDBACK", "Here is the problem.", null, Map.of("detectedIntent", "EXPLAINING_APPROACH"))
        );

        DialogueMemoryBuilder.MemoryView memory = DialogueMemoryBuilder.buildMemory(turns, "Can I assume the input array contains only positive numbers?", null);
        assertTrue(memory.adaptiveDirective().startsWith("ANSWER_CLARIFICATION:"));
    }
}
