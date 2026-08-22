package com.interviewos.session.controller;

import com.interviewos.session.service.SystemCapabilitiesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/system")
@RequiredArgsConstructor
public class SystemCapabilitiesController {

    private final SystemCapabilitiesService systemCapabilitiesService;

    @GetMapping("/capabilities")
    public ResponseEntity<SystemCapabilitiesService.SystemCapabilitiesResponse> getCapabilities() {
        log.debug("GET /api/v1/system/capabilities requested");
        SystemCapabilitiesService.SystemCapabilitiesResponse response = systemCapabilitiesService.getCapabilities();
        return ResponseEntity.ok(response);
    }
}
