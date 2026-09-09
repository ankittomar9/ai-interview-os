package com.interviewos.session.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.dto.OpenGateRequest;
import com.interviewos.session.dto.OpenGateResponse;
import com.interviewos.session.service.InterviewSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InternalSessionController.class)
class InternalSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InterviewSessionService sessionService;

    @Test
    @DisplayName("POST /internal/v1/sessions/{id}/sections/{index}/gate/open returns 200 with gateStatus OPEN")
    void testOpenSectionGate_success() throws Exception {
        OpenGateResponse response = new OpenGateResponse(0, "OPEN");
        when(sessionService.openSectionGate(eq(1L), eq(0), any())).thenReturn(response);

        OpenGateRequest req = new OpenGateRequest("APPROACH_AGREED", 10L);

        mockMvc.perform(post("/internal/v1/sessions/1/sections/0/gate/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sectionIndex").value(0))
                .andExpect(jsonPath("$.gateStatus").value("OPEN"));
    }

    @Test
    @DisplayName("POST /internal/v1/sessions/{id}/sections/{index}/gate/open returns 404 when section unknown")
    void testOpenSectionGate_unknownSection() throws Exception {
        when(sessionService.openSectionGate(eq(1L), eq(99), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "UNKNOWN_SECTION"));

        mockMvc.perform(post("/internal/v1/sessions/1/sections/99/gate/open")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /internal/v1/sessions/{id}/sections/{index}/gate/open returns 409 when gate already open")
    void testOpenSectionGate_alreadyOpen() throws Exception {
        when(sessionService.openSectionGate(eq(1L), eq(0), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "GATE_ALREADY_OPEN"));

        mockMvc.perform(post("/internal/v1/sessions/1/sections/0/gate/open")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict());
    }
}
