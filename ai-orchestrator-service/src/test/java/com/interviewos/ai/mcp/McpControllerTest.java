package com.interviewos.ai.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewos.ai.service.EgressTracker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class McpControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        McpHostRegistry registry = new McpHostRegistry(new EgressTracker());
        registry.initFirstPartyServers();
        McpController controller = new McpController(registry);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    @DisplayName("P1-07: GET /api/v1/mcp/servers returns list of active MCP servers")
    void testGetServers() throws Exception {
        mockMvc.perform(get("/api/v1/mcp/servers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").exists());
    }

    @Test
    @DisplayName("P1-08: GET /api/v1/mcp/tools returns list of registered tools")
    void testGetTools() throws Exception {
        mockMvc.perform(get("/api/v1/mcp/tools"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").exists())
                .andExpect(jsonPath("$[0].serverName").exists());
    }

    @Test
    @DisplayName("P1-09: POST /api/v1/mcp/tools/call dispatches tool execution successfully")
    void testCallTool() throws Exception {
        McpModels.ToolCallRequest request = McpModels.ToolCallRequest.builder()
                .serverName("database-mcp")
                .toolName("list_tables")
                .build();

        mockMvc.perform(post("/api/v1/mcp/tools/call")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serverName").value("database-mcp"))
                .andExpect(jsonPath("$.toolName").value("list_tables"))
                .andExpect(jsonPath("$.isError").value(false));
    }
}
