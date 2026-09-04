# AI Interview OS — Living Specification & Roadmap (SPEC.md)

This document serves as the authoritative, living task tracker and acceptance specification for ongoing reliability (R2–R5) and user experience (U1–U4) engineering tasks.

---

## 🎯 Task Roadmap Overview

| ID | Stream | Title | Priority | Status | Target Scope |
|---|---|---|---|---|---|
| **R1** | Reliability | Engine-Down Honesty in Arena IDE | P0 | **COMPLETED** (`f97d155`) | `useExecution.ts`, `TestcasePanel.tsx` |
| **R2** | Reliability | Transcript & Report Honesty on Sandbox Outages | P0 | **IN PROGRESS** (M21) | `interview-session-service`, `ai-orchestrator`, `evaluation-report` |
| **R3** | Reliability | Recording Chunk Re-queue & GridFS Store-Before-Delete | P1 | **COMPLETED** (`0290995`) | `useSessionRecorder.ts`, `SessionRecordingService.java` |
| **R4** | Reliability | Container Stability, Memory Limits & Healthchecks | P1 | **PLANNED** | `docker-compose.yaml` |
| **R5** | Reliability | Groq Whisper Audio Engine Resilience & Buffering | P2 | **PLANNED** | `WhisperTranscriptionService.java` |
| **U1** | UX/UI | SubmissionsTab Warning Badge & Honest History | P1 | **IN PROGRESS** (M21) | `SubmissionsTab.tsx` |
| **U2** | UX/UI | Testcase Panel Memory Limit & Metric Badges | P2 | **PLANNED** | `TestcasePanel.tsx` |
| **U3** | UX/UI | Secondary Proctor Phone Pairing Reconnection State | P2 | **PLANNED** | `PhoneProctor.tsx`, `PreInterviewChecklist.tsx` |
| **U4** | UX/UI | Diagnostic Report Video Player Timeline & Scrubbing | P2 | **PLANNED** | `DiagnosticReportView.tsx` |
| **SPEC-002** | Architecture | Edge Service Consolidation (M0–M4) | P3 | **PROPOSED** ([ADR-004](ADR/004-edge-service-consolidation.md)) | Gateway, Config, Discovery consolidation |

---

## 📋 Detailed Task Specifications & Acceptance Criteria

### R2: Transcript & Report Honesty on Sandbox Outages (P0)
- **Problem**: When a code execution fails due to `ENGINE_UNAVAILABLE`, recording it as a failed candidate turn causes the report evaluation to penalize Technical Accuracy with a `0/100` score.
- **Specification**:
  1. `recordExecutionTurn` writes `eventType: "ENGINE_ERROR"` (distinct from candidate turn failure).
  2. In `evaluation-report-service`, `ENGINE_ERROR` turns are excluded from the test pass-rate denominator.
  3. If ALL executions in a session were engine errors, the report renders:
     > *"Execution not verifiable (engine offline ×N)"*
     and Technical Accuracy is scored exclusively from dialogue/code-review evidence, never zeroed.
  4. Dialogue grounding: when `ENGINE_ERROR` turns occur, the LLM prompt is injected with:
     > *"The code execution engine was unavailable for this run. Do NOT claim tests passed, and do NOT penalize the candidate for infrastructure downtime."*
- **Acceptance Criteria**:
  - Session with only engine-error executions produces a report showing "Execution not verifiable", not 0/100.
  - LLM dialogue never states "Your solution failed" during engine downtime.

### R3: Recording Chunk Re-queue & Failure Resilience (P1)
- **Problem**: In `useSessionRecorder.ts`, transient network errors drop 5s video chunks with only a `console.warn`. In `SessionRecordingService.java`, GridFS deletes any prior chunk attempt before writing the new one.
- **Specification**:
  1. `useSessionRecorder.ts` maintains an in-memory retry queue with exponential backoff (up to 3 retries) before dropping chunks.
  2. `SessionRecordingService.java` flips execution order: store the new chunk first; clean up obsolete versions only upon successful write.
  3. Recording manifest adds gap detection (`missingSeqs: []`).
- **Acceptance Criteria**:
  - Simulated 502/503 during chunk upload retries and successfully uploads without dropping sequence numbers.

### R4: Container Stability, Memory Limits & Healthchecks (P1)
- **Problem**: Containers lack `restart: unless-stopped` and `mem_limit`, risking OOM kills under Windows/WSL2 host memory pressure.
- **Specification**:
  1. Add `restart: unless-stopped` to all 9 services in `docker-compose.yaml`.
  2. Set explicit JVM memory constraints (`JAVA_OPTS: "-Xms128m -Xmx384m"`) and Docker `mem_limit: 512m` for microservices.
  3. Add container healthcheck probes (`curl -f http://localhost:8080/actuator/health`).
- **Acceptance Criteria**:
  - `docker compose ps` shows healthy status across running containers.

### R5: Groq Whisper Audio Engine Resilience (P2)
- **Problem**: Ambient silence or network drops during audio recording can cause Whisper transcription timeouts.
- **Specification**:
  1. Client-side silence thresholding skips uploading empty audio buffers.
  2. Timeout fallback to browser Web Speech API if Whisper transcription exceeds 3000ms.
- **Acceptance Criteria**:
  - Voice recording recovers smoothly if Whisper API experiences momentary latency spikes.

### U1: SubmissionsTab Warning Badge & Honest History (P1)
- **Problem**: In `SubmissionsTab.tsx`, an `Engine Unavailable` submission rendered with a red "Wrong Answer" badge.
- **Specification**:
  1. `SubmissionsTab.tsx` maps `'Engine Unavailable'` to amber warning badges (`text-warning bg-warning/10 border-warning/30`), consistent with Compile Error and Time Limit Exceeded.
  2. Status filter dropdown includes "Engine Unavailable".
- **Acceptance Criteria**:
  - Submitting code when sandbox is down displays an amber badge in Submissions history.

---

## 🏛️ Governance Rules for AI Agents Working on this Spec

1. **One Spec $\to$ One Commit**: Do not bundle multiple roadmap tasks into a single commit.
2. **Read `docs/` First**: Always verify current architecture and ADRs before modifying cross-service schemas or routing.
3. **Never Rebuild Working Subsystems**: Honor the "⚠️ DO NOT" constraints in `docs/architecture.md`.
