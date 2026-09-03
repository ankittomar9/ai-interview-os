# ADR 002: Code Runner Isolation Strategy

## Status
Accepted (2026-08-15, updated 2026-09-02)

## Context
AI Interview OS must execute arbitrary, untrusted candidate source code (Java, Python, C++, JavaScript, SQL, Maven projects) in real-time. This presents serious security and operational threats:
- Malicious code executing host-level commands (`Runtime.getRuntime().exec()`).
- Resource exhaustion (fork bombs, infinite loops, memory leaks).
- File system tampering and cross-tenant data leakage.

## Decision
Implement a multi-tier sandbox architecture tailored to the execution paradigm of each track:

### 1. Judge0 CE (DSA Track)
- Single-file algorithmic execution is delegated to a self-hosted **Judge0 Community Edition (1.13.1)** instance.
- Submissions execute inside ephemeral `/box` sandbox folders managed by the Linux `isolate` control group tool.
- **Critical Configuration**: In `docker-compose.yaml`, `judge0-workers` MUST have `privileged: true` set to allow cgroup namespace creation under Docker on Windows/WSL2.
- Outbound network connections from within sandbox containers are disabled.
- Standard I/O limits: 15 seconds CPU wall-clock, 256 MB RAM.

### 2. Ephemeral PostgreSQL Schemas (SQL Track)
- Relational queries execute in a dedicated, sandboxed PostgreSQL instance.
- Each session receives a freshly provisioned schema: `session_{sessionId}`.
- Candidate queries run with `statement_timeout = '10s'` and restricted search paths.
- The schema is dropped upon session completion.

### 3. Isolated Maven Workspaces (LLD Track)
- Multi-file Spring Boot / Java projects execute inside dedicated container volumes mounting starter code.
- Test suites run via `mvn test` in headless non-root containers.

## Consequences

### Positive
- **Host Protection**: Host filesystem and network interfaces are inaccessible from candidate code.
- **Language Breadth**: Judge0 provides native support for 50+ languages without maintaining custom compilers.
- **Honest Telemetry**: Standardized execution outputs (stdout, stderr, executionTimeMs, memoryUsedMb).

### Negative
- **Privilege Requirements**: `judge0-workers` requires `privileged: true` in Docker Compose.
- **Container Startup Overhead**: Adds ~100–300ms latency compared to direct host process execution.

## Alternatives Considered
1. **Host-Level `ProcessBuilder` Execution**: Rejected. Unacceptable security risk allowing arbitrary host takeover.
2. **Docker-in-Docker Custom Daemon**: Rejected. High complexity, slow cleanup, and dangerous security implications.
3. **AWS Lambda / Cloud Run Sandboxing**: Rejected. Variable cold starts (1.5–4s) degrade the fast-feedback IDE loop.

## References
- Code: [`DsaJudge0Runner.java`](../../interview-session-service/src/main/java/com/interviewos/session/sandbox/runner/DsaJudge0Runner.java), [`SqlRunner.java`](../../interview-session-service/src/main/java/com/interviewos/session/sandbox/runner/SqlRunner.java)
- Commits:
  - `275d773` (M18-A: add privileged flag to judge0-workers for cgroup namespace isolation)
  - `f97d155` (M19: map ENGINE_UNAVAILABLE to Engine Unavailable verdict and render honest offline card)
