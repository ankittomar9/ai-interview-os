package com.interviewos.evaluation.service;

import com.interviewos.evaluation.entity.EvaluationReport;
import com.interviewos.evaluation.model.HiringVerdict;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HumanTranscriptPdfGeneratorTest {

    private final HumanTranscriptPdfGenerator pdfGenerator = new HumanTranscriptPdfGenerator();

    @Test
    @DisplayName("generates valid non-empty PDF byte array with header and turns")
    void testPdfGeneration() throws IOException {
        EvaluationReport report = EvaluationReport.builder()
                .sessionId(42L)
                .candidateId("alice-smith")
                .track("ALGORITHMS_DATA_STRUCTURES")
                .verdict(HiringVerdict.HIRE)
                .overallScore(88)
                .technicalAccuracyScore(90)
                .build();

        List<com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto> turns = List.of(
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        1L, "INTERVIEWER", "DIALOGUE", "Hello! Let us discuss Two Sum.", null, java.time.Instant.now()
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        2L, "CANDIDATE", "DIALOGUE", "I will use a HashMap for O(N) time.", "map.put(num, i);", java.time.Instant.now()
                )
        );

        byte[] pdfBytes = pdfGenerator.generateTranscriptPdf(report, turns);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "PDF should contain valid byte stream");
        // Check standard PDF file header "%PDF-"
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    @DisplayName("generates valid PDF byte array when invoked directly with TranscriptPdfMeta")
    void testPdfGenerationWithMeta() throws IOException {
        TranscriptPdfMeta meta = new TranscriptPdfMeta("bob-jones", 101L, "SYSTEM_DESIGN", 92, "STRONG_HIRE");

        List<com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto> turns = List.of(
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        1L, "CANDIDATE", "DIALOGUE", "Designing rate limiter.", null, java.time.Instant.now()
                )
        );

        byte[] pdfBytes = pdfGenerator.generateTranscriptPdf(meta, turns);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    @DisplayName("G6-11-a: seeded 2-question session PDF separates problem statements from dialogue, lists slugs, formats timestamps")
    void testSeededTwoQuestionSessionPdf_V6_11_G6_11_a() throws IOException {
        TranscriptPdfMeta meta = new TranscriptPdfMeta("alice-smith", 146L, "ALGORITHMS_DATA_STRUCTURES", 85, "HIRE");
        java.time.Instant t0 = java.time.Instant.parse("2026-09-28T10:00:00Z");

        List<com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto> turns = List.of(
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        1L, "INTERVIEWER", "DIALOGUE", "Hello candidate, welcome to the coding assessment.", null, t0
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        2L, "SYSTEM", "PROBLEM_STATEMENT", "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.", null, t0.plusSeconds(10),
                        java.util.Map.of("problemSlug", "two-sum", "title", "Two Sum", "difficulty", "EASY"), 0
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        3L, "CANDIDATE", "DIALOGUE", "I will solve this using a HashMap for O(N) lookup.", null, t0.plusSeconds(30)
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        4L, "SYSTEM", "PROBLEM_STATEMENT", "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.", null, t0.plusSeconds(120),
                        java.util.Map.of("problemSlug", "lru-cache", "title", "LRU Cache", "difficulty", "MEDIUM"), 0
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        5L, "CANDIDATE", "DIALOGUE", "For LRU cache, I will use a doubly linked list with a hash table.", null, t0.plusSeconds(150)
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        6L, "SYSTEM", "SYSTEM_EVENT", "System event: session stage transitioned.", null, t0.plusSeconds(180)
                )
        );

        byte[] pdfBytes = pdfGenerator.generateTranscriptPdf(meta, turns);
        assertNotNull(pdfBytes);

        try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(pdfBytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            String text = stripper.getText(doc);

            System.out.println("=== FIXED V6-11 PDF TEXT EXTRACT (G6-11-a) ===");
            System.out.println(text);
            System.out.println("=== END FIXED V6-11 PDF TEXT EXTRACT ===");

            // 1. Dialogue section header exists
            assertTrue(text.contains("Verbatim Dialogue History"), "Must have Verbatim Dialogue History section");

            // Extract the dialogue section text (between dialogue header and questions header)
            int dialogueStart = text.indexOf("Verbatim Dialogue History");
            int questionsStart = text.indexOf("Questions presented in this session");
            int integrityStart = text.indexOf("Integrity Summary:");

            assertTrue(dialogueStart >= 0, "Dialogue start must be present");
            assertTrue(questionsStart > dialogueStart, "Questions section must appear after dialogue");
            assertTrue(integrityStart > questionsStart, "Integrity Summary must appear after questions section");

            String dialogueSection = text.substring(dialogueStart, questionsStart);

            // 2. Dialogue section contains ZERO problem-statement text
            assertFalse(dialogueSection.contains("Given an array of integers nums"), "Dialogue section must contain zero problem statement 1 text");
            assertFalse(dialogueSection.contains("Design a data structure that follows"), "Dialogue section must contain zero problem statement 2 text");
            assertFalse(dialogueSection.contains("[SYSTEM]"), "Dialogue section must not contain [SYSTEM] turns");
            assertFalse(dialogueSection.contains("System event: session stage"), "Boilerplate system events must be excluded from dialogue");

            // 3. Questions section lists both slugs
            String questionsSection = text.substring(questionsStart, integrityStart);
            assertTrue(questionsSection.contains("two-sum"), "Questions section must list two-sum slug");
            assertTrue(questionsSection.contains("lru-cache"), "Questions section must list lru-cache slug");
            assertTrue(questionsSection.contains("Two Sum [EASY]"), "Questions section must include title and difficulty for two-sum");
            assertTrue(questionsSection.contains("LRU Cache [MEDIUM]"), "Questions section must include title and difficulty for lru-cache");

            // 4. Roles and relative timestamps on every dialogue turn line
            assertTrue(dialogueSection.contains("INTERVIEWER (00:00):"), "Turn 1 must have role and timestamp 00:00");
            assertTrue(dialogueSection.contains("CANDIDATE (00:30):"), "Turn 2 must have role and timestamp 00:30");
            assertTrue(dialogueSection.contains("CANDIDATE (02:30):"), "Turn 3 must have role and timestamp 02:30");
        }
    }

    @Test
    @DisplayName("generates PDF with explicit questionsPresented from TranscriptPdfMeta")
    void testExplicitQuestionsMetaRendering() throws IOException {
        TranscriptPdfMeta.QuestionPresentedMeta q1 = new TranscriptPdfMeta.QuestionPresentedMeta("merge-k-lists", "Merge K Sorted Lists", "HARD");
        TranscriptPdfMeta meta = new TranscriptPdfMeta(
                "candidate-77", 77L, "DSA", 90, "HIRE",
                0, 0, 0, "LOCAL_SANDBOX", List.of(), List.of(q1)
        );

        List<com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto> turns = List.of(
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        1L, "AI", "DIALOGUE", "Let us work on merging sorted lists.", null, java.time.Instant.now()
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        2L, "USER", "DIALOGUE", "I will use a min-heap priority queue.", null, java.time.Instant.now()
                )
        );

        byte[] pdfBytes = pdfGenerator.generateTranscriptPdf(meta, turns);
        assertNotNull(pdfBytes);

        try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(pdfBytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            String text = stripper.getText(doc);

            assertTrue(text.contains("Questions presented in this session"));
            assertTrue(text.contains("- merge-k-lists: Merge K Sorted Lists [HARD]"));
            assertTrue(text.contains("INTERVIEWER (00:00):"));
            assertTrue(text.contains("CANDIDATE (00:00):"));
        }
    }

    @Test
    @DisplayName("G6-11-b (honest-judge regression guard): verifies that problem statement is NOT present in dialogue section")
    void testHonestJudgeRegressionGuard() throws IOException {
        TranscriptPdfMeta meta = new TranscriptPdfMeta("alice-smith", 146L, "ALGORITHMS_DATA_STRUCTURES", 85, "HIRE");
        java.time.Instant t0 = java.time.Instant.parse("2026-09-28T10:00:00Z");

        List<com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto> turns = List.of(
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        1L, "INTERVIEWER", "DIALOGUE", "Hello candidate, welcome to the coding assessment.", null, t0
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        2L, "SYSTEM", "PROBLEM_STATEMENT", "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.", null, t0.plusSeconds(10),
                        java.util.Map.of("problemSlug", "two-sum", "title", "Two Sum", "difficulty", "EASY"), 0
                ),
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        3L, "CANDIDATE", "DIALOGUE", "I will solve this using a HashMap for O(N) lookup.", null, t0.plusSeconds(30)
                )
        );

        byte[] pdfBytes = pdfGenerator.generateTranscriptPdf(meta, turns);
        try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(pdfBytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            String text = stripper.getText(doc);
            int dialogueStart = text.indexOf("Verbatim Dialogue History");
            int questionsStart = text.indexOf("Questions presented in this session");
            String dialogueSection = text.substring(dialogueStart, questionsStart);

            // Assert that the pre-fix defect does NOT occur
            assertFalse(dialogueSection.contains("Given an array of integers nums"),
                    "Problem statement must NOT be in dialogue section");
            assertFalse(dialogueSection.contains("[SYSTEM]"),
                    "[SYSTEM] turn must NOT be in dialogue section");
        }
    }

    @Test
    @DisplayName("A13: generates PDF with integrity summary block explicitly rendering zeros")
    void testVerifyingIntegritySummaryRenderedWithZeros() throws IOException {
        TranscriptPdfMeta meta = new TranscriptPdfMeta("zero-candidate", 200L, "DSA", 85, "HIRE", 0, 0, 0, "LOCAL_SANDBOX");

        List<com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto> turns = List.of(
                new com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto(
                        1L, "CANDIDATE", "DIALOGUE", "Testing integrity block.", null, java.time.Instant.now()
                )
        );

        byte[] pdfBytes = pdfGenerator.generateTranscriptPdf(meta, turns);
        assertNotNull(pdfBytes);

        try (org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(pdfBytes)) {
            org.apache.pdfbox.text.PDFTextStripper stripper = new org.apache.pdfbox.text.PDFTextStripper();
            String text = stripper.getText(doc);
            assertTrue(text.contains("Integrity Summary:"), "PDF must contain Integrity Summary section");
            assertTrue(text.contains("Echo Filtered: 0 filtered"), "PDF must explicitly render 0 filtered");
            assertTrue(text.contains("Dropped Chunks: 0"), "PDF must explicitly render 0 dropped chunks");
            assertTrue(text.contains("Consent Downgrades: 0"), "PDF must explicitly render 0 consent downgrades");
            assertTrue(text.contains("Workspace: LOCAL_SANDBOX"), "PDF must render workspace provenance");
        }
    }
}

