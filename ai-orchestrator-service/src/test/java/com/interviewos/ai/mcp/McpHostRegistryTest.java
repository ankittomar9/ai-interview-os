package com.interviewos.ai.mcp;

import com.interviewos.ai.service.EgressTracker;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class McpHostRegistryTest {

    private EgressTracker egressTracker;
    private McpHostRegistry registry;

    @BeforeEach
    void setUp() {
        egressTracker = new EgressTracker();
        registry = new McpHostRegistry(egressTracker);
        registry.initFirstPartyServers();
    }

    @Test
    @DisplayName("P1-01: First-party MCP servers are auto-registered with expected tools and permissions")
    void testFirstPartyServersInitialization() {
        List<McpModels.ServerInfo> servers = registry.listServers();
        assertEquals(3, servers.size(), "Expected 3 seeded first-party MCP servers");

        assertTrue(servers.stream().anyMatch(s -> "database-mcp".equals(s.getName())));
        assertTrue(servers.stream().anyMatch(s -> "file-repo-mcp".equals(s.getName())));
        assertTrue(servers.stream().anyMatch(s -> "terminal-mcp".equals(s.getName())));

        List<McpModels.ToolDefinition> tools = registry.listAllTools();
        assertEquals(8, tools.size(), "Expected 8 tools across first-party MCP servers");
    }

    @Test
    @DisplayName("P1-02: Database MCP server allows schema inspection and valid SELECT queries")
    void testDatabaseMcpTools() {
        // 1. list_tables
        McpModels.ToolCallRequest listReq = McpModels.ToolCallRequest.builder()
                .serverName("database-mcp")
                .toolName("list_tables")
                .build();
        McpModels.ToolCallResult listRes = registry.executeToolCall(listReq, Duration.ofSeconds(2));
        assertFalse(listRes.isError());
        assertTrue(listRes.getContent().get(0).get("text").toString().contains("users"));

        // 2. describe_table
        McpModels.ToolCallRequest descReq = McpModels.ToolCallRequest.builder()
                .serverName("database-mcp")
                .toolName("describe_table")
                .arguments(Map.of("tableName", "orders"))
                .build();
        McpModels.ToolCallResult descRes = registry.executeToolCall(descReq, Duration.ofSeconds(2));
        assertFalse(descRes.isError());
        assertTrue(descRes.getContent().get(0).get("text").toString().contains("total_amount"));

        // 3. execute_query valid SELECT
        McpModels.ToolCallRequest queryReq = McpModels.ToolCallRequest.builder()
                .serverName("database-mcp")
                .toolName("execute_query")
                .arguments(Map.of("query", "SELECT * FROM orders WHERE status = 'COMPLETED'"))
                .build();
        McpModels.ToolCallResult queryRes = registry.executeToolCall(queryReq, Duration.ofSeconds(2));
        assertFalse(queryRes.isError());
        assertTrue(queryRes.getContent().get(0).get("text").toString().contains("2 rows returned"));

        // 4. execute_query non-SELECT is rejected
        McpModels.ToolCallRequest dropReq = McpModels.ToolCallRequest.builder()
                .serverName("database-mcp")
                .toolName("execute_query")
                .arguments(Map.of("query", "DROP TABLE users"))
                .build();
        McpModels.ToolCallResult dropRes = registry.executeToolCall(dropReq, Duration.ofSeconds(2));
        assertTrue(dropRes.isError());
        assertTrue(dropRes.getErrorMessage().contains("Permission Denied"));
    }

    @Test
    @DisplayName("P1-03: File/Repo MCP server reads workspace files and searches code")
    void testFileRepoMcpTools() {
        // 1. list_files
        McpModels.ToolCallRequest listReq = McpModels.ToolCallRequest.builder()
                .serverName("file-repo-mcp")
                .toolName("list_files")
                .build();
        McpModels.ToolCallResult listRes = registry.executeToolCall(listReq, Duration.ofSeconds(2));
        assertFalse(listRes.isError());
        assertTrue(listRes.getContent().get(0).get("text").toString().contains("OrderService.java"));

        // 2. read_file
        McpModels.ToolCallRequest readReq = McpModels.ToolCallRequest.builder()
                .serverName("file-repo-mcp")
                .toolName("read_file")
                .arguments(Map.of("path", "src/main/java/OrderService.java"))
                .build();
        McpModels.ToolCallResult readRes = registry.executeToolCall(readReq, Duration.ofSeconds(2));
        assertFalse(readRes.isError());
        assertTrue(readRes.getContent().get(0).get("text").toString().contains("createOrder"));

        // 3. search_code
        McpModels.ToolCallRequest searchReq = McpModels.ToolCallRequest.builder()
                .serverName("file-repo-mcp")
                .toolName("search_code")
                .arguments(Map.of("query", "@RestController"))
                .build();
        McpModels.ToolCallResult searchRes = registry.executeToolCall(searchReq, Duration.ofSeconds(2));
        assertFalse(searchRes.isError());
        assertTrue(searchRes.getContent().get(0).get("text").toString().contains("OrderController.java"));
    }

    @Test
    @DisplayName("P1-04: Terminal MCP server enforces whitelist and sandbox execution bounds")
    void testTerminalMcpTools() {
        // 1. Allowed command
        McpModels.ToolCallRequest mvnReq = McpModels.ToolCallRequest.builder()
                .serverName("terminal-mcp")
                .toolName("run_command")
                .arguments(Map.of("command", "mvn test"))
                .build();
        McpModels.ToolCallResult mvnRes = registry.executeToolCall(mvnReq, Duration.ofSeconds(2));
        assertFalse(mvnRes.isError());
        assertTrue(mvnRes.getContent().get(0).get("text").toString().contains("BUILD SUCCESS"));

        // 2. Disallowed command
        McpModels.ToolCallRequest rmReq = McpModels.ToolCallRequest.builder()
                .serverName("terminal-mcp")
                .toolName("run_command")
                .arguments(Map.of("command", "rm -rf /"))
                .build();
        McpModels.ToolCallResult rmRes = registry.executeToolCall(rmReq, Duration.ofSeconds(2));
        assertTrue(rmRes.isError());
        assertTrue(rmRes.getErrorMessage().contains("Permission Denied"));
    }

    @Test
    @DisplayName("P1-05: Permission gating rejects unauthorized tool call without throwing 500")
    void testPermissionGatingNegative() {
        // Register a server with NO granted permissions
        registry.registerInProcessServer(
                "restricted-server",
                req -> McpProtocol.Response.builder().jsonrpc("2.0").id(req.getId()).result(Map.of()).build(),
                List.of(McpModels.ToolDefinition.builder()
                        .serverName("restricted-server")
                        .name("restricted_tool")
                        .requiredPermissions(List.of("admin:super"))
                        .build()),
                Set.of() // empty permissions
        );

        McpModels.ToolCallRequest req = McpModels.ToolCallRequest.builder()
                .serverName("restricted-server")
                .toolName("restricted_tool")
                .build();

        McpModels.ToolCallResult res = registry.executeToolCall(req, Duration.ofSeconds(2));
        assertTrue(res.isError(), "Tool call must fail due to missing permission");
        assertTrue(res.getErrorMessage().contains("missing permission admin:super"));
    }

    @Test
    @DisplayName("P1-06: Egress accounting records cloud egress for remote HTTP MCP transports")
    void testEgressAccountingForRemoteMcp() {
        assertEquals(0, egressTracker.getCloudCallCount());

        // Create mock remote HTTP transport
        McpTransport remoteHttp = new McpTransport() {
            @Override
            public McpProtocol.Response send(McpProtocol.Request request, Duration timeout) {
                return McpProtocol.Response.builder()
                        .jsonrpc("2.0")
                        .id(request.getId())
                        .result(Map.of("content", List.of(Map.of("type", "text", "text", "remote ok"))))
                        .build();
            }

            @Override
            public String getTransportType() {
                return "STREAMABLE_HTTP";
            }

            @Override
            public boolean isHealthy() {
                return true;
            }
        };

        registry.registerServer("remote-agent-hub", remoteHttp, Set.of("agent:read"));
        registry.executeToolCall(McpModels.ToolCallRequest.builder()
                .serverName("remote-agent-hub")
                .toolName("ping")
                .build(), Duration.ofSeconds(2));

        assertEquals(1, egressTracker.getCloudCallCount(), "EgressTracker must record 1 cloud call for remote MCP invocation");
        assertTrue(egressTracker.getDestinations().contains("MCP:REMOTE-AGENT-HUB"));
    }
}
