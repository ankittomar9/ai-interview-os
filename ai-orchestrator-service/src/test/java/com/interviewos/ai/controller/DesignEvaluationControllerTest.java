package com.interviewos.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.dto.DesignEvaluationRequest;
import com.interviewos.ai.dto.DesignEvaluationResponse;
import com.interviewos.ai.model.ModelProvider;
import com.interviewos.ai.service.DesignEvaluationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DesignEvaluationController.class)
class DesignEvaluationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DesignEvaluationService designEvaluationService;

    @Test
    @DisplayName("POST /api/v1/ai/design-evaluate should return evaluation response")
    void testDesignEvaluateSuccess() throws Exception {
        DesignEvaluationRequest request = new DesignEvaluationRequest(
                1L,
                "att-json-123",
                "att-png-456",
                new DesignEvaluationRequest.DesignRequirements("10M", "3x", "10:1"),
                ModelProvider.GEMINI,
                "test-api-key"
        );

        DesignEvaluationResponse response = new DesignEvaluationResponse(
                List.of("Redis cache effectively shields SQL Store from read throughput.", "Single point of failure at API Gateway."),
                88,
                "Observed nodes: Gateway -> App Service -> Redis -> SQL Store",
                true,
                "VISION"
        );

        when(designEvaluationService.evaluateDesign(any(DesignEvaluationRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/ai/design-evaluate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(88))
                .andExpect(jsonPath("$.llmGenerated").value(true))
                .andExpect(jsonPath("$.feedback[0]").value("Redis cache effectively shields SQL Store from read throughput."))
                .andExpect(jsonPath("$.evidence").value("Observed nodes: Gateway -> App Service -> Redis -> SQL Store"));
    }
}
