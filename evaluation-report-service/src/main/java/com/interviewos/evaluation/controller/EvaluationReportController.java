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
        log.info("Received request to generate evaluation report for session {}", sessionId);
        DiagnosticReportResponse report = reportService.generateReport(sessionId);
        return ResponseEntity.status(HttpStatus.CREATED).body(report);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DiagnosticReportResponse> getReportById(@PathVariable Long id) {
        DiagnosticReportResponse report = reportService.getReportById(id);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<DiagnosticReportResponse> getReportBySessionId(@PathVariable Long sessionId) {
        DiagnosticReportResponse report = reportService.getReportBySessionId(sessionId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<List<DiagnosticReportResponse>> getCandidateReports(@PathVariable String candidateId) {
        List<DiagnosticReportResponse> reports = reportService.getCandidateReports(candidateId);
        return ResponseEntity.ok(reports);
    }
}