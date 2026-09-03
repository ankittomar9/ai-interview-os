# AI Interview OS — Living Specification & Roadmap (SPEC.md)

> **Mission**: Run your interview prep entirely on your laptop, with your own keys, forever free of cloud bills — so no learner is ever priced out of feeling confident.
> Your resume never leaves your machine. Your failures are never uploaded. $0/month, forever.

---

## 🎯 Task Roadmap Overview

| ID | Stream | Title | Priority | Status | Target Scope |
|---|---|---|---|---|---|
| **SPEC-001** | Trustworthy Core | Honesty, Durability, Focus Mode, Voice Coach & Progress | P0 | **COMPLETED** (`feature/spec-001`) | R2–R5 + U1–U4 |
| **SPEC-002** | Architecture | Edge-Service Consolidation (<5GB RAM Capped, 8GB Laptop Target) | P0 | **COMPLETED** (`feature/spec-002`) | Docker DNS, retire config/discovery, mem limits |
| **SPEC-003** | Local-First | Local-First Purity (Ollama Default, Local STT, Offline Badge) | P1 | **NEXT** | Client-side Whisper/WebSpeech, Ollama default, zero telemetry leak |
| **SPEC-004** | Tracks | Track-Neutral Engine (Per-Track Rubric, Local PDF Resume Parsing) | P1 | **PLANNED** | Behavioral STAR rubric, PDF resume parser, System Design vision |
| **SPEC-005** | Growth | Candidate Progress Ledger & Trajectory Tracking | P2 | **PLANNED** | Historical analytics, skill delta radar, progress charts |

---

## 📋 Detailed Specifications

### SPEC-002: Edge Service Consolidation & RAM Reduction (P0)
- **Goal**: Lower RAM footprint from ~6-8GB to <4GB so learners on standard 8GB laptops can run the full platform locally.
- **Scope**:
  1. Merge `api-gateway-service`, `service-discovery-service`, and `cloud-config-server` into a single consolidated edge service.
  2. Embed configuration profiles directly into application profiles (e.g. `application-local.yml`), removing the runtime requirement for `:8888`.
  3. Transition from Eureka discovery to Docker internal DNS / static routing.
  4. Preserve BYOK header forwarding (`X-InterviewOS-Key`), CORS policies, and rate-limiting.
  5. Staged across M0–M4 as outlined in [ADR 004](docs/ADR/004-edge-service-consolidation.md).

### SPEC-003: Local-First Purity (P1)
- **Goal**: Guarantee 100% offline functionality with zero data leaving the candidate's machine.
- **Scope**:
  1. Default AI model provider set to local Ollama (`llama3.2` / `qwen2.5-coder`).
  2. Local STT fallback (browser Web Speech API and/or client-side Whisper.wasm) when cloud Whisper is unconfigured.
  3. Prominent "Local Purity" UI indicator confirming no external network requests are made.

### SPEC-004: Track-Neutral Evaluation Engine (P1)
- **Goal**: Ensure non-coding tracks (Behavioral, System Design, Resume Deep Dive) are evaluated against track-appropriate criteria rather than algorithmic test-pass rates.
- **Scope**:
  1. Track-specific rubric dimensions (e.g. Behavioral evaluates STAR method, leadership, stakeholder conflict; DSA evaluates Big-O, edge cases, correctness).
  2. Local PDF resume parser in `interview-session-service` extracting work history, technologies, and generating tailored question ladders.

### SPEC-005: Progress Ledger & Improvement Trajectory (P2)
- **Goal**: Track candidate improvement across multiple practice sessions over time.
- **Scope**:
  1. Session-to-session trajectory charts (radar delta, speed improvement, communication clarity trend).
  2. Actionable study plan synchronization across attempts.

---

## 🏛️ Governance Rules for AI Agents

1. **One Spec $\to$ One Commit**: Keep commits atomic and scoped to a single milestone or spec task.
2. **Read `docs/` First**: Always consult [docs/README.md](docs/README.md) and relevant ADRs before modifying cross-service schemas or routing.
3. **Never Rebuild Working Subsystems**: Honor the "⚠️ DO NOT" constraints in `docs/architecture.md`.
4. **Topology Changes Require Accepted ADR**: Any service split or consolidation requires a formal ADR and staged migration.
