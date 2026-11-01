package com.interviewos.ai.mcp;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * @deprecated Tier-3 MCP Roadmap Quarantine (QB-54 / SPEC-019).
 * Transport implementation for HTTP/SSE-streamable MCP servers.
 * Currently quarantined pending configuration wiring for external MCP servers.
 */
@Deprecated
@Slf4j
public class StreamableHttpMcpTransport implements McpTransport {

    private final URI endpointUri;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private volatile boolean healthy = true;

    public StreamableHttpMcpTransport(URI endpointUri, ObjectMapper objectMapper) {
        this.endpointUri = endpointUri;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
    }

    @Override
    public McpProtocol.Response send(McpProtocol.Request request, Duration timeout) throws Exception {
        String jsonPayload = objectMapper.writeValueAsString(request);
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(endpointUri)
                .timeout(timeout != null ? timeout : Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json, text/event-stream")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                healthy = true;
                return objectMapper.readValue(response.body(), McpProtocol.Response.class);
            } else {
                healthy = false;
                return McpProtocol.Response.builder()
                        .jsonrpc(McpProtocol.JSONRPC_VERSION)
                        .id(request.getId())
                        .error(McpProtocol.ErrorDetails.builder()
                                .code(response.statusCode())
                                .message("HTTP Error " + response.statusCode() + ": " + response.body())
                                .build())
                        .build();
            }
        } catch (Exception ex) {
            healthy = false;
            log.warn("MCP HTTP Transport dispatch failure to {}: {}", endpointUri, ex.getMessage());
            throw ex;
        }
    }

    @Override
    public String getTransportType() {
        return "STREAMABLE_HTTP";
    }

    @Override
    public boolean isHealthy() {
        return healthy;
    }
}
