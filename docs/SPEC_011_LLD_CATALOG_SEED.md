> **STATUS: HISTORICAL SPECIFICATION** — Retained for architectural provenance. Current active development and audits are governed by collab/ protocol.

# SPEC-011 — LLD Catalog Seed: 8 Maven-Workspace Low-Level Design Problems (REV 2)

**Published by:** Z.ai (architect/audit lane) · **REV 2 — supersedes REV 1 (`e928e67`)** · **Status:** APPROVED — AWAITING EXECUTION
**Executor:** Gemini (execution lane) · **Audit:** Z (12 checks, AUDIT-PROTOCOL v1.1) · **Date:** 2026-10-06
**Provenance:** Operator request — mirror the takeUforward Prep-Hub "Low Level Design (LLD) Interview" sheet (operator screenshots, 2026-10-06). REV 1 was legally stopped at Pre-Flight under hard rule 11 (STOP-and-report, protocol v1.1): its catalog premise and file contract had been authored against a stale catalog snapshot. REV 2 is re-grounded against `origin/master` `e928e67` with every mechanical fact independently re-verified by Z. Adjudication record: `collab/z/SPEC-011-STOP-VERDICT.md`.

---

## §0-REV2 Changelog — what REV 1 got wrong and what REV 2 does instead

| # | REV 1 claimed | Ground truth on `e928e67` (Z-verified) | REV 2 resolution |
|---|---|---|---|
| R2-1 | Catalog = 36 questions (dsa 20, sql 8, hld 6, behavioral 2), **zero LLD** | **364** questions (dsa 316, hld 27, sql 8, behavioral 2, **lld 11**, all PUBLISHED) | Seed only the 8 systems the catalog does not have |
| R2-2 | `lld-parking-lot`, `lld-vending-machine` are new slugs | Both exist and are PUBLISHED | Dropped from scope |
| R2-3 | `lld-atm`, `lld-elevator` are new slugs | Semantic duplicates of existing `lld-atm-system` / `lld-elevator-system` | Dropped — no near-duplicate slugs enter the catalog |
| R2-4 | `buildProfile: maven-spring` | `ContentValidator.java:86-88`: track `SPRING_LLD` requires `maven-workspace`; all 11 live LLD files use `maven-workspace`; runner accepts both (LldMavenRunner.java:112) but the ingestion gate makes only `maven-workspace` publishable | `buildProfile: maven-workspace` everywhere; ContentValidator stays frozen |
| R2-5 | Difficulty enum MID/SENIOR | Catalog vocabulary is EASY/MEDIUM/HARD (guard test enforces it for DSA; all 11 LLD files use it) | MEDIUM/HARD per §1 |
| R2-6 | Exemplar lacked `pom.xml`, `editablePaths`, `hiddenTestFiles`; fabricated frontmatter shape | ContentValidator Rules 1–3 hard-require all three (L93, L98, L114); live schema is the real `lld-parking-lot.md` | Exemplar deleted; live file is the authoritative template (§2) |
| R2-7 | VP-1: total catalog = 48 | `DsaCatalogGuardTest.java` L110/L115/L116/L139 hard-asserts **exactly 364** | Total = 372; scoped guard-test literal bump authorized (§3) |

## §0 Source Research & Copyright Posture (operator's "find it on GitHub" ask)

Public sources located and screened (GitHub API, 2026-10-06; unchanged from REV 1):

| Source | Stars | License | Disposition |
|---|---|---|---|
| `ashishps1/awesome-low-level-design` | 27.2k | **GPL-3.0** | **Reference-only.** Covers all 8 remaining target systems. Zero text/code reuse (GPL contamination risk). |
| `arpit20adlakha/Data-Structure-Algorithms-LLD-HLD` | 2.6k | **MIT** | Reference. Adaptation permitted WITH attribution recorded in SOURCES.md. |
| `kousiknath/LowLevelDesign` | 525 | MIT | Reference. |
| `kumaransg/LLD` | 2.0k | **none** | Do not copy anything from it. |
| takeuforward Prep-Hub | — | proprietary | **Topic titles only** (facts). No statement text — Pro content is paywalled. |

Copyright rules for this seed (binding, unchanged):

- **C1** — Problem *ideas and titles* (Logging Framework, PubSub…) are unprotectable facts; mirroring the 8-topic list is safe.
- **C2** — Problem *statements* must be authored fresh, in original wording. The `ContentValidator` similarity guard is the mechanical tripwire — and note it short-circuits to 0.0 for `source: inspired-by:*` (ContentValidator.java:143), so the *binding* controls here are the authoring rules below and VP-5, not the ratio.
- **C3** — Attribution uses the repo's existing convention: `source: inspired-by:<ref>` (as in all hld and all 11 lld files).
- **C4** — No text or code from GPL-3.0 or unlicensed repositories enters this repo.
- **C5** — `content/questions/lld/SOURCES.md` records every consulted URL with license noted.

## §1 Scope

**Phase A (this spec) — 8 questions**, one per system — the takeUforward sheet systems the catalog does not yet have. The Design(Core)/Code(Pro) split is fused into one question per system (implementation happens against `starterFiles` in the LLD workspace editor).

| # | slug | Title | Difficulty | est_minutes | Package base |
|---|---|---|---|---|---|
| 1 | `lld-logging-framework` | Extensible Logging Framework | MEDIUM | 35 | `com.interviewos.logging` |
| 2 | `lld-traffic-signal` | Traffic Signal Control System | MEDIUM | 35 | `com.interviewos.traffic` |
| 3 | `lld-task-management` | Task Management System | MEDIUM | 35 | `com.interviewos.tasks` |
| 4 | `lld-pubsub` | Publish-Subscribe Message Broker | HARD | 45 | `com.interviewos.pubsub` |
| 5 | `lld-hotel-management` | Hotel Management System | HARD | 45 | `com.interviewos.hotel` |
| 6 | `lld-digital-wallet` | Digital Wallet | HARD | 45 | `com.interviewos.wallet` |
| 7 | `lld-ride-booking` | Ride Booking Application | HARD | 45 | `com.interviewos.ride` |
| 8 | `lld-music-streaming` | Music Streaming Platform | HARD | 45 | `com.interviewos.music` |

**Out of scope (deferred, §8):** `lld-parking-lot` and `lld-vending-machine` (already PUBLISHED; re-authoring their statements toward the takeUforward fusion is an operator Phase-B decision); `lld-atm`/`lld-elevator` (covered by `lld-atm-system`/`lld-elevator-system`); theory topics (articles, not executable problems — separate spec); SOLUTIONS for the 8 new problems (the existing 11 already carry reference solutions from `d0134d5`).

**Mechanical facts re-verified by Z on master `e928e67` — executor: do not re-derive, but DO re-read the named sources before authoring (hard rule 11):**

- **Auto-discovery:** `QuestionMarkdownSeeder.java:31` scans `classpath*:content/questions/**/*.md` — the `lld/` directory already exists and is live; new files need zero Java wiring.
- **Ingestion gate:** `ContentValidator.java:84-123` — `SPRING_LLD` requires `buildProfile: maven-workspace` (L86-88); `starterFiles` must contain `pom.xml` (L93); `editablePaths` non-empty and every entry either a `starterFiles` key or a `/**` directory prefix (L98-110); `hiddenTestFiles` non-empty, every key under `src/test/java/` (L114-121). Any violation ⇒ status DRAFT ⇒ guard test fails ⇒ build red.
- **Catalog count lock:** `DsaCatalogGuardTest.java` test #2 (L109-140) parses every md file in the catalog and asserts **exactly 364** total (L115) and 364 PUBLISHED (L139). Adding 8 files without the §3-authorized literal bump breaks the build.
- **Runner contract:** `LldMavenRunner.java` — `supports()` true for `maven-workspace` (L112); materialization order = starterFiles → candidate overlay (whitelisted by `editablePaths`, exact-key or `/**` prefix; anything else is dropped and logged `[LLD_RUNNER_DROPPED_PATHS]`, L131-162) → **hiddenTestFiles re-injection overwrites same-path starter copies** (L164-169 — anti-tamper, this is why the 3 test paths appear in both maps) → `mvn -o -B test` in `ai-interview-os/lld-runner:latest` (offline, 240 s, 768 MB RAM, network `none`, surefire XML parsed). Because `-o` is offline, **per-question poms may only use image-cached dependencies** — use the §2 pom template verbatim.
- **`docker/lld-runner/skeleton-pom.xml` exists on master** (`git ls-tree origin/master docker/lld-runner/`). Note: `git ls-files origin/master` cannot see remote trees — that subcommand caused the empty search during pre-flight.
- **Live LLD field conventions (all 11 files):** difficulty EASY/MEDIUM/HARD; `topics: [lld]` exactly (taxonomy id `lld`, `_taxonomy.yaml:77`); `est_minutes` present (guard requires >0; the 11 use 35); **3 test classes per system**, same paths listed in BOTH `starterFiles` (visible) and `hiddenTestFiles` (authoritative); `editablePaths` = explicit file list, no wildcards, never test files; editable skeletons throw `UnsupportedOperationException("TODO: Implement …")`; hidden tests use **junit-jupiter only** (no Mockito/Spring — offline cache constraint).

## §2 File Contract

Each file: `content/questions/lld/<slug>.md`, YAML frontmatter + body = problem statement.
**Authoritative template: the live `question-bank-service/src/main/resources/content/questions/lld/lld-parking-lot.md` on master — read it in full and mirror its structure field-for-field. Do NOT invent frontmatter shapes; REV 1's fabricated exemplar is retracted.**

Required frontmatter keys (exactly): `slug`, `title`, `track: SPRING_LLD`, `difficulty` (MEDIUM|HARD per §1), `topics: [lld]`, `est_minutes` (per §1), `tags` (3–7), `buildProfile: maven-workspace`, `source: inspired-by:takeuforward-prep-hub/lld/<system>`, `status: PUBLISHED`, `hints` (3–4 plain strings), `coaching` (`commonMistakes` / `presentationTips`), `starterFiles` (map path → content), `editablePaths` (list), `hiddenTestFiles` (map path → content).

`starterFiles` per system (package base fixed in §1):

- `pom.xml` — the live parking-lot pom **verbatim except `artifactId`** (Java 21, `junit-jupiter` 5.11.4, surefire 3.5.2 — offline-cache constraint, no additional dependencies).
- `README.md` — overview, key components, candidate task (which TODO files to implement).
- ≥ 6 compilable skeletons under `src/main/java/<packageBase>/…` — enums, 2–4 interfaces, model classes (implemented, trivial), and the coordinator/service classes whose methods are the candidate's job: toothless but compiling, `throw new UnsupportedOperationException("TODO: Implement …")` exactly as the live parking-lot skeletons do.
- The 3 visible test classes under `src/test/java/<packageBase>/…` (copies of the hidden ones — see below).

`editablePaths`: the explicit list of the TODO implementation files only. No `/**` wildcards (live convention), never test files.

`hiddenTestFiles`: the **same 3 test paths** as the visible copies, with authoritative JUnit 5 content — junit-jupiter only, no Mockito/Spring/other deps. 3 classes per system named `<Domain><Aspect>Test` (live convention: e.g. `VendingPaymentTest`, `VendingDispenseTest`, `VendingStateLifecycleTest`). Tests must compile and run against the toothless skeletons (they may fail, they must not error at compile time) and must pass against a correct implementation (VP-3b proves it for the pattern).

Statement body rules (each of the 8):
- ≥ 150 words, second-person prompt style; **original wording** — never lift sentences from any source (C2/C4).
- ≥ 8 numbered functional requirements + a short "Non-goals" paragraph.
- No platform/educator names inside the statement.
- Statement must be satisfiable by an implementation constrained to the `editablePaths` files only (hidden tests may reference model/enum types from starterFiles).

**Executor obligation (hard rule 11, verbatim):** before authoring, re-read `LldMavenRunner.java`, `ContentValidator.java`, `DsaCatalogGuardTest.java`, `docker/lld-runner/skeleton-pom.xml`, and the live `lld-parking-lot.md` on the execution ref. If the runner or validator contract makes any part of this file contract impossible, STOP and report — do not improvise.

## §3 Fence

**Allowed (new files only):**
- `content/questions/lld/` — the 8 question files (§1) + `SOURCES.md`
- `question-bank-service/src/test/java/com/interviewos/questionbank/ingestion/LldCatalogSeedTest.java` — tree-bound test: resolves the 8 classpath files, parses each, asserts count=8, track=SPRING_LLD, buildProfile=maven-workspace, starterFiles contains `pom.xml`, editablePaths non-empty, hiddenTestFiles non-empty with keys under `src/test/java/`, topics=[lld], est_minutes>0.

**Allowed (scoped edit — exactly one existing file, exactly these literals):**
- `DsaCatalogGuardTest.java`: the four occurrences of the literal `364` → `372` (L110 DisplayName, L115 assertEquals arg + L116 message, L139 arg + message). Diff census in this file: ≤ 8 changed lines. Nothing else in the file may change.

**Forbidden (zero edits):** `QuestionMarkdownParser.java`, `ContentValidator.java`, `QuestionDataInitializer.java`, `QuestionMarkdownSeeder.java`, all 11 existing `content/questions/lld/*.md` files, `content/questions/_taxonomy.yaml`, `SPEC.md`, all other services, frontend, all `pom.xml`, `docker/` (including `docker/lld-runner/*`), `package.json`, `AutoGrowingChatInput.tsx`, `FloatingAiOrb.tsx`.

## §4 VP Gates

- **VP-1 (seed & catalog):** question-bank container boots clean; `GET /api/questions/catalog` (or QuestionPublicController equivalent) returns the 8 new slugs; total catalog = **372 PUBLISHED**.
- **VP-2 (validation):** ContentValidator reports 8/8 valid (status PUBLISHED); paste the 8 `content/reports/<slug>.log` lines. Similarity ratio 0.0000 for every file is the **expected** output (inspired-by short-circuit, §1) — do not present it as a similarity pass.
- **VP-3 (dynamic runner smoke, honest-judge):**
  - (a) baseline: execute the untouched `lld-logging-framework` starter through the sandbox execute API → compilation clean (status must NOT be COMPILE_ERROR), `totalTests == 3`, overall status FAILED is the **expected** result on toothless skeletons — paste it as-is;
  - (b) satisfiability: solve `lld-logging-framework` against its own hidden tests via candidateFiles only (nothing committed under `content/`) → status PASSED, tests run 3, failures 0. Attach the solved files to the report under `collab/gemini/`.
- **VP-4 (four numbers + Pre-Flight):** protocol v1.1 Pre-Flight pasted; G3 four numbers (files / test-cases / assertions / failures) for question-bank-service tests at base ref vs post-push, own-regex recount. Note: `LldCatalogSeedTest` adds test methods; `DsaCatalogGuardTest` adds none (literal bump only) — both facts must be visible in the numbers.
- **VP-5 (originality spot-check):** Z greps distinctive phrases from `ashishps1/awesome-low-level-design` (GPL-3.0) and the MIT repos against all 8 files — zero matches required.
- **VP-6 (operator manual):** launch one live LLD interview/practice session on `lld-logging-framework`; confirm question loads, workspace editor opens with starter files, execute round-trips.

## §5 Commit Slices (verbatim messages)

1. `feat(question-bank): SPEC-011 R2 seed LLD catalog — 8 maven-workspace problems`
   (8 `.md` + `SOURCES.md` + `LldCatalogSeedTest.java` + `DsaCatalogGuardTest.java` 364→372 literal bump — nothing else)
2. `docs(spec-011): publish execution report for Z review`
   (`collab/gemini/SPEC-011-LLD-SEED-REPORT.md` with Pre-Flight + VP-1/2/3 evidence + VP-3b solved files)

## §6 Z Re-verification Plan

Fetch branch → topology vs §5 → fence census (exactly 11 paths: 8 md + SOURCES.md + LldCatalogSeedTest.java + DsaCatalogGuardTest.java + 1 report) → guard-test diff = the four 364→372 literals only → schema conformity spot-read vs live `lld-parking-lot.md` → statement originality grep (VP-5) → four-number recount with own regex → dynamic `mvn` unavailable in Z sandbox (established); VP-1/2/3 evidence executor-run + Z static match → verdict in `collab/z/SPEC-011-REVIEW.md`.

## §7 Deviations Ledger Requirement

Executor reports: any starterFiles contract drift discovered against the live template, any slug/difficulty/est_minutes change with rationale, any statement sourced closer than paraphrase from the MIT repos (with SOURCES.md line).

## §8 Deferred (Phase B candidates — not in this cycle)

- Re-authoring `lld-parking-lot` / `lld-vending-machine` statements toward the takeUforward fusion (operator decision — existing files are PUBLISHED and wired).
- Remaining takeUforward sheet items (need full-list screenshots).
- Theory topics as interview "concept cards" (requires non-executable question type — separate spec).
- SOLUTIONS for the 8 new problems (reference implementations powering auto-evaluation; the existing 11 already have them from `d0134d5`).
- HLD/SQL catalog expansion.
