---
slug: agentic-mcp-order-service
title: "Build an MCP Tool Server for Customer Order Status"
track: AGENTIC_ENGINEERING
difficulty: MEDIUM
topics:
  - agentic-engineering
  - mcp-servers
est_minutes: 35
tags: ['mcp', 'agentic', 'tool-use', 'json-rpc', 'schema-validation']
buildProfile: maven-workspace
source: enterprise-agentic:v1
status: PUBLISHED
hints:
  - "Adhere strictly to the Model Context Protocol (MCP) JSON-RPC 2.0 specification for `tools/list` and `tools/call`."
  - "Validate all input arguments against the declared JSON schema before invoking backend domain services."
  - "Return structured content blocks with explicit error states rather than unhandled server exceptions."
coaching:
  presentationTips:
    - "Explain the difference between tool declaration (schema contract) and tool execution (runtime dispatch)."
    - "Highlight how structured error responses help the LLM self-correct without failing the user conversation."
starterFiles:
  pom.xml: |
    <?xml version="1.0" encoding="UTF-8"?>
    <project xmlns="http://maven.apache.org/POM/4.0.0"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
        <modelVersion>4.0.0</modelVersion>
        <groupId>com.interviewos.workspace</groupId>
        <artifactId>agentic-mcp-order-service</artifactId>
        <version>1.0.0</version>
        <properties>
            <maven.compiler.source>21</maven.compiler.source>
            <maven.compiler.target>21</maven.compiler.target>
            <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
            <junit.jupiter.version>5.11.4</junit.jupiter.version>
        </properties>
        <dependencies>
            <dependency>
                <groupId>org.junit.jupiter</groupId>
                <artifactId>junit-jupiter</artifactId>
                <version>${junit.jupiter.version}</version>
                <scope>test</scope>
            </dependency>
        </dependencies>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>3.5.2</version>
                </plugin>
            </plugins>
        </build>
    </project>
  README.md: |
    # Build an MCP Tool Server for Customer Order Status

    Implement `getOrderStatus(String orderId)` in `src/main/java/com/interviewos/workspace/Solution.java` adhering to the MCP contract.
  src/main/java/com/interviewos/workspace/Solution.java: |
    package com.interviewos.workspace;

    public class Solution {

        /**
         * Executes the 'get_order_status' MCP tool call.
         *
         * @param orderId the order identifier passed by the calling LLM (expected format: ORD-[0-9]{6})
         * @return MCP-compliant JSON response string
         */
        public static String getOrderStatus(String orderId) {
            // TODO: Validate orderId and return MCP JSON response
            return "{\"content\": [{\"type\": \"text\", \"text\": \"TODO\"}], \"isError\": true}";
        }

        public static void main(String[] args) {
            System.out.println("Workspace ready.");
        }
    }
editablePaths:
  - src/main/java/com/interviewos/workspace/Solution.java
hiddenTestFiles:
  src/test/java/com/interviewos/workspace/SolutionTest.java: |
    package com.interviewos.workspace;

    import org.junit.jupiter.api.DisplayName;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;

    public class SolutionTest {

        @Test
        @DisplayName("Test 1: Valid Order ORD-123456 returns DELIVERED status with isError: false")
        void testValidOrderDelivered() {
            String response = Solution.getOrderStatus("ORD-123456");
            assertNotNull(response, "Response must not be null");
            assertTrue(response.contains("\"isError\": false") || response.contains("\"isError\":false"),
                    "Expected isError: false for valid order ORD-123456");
            assertTrue(response.contains("DELIVERED"), "Expected status DELIVERED");
            assertTrue(response.contains("3"), "Expected 3 items");
            assertTrue(response.contains("2026-10-28"), "Expected ETA 2026-10-28");
        }

        @Test
        @DisplayName("Test 2: Invalid order pattern returns isError: true with validation explanation")
        void testInvalidOrderIdPattern() {
            String response = Solution.getOrderStatus("INVALID-12");
            assertNotNull(response, "Response must not be null");
            assertTrue(response.contains("\"isError\": true") || response.contains("\"isError\":true"),
                    "Expected isError: true for malformed order ID");
            assertTrue(response.toLowerCase().contains("invalid") || response.toLowerCase().contains("pattern") || response.toLowerCase().contains("format"),
                    "Expected error explanation describing invalid format");
        }

        @Test
        @DisplayName("Test 3: Missing order returns isError: true indicating order not found")
        void testOrderNotFound() {
            String response = Solution.getOrderStatus("ORD-999999");
            assertNotNull(response, "Response must not be null");
            assertTrue(response.contains("\"isError\": true") || response.contains("\"isError\":true"),
                    "Expected isError: true for non-existent order");
            assertTrue(response.toLowerCase().contains("not found"),
                    "Expected 'not found' in error message for missing order");
        }

        @Test
        @DisplayName("Test 4: Null, empty, or blank orderId returns isError: true")
        void testBlankOrNullOrderId() {
            String blankResp = Solution.getOrderStatus("   ");
            assertNotNull(blankResp, "Response must not be null");
            assertTrue(blankResp.contains("\"isError\": true") || blankResp.contains("\"isError\":true"),
                    "Expected isError: true for blank orderId");

            String nullResp = Solution.getOrderStatus(null);
            assertNotNull(nullResp, "Response must not be null");
            assertTrue(nullResp.contains("\"isError\": true") || nullResp.contains("\"isError\":true"),
                    "Expected isError: true for null orderId");
        }
    }
editorial: |
  ### Engineering Walkthrough: Building a Production-Grade MCP Tool Server

  #### 1. Architectural Role of MCP in Agentic Systems
  The Model Context Protocol (MCP) standardizes how autonomous agents and AI assistants discover and execute external tools:
  - **Tool Discovery (`tools/list`)**: Exposes machine-readable JSON schemas describing parameters, types, and descriptions.
  - **Execution (`tools/call`)**: Validates candidate parameters, enforces least-privilege permissions, and returns structured result content.

  #### 2. Key Components to Implement
  - **Schema Definition**: Declare `orderId` (string, required) and optional `includeItems` (boolean).
  - **Input Sanitization**: Guard against injection attacks and malformed UUIDs.
  - **Result Formatting**: Package outputs into standard MCP content blocks: `[{"type": "text", "text": "..."}]`.
referenceSolutions:
  - approachId: canonical-mcp-order-server
    label: "Primary — Strict Schema Validation with Graceful JSON-RPC Error Envelopes"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Implements MCP JSON-RPC 2.0 endpoints for order status querying. Input parameters are verified against JSON schema constraints, and results are returned as structured text blocks with execution telemetry."
    keyIdea: "Separate tool definition schemas from execution handlers, ensuring zero unhandled exceptions escape to the agent harness."
    tradeoffs:
      - "In-process validation adds slight compute overhead but prevents agent hallucination on malformed inputs."
    writeUp: |
      ### 1. Architectural Strategy
      To build a production-grade MCP tool server for the order status service:
      - **Tool Specification**: Expose a clear, unambiguous JSON schema for `get_order_status` specifying `orderId` as required, with regex pattern `^ORD-[0-9]{6}$`.
      - **Validation Layer**: Intercept all incoming `tools/call` JSON-RPC requests, validate parameters against the schema before invoking the backend query layer.
      - **Error Handling**: Return structured error payloads with `isError: true` and descriptive feedback when validation fails, rather than crashing or throwing unhandled 500 errors.

      ### 2. Implementation Steps
      1. Register the tool definition in the MCP server's tool registry during the `initialize` / `tools/list` lifecycle handshake.
      2. In the `tools/call` handler, parse arguments into a strongly typed DTO (`OrderStatusArgs`).
      3. Validate that `orderId` matches the canonical pattern `ORD-[0-9]{6}`.
      4. Query the order repository; if not found, return an MCP result block with `isError: true` indicating "Order not found".
      5. If valid, format the response into a structured text content block and return `isError: false`.
---

# Build an MCP Tool Server for Customer Order Status

### Scenario
An enterprise customer support AI agent needs real-time access to customer order statuses. You are tasked with implementing an **MCP (Model Context Protocol)** tool server that exposes order querying capabilities to the agent.

### Requirements
1. Expose tool `get_order_status` accepting parameter `orderId` (string).
2. Validate that `orderId` adheres to pattern `ORD-[0-9]{6}`.
3. Return order status, item count, and delivery estimation in standard MCP content format:
   ```json
   {
     "content": [
       {
         "type": "text",
         "text": "Order ORD-123456: Status = DELIVERED, Items = 3, ETA = 2026-10-28"
       }
     ],
     "isError": false
   }
   ```
4. If `orderId` is invalid or not found, return `"isError": true` with a clear explanation so the calling LLM can inform the user or prompt for correction.
