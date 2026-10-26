package com.interviewos.ai.mcp;

import com.interviewos.ai.mcp.servers.DatabaseMcpServer;
import com.interviewos.ai.mcp.servers.FileRepoMcpServer;
import com.interviewos.ai.mcp.servers.TerminalMcpServer;
import com.interviewos.ai.service.EgressTracker;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class McpHostRegistry {

    private final EgressTracker egressTracker;

    private final Map<String, McpTransport> serverTransports = new ConcurrentHashMap<>();
    private final Map<String, McpModels.ServerInfo> serverInfos = new ConcurrentHashMap<>();
    private final Map<String, List<McpModels.ToolDefinition>> serverTools = new ConcurrentHashMap<>();
    private final Map<String, Set<String>> grantedPermissions = new ConcurrentHashMap<>();

    @PostConstruct
    public void initFirstPartyServers() {
        // 1. Seed Database MCP Server
        registerInProcessServer(
                DatabaseMcpServer.SERVER_NAME,
                DatabaseMcpServer::handle,
                DatabaseMcpServer.getTools(),
                Set.of("db:read", "db:query")
        );

        // 2. Seed File/Repo MCP Server
        registerInProcessServer(
                FileRepoMcpServer.SERVER_NAME,
                FileRepoMcpServer::handle,
                FileRepoMcpServer.getTools(),
                Set.of("repo:read")
        );

        // 3. Seed Terminal MCP Server
        registerInProcessServer(
                TerminalMcpServer.SERVER_NAME,
                TerminalMcpServer::handle,
                TerminalMcpServer.getTools(),
                Set.of("terminal:read", "terminal:exec")
        );

        log.info("🚀 [McpHostRegistry] Initialized {} first-party MCP servers (total tools: {})",
                serverTransports.size(), listAllTools().size());
    }

    public void registerInProcessServer(String name, java.util.function.Function<McpProtocol.Request, McpProtocol.Response> handler, List<McpModels.ToolDefinition> tools, Set<String> permissions) {
        McpTransport transport = new InProcessMcpTransport(handler);
        serverTools.put(name, tools != null ? tools : Collections.emptyList());
        registerServer(name, transport, permissions);
    }

    public void registerServer(String name, McpTransport transport, Set<String> permissions) {
        serverTransports.put(name, transport);
        grantedPermissions.put(name, permissions != null ? permissions : Collections.emptySet());

        // Perform MCP initialize handshake
        try {
            McpProtocol.Request initReq = McpProtocol.Request.builder()
                    .id(UUID.randomUUID().toString())
                    .method(McpProtocol.METHOD_INITIALIZE)
                    .params(Map.of(
                            "protocolVersion", "2024-11-05",
                            "clientInfo", Map.of("name", "AI-Interview-OS-Harness", "version", "1.0.0"),
                            "capabilities", Map.of("tools", Map.of("subscribe", false))
                    ))
                    .build();

            McpProtocol.Response initResp = transport.send(initReq, Duration.ofSeconds(3));
            boolean healthy = initResp != null && initResp.getError() == null;

            serverInfos.put(name, McpModels.ServerInfo.builder()
                    .name(name)
                    .transportType(transport.getTransportType())
                    .version("2024-11-05")
                    .healthy(healthy)
                    .supportedMethods(List.of(McpProtocol.METHOD_INITIALIZE, McpProtocol.METHOD_TOOLS_LIST, McpProtocol.METHOD_TOOLS_CALL))
                    .grantedPermissions(new ArrayList<>(grantedPermissions.getOrDefault(name, Collections.emptySet())))
                    .toolCount(serverTools.getOrDefault(name, Collections.emptyList()).size())
                    .build());

        } catch (Exception e) {
            log.warn("Failed to initialize MCP server '{}': {}", name, e.getMessage());
            serverInfos.put(name, McpModels.ServerInfo.builder()
                    .name(name)
                    .transportType(transport.getTransportType())
                    .version("unknown")
                    .healthy(false)
                    .supportedMethods(Collections.emptyList())
                    .grantedPermissions(new ArrayList<>(grantedPermissions.getOrDefault(name, Collections.emptySet())))
                    .toolCount(0)
                    .build());
        }
    }

    public List<McpModels.ServerInfo> listServers() {
        return new ArrayList<>(serverInfos.values());
    }

    public List<McpModels.ToolDefinition> listAllTools() {
        List<McpModels.ToolDefinition> allTools = new ArrayList<>();
        for (List<McpModels.ToolDefinition> tools : serverTools.values()) {
            allTools.addAll(tools);
        }
        return allTools;
    }

    public Optional<McpModels.ToolDefinition> findTool(String serverName, String toolName) {
        List<McpModels.ToolDefinition> tools = serverTools.get(serverName);
        if (tools == null) return Optional.empty();
        return tools.stream().filter(t -> t.getName().equals(toolName)).findFirst();
    }

    public McpModels.ToolCallResult executeToolCall(McpModels.ToolCallRequest request, Duration timeout) {
        long startTime = System.currentTimeMillis();
        String serverName = request.getServerName();
        String toolName = request.getToolName();

        McpTransport transport = serverTransports.get(serverName);
        if (transport == null) {
            long duration = System.currentTimeMillis() - startTime;
            return McpModels.ToolCallResult.failure(serverName, toolName, "MCP Server not registered: " + serverName, duration);
        }

        // Permission check
        Optional<McpModels.ToolDefinition> toolDefOpt = findTool(serverName, toolName);
        if (toolDefOpt.isPresent()) {
            McpModels.ToolDefinition def = toolDefOpt.get();
            Set<String> granted = grantedPermissions.getOrDefault(serverName, Collections.emptySet());
            for (String requiredPerm : def.getRequiredPermissions()) {
                if (!granted.contains(requiredPerm)) {
                    long duration = System.currentTimeMillis() - startTime;
                    log.warn("🛡️ [McpHostRegistry] Tool call '{}' on '{}' rejected: missing permission '{}'", toolName, serverName, requiredPerm);
                    return McpModels.ToolCallResult.failure(serverName, toolName, "Permission Denied: missing permission " + requiredPerm, duration);
                }
            }
        }

        // Track external egress if transport is remote HTTP
        if ("STREAMABLE_HTTP".equals(transport.getTransportType())) {
            egressTracker.recordCloudCall("MCP:" + serverName);
        }

        // Dispatch call with timeout and deterministic fallback degradation
        try {
            McpProtocol.Request rpcReq = McpProtocol.Request.builder()
                    .id(UUID.randomUUID().toString())
                    .method(McpProtocol.METHOD_TOOLS_CALL)
                    .params(Map.of(
                            "name", toolName,
                            "arguments", request.getArguments() != null ? request.getArguments() : Collections.emptyMap()
                    ))
                    .build();

            McpProtocol.Response resp = transport.send(rpcReq, timeout != null ? timeout : Duration.ofSeconds(10));
            long duration = System.currentTimeMillis() - startTime;

            if (resp.getError() != null) {
                return McpModels.ToolCallResult.failure(serverName, toolName, resp.getError().getMessage(), duration);
            }

            Map<String, Object> result = resp.getResult();
            if (result != null && Boolean.TRUE.equals(result.get("isError"))) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> content = (List<Map<String, Object>>) result.get("content");
                String errorText = content != null && !content.isEmpty() ? (String) content.get(0).get("text") : "Tool returned error state.";
                return McpModels.ToolCallResult.failure(serverName, toolName, errorText, duration);
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> content = result != null ? (List<Map<String, Object>>) result.get("content") : Collections.emptyList();
            return McpModels.ToolCallResult.builder()
                    .serverName(serverName)
                    .toolName(toolName)
                    .content(content)
                    .isError(false)
                    .durationMs(duration)
                    .executedAt(Instant.now())
                    .build();

        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("⚠️ [McpHostRegistry] Degrading tool call '{}/{}': {}", serverName, toolName, e.getMessage());
            return McpModels.ToolCallResult.failure(serverName, toolName, "Tool execution degraded/unavailable: " + e.getMessage(), duration);
        }
    }
}
