package com.interviewos.evaluation.controller;

import com.interviewos.evaluation.entity.ProgressLedger;
import com.interviewos.evaluation.service.ProgressLedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/progress")
@RequiredArgsConstructor
public class ProgressLedgerController {

    private final ProgressLedgerService progressLedgerService;

    @GetMapping("/{candidateId}")
    public ResponseEntity<List<ProgressLedger>> getCandidateProgress(
            @PathVariable String candidateId,
            @RequestParam(value = "track", required = false) String track
    ) {
        log.info("📊 Fetching progress ledger for candidate: {}, track: {}", candidateId, track);
        List<ProgressLedger> progress = progressLedgerService.getCandidateProgress(candidateId, track);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/{candidateId}/{track}")
    public ResponseEntity<List<ProgressLedger>> getCandidateProgressByTrack(
            @PathVariable String candidateId,
            @PathVariable String track
    ) {
        log.info("📊 Fetching progress ledger for candidate: {} on track: {}", candidateId, track);
        List<ProgressLedger> progress = progressLedgerService.getCandidateProgress(candidateId, track);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/{candidateId}/analytics")
    public ResponseEntity<ProgressLedgerService.ProgressAnalytics> getCandidateAnalytics(
            @PathVariable String candidateId,
            @RequestParam(value = "track", required = false) String track
    ) {
        log.info("📈 Fetching progress analytics for candidate: {}, track: {}", candidateId, track);
        ProgressLedgerService.ProgressAnalytics analytics = progressLedgerService.getCandidateAnalytics(candidateId, track);
        return ResponseEntity.ok(analytics);
    }
}
