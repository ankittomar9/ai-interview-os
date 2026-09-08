package com.interviewos.session.controller;

import com.interviewos.session.dto.DashboardStatsResponse;
import com.interviewos.session.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/api/v1/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getStats(
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(userId));
    }

    @GetMapping("/api/v1/practice/dashboard")
    public ResponseEntity<DashboardStatsResponse> getPracticeDashboard(
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(userId));
    }

    @GetMapping("/api/v1/sessions/dashboard")
    public ResponseEntity<DashboardStatsResponse> getSessionsDashboard(
            @RequestParam(value = "userId", defaultValue = "local") String userId
    ) {
        return ResponseEntity.ok(dashboardService.getDashboardStats(userId));
    }
}
