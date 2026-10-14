# SPEC-016 NOTE: Question Rotation & Catalog Depth

| Metadata | Value |
|---|---|
| **Spec** | SPEC-016 (Question Rotation & Catalog Depth: All Tracks) |
| **Author / Lane** | Gemini (Execution Lane, compressed single-push per QB-35) |
| **Architect & Auditor** | Z (Audit Lane) |
| **Base Commit** | `814ff2d` |
| **Branch** | `feat/spec-016-rotation-catalog-depth` |
| **Date** | 2026-10-14 |
| **Status** | Implementation Complete — Ready for QB-40 Single Audit |

---

## 1. Architecture Overview

### 1.1 Root Cause & Solution Topology
1. **Root Cause**: `InterviewSessionService.createSession` derived its plan random seed via `Math.abs(hash(candidateId)*31 + hash(track) + hash(difficulty))`. Because `String.hashCode()` is deterministic across JVM runs, the same candidate choosing the same track and difficulty received identical pseudorandom sequences and identical question selections indefinitely. Furthermore, `SessionPlanService` only checked `alreadyChosenSlugs` within the current session, maintaining zero cross-session memory despite Addendum A's `session_questions` exposure ledger being actively written.
2. **P0 Rotation Engine**:
   - **Exclusion Ledger Read**: Implemented `QuestionExposureService` querying `session_questions` joined with `interview_sessions` for non-PLAYGROUND completed/active sessions for the given `candidateId` and `track`, with covering database index `idx_sessions_candidate_track` on `interview_sessions(candidate_id, track)` via migration `V13__add_exposure_lookup_index.sql`.
   - **Nonce-Seeded Entropy**: Injected `sessionNonceSupplier` (`LongSupplier`, defaulting to wall-clock nanoTime ^ UUID hash) into `InterviewSessionService.createSession`, guaranteeing that distinct sessions explore divergent random walks even before exclusion takes effect.
   - **Degradation Ladder**: Extended `SessionPlanService.buildPlannedSlugsForTrack` with `Set<String> excludedSlugs`. When available eligible pools are exhausted:
     - **STRICT**: Plan formed entirely from unserved questions.
     - **D1 (Adjacent Rung)**: Relax difficulty rungs across neighboring difficulty levels.
     - **D2 (LRU Reuse)**: Reuse previously served questions ordered by lowest `timesServed`, then oldest `lastServedAt`. Emits `[ROTATION_DEGRADED]` log telemetry and records `rotationPolicy = DEGRADED_LRU` with reused slugs inside `SessionPlan`.
     - **D3 (Fallback)**: Any published question from fallback pool. Guaranteed never to throw or block session creation.
   - **Loop Parity**: Multi-track loops (`FULL_LOOP`, `DSA_LLD`, `LLD_HLD`, `DSA_LLD_HLD`) propagate `excludedSlugs` across all sections while accumulating in-session exclusions, preventing cross-section repeats within a loop and cross-session repeats across loops.

### 1.2 P1 Guard Evolution
- Replaced hardcoded exact count pins (`397`) in `DsaCatalogGuardTest` and `QuestionMarkdownParserTest` with monotonic floors: `assertTotalAtLeast(397)` and track-specific floors (`dsa: 341, hld: 27, lld: 19, sql: 8, behavioral: 2`). Added starvation telemetry alarms identifying any (track, difficulty) rungs with 0 published questions.

### 1.3 P2 Catalog Expansion
- Expanded starving and thin tracks by +78 original, high-quality questions:
  - `behavioral`: 2 → 24 (+22 STAR scenarios spanning conflict, failure, ethics, ambiguity, leadership)
  - `sql`: 8 → 20 (+12 PostgreSQL problems with DDL setup, solution SQL, expected CSV)
  - `hld`: 27 → 50 (+23 distributed system architectures with detailed scopes, components, tradeoffs)
  - `lld`: 19 → 40 (+21 Maven workspaces with pom.xml, starter files, editable paths, hidden JUnit tests)
- Total catalog depth: **475 PUBLISHED questions** (surpassing the target of ≥ 473).
- All questions adhere to copyright guidelines: `source: ai-generated:v1`, original domain contexts, zero brand names.
