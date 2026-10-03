# AI Interview OS — Living Specification & Roadmap (SPEC.md)

> **Mission**: Run your interview prep entirely on your laptop, with your own keys, forever free of cloud bills — so no learner is ever priced out of feeling confident.
> Your resume never leaves your machine. Your failures are never uploaded. $0/month, forever.

---

## 🎯 Task Roadmap Overview

| ID | Stream | Title | Priority | Status | Target Scope |
|---|---|---|---|---|---|
| **SPEC-001** | Trustworthy Core | Honesty, Durability, Focus Mode, Voice Coach & Progress | P0 | **COMPLETED** (`feature/spec-001`) | R2–R5 + U1–U4 |
| **SPEC-002** | Architecture | Edge-Service Consolidation (<5GB RAM Capped, 8GB Laptop Target) | P0 | **COMPLETED** (`feature/spec-002`) | Docker DNS, retire config/discovery, mem limits |
| **SPEC-003** | Local-First | Local-First Purity (Ollama Default, Local STT, Offline Badge) | P1 | **COMPLETED** (`feature/spec-003`) | Ollama default, Whisper.cpp sidecar, EgressTracker, purity badge |
| **SPEC-004** | Tracks | Track-Neutral Engine (Per-Track Rubric, Local PDF Resume Parsing) | P1 | **COMPLETED** (`feature/spec-004`) | Behavioral STAR rubric, PDF resume parser, role calibration |
| **SPEC-005** | Growth | Candidate Progress Ledger & Trajectory Tracking | P2 | **COMPLETED** (`feature/spec-005`) | Historical analytics, skill delta radar, progress charts |
| **SPEC-006** | UX/UI | Playground Redesign — Hub / Module Dual View with Toggle | P1 | **COMPLETED** (merged `be35812` + cleanup `10b3951`) | `LearnView` shell, `HubView`, `ModulesView`, `ViewToggle`, two-track table, learn-tree counters — [full spec](docs/SPEC_006_PLAYGROUND_REDESIGN.md) |
| **SPEC-007** | Bugfix | Playground Coach Fixpack — Stage Integrity, Payload Honesty, URL Sync | P0 | **EXECUTED — Z REVIEW ACCEPTED, MERGE APPROVED** ([review](collab/z/SPEC-007-008-REVIEW.md); VP-7 runtime check deferred to operator) | Gate INTRO stage spec to interview mode (B-1), playground payload bypass (F-2), synthetic coding-stage plan (F-1), `/session/:id` URL sync (F-3) — [full spec](docs/SPEC_007_PLAYGROUND_COACH_FIXPACK.md) |
| **SPEC-008** | Observability | Client Telemetry Echo — Browser Logs into the Loki Pane | P1 | **EXECUTED — Z REVIEW ACCEPTED, MERGE APPROVED** ([review](collab/z/SPEC-007-008-REVIEW.md); VP-7 runtime check deferred to operator) | `clientLogger.ts` bounded buffer, gateway `/api/v1/telemetry/client-logs` echo to stdout, Session #155 call sites instrumented, promtail verify-only; no Mongo, no new containers, drop-on-failure — [full spec](docs/SPEC_008_CLIENT_TELEMETRY_ECHO.md) |
| **SPEC-009** | UX/Bugfix | Playground Arena UX Fixpack — CTA Dedupe, Panel Expand, Turn Abort, Prompt Relevance | P1 | **EXECUTED — Z REVIEW: ACCEPT** (R-1/R-2/R-3 fix `bb03b19` verified by Z — timeout parity, voice/turn separation, abort guard; frontend 249/0F + build exit 0 reproduced dynamically; VP-7 manual script pending operator — [review](collab/z/SPEC-009-REVIEW.md)) | Modal single solve CTA (F-1), playground follow-up relevance rule (B-1), stage-reel + rail auto-hide ≤1 question (F-3 REV 2), turn stop + draft restore + ↑ recall + panel normal/wide/fullscreen (F-2); history editing deferred (no backend mutation API) — [full spec](docs/SPEC_009_ARENA_UX_FIXPACK.md) |
| **SPEC-010** | UX/Bugfix | Arena Panel Fixpack — Geometry Safety, Transcript Collapse, Inline Formatting | P1 | **APPROVED — AWAITING EXECUTION · REV 1** (3 live defects confirmed on master 8865d24; Gemini proposal adjudicated in §0.1 — several items corrected/deferred; no self-approval, no merge before Z audit — [full spec](docs/SPEC_010_ARENA_PANEL_FIXPACK.md)) | F-1 panel geometry: conditional stackAbove (!isPlayground && cameraActive), wide ignores webcam offset (bottom-5), normal+webcam height clamp, fullscreen untouched — kills the <1387px header trap; F-2 candidate prompts >5 lines collapse to 4-line preview + Show more, abort marks metadata.stopped (local-only, SPEC-009 silence preserved); F-3a pure inline renderer ($…$ → math chip, backticks → code chip, ``` fences → code block, unmatched stays literal, no dangerouslySetInnerHTML, no new deps), F-3b FORMATTING RULE appended to playground block + ONE line to interview block (explicit scoped B-1 freeze amendment; repairs TTS "dollar" seep) — deferred: double-click cycling, full markdown, math-symbol substitution — [full spec](docs/SPEC_010_ARENA_PANEL_FIXPACK.md) |

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
