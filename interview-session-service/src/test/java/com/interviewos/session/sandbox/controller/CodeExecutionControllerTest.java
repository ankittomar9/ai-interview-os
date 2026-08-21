package com.interviewos.session.sandbox.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.session.sandbox.dto.ExecuteCodeRequest;
import com.interviewos.session.sandbox.dto.ExecutionResultResponse;
import com.interviewos.session.sandbox.service.CodeExecutionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CodeExecutionController.class)
class CodeExecutionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CodeExecutionService executionService;

    @Test
    @DisplayName("POST /api/v1/sessions/1/execute should return 200 OK with test fixture execution breakdown")
    void testExecuteCode() throws Exception {
        ExecuteCodeRequest request = new ExecuteCodeRequest(
                "java",
                "public class ReverseString { public static String reverse(String str) { return new StringBuilder(str).reverse().toString(); } }",
                "reverse-a-string"
        );

        ExecutionResultResponse mockResponse = ExecutionResultResponse.builder()
                .status("PASSED")
                .totalTests(4)
                .passedTests(4)
                .executionTimeMs(1.4)
                .memoryUsedMb(22.1)
                .stdout("All test cases passed successfully.")
                .stderr("")
                .compilerOutput("")
                .testResults(List.of(
                        ExecutionResultResponse.TestCaseResult.builder()
                                .name("Sample 1: Basic Inversion")
                                .status("PASS")
                                .durationMs(0.8)
                                .input("Hello, World!")
                                .expectedOutput("!dlroW ,olleH")
                                .actualOutput("!dlroW ,olleH")
                                .isHidden(false)
                                .build()
                ))
                .build();

        when(executionService.executeCode(eq(1L), any(ExecuteCodeRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/sessions/1/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PASSED"))
                .andExpect(jsonPath("$.totalTests").value(4))
                .andExpect(jsonPath("$.passedTests").value(4))
                .andExpect(jsonPath("$.testResults[0].status").value("PASS"));
    }
}
