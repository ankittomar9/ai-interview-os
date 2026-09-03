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
}
