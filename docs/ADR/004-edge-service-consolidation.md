# ADR 004: Edge Service Consolidation & Execution Engine Extraction Seam

## Status
Proposed (2026-09-03)

## Context
The platform currently operates 8 backend Spring Boot microservices coordinated via Spring Cloud Gateway (`api-gateway-service:8080`), Netflix Eureka (`service-discovery-service:8761`), and Spring Cloud Config Server (`cloud-config-server:8888`), as established in [ADR 001](001-monolith-to-microservices.md).

While this topology provides strong domain autonomy, in local developer workflows and single-node Docker Compose deployments, running 3 distinct infrastructure containers for discovery, configuration, and routing introduces operational friction:
- **Memory Footprint**: Three separate JVM runtimes consume ~750MB RAM merely for static service registration and configuration distribution.
- **Startup Latency**: Services must wait for `cloud-config-server` and `service-discovery-service` before starting their own Spring application contexts.
- **Topology Seam Asymmetry**: Meanwhile, `interview-session-service:8081` still bundles session lifecycle, MongoDB transcripts, GridFS video streaming, AND all three code runner engines (DSA Judge0, SQL Ephemeral Postgres, and LLD Maven workspaces).

## Proposal

### 1. Edge Service Consolidation (Gated by SPEC-002)
Merge `api-gateway-service`, `service-discovery-service`, and `cloud-config-server` into a single consolidated `edge-service` (or transition to Docker DNS-based service discovery with local profile-backed gateway routing).

Migration is staged across 5 milestones (M0–M4):
- **Stage M0 (Baseline)**: Establish benchmark telemetry for gateway routing latency, memory usage, and CORS headers.
- **Stage M1 (Configuration Inlining)**: Embed configuration profiles directly into services with environment override support, removing runtime dependency on `:8888`.
- **Stage M2 (DNS Service Discovery)**: Replace Eureka client lookups with Docker internal DNS (`http://interview-session-service:8081`) or embed Eureka into the edge gateway.
- **Stage M3 (Container Deprecation)**: Retire standalone `cloud-config-server` and `service-discovery-service` containers in `docker-compose.yaml`.
- **Stage M4 (Verification)**: Audit CORS headers, BYOK header forwarding (`X-InterviewOS-Key`), WebSocket proxying, and verify sub-20ms routing latency.

### 2. Execution Engine Extraction Seam (Planned M14)
To maintain balanced domain boundaries, as edge services consolidate, the code execution subsystems currently inside `interview-session-service` will be extracted into a dedicated `execution-engine-service`:
- **Components to Extract**: `DsaJudge0Runner`, `SqlRunner`, `LldRunner`, `CodeExecutionController`, Docker volume workspace provisioner.
- **Retained in Session Service**: PostgreSQL session state, MongoDB hierarchical transcripts, GridFS recording chunks, and report aggregation.

## Consequences

### Positive
- **Reduced Memory**: Eliminates 2 JVM runtimes, saving ~500–750MB host RAM.
- **Faster Startup**: Eliminates 2-tier container startup dependencies.
- **Clear Domain Separation**: Execution sandboxes become autonomous from session persistence.

### Negative
- **Transition Risk**: Gateway routing or CORS regression during consolidation (mitigated by strict M0–M4 staging).
- **ADR Governance**: Requires Accepted status and SPEC-002 sign-off prior to execution.

## References
- ADR: [ADR 001: Monolith to Microservices Split (Historical)](001-monolith-to-microservices.md)
- ADR: [ADR 002: Code Runner Isolation Strategy](002-code-runner-isolation.md)
- Spec: [docs/SPEC.md](../SPEC.md) (Roadmap tasks R4, SPEC-002, M14)
