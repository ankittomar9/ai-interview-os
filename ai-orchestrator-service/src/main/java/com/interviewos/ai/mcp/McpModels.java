package com.interviewos.ai.mcp;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;

public final class McpModels {

    private McpModels() {}

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ToolDefinition {
        private String name;
        private String description;
        private Map<String, Object> inputSchema;
        private String serverName;
        private String category;
        private boolean requiresConfirmation;
        private List<String> requiredPermissions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ServerInfo {
        private String name;
        private String transportType;
        private String version;
        private boolean healthy;
        private List<String> supportedMethods;
        private List<String> grantedPermissions;
        private int toolCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ToolCallRequest {
        private String serverName;
        private String toolName;
        private Map<String, Object> arguments;
        private String candidateSessionId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ToolCallResult {
        private String serverName;
        private String toolName;
        @Builder.Default
        private List<Map<String, Object>> content = Collections.emptyList();
        @com.fasterxml.jackson.annotation.JsonProperty("isError")
        private boolean isError;
        private String errorMessage;
        private long durationMs;
        private Instant executedAt;

        public static ToolCallResult success(String serverName, String toolName, String textContent, long durationMs) {
            return ToolCallResult.builder()
                    .serverName(serverName)
                    .toolName(toolName)
                    .content(List.of(Map.of("type", "text", "text", textContent)))
                    .isError(false)
                    .durationMs(durationMs)
                    .executedAt(Instant.now())
                    .build();
        }

        public static ToolCallResult failure(String serverName, String toolName, String errorMsg, long durationMs) {
            return ToolCallResult.builder()
                    .serverName(serverName)
                    .toolName(toolName)
                    .content(List.of(Map.of("type", "text", "text", "Error: " + errorMsg)))
                    .isError(true)
                    .errorMessage(errorMsg)
                    .durationMs(durationMs)
                    .executedAt(Instant.now())
                    .build();
        }
    }
}
