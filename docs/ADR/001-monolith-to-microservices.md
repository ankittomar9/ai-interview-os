# ADR 001: Monolith to Microservices Split

## Status
Accepted (2026-08-20)

## Context
The platform initially began as a monolithic Spring Boot application (`interview-os`). As feature complexity expanded to support 6 distinct technical interview tracks, 3 distinct sandbox execution runners, multimodal AI orchestration, and continuous chunked WebM video recording, the monolithic model began suffering critical operational bottlenecks:
- **Build Times**: Maven builds exceeded 6+ minutes for the full test suite.
- **Blast Radius**: A defect in audio transcription or dialogue prompting could crash the sandbox execution runtime or corrupt session lifecycle state.
- **Resource Contention**: Sandboxed code execution and video chunk streaming consumed system threads and memory needed for real-time AI dialogue.

## Decision
Decompose the platform into 8 specialized, autonomous Spring Boot microservices coordinated via Spring Cloud Gateway (`api-gateway-service:8080`) and Netflix Eureka (`service-discovery-service:8761`):

1. **`api-gateway-service` (:8080)**: Central routing, CORS headers, client API contract, BYOK header forwarding.
2. **`cloud-config-server` (:8888)**: Centralized external configuration profiles.
3. **`service-discovery-service` (:8761)**: Dynamic registration and health monitoring.
4. **`interview-session-service` (:8081)**: Session lifecycle, relational PostgreSQL records, MongoDB transcripts, and GridFS chunk recording.
5. **`ai-orchestrator-service` (:8082)**: Low-latency AI dialogue routing (Groq LPU, Ollama), STT, and deterministic post-guards.
6. **`proctor-sentinel-service` (:8083)**: Biometric telemetry, tab-switch monitoring, keystroke dynamics.
7. **`evaluation-report-service` (:8084)**: 360° rubric synthesis, radar charts, PDF/JSON reporting.
8. **`question-bank-service` (:8085)**: Problem catalog, curated 1-2-3 ladders, markdown problem parser.

## Consequences

### Positive
- **Independent Deployability**: Improvements to dialogue prompting or post-guards in `ai-orchestrator-service` deploy without restarting execution or session infrastructure.
- **Targeted Scaling**: `ai-orchestrator-service` and `interview-session-service` can be horizontally scaled independently based on load.
- **Build Parallelization**: Individual services build in under 30 seconds.

### Negative
- **Network Overhead**: Inter-service REST calls introduce 5–20ms of local latency.
- **Configuration Management**: Requires centralized configuration and service discovery.
- **Operational Footprint**: Requires multi-container Docker Compose orchestration.

## Alternatives Considered
1. **Retain Monolith**: Rejected. Tightly coupled dependencies and unacceptable blast radius.
2. **Micro-frontends / 20+ Microservices**: Rejected. Excess granularity leads to distributed transaction complexity and high cognitive load.
3. **Serverless Functions (AWS Lambda / Cloud Functions)**: Rejected. Cold starts (1–3 seconds) violate the sub-500ms conversational turnaround requirement for voice dialogue.

## References
- Code: [`api-gateway-service`](file:///D:/ai-interview-os/api-gateway-service), [`interview-session-service`](file:///D:/ai-interview-os/interview-session-service)
- Commit: `d128343` (M13: Modularize arena components and extract hooks)
