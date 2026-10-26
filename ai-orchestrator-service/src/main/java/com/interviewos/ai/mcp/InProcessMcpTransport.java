package com.interviewos.ai.mcp;

import java.time.Duration;
import java.util.function.Function;

public class InProcessMcpTransport implements McpTransport {

    private final Function<McpProtocol.Request, McpProtocol.Response> handler;
    private volatile boolean healthy = true;

    public InProcessMcpTransport(Function<McpProtocol.Request, McpProtocol.Response> handler) {
        this.handler = handler;
    }

    @Override
    public McpProtocol.Response send(McpProtocol.Request request, Duration timeout) {
        try {
            McpProtocol.Response resp = handler.apply(request);
            healthy = true;
            return resp;
        } catch (Exception e) {
            healthy = false;
            return McpProtocol.Response.builder()
                    .jsonrpc(McpProtocol.JSONRPC_VERSION)
                    .id(request.getId())
                    .error(McpProtocol.ErrorDetails.builder()
                            .code(-32603)
                            .message("Internal in-process MCP error: " + e.getMessage())
                            .build())
                    .build();
        }
    }

    @Override
    public String getTransportType() {
        return "IN_PROCESS";
    }

    @Override
    public boolean isHealthy() {
        return healthy;
    }
}
