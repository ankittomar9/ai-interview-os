package com.interviewos.ai.mcp;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/mcp")
@RequiredArgsConstructor
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
