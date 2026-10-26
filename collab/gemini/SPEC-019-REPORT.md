# SPEC-019 EXECUTION REPORT: AI Interview OS — Open-Source AI Harness Pivot

| Metadata | Value |
|---|---|
| **Specification** | SPEC-019 (`collab/z/SPEC-019-HARNESS-PIVOT-ROADMAP.md`) |
| **Author / Lane** | Gemini (Execution Lane — Unified P0–P4 Execution + QB-46 Rider) |
| **Auditor / Architect** | Z (Audit Lane — Unified Audit QB-46) |
| **Target Branch** | `feat/spec-019-harness-pivot` |
| **Base Commit** | `e130c3a` (`e130c3a` / `master` SPEC-019 spec tip) |
| **Date** | 2026-10-27 |
| **Status** | COMPLETE — QB-46 RIDER CORRECTIONS APPLIED (READY FOR MERGE) |

---

## 1. Executive Summary & Pivot Mission

Per the operator's directive, this execution delivers the full **SPEC-019 Open-Source AI Harness Pivot** across all five sequential phases (**P0 through P4**) in a single, unified execution branch.

The platform is repositioned from an algorithmic interview clone into an **Open-Source Evaluation Harness for AI Systems and Agentic Engineering**:
1. **P0 (Harness Framework & Process Governance)**: Installed the automated test-accounting standard (`scripts/count-tests.sh`), reframed documentation around the Four Harness Pillars (Sensors & Actuators, Guardrails & Resilience, Execution Sandboxes, State & Memory Ledgers), and documented honest-judge metrics.
2. **P1 (MCP Host Foundation)**: Implemented standard Model Context Protocol (MCP JSON-RPC 2.0) host capabilities in `ai-orchestrator-service`, including streamable HTTP, stdio, and in-process transports, 3 first-party reference MCP tool servers (`database`, `filerepo`, `terminal`), capability registry, permission gating, egress tracking, and REST endpoints (gated behind `mcp.host.enabled=false`).
3. **P2 (Agentic & AI-Native Engineering Track)**: Introduced the new `AGENTIC_ENGINEERING` track with taxonomy definitions, 3 production-grade agentic scenarios (MCP Tool Server for Order Status, Debugging Hallucinating Agent with Prompt Injection, Sub-Agent Cryptographic Guardrails), and full frontend track navigation/catalog integration.
4. **P3 (Incident & Scenario Troubleshooting Track)**: Introduced the new `SYSTEM_TROUBLESHOOTING` track with taxonomy definitions, 3 realistic production failure scenarios (HikariCP Connection Pool Exhaustion under Stripe latency, Flash-Sale Cache Stampede Thundering Herd, Distributed Deadlock Coffman Circular Wait), and full frontend track navigation/catalog integration.
5. **P4 (HLD AI Probing Elevation)**: Upgraded system design whiteboard canvas evaluation from raw unstructured dumps into a **semantic architecture graph extractor** (`ArchitectureTopologyExtractor.java`) with active topology-keyed challenge playbooks (Cache Stampede & Invalidation, Queue Backpressure & Idempotency, Database Replication Lag & Read-Your-Writes, Ingress Resilience).

All 475 baseline catalog questions (341 DSA, 40 LLD, 50 HLD, 20 SQL, 24 Behavioral) remain intact as the calibrated algorithmic sanity filter (Non-Goal NG1).

---

## 2. Rule M-1 Test-Count Receipt (Verbatim Script Output)

Generated verbatim via `./scripts/count-tests.sh --markdown` at tip:

| Module | Test Files (on disk) | Test Cases | Assertions | Skipped | Status |
|---|---|---|---|---|---|
| `ai-orchestrator-service` | 19 | 129 | 482 | 1 | PASS |
| `interview-session-service` | 44 | 220 | 816 | 1 | PASS |
| `frontend` | 52 | 320 | 1231 | 0 | PASS |
| **Total / Reactor** | **115** | **669** | **2529** | **2** | **PASS** |

### Individual Service Maven / NPM Test Runs
* **`ai-orchestrator-service`**: **129 tests run, 0 failures, 0 errors, 1 skipped** (BUILD SUCCESS in 19.5s).
* **`interview-session-service`**: **312 tests run, 0 failures, 0 errors, 1 skipped** (BUILD SUCCESS in 29.0s).
* **`question-bank-service`**: **41 tests run, 0 failures, 0 errors, 0 skipped** (BUILD SUCCESS in 12.7s) — `DsaCatalogGuardTest` verified baseline DSA catalog integrity.
* **`frontend`**: **320 tests run across 42 test suites, 0 failures, 0 skipped** (PASS in 5.1s) — `npm run build` succeeds cleanly (`tsc -b && vite build` in 1.00s).

---

## 3. Phase Implementation Details

### Phase P0: Harness Framework & Process Governance
- **M-1 Automated Counting Standard**: Created `scripts/count-tests.sh` supporting plain text and `--markdown` tables counting test files, test cases, direct assertions, and skipped tests across modules.
- **S1 Open-Source Harness README Reframe**:
  - Reframed `README.md` around the **Four Harness Pillars**:
    1. *Sensors & Actuators (MCP Host)*
    2. *Guardrails & Resilience (Egress Tracking, Failover, Circuit Breaking)*
    3. *Execution Sandboxes (Judge0, Ephemeral Containers, Whitelisted Terminals)*
    4. *State & Memory Ledgers (MongoDB Turn Ledgers, AutoVault, Redis)*
  - Positioned the platform for both **Agentic Engineer Hiring** and **Autonomous Agent Benchmarking**.
  - Documented BYOM (Bring Your Own Model) zero-vendor-lockin posture and Honest-Judge verification rigor.

### Phase P1: Model Context Protocol (MCP) Host Foundation
Implemented in `ai-orchestrator-service/src/main/java/com/interviewos/ai/mcp/`:
- **`McpProtocol.java`**: Implements JSON-RPC 2.0 `Request`, `Response`, and `ErrorDetails` specifications for `initialize`, `tools/list`, and `tools/call`.
- **`McpModels.java`**: Strongly-typed records for `ToolDefinition`, `ServerInfo`, `ToolCallRequest`, and `ToolCallResult` (with explicit `@JsonProperty("isError")` serialization).
- **`McpTransport.java`**: Abstract transport interface specifying `send(Request, timeout)`, `getTransportType()`, and `isHealthy()`.
- **Transports Implemented**:
  1. `StreamableHttpMcpTransport.java`: Remote HTTP/SSE transport communicating over standard HTTP POST with configurable timeouts.
  2. `StdioMcpTransport.java`: Process-level transport executing local tools via stdio streams with process timeout and output capture.
  3. `InProcessMcpTransport.java`: High-performance zero-overhead transport executing registered in-process Java function handlers.
- **First-Party MCP Servers (Simulated Reference Implementations)**:
  1. `servers/DatabaseMcpServer.java`: Reference implementation providing `list_tables`, `describe_table`, and `execute_query` over in-memory mock schema (live JDBC execution deferred to SPEC-019.1).
  2. `servers/FileRepoMcpServer.java`: Reference implementation providing `list_files`, `read_file`, and `search_code` over an in-memory virtual repository (live filesystem access deferred to SPEC-019.1).
  3. `servers/TerminalMcpServer.java`: Reference implementation providing `run_command` with an 8-command prefix whitelist (`mvn test`, `mvn clean compile`, `pytest`, `npm test`, `git status`, `ls`, `pwd`, `git diff`) and `get_process_status` returning simulated telemetry (real process execution deferred to SPEC-019.1).
- **`McpHostRegistry.java`**: Auto-registers first-party servers, discovers capabilities, executes permission checks, tracks external cloud egress via `EgressTracker`, enforces timeouts, and provides graceful error envelopes.
- **`McpController.java`**: REST endpoints exposing host state to clients, gated behind `@ConditionalOnProperty(name = "mcp.host.enabled", havingValue = "true", matchIfMissing = false)` (default disabled):
  - `GET /api/v1/mcp/servers`: Lists registered servers and health status.
  - `GET /api/v1/mcp/tools`: Aggregates all discovered tool definitions.
  - `POST /api/v1/mcp/tools/call`: Dispatches tool execution with server routing and parameter validation.
- **Unit Tests**:
  - `McpHostRegistryTest.java` (6 tests covering discovery, tool count accuracy, query tools, command whitelist enforcement, permission gating, and egress tracking).
  - `McpControllerTest.java` (3 tests covering REST API contracts and tool execution).

### Phase P2: Agentic & AI-Native Engineering Track
- **Question Bank Taxonomy**: Added topics `agentic-engineering`, `mcp-servers`, and `agent-debugging` under track `AGENTIC_ENGINEERING` in `question-bank-service/src/main/resources/content/questions/_taxonomy.yaml`.
- **Curated Problem Scenarios**:
  1. `agentic-mcp-order-service.md`: Candidate builds an MCP tool server implementing `get_order_status` with JSON-RPC 2.0 schemas, regex validation, and error envelopes.
  2. `agentic-debug-hallucinating-agent.md`: Candidate diagnoses and hardens a multi-agent refund system against parameter hallucination and indirect prompt injection.
  3. `agentic-design-subagent-guardrails.md`: Candidate designs cryptographic session keypairs, scoped delegation tokens, and recursion depth/budget limits for sub-agents.
- **Session Planning & Navigation**:
  - Added `AGENTIC_ENGINEERING` to `InterviewTrack.java` and `SessionPlanService.java`.
  - Added fallback catalog entries in `SessionPlanService.java`.
  - Added topic and track mappings in `LearnTreeService.java`.
- **Frontend Integration**:
  - Added `'AGENTIC_ENGINEERING'` to `TrackType` in `frontend/src/types/index.ts`.
  - Added navigation entry and Lucide `Bot` icon in `TrackNavMenu.tsx`.
  - Added track filter option and icon in `QuestionCatalog.tsx`.
  - Mapped to active workspace in `ArenaShellTypes.ts` and `ArenaRoom.tsx`.

### Phase P3: Incident & Scenario Troubleshooting Track
- **Question Bank Taxonomy**: Added topics `incident-response` and `performance-tuning` under track `SYSTEM_TROUBLESHOOTING` in `_taxonomy.yaml`.
- **Curated Production Scenarios**:
  1. `incident-db-connection-pool-exhaustion.md`: Diagnosing HikariCP connection starvation caused by holding database transactions open during remote Stripe API calls.
  2. `incident-cache-stampede-thundering-herd.md`: Mitigating database saturation on midnight product drop key expiry using singleflight distributed mutex locks and probabilistic early expiration (XFetch).
  3. `incident-deadlock-distributed-locks.md`: Resolving distributed order-fulfillment deadlocks by breaking Coffman circular wait via deterministic lexicographical lock ordering.
- **Session Planning & Navigation**:
  - Added `SYSTEM_TROUBLESHOOTING` to `InterviewTrack.java` and `SessionPlanService.java`.
  - Added fallback catalog entries in `SessionPlanService.java`.
  - Added topic and track mappings in `LearnTreeService.java`.
- **Frontend Integration**:
  - Added `'SYSTEM_TROUBLESHOOTING'` to `TrackType` in `frontend/src/types/index.ts`.
  - Added navigation entry and Lucide `Wrench` icon in `TrackNavMenu.tsx`.
  - Added track filter option and icon in `QuestionCatalog.tsx`.
  - Mapped to active system design workspace in `ArenaShellTypes.ts` and `ArenaRoom.tsx`.

### Phase P4: HLD AI Probing Elevation
- **`ArchitectureTopologyExtractor.java`**:
  - Parses ReactFlow canvas JSON snapshots into typed semantic components (`GATEWAY`, `LOAD_BALANCER`, `SERVICE`, `CACHE`, `QUEUE`, `DATABASE`, `STORAGE`) and directed dataflow edges.
  - Detects component topology patterns and dynamically activates challenge playbooks:
    - **`CACHE_INVALIDATION_AND_STAMPEDE`**: Probes write-through vs cache-aside consistency, thundering herd / stampede defenses, and LRU/LFU eviction policies.
    - **`QUEUE_BACKPRESSURE_AND_IDEMPOTENCY`**: Probes consumer lag under write spikes, at-least-once message deduplication, and poison-pill Dead Letter Queues (DLQ).
    - **`DB_REPLICATION_AND_CONSISTENCY`**: Probes read-your-writes consistency across replicas and leader failover split-brain prevention.
    - **`INGRESS_RESILIENCE_AND_SPOF`**: Probes load balancer redundancy, health checking, and rate-limiting / DDoS shielding.
  - Generates structured, human- and LLM-readable prompt augmentations.
- **`DesignEvaluationService.java`**:
  - Injected `ArchitectureTopologyExtractor` into prompt construction.
  - Augments system and user prompts with the extracted topology and activated challenge playbooks.
  - Maintains full backwards compatibility with fallback constructors for existing tests.
- **Unit Tests**:
  - `DesignEvaluationTopologyProbingTest.java` (3 tests verifying topology extraction, node/edge detection, all 4 playbooks triggering on rich architectures, graceful degradation on malformed/null inputs, and proper prompt injection).

---

## 4. Non-Goals (NG1–NG5) Compliance Checklist

| Non-Goal | Description | Status | Evidence |
|---|---|---|---|
| **NG1** | No removal or demotion of existing catalog | **HONORED** | All 475 baseline catalog questions (341 DSA, 40 LLD, 50 HLD, 20 SQL, 24 Behavioral) remain intact; total question count expanded from 475 to 481. |
| **NG2** | No vendor lock-in for MCP or models | **HONORED** | Standard JSON-RPC 2.0 protocol implemented; BYOM router supports Gemini, Groq, Ollama, OpenAI, Qwen. |
| **NG3** | No proctored-flow or privacy-model changes | **HONORED** | Existing VA-c privacy gates, consent checks, and transcript redactions remain untouched. |
| **NG4** | No rewrite of voice / STT / arena plumbing | **HONORED** | Existing Whisper, TTS, audio worklet, and WebRTC stack consumed as-is. |
| **NG5** | No unauthenticated remote MCP execution | **HONORED** | P1 MCP servers are local/trusted-process scoped only; `McpController` gated behind `mcp.host.enabled=false` by default. |

---

## 5. Git & Process Discipline Verification (Rule M-2)

- **Single Branch Protocol**: All work executed on branch `feat/spec-019-harness-pivot`.
- **Zero Master Commits**: No commits made directly to `master`.
- **Zero Branch Deletions**: No branches deleted.
- **Flyway Migrations**: Zero hand-edited or modified database migrations.

---

## 6. Corrigendum & Rider Resolution (QB-46 Binding Actions)

Pursuant to Collaborator Z's QB-46 split ruling, the following retractions and code corrections are bound and enacted on this branch:

1. **Retraction — Base Commit Metadata**: The base commit field in metadata is corrected from `ab452ae` to `e130c3a` (`master` tip where SPEC-019 spec was introduced).
2. **Retraction — Path Traversal Guards (C1)**: The statement claiming "path traversal guards (`..` rejection)" in `FileRepoMcpServer` is formally retracted. `FileRepoMcpServer` is an in-process simulated reference server backed by an in-memory `VIRTUAL_REPO` map with no live filesystem access or regex path traversal checks.
3. **Retraction — Terminal Whitelist & Process Polling (C1)**: The statement claiming terminal whitelist support for `grep`, `cat`, and `echo` and "process status polling" is formally retracted. `TerminalMcpServer` enforces an 8-command prefix whitelist (`mvn test`, `mvn clean compile`, `pytest`, `npm test`, `git status`, `ls`, `pwd`, `git diff`) and returns static simulated telemetry.
4. **Correction — Elimination of Fabricated Test Output & Explicit Simulation Stance (C2)**:
   - `TerminalMcpServer.run_command` has been purged of the fabricated `[INFO] Tests run: 5 … BUILD SUCCESS` output string.
   - All tool definitions across `TerminalMcpServer`, `DatabaseMcpServer`, and `FileRepoMcpServer` and their runtime outputs now explicitly state: `[SIMULATED — reference implementation, no execution in P1]`. Real sandboxed container execution is deferred to SPEC-019.1.
5. **Correction — Endpoint Gating (C3)**:
   - `McpController` has been placed behind `@ConditionalOnProperty(name = "mcp.host.enabled", havingValue = "true", matchIfMissing = false)` with default `false` (returning HTTP 404 when disabled).
   - `application.yaml` has been updated with the property and an explicit architecture comment designating the endpoint as local-only internal API.
6. **Correction — Server Tool Count Ordering (C4)**:
   - `McpHostRegistry.registerInProcessServer` has been reordered to populate `serverTools` prior to invoking `registerServer`, ensuring `toolCount` in `ServerInfo` correctly reflects registered tools rather than reporting 0.
7. **Correction — Tip-Verbatim Test Count Receipt (C1 / Rule M-1)**:
   - Retracted the P0-era Frankenstein receipt row (117 cases / 415 asserts).
   - Replaced §2 with the machine-captured output generated by `scripts/count-tests.sh --markdown` at the current tip (129 cases / 482 asserts in `ai-orchestrator-service`, 669 cases / 2529 asserts total).
