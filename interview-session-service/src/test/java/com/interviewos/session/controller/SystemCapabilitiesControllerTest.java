package com.interviewos.session.controller;

import com.interviewos.session.service.SystemCapabilitiesService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SystemCapabilitiesController.class)
class SystemCapabilitiesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SystemCapabilitiesService systemCapabilitiesService;

    @Test
    @DisplayName("GET /api/v1/system/capabilities should return 200 OK with all engines and fail-safe readiness")
    void testGetCapabilitiesSuccess() throws Exception {
        SystemCapabilitiesService.SystemCapabilitiesResponse mockResponse = SystemCapabilitiesService.SystemCapabilitiesResponse.builder()
                .engines(Map.of(
                        "dsa", new SystemCapabilitiesService.EngineStatus(true, "Judge0 CE online"),
                        "lld", new SystemCapabilitiesService.EngineStatus(false, "Docker socket unavailable"),
                        "hld", new SystemCapabilitiesService.EngineStatus(true, "React Flow Canvas ready"),
                        "behavioral", new SystemCapabilitiesService.EngineStatus(true, "Voice dialogue ready")
                ))
                .services(Map.of(
                        "postgres", true,
                        "mongo", true,
                        "eureka", true,
                        "orchestrator", true
                ))
                .storage(new SystemCapabilitiesService.StorageMetrics(10, 2048000))
                .checkedAt(Instant.now().toString())
                .build();

        when(systemCapabilitiesService.getCapabilities()).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/system/capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.engines.dsa.ready").value(true))
                .andExpect(jsonPath("$.engines.dsa.state").value("ONLINE"))
                .andExpect(jsonPath("$.engines.lld.ready").value(false))
                .andExpect(jsonPath("$.engines.lld.state").value("DOWN"))
                .andExpect(jsonPath("$.engines.hld.ready").value(true))
                .andExpect(jsonPath("$.engines.behavioral.ready").value(true))
                .andExpect(jsonPath("$.storage.gridFsAttachmentCount").value(10))
                .andExpect(jsonPath("$.checkedAt").exists());
    }

    @Test
    @DisplayName("GET /api/v1/system/capabilities should return STARTING state for warming engines")
    void testGetCapabilitiesStartingState() throws Exception {
        SystemCapabilitiesService.SystemCapabilitiesResponse mockResponse = SystemCapabilitiesService.SystemCapabilitiesResponse.builder()
                .engines(Map.of(
                        "dsa", new SystemCapabilitiesService.EngineStatus(false, "STARTING", "Starting… engines warming up", null),
                        "lld", new SystemCapabilitiesService.EngineStatus(false, "STARTING", "Starting… engines warming up", null)
                ))
                .services(Map.of("postgres", true))
                .storage(new SystemCapabilitiesService.StorageMetrics(0, 0))
                .checkedAt(Instant.now().toString())
                .build();

        when(systemCapabilitiesService.getCapabilities()).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/system/capabilities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.engines.dsa.ready").value(false))
                .andExpect(jsonPath("$.engines.dsa.state").value("STARTING"))
                .andExpect(jsonPath("$.engines.dsa.detail").value("Starting… engines warming up"))
                .andExpect(jsonPath("$.engines.lld.ready").value(false))
                .andExpect(jsonPath("$.engines.lld.state").value("STARTING"));
    }
}
