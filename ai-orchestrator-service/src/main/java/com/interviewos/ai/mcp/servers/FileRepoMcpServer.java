package com.interviewos.ai.mcp.servers;

import com.interviewos.ai.mcp.McpModels;
import com.interviewos.ai.mcp.McpProtocol;

import java.util.*;

public class FileRepoMcpServer {

    public static final String SERVER_NAME = "file-repo-mcp";

    private static final Map<String, String> VIRTUAL_REPO = Map.of(
            "src/main/java/OrderService.java", "public class OrderService {\n    public Order createOrder(OrderReq req) {\n        // implementation\n        return new Order();\n    }\n}",
            "src/main/java/OrderController.java", "@RestController\npublic class OrderController {\n    @Autowired private OrderService svc;\n}",
            "pom.xml", "<project>\n  <groupId>com.example</groupId>\n  <artifactId>order-svc</artifactId>\n</project>",
            "README.md", "# Order Microservice\nHandles customer checkout and inventory reservation."
    );

    public static List<McpModels.ToolDefinition> getTools() {
        return List.of(
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("list_files")
                        .description("List files in the candidate workspace repository")
                        .category("file")
                        .inputSchema(Map.of("type", "object", "properties", Map.of()))
                        .requiredPermissions(List.of("repo:read"))
                        .build(),
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("read_file")
                        .description("Read contents of a file in the workspace")
                        .category("file")
                        .inputSchema(Map.of(
                                "type", "object",
                                "required", List.of("path"),
                                "properties", Map.of("path", Map.of("type", "string", "description", "Relative file path"))
                        ))
                        .requiredPermissions(List.of("repo:read"))
                        .build(),
                McpModels.ToolDefinition.builder()
                        .serverName(SERVER_NAME)
                        .name("search_code")
                        .description("Search across files in the candidate workspace")
                        .category("file")
                        .inputSchema(Map.of(
                                "type", "object",
                                "required", List.of("query"),
                                "properties", Map.of("query", Map.of("type", "string", "description", "Text or symbol to search for"))
                        ))
                        .requiredPermissions(List.of("repo:read"))
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

            if ("list_files".equals(toolName)) {
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of(
                                "type", "text",
                                "text", String.join("\n", VIRTUAL_REPO.keySet())
                        ))))
                        .build();
            }

            if ("read_file".equals(toolName)) {
                String path = (String) args.get("path");
                if (path == null || !VIRTUAL_REPO.containsKey(path)) {
                    return McpProtocol.Response.builder()
                            .jsonrpc(McpProtocol.JSONRPC_VERSION)
                            .id(id)
                            .result(Map.of(
                                    "isError", true,
                                    "content", List.of(Map.of("type", "text", "text", "File not found: " + path))
                            ))
                            .build();
                }
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of(
                                "type", "text",
                                "text", VIRTUAL_REPO.get(path)
                        ))))
                        .build();
            }

            if ("search_code".equals(toolName)) {
                String query = (String) args.get("query");
                List<String> matches = new ArrayList<>();
                if (query != null && !query.isBlank()) {
                    for (Map.Entry<String, String> entry : VIRTUAL_REPO.entrySet()) {
                        if (entry.getValue().contains(query)) {
                            matches.add(entry.getKey());
                        }
                    }
                }
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(id)
                        .result(Map.of("content", List.of(Map.of(
                                "type", "text",
                                "text", matches.isEmpty() ? "No matches found." : "Matches found in:\n  " + String.join("\n  ", matches)
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
