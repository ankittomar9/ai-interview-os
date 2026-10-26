package com.interviewos.ai.mcp.servers;

import com.interviewos.ai.mcp.McpModels;
import com.interviewos.ai.mcp.McpProtocol;

import java.util.*;

public class DatabaseMcpServer {

    public static final String SERVER_NAME = "database-mcp";

    private static final Map<String, List<String>> MOCK_SCHEMA = Map.of(
            "users", List.of("id BIGINT PRIMARY KEY", "email VARCHAR(255)", "role VARCHAR(50)", "created_at TIMESTAMP"),
            "orders", List.of("id BIGINT PRIMARY KEY", "user_id BIGINT", "total_amount DECIMAL(10,2)", "status VARCHAR(30)", "created_at TIMESTAMP"),
            "order_items", List.of("id BIGINT PRIMARY KEY", "order_id BIGINT", "sku VARCHAR(100)", "quantity INT", "unit_price DECIMAL(10,2)"),
            "inventory", List.of("sku VARCHAR(100) PRIMARY KEY", "available_stock INT", "reserved_stock INT", "updated_at TIMESTAMP")
    );

    public static List<McpModels.ToolDefinition> getTools() {
        return List.of(
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("list_tables")
                        .description("List all available tables in the candidate database sandbox")
                        .category("database")
                        .inputSchema(Map.of("type", "object", "properties", Map.of()))
                        .requiredPermissions(List.of("db:read"))
                        .build(),
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("describe_table")
                        .description("Inspect the schema and column definitions for a given table")
                        .category("database")
                        .inputSchema(Map.of(
                                "type", "object",
                                "required", List.of("tableName"),
                                "properties", Map.of("tableName", Map.of("type", "string", "description", "The name of the table"))
                        ))
                        .requiredPermissions(List.of("db:read"))
                        .build(),
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("execute_query")
                        .description("Execute a read-only SQL query against the sandbox database")
                        .category("database")
                        .inputSchema(Map.of(
                                "type", "object",
                                "required", List.of("query"),
                                "properties", Map.of("query", Map.of("type", "string", "description", "The SQL SELECT statement"))
                        ))
                        .requiredPermissions(List.of("db:query"))
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

            if ("list_tables".equals(toolName)) {
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of(
                                "type", "text",
                                "text", "Tables: " + String.join(", ", MOCK_SCHEMA.keySet())
                        ))))
                        .build();
            }

            if ("describe_table".equals(toolName)) {
                String tableName = (String) args.get("tableName");
                if (tableName == null || !MOCK_SCHEMA.containsKey(tableName.toLowerCase())) {
                    return McpProtocol.Response.builder()
                            .jsonrpc(McpProtocol.JSONRPC_VERSION)
                            .id(id)
                            .result(Map.of(
                                    "isError", true,
                                    "content", List.of(Map.of("type", "text", "text", "Unknown table: " + tableName))
                            ))
                            .build();
                }
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of(
                                "type", "text",
                                "text", "Schema for " + tableName + ":\n  " + String.join("\n  ", MOCK_SCHEMA.get(tableName.toLowerCase()))
                        ))))
                        .build();
            }

            if ("execute_query".equals(toolName)) {
                String query = (String) args.get("query");
                if (query == null || !query.trim().toUpperCase().startsWith("SELECT")) {
                    return McpProtocol.Response.builder()
                            .jsonrpc(McpProtocol.JSONRPC_VERSION)
                            .id(id)
                            .result(Map.of(
                                    "isError", true,
                                    "content", List.of(Map.of("type", "text", "text", "Permission Denied: Only read-only SELECT queries are allowed."))
                            ))
                            .build();
                }
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of(
                                "type", "text",
                                "text", "Executed: " + query + "\nResult: 2 rows returned (sandboxed mock execution)."
                        ))))
                        .build();
            }

            return McpProtocol.Response.builder()
                    .jsonrpc(McpProtocol.JSONRPC_VERSION)
                    .id(id)
                    .error(McpProtocol.ErrorDetails.builder().code(-32601).message("Method not found: " + toolName).build())
                    .build();
        }

        return McpProtocol.Response.builder()
                .jsonrpc(McpProtocol.JSONRPC_VERSION)
                .id(id)
                .error(McpProtocol.ErrorDetails.builder().code(-32601).message("Unsupported method: " + method).build())
                .build();
    }
}
