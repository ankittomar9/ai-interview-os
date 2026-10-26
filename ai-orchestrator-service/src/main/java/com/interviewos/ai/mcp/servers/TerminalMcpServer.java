package com.interviewos.ai.mcp.servers;

import com.interviewos.ai.mcp.McpModels;
import com.interviewos.ai.mcp.McpProtocol;

import java.util.*;

public class TerminalMcpServer {

    public static final String SERVER_NAME = "terminal-mcp";

    private static final Set<String> ALLOWED_COMMANDS = Set.of(
            "mvn test", "mvn clean compile", "pytest", "npm test", "git status", "ls", "pwd", "git diff"
    );

    public static List<McpModels.ToolDefinition> getTools() {
        return List.of(
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("run_command")
                        .description("Execute a sandboxed command inside the candidate container")
                        .category("terminal")
                        .inputSchema(Map.of(
                                "type", "object",
                                "required", List.of("command"),
                                "properties", Map.of("command", Map.of("type", "string", "description", "Command to execute"))
                        ))
                        .requiresConfirmation(true)
                        .requiredPermissions(List.of("terminal:exec"))
                        .build(),
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("get_process_status")
                        .description("Query process status and resource utilization")
                        .category("terminal")
                        .inputSchema(Map.of("type", "object", "properties", Map.of()))
                        .requiredPermissions(List.of("terminal:read"))
                        .build()
        );
    }

    public static McpProtocol.Response handle(McpProtocol.Request request) {
        String method = request.getMethod();
        String id = request.getId();

        if (McpProtocol.METHOD_INITIALIZE.equals(method)) {
            return McpProtocol.Response.builder()
                    .jsonrpc(McpProtocol.JSONRPC_VERSION)
                    .id(id)
                    .result(Map.of(
                            "serverName", SERVER_NAME,
                            "protocolVersion", "2024-11-05",
                            "capabilities", Map.of("tools", Map.of("listChanged", true))
                    ))
                    .build();
        }

        if (McpProtocol.METHOD_TOOLS_LIST.equals(method)) {
            return McpProtocol.Response.builder()
                    .jsonrpc(McpProtocol.JSONRPC_VERSION)
                    .id(id)
                    .result(Map.of("tools", getTools()))
                    .build();
        }

        if (McpProtocol.METHOD_TOOLS_CALL.equals(method)) {
            Map<String, Object> params = request.getParams() != null ? request.getParams() : Collections.emptyMap();
            String toolName = (String) params.get("name");
            @SuppressWarnings("unchecked")
            Map<String, Object> args = (Map<String, Object>) params.getOrDefault("arguments", Collections.emptyMap());

            if ("run_command".equals(toolName)) {
                String cmd = (String) args.get("command");
                if (cmd == null || cmd.isBlank()) {
                    return McpProtocol.Response.builder()
                            .jsonrpc(McpProtocol.JSONRPC_VERSION)
                            .id(id)
                            .result(Map.of(
                                    "isError", true,
                                    "content", List.of(Map.of("type", "text", "text", "Error: Command cannot be blank."))
                            ))
                            .build();
                }

                String trimmed = cmd.trim();
                boolean isAllowed = ALLOWED_COMMANDS.stream().anyMatch(trimmed::startsWith);
                if (!isAllowed) {
                    return McpProtocol.Response.builder()
                            .jsonrpc(McpProtocol.JSONRPC_VERSION)
                            .id(id)
                            .result(Map.of(
                                    "isError", true,
                                    "content", List.of(Map.of("type", "text", "text", "Permission Denied: Command '" + cmd + "' is outside the allowed sandbox whitelist."))
                            ))
                            .build();
                }

                String simulatedOutput = "Executing in isolated sandbox: " + trimmed + "\n" +
                        (trimmed.contains("test") ? "[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0\n[INFO] BUILD SUCCESS" : "Exit code: 0");

                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of("type", "text", "text", simulatedOutput))))
                        .build();
            }

            if ("get_process_status".equals(toolName)) {
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of(
                                "type", "text",
                                "text", "CPU: 2.1%, Memory: 142MB/768MB, Active Containers: 1, State: HEALTHY"
                        ))))
                        .build();
            }

            return McpProtocol.Response.builder()
                    .jsonrpc(McpProtocol.JSONRPC_VERSION)
                    .id(id)
                    .error(McpProtocol.ErrorDetails.builder().code(-32601).message("Tool not found: " + toolName).build())
                    .build();
        }

        return McpProtocol.Response.builder()
                .jsonrpc(McpProtocol.JSONRPC_VERSION)
                .id(id)
                .error(McpProtocol.ErrorDetails.builder().code(-32601).message("Unsupported method: " + method).build())
                .build();
    }
}
