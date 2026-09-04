package com.interviewos.evaluation.service;

import com.interviewos.evaluation.entity.EvaluationReport;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class HumanTranscriptPdfGenerator {

    private static final float MARGIN = 50f;
    private static final float FONT_SIZE_TITLE = 16f;
    private static final float FONT_SIZE_HEADING = 12f;
    private static final float FONT_SIZE_BODY = 9.5f;
    private static final float LEADING = 13f;

    public byte[] generateTranscriptPdf(EvaluationReport report, List<?> transcriptTurns) throws IOException {
        return generateTranscriptPdf(TranscriptPdfMeta.fromEntity(report), transcriptTurns);
    }

    public byte[] generateTranscriptPdf(TranscriptPdfMeta meta, List<?> transcriptTurns) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDType1Font fontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            PDType1Font fontRegular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDType1Font fontMono = new PDType1Font(Standard14Fonts.FontName.COURIER);

            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDPageContentStream contentStream = new PDPageContentStream(doc, page);
            float y = page.getMediaBox().getHeight() - MARGIN;

            // 1. Title Header
            contentStream.beginText();
            contentStream.setFont(fontBold, FONT_SIZE_TITLE);
            contentStream.newLineAtOffset(MARGIN, y);
            contentStream.showText("AI Interview OS — Audited Session Transcript");
            contentStream.endText();
            y -= 25f;

            // 2. Metadata Box
            contentStream.beginText();
            contentStream.setFont(fontRegular, FONT_SIZE_BODY);
            contentStream.newLineAtOffset(MARGIN, y);
            String candidateInfo = String.format("Candidate ID: %s   |   Session #%s   |   Track: %s",
                    meta != null && meta.candidateId() != null ? meta.candidateId() : "N/A",
                    meta != null && meta.sessionId() != null ? meta.sessionId() : "N/A",
                    meta != null && meta.track() != null ? meta.track() : "N/A");
            contentStream.showText(candidateInfo);
            contentStream.newLineAtOffset(0, -LEADING);
            String scoreInfo = String.format("Overall Score: %d/100   |   Verdict: %s",
                    meta != null ? meta.overallScore() : 0,
                    meta != null && meta.verdict() != null ? meta.verdict() : "PENDING");
            contentStream.showText(scoreInfo);
            contentStream.endText();
            y -= 25f;

            // 2b. Section: Integrity Summary (A13 - explicit zeros rendered)
            contentStream.beginText();
            contentStream.setFont(fontBold, FONT_SIZE_BODY);
            contentStream.newLineAtOffset(MARGIN, y);
            contentStream.showText("Integrity Summary: ");
            contentStream.setFont(fontRegular, FONT_SIZE_BODY);
            int echo = meta != null && meta.echoFilteredCount() != null ? meta.echoFilteredCount() : 0;
            int dropped = meta != null && meta.droppedChunks() != null ? meta.droppedChunks() : 0;
            int downgrades = meta != null && meta.consentDowngrades() != null ? meta.consentDowngrades() : 0;
            String prov = meta != null && meta.workspaceProvenance() != null ? meta.workspaceProvenance() : "LOCAL_SANDBOX";
            String integrityLine = String.format("Echo Filtered: %d filtered  |  Dropped Chunks: %d  |  Consent Downgrades: %d  |  Workspace: %s",
                    echo, dropped, downgrades, prov);
            contentStream.showText(integrityLine);
            contentStream.endText();
            y -= 20f;

            // 2c. Section: Plan-vs-Actual Breakdown (C4)
            if (meta != null && meta.planVsActual() != null && !meta.planVsActual().isEmpty()) {
                contentStream.beginText();
                contentStream.setFont(fontBold, FONT_SIZE_BODY);
                contentStream.newLineAtOffset(MARGIN, y);
                contentStream.showText("Plan vs. Actual Assessment Breakdown:");
                contentStream.endText();
                y -= LEADING;

                for (com.interviewos.evaluation.dto.DiagnosticReportResponse.PlanVsActualEntryDto entry : meta.planVsActual()) {
                    contentStream.beginText();
                    contentStream.setFont(fontRegular, FONT_SIZE_BODY);
                    contentStream.newLineAtOffset(MARGIN + 10f, y);
                    String line = String.format("- %s [%s]: %d turns | %d min elapsed (soft budget: %d min)",
                            entry.sectionType(), entry.status(), entry.turnCount(), entry.elapsedMinutes(), entry.softBudgetMinutes());
                    contentStream.showText(sanitizeText(line));
                    contentStream.endText();
                    y -= LEADING;
                }
                y -= 10f;
            }

            // 3. Section Header: Transcript Turns
            contentStream.beginText();
            contentStream.setFont(fontBold, FONT_SIZE_HEADING);
            contentStream.newLineAtOffset(MARGIN, y);
            contentStream.showText("Verbatim Dialogue & Execution History");
            contentStream.endText();
            y -= 20f;

            contentStream.close();

            // Render turns
            if (transcriptTurns != null && !transcriptTurns.isEmpty()) {
                for (Object turnObj : transcriptTurns) {
                    String role = "SPEAKER";
                    String content = turnObj.toString();
                    if (turnObj instanceof com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto turn) {
                        role = turn.senderRole() != null ? turn.senderRole() : "PARTICIPANT";
                        content = turn.content() != null ? turn.content() : "";
                    }

                    // Check if new page needed
                    if (y < MARGIN + 40f) {
                        page = new PDPage(PDRectangle.A4);
                        doc.addPage(page);
                        y = page.getMediaBox().getHeight() - MARGIN;
                    }

                    PDPageContentStream turnStream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
                    turnStream.beginText();
                    turnStream.setFont(fontBold, FONT_SIZE_BODY);
                    turnStream.newLineAtOffset(MARGIN, y);
                    turnStream.showText("[" + role + "]");
                    turnStream.endText();
                    y -= LEADING;

                    List<String> wrappedLines = wrapText(content, 85);
                    turnStream.beginText();
                    turnStream.setFont(fontRegular, FONT_SIZE_BODY);
                    turnStream.newLineAtOffset(MARGIN + 10f, y);
                    for (String line : wrappedLines) {
                        if (y < MARGIN + 20f) {
                            turnStream.endText();
                            turnStream.close();
                            page = new PDPage(PDRectangle.A4);
                            doc.addPage(page);
                            y = page.getMediaBox().getHeight() - MARGIN;
                            turnStream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
                            turnStream.beginText();
                            turnStream.setFont(fontRegular, FONT_SIZE_BODY);
                            turnStream.newLineAtOffset(MARGIN + 10f, y);
                        }
                        turnStream.showText(sanitizeText(line));
                        turnStream.newLineAtOffset(0, -LEADING);
                        y -= LEADING;
                    }
                    turnStream.endText();
                    turnStream.close();
                    y -= 8f;
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private List<String> wrapText(String text, int maxChars) {
        List<String> lines = new ArrayList<>();
        if (text == null) return lines;
        String[] rawLines = text.split("\n");
        for (String raw : rawLines) {
            String remaining = raw.trim();
            while (remaining.length() > maxChars) {
                int splitIndex = remaining.lastIndexOf(' ', maxChars);
                if (splitIndex <= 0) splitIndex = maxChars;
                lines.add(remaining.substring(0, splitIndex).trim());
                remaining = remaining.substring(splitIndex).trim();
            }
            if (!remaining.isEmpty()) {
                lines.add(remaining);
            }
        }
        return lines;
    }

    private String sanitizeText(String line) {
        if (line == null) return "";
        // PDF standard fonts handle WinAnsiEncoding / ASCII
        return line.replaceAll("[^\\x20-\\x7E]", " ").trim();
    }
}
