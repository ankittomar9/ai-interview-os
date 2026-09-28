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
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

            // 2b. Section: Plan-vs-Actual Breakdown (C4)
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

            contentStream.close();

            // Extract questions and dialogue turns (V6-11)
            List<TranscriptPdfMeta.QuestionPresentedMeta> questions = extractQuestions(meta, transcriptTurns);
            List<DialogueTurn> dialogueTurns = extractDialogueTurns(meta, transcriptTurns);

            // 3. Section Header: Verbatim Dialogue History
            if (y < MARGIN + 40f) {
                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                y = page.getMediaBox().getHeight() - MARGIN;
            }

            PDPageContentStream stream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
            stream.beginText();
            stream.setFont(fontBold, FONT_SIZE_HEADING);
            stream.newLineAtOffset(MARGIN, y);
            stream.showText("Verbatim Dialogue History");
            stream.endText();
            y -= 20f;
            stream.close();

            // Render dialogue turns (only genuine CANDIDATE and INTERVIEWER turns)
            if (dialogueTurns.isEmpty()) {
                if (y < MARGIN + 20f) {
                    page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    y = page.getMediaBox().getHeight() - MARGIN;
                }
                stream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
                stream.beginText();
                stream.setFont(fontRegular, FONT_SIZE_BODY);
                stream.newLineAtOffset(MARGIN + 10f, y);
                stream.showText("(No verbatim dialogue turns recorded)");
                stream.endText();
                y -= LEADING + 5f;
                stream.close();
            } else {
                for (DialogueTurn dt : dialogueTurns) {
                    if (y < MARGIN + 35f) {
                        page = new PDPage(PDRectangle.A4);
                        doc.addPage(page);
                        y = page.getMediaBox().getHeight() - MARGIN;
                    }

                    stream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
                    stream.beginText();
                    stream.setFont(fontBold, FONT_SIZE_BODY);
                    stream.newLineAtOffset(MARGIN, y);
                    stream.showText(dt.role() + " (" + dt.relativeTime() + "):");
                    stream.endText();
                    y -= LEADING;

                    List<String> wrappedLines = wrapText(dt.content(), 85);
                    stream.beginText();
                    stream.setFont(fontRegular, FONT_SIZE_BODY);
                    stream.newLineAtOffset(MARGIN + 10f, y);
                    for (String line : wrappedLines) {
                        if (y < MARGIN + 20f) {
                            stream.endText();
                            stream.close();
                            page = new PDPage(PDRectangle.A4);
                            doc.addPage(page);
                            y = page.getMediaBox().getHeight() - MARGIN;
                            stream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
                            stream.beginText();
                            stream.setFont(fontRegular, FONT_SIZE_BODY);
                            stream.newLineAtOffset(MARGIN + 10f, y);
                        }
                        stream.showText(sanitizeText(line));
                        stream.newLineAtOffset(0, -LEADING);
                        y -= LEADING;
                    }
                    stream.endText();
                    stream.close();
                    y -= 8f;
                }
            }

            // 4. Questions presented in this session (printed once, after the dialogue, before integrity summary)
            if (y < MARGIN + 50f) {
                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                y = page.getMediaBox().getHeight() - MARGIN;
            }

            stream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
            stream.beginText();
            stream.setFont(fontBold, FONT_SIZE_HEADING);
            stream.newLineAtOffset(MARGIN, y);
            stream.showText("Questions presented in this session");
            stream.endText();
            y -= 16f;

            if (questions.isEmpty()) {
                stream.beginText();
                stream.setFont(fontRegular, FONT_SIZE_BODY);
                stream.newLineAtOffset(MARGIN + 10f, y);
                stream.showText("- No distinct problem statements recorded.");
                stream.endText();
                y -= LEADING;
            } else {
                for (TranscriptPdfMeta.QuestionPresentedMeta q : questions) {
                    if (y < MARGIN + 20f) {
                        stream.close();
                        page = new PDPage(PDRectangle.A4);
                        doc.addPage(page);
                        y = page.getMediaBox().getHeight() - MARGIN;
                        stream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
                    }
                    stream.beginText();
                    stream.setFont(fontRegular, FONT_SIZE_BODY);
                    stream.newLineAtOffset(MARGIN + 10f, y);
                    String qLine = String.format("- %s: %s [%s]",
                            q.slug() != null ? q.slug() : "unknown",
                            q.title() != null ? q.title() : (q.slug() != null ? q.slug() : "Problem"),
                            q.difficulty() != null ? q.difficulty().toUpperCase() : "STANDARD");
                    stream.showText(sanitizeText(qLine));
                    stream.endText();
                    y -= LEADING;
                }
            }
            y -= 14f;
            stream.close();

            // 5. Section: Integrity Summary (A13 - explicit zeros rendered, printed after dialogue & questions)
            if (y < MARGIN + 40f) {
                page = new PDPage(PDRectangle.A4);
                doc.addPage(page);
                y = page.getMediaBox().getHeight() - MARGIN;
            }

            stream = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true);
            stream.beginText();
            stream.setFont(fontBold, FONT_SIZE_BODY);
            stream.newLineAtOffset(MARGIN, y);
            stream.showText("Integrity Summary: ");
            stream.setFont(fontRegular, FONT_SIZE_BODY);
            int echo = meta != null && meta.echoFilteredCount() != null ? meta.echoFilteredCount() : 0;
            int dropped = meta != null && meta.droppedChunks() != null ? meta.droppedChunks() : 0;
            int downgrades = meta != null && meta.consentDowngrades() != null ? meta.consentDowngrades() : 0;
            String prov = meta != null && meta.workspaceProvenance() != null ? meta.workspaceProvenance() : "LOCAL_SANDBOX";
            String integrityLine = String.format("Echo Filtered: %d filtered  |  Dropped Chunks: %d  |  Consent Downgrades: %d  |  Workspace: %s",
                    echo, dropped, downgrades, prov);
            stream.showText(integrityLine);
            stream.endText();
            stream.close();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    private record DialogueTurn(String role, String relativeTime, String content) {}

    private Instant resolveSessionStart(TranscriptPdfMeta meta, List<?> transcriptTurns) {
        if (meta != null && meta.sessionStartTime() != null) {
            return meta.sessionStartTime();
        }
        if (transcriptTurns != null) {
            for (Object turnObj : transcriptTurns) {
                if (turnObj instanceof com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto turn) {
                    if (turn.timestamp() != null) {
                        return turn.timestamp();
                    }
                }
            }
        }
        return null;
    }

    private List<DialogueTurn> extractDialogueTurns(TranscriptPdfMeta meta, List<?> transcriptTurns) {
        List<DialogueTurn> result = new ArrayList<>();
        if (transcriptTurns == null || transcriptTurns.isEmpty()) {
            return result;
        }

        Instant sessionStart = resolveSessionStart(meta, transcriptTurns);

        for (Object turnObj : transcriptTurns) {
            if (turnObj instanceof com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto turn) {
                String role = turn.senderRole() != null ? turn.senderRole().toUpperCase() : "";
                String type = turn.messageType() != null ? turn.messageType().toUpperCase() : "";

                // Exclude problem statements and system/execution turns
                if (isNonDialogueTurn(role, type, turn)) {
                    continue;
                }

                String normalizedRole;
                if ("CANDIDATE".equals(role) || "USER".equals(role)) {
                    normalizedRole = "CANDIDATE";
                } else if ("INTERVIEWER".equals(role) || "AI".equals(role)) {
                    normalizedRole = "INTERVIEWER";
                } else {
                    continue; // exclude SYSTEM, PROBLEM, or unrecognized non-dialogue roles
                }

                String relTime = "00:00";
                if (turn.timestamp() != null && sessionStart != null) {
                    long secs = Math.max(0, Duration.between(sessionStart, turn.timestamp()).getSeconds());
                    long mm = secs / 60;
                    long ss = secs % 60;
                    relTime = String.format("%02d:%02d", mm, ss);
                }

                String content = turn.content() != null ? turn.content() : "";
                result.add(new DialogueTurn(normalizedRole, relTime, content));
            } else if (turnObj != null) {
                // Generic turn fallback if not TranscriptMessageDto
                String raw = turnObj.toString();
                result.add(new DialogueTurn("CANDIDATE", "00:00", raw));
            }
        }
        return result;
    }

    private boolean isNonDialogueTurn(String role, String type, com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto turn) {
        if ("SYSTEM".equals(role) || "PROBLEM".equals(role)) {
            return true;
        }
        if ("PROBLEM_STATEMENT".equals(type) || "PROBLEM".equals(type)
                || "CODE_EXECUTION".equals(type) || "CODE_SUBMISSION".equals(type)
                || "ENGINE_ERROR".equals(type) || "SYSTEM".equals(type) || "SYSTEM_EVENT".equals(type)) {
            return true;
        }
        if (turn.metadata() != null) {
            if ("true".equalsIgnoreCase(turn.metadata().get("isProblemStatement"))
                    || "PROBLEM_STATEMENT".equalsIgnoreCase(turn.metadata().get("turnType"))) {
                return true;
            }
        }
        return false;
    }

    private List<TranscriptPdfMeta.QuestionPresentedMeta> extractQuestions(TranscriptPdfMeta meta, List<?> transcriptTurns) {
        Map<String, TranscriptPdfMeta.QuestionPresentedMeta> questionsBySlug = new LinkedHashMap<>();

        // 1. From meta if provided
        if (meta != null && meta.questionsPresented() != null) {
            for (TranscriptPdfMeta.QuestionPresentedMeta q : meta.questionsPresented()) {
                if (q != null && q.slug() != null && !q.slug().isBlank()) {
                    questionsBySlug.put(q.slug(), q);
                }
            }
        }

        // 2. From transcript turns (look for problem statements / metadata)
        if (transcriptTurns != null) {
            for (Object turnObj : transcriptTurns) {
                if (turnObj instanceof com.interviewos.evaluation.client.SessionServiceClient.TranscriptMessageDto turn) {
                    Map<String, String> m = turn.metadata();
                    String slug = null;
                    String title = null;
                    String difficulty = "MEDIUM";

                    if (m != null) {
                        slug = m.get("problemSlug") != null ? m.get("problemSlug") : m.get("slug");
                        title = m.get("title") != null ? m.get("title") : m.get("problemTitle");
                        if (m.get("difficulty") != null) {
                            difficulty = m.get("difficulty");
                        }
                    }

                    // Content matching fallback: [problem:slug]
                    if ((slug == null || slug.isBlank()) && turn.content() != null) {
                        Matcher mat = Pattern.compile("\\[problem:([a-zA-Z0-9_-]+)\\]").matcher(turn.content());
                        if (mat.find()) {
                            slug = mat.group(1);
                        }
                    }

                    if (slug != null && !slug.isBlank() && !questionsBySlug.containsKey(slug)) {
                        if (title == null || title.isBlank()) {
                            title = humanizeSlug(slug);
                        }
                        questionsBySlug.put(slug, new TranscriptPdfMeta.QuestionPresentedMeta(slug, title, difficulty));
                    }
                }
            }
        }

        return new ArrayList<>(questionsBySlug.values());
    }

    private String humanizeSlug(String slug) {
        if (slug == null) return "";
        String[] parts = slug.split("[-_]");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (!part.isEmpty()) {
                if (sb.length() > 0) sb.append(" ");
                sb.append(Character.toUpperCase(part.charAt(0)));
                if (part.length() > 1) {
                    sb.append(part.substring(1).toLowerCase());
                }
            }
        }
        return sb.toString();
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
