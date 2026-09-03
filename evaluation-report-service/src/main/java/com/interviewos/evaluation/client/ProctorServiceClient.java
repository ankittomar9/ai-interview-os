package com.interviewos.evaluation.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "proctor-sentinel-service", url = "${PROCTOR_SERVICE_URL:http://proctor-sentinel-service:8083}")
public interface ProctorServiceClient {

    @GetMapping("/api/v1/proctor/session/{sessionId}/summary")
    ProctorSummaryDto getSessionSummary(@PathVariable("sessionId") Long sessionId);

    record ProctorSummaryDto(
            Long sessionId,
            int integrityScore,
            String riskLevel,
            String integrityVerdict,
            long totalEventsCount,
            int tabSwitchCount,
            int pasteDumpCount,
            List<String> anomalyFlags
    ) {}
}