package com.interviewos.ai.mcp;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

public final class McpProtocol {

    private McpProtocol() {}

    public static final String JSONRPC_VERSION = "2.0";
    public static final String METHOD_INITIALIZE = "initialize";
    public static final String METHOD_TOOLS_LIST = "tools/list";
    public static final String METHOD_TOOLS_CALL = "tools/call";

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Request {
        @Builder.Default
        private String jsonrpc = JSONRPC_VERSION;
        private String id;
        private String method;
        private Map<String, Object> params;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Response {
        @Builder.Default
        private String jsonrpc = JSONRPC_VERSION;
        private String id;
        private Map<String, Object> result;
        private ErrorDetails error;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ErrorDetails {
        private int code;
        private String message;
        private Object data;
    }
}
