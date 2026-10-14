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
| **SPEC-011** | Content | LLD Catalog Seed — 8 Maven-Workspace Problems (takeUforward LLD sheet mirror) | P1 | **COMPLETED & MERGED** ([Z Review: CONDITIONAL ACCEPT](collab/z/SPEC-011-REVIEW.md) → [Post-Merge VERIFIED](collab/z/SPEC-011-POSTMERGE.md), [Execution Report](collab/gemini/SPEC-011-LLD-SEED-REPORT.md)) | [docs/SPEC_011_LLD_CATALOG_SEED.md](docs/SPEC_011_LLD_CATALOG_SEED.md) — 8 new `SPRING_LLD` questions (`maven-workspace`, live-schema conform), scoped `DsaCatalogGuardTest` 364→372 bump, total catalog 372 PUBLISHED |
| **SPEC-006** | UX/UI | Playground Redesign — Hub / Module Dual View with Toggle | P1 | **COMPLETED** (merged `be35812` + cleanup `10b3951`) | `LearnView` shell, `HubView`, `ModulesView`, `ViewToggle`, two-track table, learn-tree counters — [full spec](docs/SPEC_006_PLAYGROUND_REDESIGN.md) |
| **SPEC-007** | Bugfix | Playground Coach Fixpack — Stage Integrity, Payload Honesty, URL Sync | P0 | **EXECUTED — Z REVIEW ACCEPTED, MERGE APPROVED** ([review](collab/z/SPEC-007-008-REVIEW.md); VP-7 runtime check deferred to operator) | Gate INTRO stage spec to interview mode (B-1), playground payload bypass (F-2), synthetic coding-stage plan (F-1), `/session/:id` URL sync (F-3) — [full spec](docs/SPEC_007_PLAYGROUND_COACH_FIXPACK.md) |
| **SPEC-008** | Observability | Client Telemetry Echo — Browser Logs into the Loki Pane | P1 | **EXECUTED — Z REVIEW ACCEPTED, MERGE APPROVED** ([review](collab/z/SPEC-007-008-REVIEW.md); VP-7 runtime check deferred to operator) | `clientLogger.ts` bounded buffer, gateway `/api/v1/telemetry/client-logs` echo to stdout, Session #155 call sites instrumented, promtail verify-only; no Mongo, no new containers, drop-on-failure — [full spec](docs/SPEC_008_CLIENT_TELEMETRY_ECHO.md) |
| **SPEC-009** | UX/Bugfix | Playground Arena UX Fixpack — CTA Dedupe, Panel Expand, Turn Abort, Prompt Relevance | P1 | **EXECUTED — Z REVIEW: ACCEPT** (R-1/R-2/R-3 fix `bb03b19` verified by Z — timeout parity, voice/turn separation, abort guard; frontend 249/0F + build exit 0 reproduced dynamically; VP-7 manual script pending operator — [review](collab/z/SPEC-009-REVIEW.md)) | Modal single solve CTA (F-1), playground follow-up relevance rule (B-1), stage-reel + rail auto-hide ≤1 question (F-3 REV 2), turn stop + draft restore + ↑ recall + panel normal/wide/fullscreen (F-2); history editing deferred (no backend mutation API) — [full spec](docs/SPEC_009_ARENA_UX_FIXPACK.md) |
| **SPEC-010** | UX/Bugfix | Arena Panel Fixpack — Geometry Safety, Transcript Collapse, Inline Formatting | P1 | **EXECUTED — Z REVIEW: ACCEPT** (branch `fix/spec-010-arena-panel`, 4 commits audited; frontend 260/0F + build exit 0 reproduced dynamically by Z, backend 425 checks exact static match; F-3b interview freeze amendment proven single-hunk +1 line; VP-7 manual script at 2 viewports pending operator — [review](collab/z/SPEC-010-REVIEW.md)) | F-1 panel geometry: conditional stackAbove (!isPlayground && cameraActive), wide ignores webcam offset (bottom-5), normal+webcam height clamp, fullscreen untouched — kills the <1387px header trap; F-2 candidate prompts >5 lines collapse to 4-line preview + Show more, abort marks metadata.stopped (local-only, SPEC-009 silence preserved); F-3a pure inline renderer ($…$ → math chip, backticks → code chip, ``` fences → code block, unmatched stays literal, no dangerouslySetInnerHTML, no new deps), F-3b FORMATTING RULE appended to playground block + ONE line to interview block (explicit scoped B-1 freeze amendment; repairs TTS "dollar" seep) — deferred: double-click cycling, full markdown, math-symbol substitution — [full spec](docs/SPEC_010_ARENA_PANEL_FIXPACK.md) |
| **SPEC-012** | UX/Bugfix | Arena UX Fixpack — Resizable Code Editor & Mode-Aware Focus | P1 | **COMPLETED & MERGED** ([Z Review: ACCEPT](collab/z/SPEC-012-REVIEW.md), [Execution Report](collab/gemini/SPEC-012-ARENA-UX-FIXPACK-REPORT.md)) | Mode-aware Focus collapses problem panel to 0% (F-1); 3-mode resizable editor: split (62%/38%), expanded (95% height, testcases collapsed to 36px header), fullscreen Zen IDE overlay (`z-30` < Coach Sam `z-40`, Esc exit, Minimize2 restore) (F-2); persistence via `interviewos.editorSizing.dsa\|sql` with SSR guards (F-3); 10 new unit tests (272/31/0 dynamic pass) |
| **SPEC-014** | UX/Bugfix | Track Navigation Fixpack — Playground Multi-Track Switching | P1 | **COMPLETED & MERGED** ([Z Review: ACCEPT](collab/z/SPEC-014-AUDIT.md) → [C-1 Verified](collab/z/SPEC-014-C1-VERIFICATION.md), [Execution Report](collab/gemini/SPEC-014-TRACK-NAV-REPORT.md)) | Playground hamburger multi-track switching (DSA ⇄ SQL ⇄ LLD ⇄ HLD ⇄ ALL) with track-reactive catalog (`useSessionCatalog`), dynamic routing (`resolveSectionType`), playlist precedence bypass (RC-5), deterministic index resets on all transitions (RC-6 / C-1), and language sync (AC-5); proctored interview mode strictly preserved (AC-6); 28 new unit tests (300/39/0 pass, 1,144 assertions, build exit 0) |
| **SPEC-015** | Voice/Bugfix | Voice/PTT Hardening — Keyboard Repeat Guard & Mic Requesting Parity | P1 | **COMPLETED & MERGED** ([Z Pre-Flight: APPROVED](collab/z/SPEC-015-PREFLIGHT-QB33.md) → [Z Merge Audit: AUTHORIZED](collab/z/SPEC-015-MERGE-AUDIT-QB34.md), [Execution Report](collab/gemini/SPEC-015-REPORT.md)) | Push-to-Talk `Ctrl+M` hotkey hardening across ArenaShell & AutoGrowingChatInput: `e.repeat` guard against held-key flapping (AC-1), `!isRequestingMic` keyboard parity with click path & `isRequestingMic` in `useEffect` deps (AC-2, BC-2, BC-3); 2 contract tests (+6 assertions; 306/39/0 pass, 1,161 assertions, build exit 0) |
| **SPEC-013** | Content | DSA Catalog Seed — 25 Flagship Questions (Gaurav Kumar Blog Seed) | P1 | **COMPLETED & MERGED** ([Z Merge Audit: AUTHORIZED](collab/z/SPEC-013-MERGE-AUDIT-QB36.md), [Execution Report](collab/gemini/SPEC-013-REPORT.md)) | 25 high-yield DSA questions curated from Gaurav's blog with complete test suites & JDK 21 runnable solutions; stale voice fix `173cf63` dropped to protect audited voice state machine; scoped `DsaCatalogGuardTest` 372→397 bump, total catalog **397 PUBLISHED** |
| **SPEC V-2.0.8** | Workspace | Per-Question Project Scaffolds & Hard-Gate Hardening | P1 | **COMPLETED & MERGED** ([Z Fast-Track Audit: AUTHORIZED](collab/z/V208-MERGE-AUTH-QB37.md), [Execution Report](collab/gemini/V208-REPORT.md)) | [docs/SPEC_V208.md](docs/SPEC_V208.md) — V8-01 hidden-test exposure lock, whitelist staging policy (`/**` prefix & fail-closed), wire `droppedWriteCount` observability; V8-02 ContentValidator hard gates for workspace profile |
| **SPEC-016** | Engine/Content | Question Rotation Engine & Catalog Depth Expansion (All Tracks) | P0 | **COMPLETED & MERGED** ([Z Pre-Audit: GREEN](collab/z/SPEC-016-PREAUDIT-QB40.md) → [Z Merge Audit: AUTHORIZED](collab/z/QB40-MERGE-AUTH-SPEC-016.md), [Execution Report](collab/gemini/SPEC-016-REPORT.md)) | [collab/z/SPEC-016-ROTATION-CATALOG-DEPTH.md](collab/z/SPEC-016-ROTATION-CATALOG-DEPTH.md) — Entropy injection & candidate exposure ledger (`V13__add_exposure_lookup_index.sql`), D1→D2→D3 graceful degradation ladder, multi-track loop deduplication; +78 AI-drafted original questions across HLD/LLD/SQL/Behavioral (catalog 397→475, zero starvation); zero frontend touch |
| **SPEC-017** | Core/Growth | Persistent Streak, Activity Calendar & Question History | P0 | **COMPLETED & MERGED** ([Z Spec](collab/z/SPEC-017-STREAK-CALENDAR-HISTORY.md) → [Z Merge Audit: AUTHORIZED](collab/z/QB42-MERGE-AUTH-SPEC-017.md), [Execution Report](collab/gemini/SPEC-017-REPORT.md)) | [collab/z/SPEC-017-STREAK-CALENDAR-HISTORY.md](collab/z/SPEC-017-STREAK-CALENDAR-HISTORY.md) — Query-time pure derived streak (compose restart-proof by construction), strict `java.time` timezone doctrine (DST/half-open safe), Flyway `V14` covering read indexes, Gateway Route 1.7 (`/api/v1/history/**`), GitHub-style 7×N contribution calendar (`ActivityHeatmap`), drill-down daily ledger (`DayDetail`), deep-link practice launcher (`PracticeLauncherCard`), and dashboard streak chip (`StreakStrip`); zero new npm deps; 312 backend + 317 frontend tests green |



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
