package com.interviewos.evaluation.controller;

import com.interviewos.evaluation.dto.DiagnosticReportResponse;
import com.interviewos.evaluation.service.EvaluationReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/reports")
//@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EvaluationReportController {

    private final EvaluationReportService reportService;

    @PostMapping("/generate/{sessionId}")
    public ResponseEntity<DiagnosticReportResponse> generateReport(@PathVariable Long sessionId) {
        long start = System.currentTimeMillis();
        log.info("📊 Synthesizing Diagnostic Report for Session ID: {}", sessionId);
        DiagnosticReportResponse report = reportService.generateReport(sessionId);
        long duration = System.currentTimeMillis() - start;
        log.info("✅ Diagnostic Report Generated: Session={}, Verdict={}, OverallScore={}/100, Tech={}/100, Integrity={}/100 in {}ms",
                sessionId, report.verdict(), report.overallScore(), report.scorecard().technicalAccuracy(), report.scorecard().integrityScore(), duration);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }

    @GetMapping(value = "/{sessionId}/human-transcript.pdf", produces = org.springframework.http.MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getTranscriptPdf(@PathVariable Long sessionId) {
        try {
            byte[] pdf = reportService.generateTranscriptPdf(sessionId);
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"transcript-session-" + sessionId + ".pdf\"")
                    .body(pdf);
        } catch (Exception e) {
            log.error("Failed to generate PDF for session {}: {}", sessionId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiagnosticReportResponse> getReportById(@PathVariable Long id) {
        log.info("Fetching report by Report ID: {}", id);
        DiagnosticReportResponse report = reportService.getReportById(id);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<DiagnosticReportResponse> getReportBySessionId(@PathVariable Long sessionId) {
        log.info("Fetching report by Session ID: {}", sessionId);
        DiagnosticReportResponse report = reportService.getReportBySessionId(sessionId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<DiagnosticReportResponse>> getCandidateReports(@PathVariable String candidateId) {
        log.info("Fetching all reports for candidate: {}", candidateId);
        List<DiagnosticReportResponse> reports = reportService.getCandidateReports(candidateId);
        log.info("Found {} reports for candidate: {}", reports.size(), candidateId);
        return ResponseEntity.ok(reports);
    }
}