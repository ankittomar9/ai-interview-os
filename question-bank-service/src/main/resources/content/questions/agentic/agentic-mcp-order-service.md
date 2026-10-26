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
buildProfile: judge0
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
