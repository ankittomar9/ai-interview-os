package com.interviewos.session.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.dto.CandidateProfileRequest;
import com.interviewos.session.dto.CandidateProfileResponse;
import com.interviewos.session.service.CandidateProfileService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CandidateProfileController.class)
class CandidateProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CandidateProfileService profileService;

    @Test
    @DisplayName("GET /api/v1/profile returns candidate profile")
    void testGetProfile() throws Exception {
        CandidateProfileResponse resp = new CandidateProfileResponse(
                1L,
                "local",
                "Jane Doe",
                "Staff Systems Engineer",
                "Vertex Global",
                "Scale event streams",
                "Jane resume",
                null,
                "TECH",
                true,
                Instant.now(),
                Instant.now()
        );

        when(profileService.getProfile("local")).thenReturn(resp);

        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.userId").value("local"))
                .andExpect(jsonPath("$.fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.targetRole").value("Staff Systems Engineer"))
                .andExpect(jsonPath("$.hasResume").value(true));
    }

    @Test
    @DisplayName("PUT /api/v1/profile updates candidate profile")
    void testUpsertProfile() throws Exception {
        CandidateProfileRequest req = new CandidateProfileRequest(
                "local",
                "Jane Doe",
                "Principal Architect",
                "Vertex Global",
                "Kafka and Cassandra",
                "Jane resume text",
                null,
                "TECH"
        );

        CandidateProfileResponse resp = new CandidateProfileResponse(
                1L,
                "local",
                "Jane Doe",
                "Principal Architect",
                "Vertex Global",
                "Kafka and Cassandra",
                "Jane resume text",
                null,
                "TECH",
                true,
                Instant.now(),
                Instant.now()
        );

        when(profileService.upsertProfile(any(CandidateProfileRequest.class))).thenReturn(resp);

        mockMvc.perform(put("/api/v1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.targetRole").value("Principal Architect"));
    }

    @Test
    @DisplayName("POST /api/v1/profile/resume with JSON payload updates resume text")
    void testUpdateResumeJson() throws Exception {
        CandidateProfileResponse resp = new CandidateProfileResponse(
                1L,
                "local",
                "Jane Doe",
                "Staff Systems Engineer",
                "Vertex Global",
                null,
                "Updated resume text",
                null,
                "TECH",
                true,
                Instant.now(),
                Instant.now()
        );

        when(profileService.updateResume(eq("local"), eq("Updated resume text"), any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/profile/resume")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("resumeText", "Updated resume text"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasResume").value(true))
                .andExpect(jsonPath("$.resumeText").value("Updated resume text"));
    }

    @Test
    @DisplayName("POST /api/v1/profile/resume with Multipart file parses file and updates resume")
    void testUpdateResumeMultipart() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "resume.txt",
                "text/plain",
                "Resume content from uploaded file".getBytes()
        );

        CandidateProfileResponse resp = new CandidateProfileResponse(
                1L,
                "local",
                "Jane Doe",
                "Staff Systems Engineer",
                "Vertex Global",
                null,
                "Resume content from uploaded file",
                "resume.txt",
                "TECH",
                true,
                Instant.now(),
                Instant.now()
        );

        when(profileService.updateResume(eq("local"), any(), any())).thenReturn(resp);

        mockMvc.perform(multipart("/api/v1/profile/resume").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasResume").value(true));
    }
}
