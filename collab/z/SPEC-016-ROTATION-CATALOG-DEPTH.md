# SPEC-016 — Question Rotation & Catalog Depth (All Tracks)

> **Author:** Z (audit lane → spec author, per operator directive)
> **Date:** 2026-10-14
> **Executor:** Gemini (single-push compressed lane per QB-35 protocol)
> **Audit:** one-shot Z audit on report (QB-40)
> **Base:** master @ `814ff2d`
> **Status:** APPROVED FOR EXECUTION — no Pre-Flight Q&A round required; this spec is self-contained. Deviations are forbidden; impossibilities must be documented in the report, never silently skipped.

---

## 0. Problem Statement (operator verbatim → engineering truth)

> "Every time I open a track and give an interview, the same question comes again and again… I can solve a question once or twice and easily pass the interview. That's not honest interviewing."

**Root cause (verified on master `814ff2d`, file:line receipts):**

1. `InterviewSessionService.createSession` (L130-L138) derives a **stable seed**:
   `seed = |hash(candidateId)*31 + hash(track) + hash(difficulty)|`.
   `String.hashCode()` is stable across JVM runs ⇒ same candidate + track + difficulty ⇒ **identical `Random` sequence ⇒ identical question plan, every session, forever**.
2. `SessionPlanService.buildPlannedSlugsForTrack(...)` dedups only against `alreadyChosenSlugs` **within the current session** (`localSeen`). There is **zero cross-session memory**.
3. Meanwhile Addendum A's exposure ledger **already exists and is already written**: `session_questions` (migration `V9__add_session_questions.sql`: session_id, question_slug, display_order, verdict, attempted_at) is populated at session start by `SessionQuestionService.recordSessionQuestions` (L97-99). The planner simply never reads it back.

**Secondary truth — catalog depth (PUBLISHED counts on master, per difficulty):**

| Family (dir) | EASY | MEDIUM | HARD | Total | Rotation viability |
|---|---|---|---|---|---|
| `dsa` (ALGORITHMS_DATA_STRUCTURES) | 105 | 208 | 28 | **341** | healthy |
| `hld` (SYSTEM_DESIGN) | 0 | 7 | 20 | **27** | thin |
| `lld` (SPRING_LLD) | 1 | 8 | 10 | **19** | very thin |
| `sql` (SQL) | 2 | 2 | 4 | **8** | starving |
| `behavioral` (BEHAVIORAL_STAR) | 0 | 0 | 2 | **2** | no rotation possible |
| **Total** | | | | **397** | (guard-pinned) |

Even a perfect rotation engine cannot rotate inside a pool of 2. Hence this spec has two inseparable halves: **P0 rotation engine** + **P2 catalog depth**.

---

## 1. Goals / Non-Goals

**Goals**
- G-A: A candidate who completes an interview on a track must **never** be served a question they were already served in a prior interview on that track — while the eligible pool allows it.
- G-B: When the pool is exhausted, degrade **gracefully, explicitly, and observably** (never fail session creation; never silently repeat).
- G-C: Grow the catalog to rotation-viable depth for every family, **tech and non-tech** (LLD, System Design, SQL, Behavioral are the starving ones).
- G-D: All new content is **AI-drafted, original, and vetted** — thematically inspired by widely-known industry interview themes; **zero copied text/scenarios**; zero copyright exposure (rules in §5).
- G-E: Zero frontend changes; zero regression in any existing gate.

**Non-Goals**
- Practice/playground mode rotation (playground is explicit self-serve; `PLAYGROUND` sessions skip planning today — keep it that way).
- Spaced-repetition scheduling, candidate ability modeling, adaptive difficulty (future spec).
- Exposing any exposure/rotation data to the candidate mid-interview (violates Addendum A §A3 pressure-realism rule — carries forward as a hard rider, §7).
- New Spring Boot/Java track content (JAVA_SPRING_BOOT currently draws from shared pools via `resolveCatalogTrackKey`; untouched).

---

## 2. P0 — Rotation Engine (interview-session-service)

### 2.1 Exposure query (read path)

New service `QuestionExposureService` (package `com.interviewos.session.service`):

```java
Map<String, ExposureRecord> exposureForCandidate(String candidateId, String trackKey)
// record = { slug, timesServed, lastServedAt }
```

Implementation: query `session_questions sq JOIN interview_sessions s ON sq.session_id = s.id`
WHERE `s.candidate_id = :candidateId` AND `s.track = :track` AND `s.status <> 'PLAYGROUND'`-equivalent mode filter
GROUP BY `sq.question_slug` → `count(*)`, `max(s.created_at)`.
- Add covering index migration `V13__add_exposure_lookup_index.sql`: `CREATE INDEX IF NOT EXISTS idx_sessions_candidate_track ON interview_sessions(candidate_id, track);`
  (verify name-collision against existing indexes before finalizing; if an equivalent index exists, document and skip).
- Session creation with blank/`local` candidateId: exposure = empty map (anonymous candidates get pure nonce-rotation, still never failing).

### 2.2 Nonce-seeded selection (write path)

In `createSession`, the seed gains a **per-session nonce**:

```java
long nonce = sessionNonceSupplier.getAsLong();   // default: System.nanoTime() ^ UUID hash
long seed = Math.abs(hash(candidateId)*31 + hash(track) + hash(difficulty) + nonce);
```

- `sessionNonceSupplier` is an injectable `LongSupplier` (constructor overload, defaults to wall-clock nanoTime) so tests remain deterministic.
- Effect: even with an empty exclusion set, two sessions never share a Random walk. Exclusion (2.3) is the correctness guarantee; nonce is belt-and-braces.
- Any existing test that pins cross-session determinism of `createSession` MUST be updated to inject a fixed nonce and assert **plan stability under fixed nonce** + **divergence under differing nonces** (this becomes gate VP-02 evidence). Do not delete determinism tests — repurpose them.

### 2.3 Exclusion-aware plan building

`SessionPlanService.buildPlannedSlugsForTrack(track, difficulty, count, seed, alreadyChosenSlugs)` gains one parameter:

```java
Set<String> excludedSlugs   // candidate's cross-session exposure for this track (2.1)
```

- Merge into `localSeen` at entry. Eligibility per rung becomes: REMOTE/FALLBACK pool − `localSeen` − `excludedSlugs`.
- **Degradation ladder** (per rung, in order, never skipping a level while any option remains):
  - **D1 adjacent-rung relaxation**: widen to `low..high` ladder rungs (reuse/extend `findAdjacentRungCandidates`).
  - **D2 LRU reuse**: allow reuse of exposed slugs, ranked by (lowest `timesServed`, then oldest `lastServedAt`). Mark plan-level flag.
  - **D3 any-published fallback**: current behavior (pick from pool ignoring exclusion). Last resort only.
- Plan output carries the effective policy: `rotationPolicy: STRICT | DEGRADED_LRU | DEGRADED_ANY`, and when degraded, the reused slugs list. Persist inside the existing `SessionPlan` JSON (planJson column) — no schema change.
- Every degradation logs one line: `log.warn("[ROTATION_DEGRADED] candidate={} track={} policy={} reused={}", ...)` — this is the operator's pool-depth telemetry.
- **Never throw** on rotation constraints. Session creation availability is inviolable.
- Multi-track loops (FULL_LOOP, DSA_LLD, LLD_HLD, DSA_LLD_HLD): the same `excludedSlugs` set seeds every section call; within-session accumulation via `alreadyChosenSlugs` continues as today ⇒ no cross-section repeats inside one loop, no cross-session repeats across loops.

### 2.4 Verdict semantics

P0 treats **every served question** as exposed regardless of verdict (`PASSED`/`FAILED`/`UNATTEMPTED` all excluded). Rationale: honesty — a failed question the candidate saw is still burned. Verdict-weighted cooldowns are explicitly deferred (non-goal).

### 2.5 P0 unit/integration tests (interview-session-service)

1. Same candidate+track+difficulty, two sessions (distinct nonces) → `plannedSlugs` disjoint when pool ≥ 2×count.
2. Fixed nonce → identical plans (determinism preserved for tests); different nonce → different plan order/picks.
3. Candidate isolation: candidate B's plan unaffected by candidate A's history.
4. Tiny synthetic pool (3 slugs, 4th session) → D2 path, `rotationPolicy=DEGRADED_LRU`, least-served slug chosen, session created successfully.
5. Empty catalog + fallback map path still terminates (D3) — no exception.
6. Multi-track loop: section slugs globally unique within session.
7. Exposure map correctness: seeded `session_questions` rows → expected `timesServed`/`lastServedAt` per slug.

---

## 3. P1 — Guard Evolution (question-bank-service)

`DsaCatalogGuardTest` currently hard-pins `assertEquals(397, allResources.length)` (L115) and `assertEquals(397, publishedCount)` (L139). Every P2 batch would break the build. Evolve to **floors**:

```java
// REPLACE exact-count pins with:
assertTotalAtLeast(397);                        // monotonic baseline
assertTrackFloors(Map.of(
  "dsa", 341, "hld", 27, "lld", 19, "sql", 8, "behavioral", 2));  // RED floors = current counts
assertPublishedRatio(1.0);                      // unchanged: all PUBLISHED
// slug uniqueness + taxonomy membership + ContentValidator pass: unchanged
```

- Keep all per-question validation loops byte-for-byte (they run ContentValidator on every file).
- Add per-(family, difficulty) **starvation alarms** as warnings-in-name / soft assertions documented in the test (`behavioral EASY=0, MEDIUM=0` today) — they become hard floors only in a future spec after P2 lands.
- Guard must stay green after each P2 batch (that is the point).

---

## 4. P2 — Catalog Expansion (content workstream)

### 4.1 Targets (PUBLISHED, per family)

| Family | Current | Target | Δ | Batch commit |
|---|---|---|---|---|
| `lld` (SPRING_LLD, `buildProfile: maven-workspace`) | 19 | **≥ 40** | +21 | `content(lld): rotation depth batch 1+2` |
| `hld` (SYSTEM_DESIGN) | 27 | **≥ 50** | +23 | `content(hld): rotation depth batch 1+2` |
| `behavioral` (BEHAVIORAL_STAR) | 2 | **≥ 24** | +22 | `content(behavioral): STAR matrix coverage` |
| `sql` (SQL) | 8 | **≥ 20** | +12 | `content(sql): rotation depth batch` |
| `dsa` | 341 | ≥ 341 (no mandate) | +0..20 optional | — |
| **Total** | 397 | **≥ 473** | +76 min | |

Difficulty mix guidance: each family's new batch must not be >60% one difficulty; every family must gain EASY/MEDIUM/HARD coverage (behavioral and hld currently have EASY=0 — include some).

### 4.2 LLD authoring contract (hard gates — ContentValidator enforces these today)

Every new LLD question: `track: SPRING_LLD`, `buildProfile: maven-workspace`, non-empty `starterFiles` incl. `pom.xml`, `editablePaths` (exact paths and/or `dir/**` prefixes — V8-01 syntax, fail-closed), `hiddenTestFiles` all under `src/test/java/`. Reuse the existing 19 LLD files as structural templates. Expected: `DsaCatalogGuardTest` + `ContentValidatorTest` green with zero rule changes.

### 4.3 HLD & Behavioral structure

Follow the existing `hld/*` and `behavioral/*` files' structure exactly (prompt body, evaluation focus, rubric tags). Behavioral must cover a STAR scenario matrix — conflict, failure, leadership, ambiguity, deadline pressure, cross-team friction, ethical call, mentoring, stakeholder pushback, initiative — minimum 20 distinct scenarios.

### 4.4 Copyright & Provenance Rules (HARD — violations reject the batch)

1. **Theme inspiration only.** Widely-known interview *topics/techniques* (consistent hashing, rate limiter, URL shortener class of problem, coin-change class, ATM/ elevator class…) are not ownable and may be used.
2. **No verbatim or near-verbatim text, numbers, diagrams, named scenarios, or answer keys from any third-party source.** Every scenario must be originally framed in a *different domain context* than any source the author consulted (e.g., if sources discuss "ride-hailing surge pricing", author "cloud-kitchen order throttling" instead).
3. **No brand/source names in content or metadata.** `source:` must use `ai-generated:v1`; optionally `inspiration: <technique-slug>` (e.g. `inspiration: rate-limiting`, `inspiration: topo-sort`). **Never** name publications, authors, platforms, or academies in any field, tag, or body text.
4. Operator post-merge vetting pass: 5-point checklist per file — (a) original framing, (b) difficulty label plausible, (c) topics ∈ taxonomy, (d) no third-party identifiers, (e) evaluable answer path (rubric for hld/behavioral, hidden tests for lld/sql/dsa).
5. ContentValidator must pass unchanged on every file; `status: PUBLISHED` only.

### 4.5 Repo hygiene rider

Repo root contains a stray `content/questions/lld` entry **outside** `question-bank-service/src/main/resources/content/questions/`. Reconcile: if it duplicates a catalog file, delete it; if unique, migrate it into the service tree and floor-assert its family. Report the disposition.

---

## 5. Fence

| Area | Allowed |
|---|---|
| `interview-session-service` | `InterviewSessionService` (seed derivation, nonce injection), `SessionPlanService` (exclusion param, ladder), new `QuestionExposureService`, `SessionQuestionRepository` query, `InterviewSession`/plan model `rotationPolicy` field, migration `V13`, tests (incl. repurposed determinism tests) |
| `question-bank-service` | `DsaCatalogGuardTest` floor evolution, new content `.md` files, `_taxonomy.yaml` **only if** a new file needs a topic not present (prefer the 23 existing topics) |
| repo root | stray `content/questions/lld` disposition (§4.5) |
| `collab/` | `collab/gemini/SPEC-016-NOTE.md`, `collab/gemini/SPEC-016-REPORT.md` |
| **Forbidden** | frontend/**, `docs/` (except none needed), SPEC.md (Z flips post-audit), any test rule *weakening*, ContentValidator rules, `session_questions` schema change, docker/compose files |

## 6. Gates for the Report (all digit-receipted)

- **VP-01** no-repeat: integration proof — same candidate+track+difficulty ×2 sessions → disjoint plans (pool ≥ 2×count); log lines included.
- **VP-02** nonce determinism: fixed nonce ⇒ stable plan; nonce delta ⇒ divergent plan (repurposed determinism tests).
- **VP-03** candidate isolation test green.
- **VP-04** degradation ladder: D2 synthetic-pool test green + `[ROTATION_DEGRADED]` log receipt + session created OK.
- **VP-05** exposure write path retained: session_questions rows == planned slugs per session (existing behavior asserted).
- **VP-06** multi-track loop uniqueness test green.
- **VP-07** guard floors: exact 397 pins gone; `assertTotalAtLeast(397)` + track floors green.
- **VP-08** expansion receipt: per-family table current→delivered (must meet §4.1 targets); all files PUBLISHED; ContentValidator clean; taxonomy membership clean.
- **VP-09** suite numbers (four-number format per G3): interview-session-service full suite ≥ 278 pass / 0F (grows with new tests; state the number); question-bank-service 41 + new-content-driven growth, 0F; frontend **306 pass / 0F / 39 suites / 1,161 assertions / build exit 0 — unchanged, proven**.
- **VP-10** fence audit: `git diff --stat base..HEAD` matches §5 exactly; zero frontend files; SPEC.md untouched.
- **VP-11** hygiene: stray root `content/questions/lld` disposition receipt.
- Riders carried (V2-Platform-SPEC S0, unchanged): G1 image-only deploy, G2 flyway runbook (no hand-edited schema history; V13 via migration only), G3 four-number reporting, G4 honest-judge.

## 7. Standing Riders (violations = audit reject)

- No exposure/rotation metadata reaches the candidate UI mid-interview (Addendum A3 pressure realism).
- Report contains real command outputs, not paraphrases (G4 honest-judge doctrine).
- Slice commits allowed and encouraged (`P0.rotation`, `P0.tests`, `P1.guard`, `P2.lld`, `P2.hld`, `P2.behavioral`, `P2.sql`, `docs`), but **one single push** delivering NOTE + code + REPORT (compressed two-lane protocol, QB-35).
- Estimated new/changed tests: +10..14 session-service, guard rework only in qb (no new test classes required beyond VP needs).

## 8. Execution Order

1. `P0.rotation` → 2. `P0.tests` → 3. `P1.guard` → 4. `P2` batches (lld → hld → behavioral → sql, floors green after each) → 5. `docs` (NOTE + REPORT) → 6. single push → 7. Z one-shot audit (QB-40) → 8. Z flips SPEC-016 status.

## 9. Report Template (collab/gemini/SPEC-016-REPORT.md)

Sections: ① fence `--stat` receipt ② P0 algorithm description ≤15 lines + VP-01..06 test receipts ③ P1 guard diff receipt ④ P2 per-family count table (current→delivered) + sample slug list per family ⑤ VP-09 four-number block per module ⑥ deviations section (empty = "NONE") ⑦ rotation telemetry sample (`[ROTATION_DEGRADED]` absent in green path, present in D2 test receipt).
