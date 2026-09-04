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
