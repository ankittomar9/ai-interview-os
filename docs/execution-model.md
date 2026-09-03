# Execution Model & Code Runner Architecture

This document describes the sandboxed code execution pipeline across all tracks within AI Interview OS.

---

## 1. Execution Track Matrix

| Track | Runner Implementation | Isolation Environment | Wall-Clock Timeout | Languages Supported |
|---|---|---|---|---|
| **Algorithms & Data Structures (DSA)** | [`DsaJudge0Runner.java`](../interview-session-service/src/main/java/com/interviewos/session/sandbox/runner/DsaJudge0Runner.java) | Judge0 CE Container via Linux `isolate` | 15s | Java 21, Python 3, JavaScript (Node), C++17 |
| **SQL & Database Engineering** | [`SqlRunner.java`](../interview-session-service/src/main/java/com/interviewos/session/sandbox/runner/SqlRunner.java) | Dedicated ephemeral schema in PostgreSQL 13 | 10s | PostgreSQL Dialect |
| **Low-Level Design (LLD)** | [`LldRunner.java`](../interview-session-service/src/main/java/com/interviewos/session/sandbox/runner/LldRunner.java) | Embedded VS Code container (`code-server`) + volume mount | 120s | Java 21 (Maven multi-file) |
| **High-Level System Design (HLD)** | `WhiteboardRunner.tsx` / `DesignEvaluationController.java` | Interactive Canvas SVG/PNG export + Vision AI | N/A | Excalidraw / Diagram JSON |
| **Behavioral & Leadership** | `DialogueRunner` / [`AiOrchestratorService.java`](../ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java) | AI conversational state machine | N/A | Natural Language (Audio / Text) |
| **Resume Deep Dive** | `DialogueRunner` (Resume Context Ingestion) | AI conversational state machine grounded on PDF embeddings | N/A | Natural Language (Audio / Text) |

---

## 2. Judge0 CE Isolation Architecture (DSA)

DSA submissions execute inside isolated Linux container sandboxes managed by **Judge0 CE (Community Edition)**:

```
[Candidate Browser]
       │
       ▼ (REST POST /api/v1/sessions/{id}/execute)
[InterviewSessionService]
       │
       ▼ (Java Class Normalization -> public class Main)
[Judge0 Server (:3000)]
       │
       ▼ (Redis Submission Queue :6379)
[Judge0 Worker Container] ◄─── (Docker privileged: true)
       │
       ▼ (Linux cgroup + namespaces via /usr/local/bin/isolate)
[/box Sandbox Directory]
  ├── Main.java
  └── Main.class (compiled & executed under non-root UID 1000)
```

### Critical Isolation Invariants

1. **`privileged: true` Requirement**:
   In `docker-compose.yaml`, `judge0-workers` MUST specify `privileged: true`. Without this capability, the worker cannot interact with host Linux cgroup namespaces under Docker Desktop / WSL2, causing the sandbox tool `/usr/local/bin/isolate` to fail and throw `cannot access '/box': No such file or directory`.
2. **Java Class Normalization**:
   Judge0 requires Java files inside `/box` to match the public class name (`Main.java`). Candidates often submit custom class names (e.g. `public class Solution`). `DsaJudge0Runner` deterministically transforms:
   ```java
   code = code.replaceAll("public\\s+class\\s+\\w+", "public class Main");
   ```
   preventing compiler name mismatch errors.
3. **Network Quarantine**:
   Worker sandbox execution prevents outbound sockets; candidate code cannot contact external networks or host endpoints.

---

## 3. SQL Ephemeral Schema Model

SQL questions execute directly against a sandboxed PostgreSQL instance with strict tenant isolation:

```sql
-- 1. On Session Start / Problem Initialization:
CREATE SCHEMA session_1042;
SET search_path TO session_1042;

-- 2. Execute Starter DDL (Tables, Indexes, Seed Data):
CREATE TABLE employees (...);
INSERT INTO employees VALUES (...);

-- 3. Run Candidate Submission with Strict Query Limits:
SET statement_timeout = '10000'; -- 10s maximum query time
SELECT * FROM employees WHERE department = 'Engineering';

-- 4. Teardown on Session Completion (StorageHygieneScheduledJob):
DROP SCHEMA session_1042 CASCADE;
```

Candidate queries are restricted to their assigned schema; foreign schema access is forbidden by database role privileges.

---

## 4. Maven Workspace Model (LLD)

For Low-Level Design problems (e.g. In-Memory Cache, Parking Lot, Elevator System), single-file execution is insufficient:

1. **Volume Provisioning**: An isolated Docker volume is created per session: `ws-vol-{sessionId}`.
2. **Starter Project Injection**: Starter files (`pom.xml`, domain classes, interface stubs, JUnit 5 suites) are populated into the volume.
3. **Monaco / Embedded VS Code**: The candidate edits files either through Monaco file tabs or an embedded code-server container.
4. **Automated Test Runner**: Clicking **"Run Project Tests"** executes `mvn test -Dtest=TestSuite` inside a temporary container mounting the volume, streaming structured test outcomes to the UI.

---

## 5. Execution Result Contract

All runners normalize their output into the unified `ExecutionResultResponse` schema:

```typescript
export interface ExecutionResult {
  status: 'idle' | 'running' | 'passed' | 'failed' | 'error';
  verdictTitle?: string;  // "Accepted" | "Wrong Answer" | "Engine Unavailable" | "Compile Error" | "Runtime Error"
  executionTimeMs?: number;
  memoryUsedMb?: number;
  passedTests?: number;
  totalTests?: number;
  cases?: TestCaseItem[];
  rawOutput?: string;
}
```

### Engine-Down Honesty Invariant (M19)

If Judge0 or the Docker daemon is unreachable:
- The backend returns `status: "ENGINE_UNAVAILABLE"`.
- `useExecution.ts` maps this to `status: "error"` and `verdictTitle: "Engine Unavailable"`.
- `TestcasePanel.tsx` renders an amber warning banner ("Sandbox Offline") explaining that the runner is temporarily unavailable, **never marking the candidate's code as a "Wrong Answer"**.

---

## ⚠️ DO NOT (Execution Constraints)

> [!CAUTION]
> **STRICT EXECUTION CONSTRAINTS FOR FUTURE DEVELOPERS AND LLMs:**

1. **Do NOT execute candidate code on the host operating system.** All executions must run inside container sandboxes with memory and CPU bounds.
2. **Do NOT remove `privileged: true` from `judge0-workers` in `docker-compose.yaml`.** Linux `isolate` requires cgroup mount permissions to create `/box`.
3. **Do NOT increase Judge0 timeouts beyond 15 seconds.** Long timeouts invite infinite-loop DoS attacks that starve worker execution queues.
4. **Do NOT cache code execution results.** Submissions must execute dynamically against live sandboxes to guarantee test case freshness.
5. **Do NOT mark infrastructure errors as candidate failures.** If the runner fails to connect, report `ENGINE_UNAVAILABLE` honestly.
