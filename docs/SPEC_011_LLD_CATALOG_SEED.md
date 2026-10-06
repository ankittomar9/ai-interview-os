# SPEC-011 — LLD Catalog Seed: 12 Maven-Spring Low-Level Design Problems

**Published by:** Z.ai (architect/audit lane) · **REV 1** · **Status:** APPROVED — AWAITING EXECUTION
**Executor:** Gemini (execution lane) · **Audit:** Z (12 checks, AUDIT-PROTOCOL v1.1) · **Date:** 2026-10-06
**Provenance:** Operator request — mirror the takeUforward Prep-Hub "Low Level Design (LLD) Interview" sheet (operator screenshots, 2026-10-06). Repo catalog today: 36 questions (dsa 20, sql 8, hld 6, behavioral 2), **zero LLD**, despite the `SPRING_LLD` track and the `maven-spring` runner being fully plumbed and idle.

---

## §0 Source Research & Copyright Posture (operator's "find it on GitHub" ask)

Public sources located and screened (GitHub API, 2026-10-06):

| Source | Stars | License | Disposition |
|---|---|---|---|
| `ashishps1/awesome-low-level-design` | 27.2k | **GPL-3.0** | **Reference-only.** Covers all 12 target systems. Zero text/code reuse (GPL contamination risk). |
| `arpit20adlakha/Data-Structure-Algorithms-LLD-HLD` | 2.6k | **MIT** | Reference. Adaptation permitted WITH attribution recorded in SOURCES.md. |
| `kousiknath/LowLevelDesign` | 525 | MIT | Reference. |
| `kumaransg/LLD` | 2.0k | **none** | Do not copy anything from it. |
| takeuforward Prep-Hub | — | proprietary | **Topic titles only** (facts). No statement text — Pro content is paywalled. |

Copyright rules for this seed (binding):

- **C1** — Problem *ideas and titles* (Parking Lot, Vending Machine…) are unprotectable facts; mirroring the 12-topic list is safe.
- **C2** — Problem *statements* must be authored fresh, in original wording. The existing `ContentValidator` similarity guard (< 0.35 word-overlap vs `source`) is the mechanical tripwire — every file must pass it.
- **C3** — Attribution uses the repo's existing convention: `source: inspired-by:<ref>` (as in all hld files).
- **C4** — No text or code from GPL-3.0 or unlicensed repositories enters this repo.
- **C5** — `content/questions/lld/SOURCES.md` records every consulted URL with license noted.

## §1 Scope

**Phase A (this spec) — 12 questions**, one per system. The takeUforward Design(Core)/Code(Pro) split is **fused into one question per system** (implementation happens against `starterFiles` in the LLD workspace editor).

| # | slug | Title | Difficulty |
|---|---|---|---|
| 1 | `lld-parking-lot` | Multi-Level Parking Lot | MID |
| 2 | `lld-logging-framework` | Extensible Logging Framework | MID |
| 3 | `lld-traffic-signal` | Traffic Signal Control System | MID |
| 4 | `lld-vending-machine` | Vending Machine | MID |
| 5 | `lld-task-management` | Task Management System | MID |
| 6 | `lld-atm` | ATM Banking Machine | MID |
| 7 | `lld-elevator` | Multi-Elevator Control System | MID |
| 8 | `lld-pubsub` | Publish-Subscribe Message Broker | SENIOR |
| 9 | `lld-hotel-management` | Hotel Management System | SENIOR |
| 10 | `lld-digital-wallet` | Digital Wallet | SENIOR |
| 11 | `lld-ride-booking` | Ride Booking Application | SENIOR |
| 12 | `lld-music-streaming` | Music Streaming Platform | SENIOR |

**Out of scope (deferred, §8):** theory topics (All About APIs, Database Design & Integration, How to approach a LLD interview, Types of Locking Mechanism, Streaming Protocols — articles, not executable problems); sheet items not visible in the screenshots (operator to supply expanded-list screenshots for Phase B).

**Mechanical facts verified on master `2678235`:** seeder scans `classpath*:content/questions/**/*.md` (new directory auto-discovered, zero Java edits); `LldMavenRunner` activates on `buildProfile: maven-spring` (LldMavenRunner.java:110); `ContentValidator` SPRING_LLD branch requires non-empty `starterFiles` or `starterCode`; difficulty enum = JUNIOR/MID/SENIOR; track enum = `SPRING_LLD`.

## §2 File Contract

Each file: `content/questions/lld/<slug>.md`, YAML frontmatter (keys exactly as parser expects) + body = problem statement. **Exemplar (authoritative template) — `lld-parking-lot.md`:**

```markdown
---
slug: lld-parking-lot
title: Multi-Level Parking Lot
track: SPRING_LLD
difficulty: MID
tags: [lld, oop, strategy-pattern, concurrency, enums]
buildProfile: maven-spring
source: inspired-by:takeuforward-prep-hub/lld/parking-lot
status: PUBLISHED
hints:
  - "Model vehicle and spot types as one hierarchy so new vehicle kinds never touch gate logic."
  - "Fee calculation is a policy, not a property: hide it behind an interface and inject it."
coaching:
  commonMistakes:
    - "Hardcoding spot-to-vehicle mapping in if/else chains instead of polymorphic matching."
    - "Forgetting the exit flow: payment settlement, spot release, receipt."
  presentationTips:
    - "Open with actors and flows (entry, exit, payment) before drawing any class."
  modelAnswerOutline: "Gate services -> Ticket -> Spot allocation strategy -> Fee policy -> Payment processor; close with spot-state concurrency."
  approachHint: "Clarify scale (single lot vs multi-lot) before deciding whether floors are first-class."
evaluationCriteria:
  - "Object-oriented modeling quality"
  - "Design pattern selection and justification"
  - "Extensibility to new vehicle and fee types"
  - "Concurrency awareness in spot allocation"
constraints:
  - "Single process; in-memory persistence is acceptable"
  - "Multiple entry and exit gates must be modeled"
interviewerNotes:
  expectedConcepts:
    - "Composition over inheritance"
    - "Strategy pattern for fee/allocation"
    - "Enum-driven type safety"
  followUpSeeds:
    - "How would you add EV charging spots without rewriting the gate?"
    - "What changes when occupancy must be exposed to a city API?"
  rubricCheckpoints:
    - "Candidate names entities unprompted: Vehicle, Spot, Ticket, Gate, FeePolicy"
    - "Allocation strategy is swappable, not hardcoded"
starterFiles:
  "src/main/java/com/interviewos/lld/parkinglot/model/Vehicle.java": |
    package com.interviewos.lld.parkinglot.model;
    public enum VehicleType { MOTORCYCLE, CAR, TRUCK, EV }
  "src/main/java/com/interviewos/lld/parkinglot/model/SpotType.java": |
    package com.interviewos.lld.parkinglot.model;
    public enum SpotType { MOTORCYCLE, COMPACT, LARGE, EV_CHARGING }
  "src/main/java/com/interviewos/lld/parkinglot/service/SpotAllocator.java": |
    package com.interviewos.lld.parkinglot.service;
    import com.interviewos.lld.parkinglot.model.SpotType;
    import com.interviewos.lld.parkinglot.model.VehicleType;
    /** Strategies decide which SpotType can host a given VehicleType. */
    public interface SpotAllocator {
        SpotType allocate(VehicleType vehicleType);
    }
  "src/test/java/com/interviewos/lld/parkinglot/WarmupTest.java": |
    package com.interviewos.lld.parkinglot;
    import org.junit.jupiter.api.Test;
    import static org.junit.jupiter.api.Assertions.*;
    class WarmupTest {
        @Test
        void projectCompilesAndRuns() { assertEquals(4, VehicleType.values().length); }
    }
---
### Multi-Level Parking Lot
Design the software for a multi-level parking lot ... (original statement, >= 150 words,
>= 8 numbered functional requirements, explicit non-goals — see rules below)
```

**Statement authoring rules (each of the 12):**
- Body ≥ 150 words, second-person prompt style; **original wording** — never lift sentences from any source (C2/C4).
- ≥ 8 numbered functional requirements + a short "Non-goals" paragraph.
- No platform/educator names inside the statement.
- `starterFiles`: keys are repo-relative paths under `src/main/java/com/interviewos/lld/<system>/…`; include **compilable toothless skeletons** (enums + 2–4 interfaces, no implementation) and **one `WarmupTest`** that passes without candidate code, so the maven-spring baseline is green before the candidate types anything.
- **Executor must re-read `LldMavenRunner.java` and `docker/lld-runner/skeleton-pom.xml` before authoring** and conform to the runner's actual materialization contract (the runner source is the mechanical source of truth; this spec fixes outcomes, not build internals). If the runner contract makes any part of this file contract impossible, STOP and report — do not improvise (hard rule 11, protocol v1.1).

## §3 Fence

**Allowed (new files only):**
- `content/questions/lld/` — 12 question files + `SOURCES.md`
- `question-bank-service/src/test/java/com/interviewos/questionbank/ingestion/LldCatalogSeedTest.java` — tree-bound test: resolves all 12 classpath files, parses each, asserts count=12, track=SPRING_LLD, buildProfile=maven-spring, starterFiles non-empty, WarmupTest present, similarity-safe statement length.

**Forbidden (zero edits):** `QuestionMarkdownParser.java`, `ContentValidator.java`, `QuestionDataInitializer.java`, `QuestionMarkdownSeeder.java`, all other services, frontend, `pom.xml`, `docker/`, `package.json`, `AutoGrowingChatInput.tsx`, `FloatingAiOrb.tsx`.

## §4 VP Gates

- **VP-1 (seed & catalog):** question-bank container boots clean; `GET /api/questions/catalog` (or QuestionPublicController equivalent) returns the 12 new slugs; total catalog = 48 PUBLISHED.
- **VP-2 (validation):** ContentValidator reports 12/12 valid (status PUBLISHED); validation logs show zero errors; similarity ratio < 0.35 for every file (paste the 12 log lines).
- **VP-3 (dynamic runner smoke):** through the sandbox execute API, run the `lld-parking-lot` warmup in the lld-runner container → maven build success, tests run 1, failures 0 (proves the first-ever `maven-spring` profile consumer is live end-to-end).
- **VP-4 (four numbers + Pre-Flight):** protocol v1.1 Pre-Flight pasted; four numbers for question-bank-service tests (baseline: re-count at base ref with own regex) and frontend untouched note.
- **VP-5 (originality spot-check):** Z greps distinctive phrases from the top public sources against all 12 files — zero matches required.
- **VP-6 (operator manual):** launch one live LLD interview session on `lld-parking-lot`; confirm question loads, workspace editor opens with starter files, warmup executes.

## §5 Commit Slices (verbatim messages)

1. `feat(question-bank): SPEC-011 seed LLD catalog — 12 maven-spring problems`
   (12 .md + SOURCES.md + LldCatalogSeedTest.java — nothing else)
2. `docs(spec-011): publish execution report for Z review`
   (`collab/gemini/SPEC-011-LLD-SEED-REPORT.md` with Pre-Flight)

## §6 Z Re-verification Plan

Fetch branch → topology vs §5 → fence census (13 code files + 1 report = 14) → statement originality grep (VP-5) → parser round-trip static read → four-number recount own-regex → dynamic `mvn` unavailable in Z sandbox (established); VP-1/2/3 evidence executor-run + Z static match → verdict in `collab/z/SPEC-011-REVIEW.md`.

## §7 Deviations Ledger Requirement

Executor reports: any starterFiles contract drift discovered in the runner source, any slug/difficulty change with rationale, any statement sourced closer than paraphrase from MIT repos (with SOURCES.md line).

## §8 Deferred (Phase B candidates — not in this cycle)

Remaining takeUforward sheet items (need full-list screenshots), theory topics as interview "concept cards" (requires non-executable question type — separate spec), HLD/SQL catalog expansion, SOLUTIONS (full reference implementations per LLD problem — candidates currently build from skeletons; reference solutions would power auto-evaluation later).
