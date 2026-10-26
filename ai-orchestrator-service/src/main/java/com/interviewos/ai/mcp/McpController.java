package com.interviewos.ai.mcp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

/**
 * REST API gateway for Model Context Protocol (MCP) host services.
 * SPEC-019 / C3: Gated behind 'mcp.host.enabled' (default: false).
 * Intended for local-only, trusted internal network communications.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/mcp")
@RequiredArgsConstructor
@ConditionalOnProperty(name = "mcp.host.enabled", havingValue = "true", matchIfMissing = false)
public class McpController {

    private final McpHostRegistry mcpHostRegistry;

    @GetMapping("/servers")
    public ResponseEntity<List<McpModels.ServerInfo>> listServers() {
        return ResponseEntity.ok(mcpHostRegistry.listServers());
    }

    @GetMapping("/tools")
    public ResponseEntity<List<McpModels.ToolDefinition>> listTools() {
        return ResponseEntity.ok(mcpHostRegistry.listAllTools());
    }

    @PostMapping("/tools/call")
    public ResponseEntity<McpModels.ToolCallResult> callTool(
            @RequestBody McpModels.ToolCallRequest request,
            @RequestParam(value = "timeoutMs", defaultValue = "5000") long timeoutMs
    ) {
        log.info("🛠️ [MCP Tool Call] Dispatched: Server='{}', Tool='{}', Session='{}'",
                request.getServerName(), request.getToolName(), request.getCandidateSessionId());
        McpModels.ToolCallResult result = mcpHostRegistry.executeToolCall(request, Duration.ofMillis(timeoutMs));
        return ResponseEntity.ok(result);
    }
}
