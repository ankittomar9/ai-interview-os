package com.interviewos.ai.mcp;

import java.time.Duration;

public interface McpTransport {
    McpProtocol.Response send(McpProtocol.Request request, Duration timeout) throws Exception;
    String getTransportType();
    boolean isHealthy();
}
