package com.interviewos.ai.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.*;

/**
 * @deprecated Tier-3 MCP Roadmap Quarantine (QB-54 / SPEC-019).
 * Transport implementation for out-of-process STDIO MCP servers.
 * Currently quarantined pending configuration wiring for external MCP servers.
 */
@Deprecated
@Slf4j
public class StdioMcpTransport implements McpTransport {

    private final List<String> command;
    private final ObjectMapper objectMapper;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private volatile boolean healthy = true;

    public StdioMcpTransport(List<String> command, ObjectMapper objectMapper) {
        this.command = command;
        this.objectMapper = objectMapper;
    }

    @Override
    public McpProtocol.Response send(McpProtocol.Request request, Duration timeout) throws Exception {
        ProcessBuilder pb = new ProcessBuilder(command);
        Process process = pb.start();

        Future<McpProtocol.Response> future = executor.submit(() -> {
            try (PrintWriter out = new PrintWriter(new OutputStreamWriter(process.getOutputStream(), StandardCharsets.UTF_8), true);
                 BufferedReader in = new BufferedReader(new InputStreamReader(process.getInputStream(), StandardCharsets.UTF_8))) {

                String jsonStr = objectMapper.writeValueAsString(request);
                out.println(jsonStr);

                String line = in.readLine();
                if (line == null) {
                    throw new IllegalStateException("EOF from stdio MCP server process");
                }
                return objectMapper.readValue(line, McpProtocol.Response.class);
            } finally {
                process.destroyForcibly();
            }
        });

        long waitMs = timeout != null ? timeout.toMillis() : 5000;
        try {
            McpProtocol.Response res = future.get(waitMs, TimeUnit.MILLISECONDS);
            healthy = true;
            return res;
        } catch (TimeoutException te) {
            healthy = false;
            future.cancel(true);
            process.destroyForcibly();
            throw new TimeoutException("MCP stdio process timed out after " + waitMs + "ms");
        } catch (Exception e) {
            healthy = false;
            throw e;
        }
    }

    @Override
    public String getTransportType() {
        return "STDIO";
    }

    @Override
    public boolean isHealthy() {
        return healthy;
    }
}
