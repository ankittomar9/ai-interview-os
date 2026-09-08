package com.interviewos.session.controller;

import com.interviewos.session.dto.LearnTreeResponse;
import com.interviewos.session.dto.LearnTreeResponse.TopicNode;
import com.interviewos.session.service.LearnTreeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(LearnTreeController.class)
class LearnTreeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LearnTreeService learnTreeService;

    @Test
    @DisplayName("GET /api/v1/learn/tree returns 200 OK with expected JSON structure")
    void testGetLearnTreeEndpoint() throws Exception {
        TopicNode arraysNode = new TopicNode(
                "arrays",
                "Arrays",
                "ALGORITHMS_DATA_STRUCTURES",
                56,
                2,
                2,
                1,
                0,
                "Practice ×2 · Interview 1/1",
                List.of()
        );

        LearnTreeResponse mockResponse = new LearnTreeResponse(
                List.of(arraysNode),
                Map.of("ALGORITHMS_DATA_STRUCTURES", 316),
                false
        );

        when(learnTreeService.getLearnTree(eq("test-user"))).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/learn/tree").param("userId", "test-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stale").value(false))
                .andExpect(jsonPath("$.trackTotals.ALGORITHMS_DATA_STRUCTURES").value(316))
                .andExpect(jsonPath("$.topics[0].topicId").value("arrays"))
                .andExpect(jsonPath("$.topics[0].total").value(56))
                .andExpect(jsonPath("$.topics[0].pressureGap").value("Practice ×2 · Interview 1/1"));
    }

    @Test
    @DisplayName("GET /api/v1/sessions/learn/tree dual-mapping works identically")
    void testDualMappingEndpoint() throws Exception {
        LearnTreeResponse mockResponse = new LearnTreeResponse(List.of(), Map.of(), true);
        when(learnTreeService.getLearnTree(eq("local"))).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/sessions/learn/tree"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stale").value(true));
    }
}
