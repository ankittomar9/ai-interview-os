package com.interviewos.session.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.dto.UserNoteRequest;
import com.interviewos.session.dto.UserNoteResponse;
import com.interviewos.session.service.UserNoteService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserNoteController.class)
class UserNoteControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserNoteService userNoteService;

    @Test
    @DisplayName("GET /api/v1/learn/notes/{slug} returns 200 and note")
    void testGetNoteReturnsOk() throws Exception {
        UserNoteResponse resp = new UserNoteResponse(1L, "local", "dsa-two-sum-target", "Sample note", Instant.now(), Instant.now());
        when(userNoteService.getNote("local", "dsa-two-sum-target")).thenReturn(resp);

        mockMvc.perform(get("/api/v1/learn/notes/dsa-two-sum-target?userId=local"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionSlug").value("dsa-two-sum-target"))
                .andExpect(jsonPath("$.body").value("Sample note"));
    }

    @Test
    @DisplayName("PUT /api/v1/learn/notes/{slug} returns 200 on success")
    void testUpsertNoteReturnsOk() throws Exception {
        UserNoteResponse resp = new UserNoteResponse(1L, "local", "dsa-two-sum-target", "Updated note", Instant.now(), Instant.now());
        when(userNoteService.upsertNote(eq("local"), eq("dsa-two-sum-target"), eq("Updated note"))).thenReturn(resp);

        mockMvc.perform(put("/api/v1/learn/notes/dsa-two-sum-target?userId=local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UserNoteRequest("Updated note"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.body").value("Updated note"));
    }

    @Test
    @DisplayName("PUT /api/v1/learn/notes/{slug} returns 400 when body is blank")
    void testUpsertNoteReturns400OnBlank() throws Exception {
        when(userNoteService.upsertNote(eq("local"), eq("dsa-two-sum-target"), eq("   ")))
                .thenThrow(new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note body cannot be blank"));

        mockMvc.perform(put("/api/v1/learn/notes/dsa-two-sum-target?userId=local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UserNoteRequest("   "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/v1/learn/notes/{slug} returns 404 when slug is unknown")
    void testUpsertNoteReturns404OnUnknownSlug() throws Exception {
        when(userNoteService.upsertNote(eq("local"), eq("unknown-slug"), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "Unknown question slug: unknown-slug"));

        mockMvc.perform(put("/api/v1/learn/notes/unknown-slug?userId=local")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UserNoteRequest("Some body"))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/v1/learn/notes/{slug} returns 204")
    void testDeleteNoteReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/learn/notes/dsa-two-sum-target?userId=local"))
                .andExpect(status().isNoContent());
    }
}
