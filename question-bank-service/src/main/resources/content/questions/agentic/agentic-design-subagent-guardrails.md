---
slug: agentic-design-subagent-guardrails
title: "Design Cryptographic Identity and Scoped Permissions for Sub-Agents"
track: AGENTIC_ENGINEERING
difficulty: HARD
topics:
  - agentic-engineering
  - mcp-servers
est_minutes: 45
tags: ['agentic', 'system-design', 'dpop', 'mcp', 'least-privilege', 'security']
buildProfile: judge0
source: enterprise-agentic:v1
status: PUBLISHED
hints:
  - "Apply the principle of least privilege: a code-research sub-agent should not have write permissions to production databases."
  - "Consider Demonstration of Proof-of-Possession (DPoP) or ephemeral scoped JWTs for sub-agent tool calls."
  - "Design budget and depth caps to prevent recursive sub-agent explosion and runaway compute costs."
coaching:
  presentationTips:
    - "Diagram the trust boundary between the primary coordinator agent, specialized sub-agents, and the MCP tool hosts."
    - "Explain how token replay attacks are mitigated when sub-agents communicate across network boundaries."
editorial: |
  ### System Design Walkthrough: Sub-Agent Authorization & Identity Delegation

  #### 1. Core Threat Model
  In hierarchical multi-agent architectures:
  - **Privilege Escalation**: A compromised sub-agent invoking high-privilege tools outside its task scope.
  - **Token Theft / Replay**: Intercepted credentials used to invoke tool hosts asynchronously.
  - **Infinite Spawning**: A sub-agent creating infinite nested sub-agents, resulting in budget exhaustion.

  #### 2. Architectural Design
  - **Ephemeral DPoP Tokens**: Each sub-agent generates an ephemeral keypair; tool requests are bound to the sub-agent's public key.
  - **Hierarchical Token Scoping**: Child agent tokens inherit a subset of parent scopes with tighter TTLs (e.g. 5 minutes).
  - **Global Egress & Recursion Bounds**: The orchestrator harness enforces a maximum delegation depth (e.g. max depth 3) and hard token budget.
referenceSolutions:
  - approachId: canonical-subagent-security
    label: "Primary — Scoped Ephemeral Keypairs with Hierarchical Capability Gating"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Architects a zero-trust delegation framework using ephemeral sub-agent identities, strictly scoped MCP tool tokens, and centralized harness budget enforcement."
    keyIdea: "Cryptographically bind every tool call to the specific sub-agent session and enforce depth and cost bounds at the harness boundary."
    tradeoffs:
      - "Cryptographic signing per tool call adds slight latency (~2-5ms) but eliminates impersonation and privilege escalation."
    writeUp: |
      ### 1. Identity & Capability Gating
      - **Ephemeral Session Keypairs**: Upon subagent spawn, the harness generates an asymmetric keypair. All subsequent MCP JSON-RPC requests from the subagent must include an HTTP Authorization header or signed envelope binding the request to this keypair.
      - **Hierarchical Capability Tokens**: The coordinator signs a JWT or macaroon granting explicit tool scopes (e.g. `scope: ["mcp:repo:read", "mcp:repo:search"]`) with an expiration of 5 minutes. Downstream tool hosts verify the signature and scope prior to execution.

      ### 2. Harness Execution Guardrails
      - **Recursion & Depth Control**: Every delegation event increments a `delegationDepth` metadata counter. If `delegationDepth > MAX_DEPTH` (default 3), the harness rejects further subagent invocations.
      - **Centralized Token & Egress Budget**: The harness maintains a unified credit ledger. If the cumulative token consumption or tool execution budget across coordinator and all sub-agents exceeds the hard quota, all pending tasks are terminated and an incident alert is raised.
---

# Design Cryptographic Identity and Scoped Permissions for Sub-Agents

### Problem Context
Your engineering team is building an enterprise autonomous coding platform where a **Lead Coordinator Agent** delegates complex development tasks to multiple specialized sub-agents:
* **Code Search Agent** (read-only repository access)
* **Testing Agent** (can execute sandboxed test suites)
* **Deployment Agent** (can trigger staging deployments)

### Requirements
1. Design the authentication, authorization, and cryptographic identity framework ensuring that:
   - Sub-agents can only execute tools explicitly permitted for their assigned role.
   - Credentials cannot be intercepted and replayed outside the session.
2. Design the harness guardrails that prevent:
   - Infinite recursive sub-agent creation.
   - Resource and token budget exhaustion.
3. Walk through the end-to-end flow when the Coordinator dispatches a task to the Testing Agent to run unit tests.
