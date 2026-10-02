# SPEC-006 — Playground Redesign: Hub / Module Dual View with Toggle

> **Status**: APPROVED FOR EXECUTION · **Author**: Z.ai (architecture/audit lane) · **Reviewer**: Operator (verdict recorded 2026-10-03)
> **Executor**: Gemini (execution lane) · **Branch name**: `feat/spec-006-playground-redesign` (cut from updated `origin/master`)
> **Design mockups (operator-approved)**: [docs/design/playground-redesign/](design/playground-redesign/) — see `d1_prep_hub_v2.html` + `d2_module_view.html` and their PNG renders.

---

## 0. Operator Verdict (source of truth)

> "let's build both the screens and have a toggle feature to select and can be changed"

Both approved mockup directions are built as **two view modes of the same Playground**, switchable
at runtime by a persistent toggle:

- **D1 — "Hub" view** (`d1_prep_hub_v2.html`): dashboard-style overview. Continue hero, retry
  queue panel, topic tiles, compact problem table, right activity rail.
- **D2 — "Modules" view** (`d2_module_view.html`): curriculum-first detail. Module rail with honest
  counts, module tabs (Problems / Resources / Notes), retry banner, and the **two-track problem
  table** (Practice `x/5` pips + Interview `n/1`).

Everything else in this spec is implementation detail subordinate to that verdict and to the
non-negotiables in §1.

---

## 1. Non-Negotiables (inherited from repo rules + design review)

| ID | Rule |
|----|------|
| G-N1 | **Honest counts only.** Every number rendered must map to a real field from a real endpoint. No streaks, no daily goals, no invented percentages, no "12/56 solved" unless `solved===12 && total===56` is actually in the API response. |
| G-N2 | **Two-track model preserved.** Every problem row carries a Practice lane and an Interview lane. Never flatten both into one "Attempts" column. |
| G-N3 | **Failure-state semantics preserved.** Verdicts are never reduced to ✓/✗. COMPILE_ERROR, RUNTIME_ERROR, PARTIAL, TIME_LIMIT_EXCEEDED etc. render as distinct, colored, labeled chips (§4 taxonomy). |
| G-N4 | **No vaporware.** No nav entries, buttons, or tabs for features that do not exist. Tabs without backing scope render explicitly as `SOON` and are disabled (this is honesty, not vaporware). |
| G-N5 | **Preserve live behavior.** The anti-freeze polling pattern (`learnTreePollReducer`, `retryQueuePollReducer`, 15s interval, 5s abort timeout), the `LOCAL` badge, the `STALE` degraded banner, and the theme toggle all keep working unchanged in both views. |
| G-N6 | **Design tokens only.** All styling uses the existing theme tokens (`--color-*`, `--verdict-*`, Tailwind semantic classes `bg-surface`, `bg-elevated`, `text-text-2`, etc.). No new raw hex palette, no new UI dependency. |
| G-N7 | **Existing flows unchanged.** `onSolveQuestion(slug)` hand-off into the arena/practice loop, `QuestionDetailModal`, `SubmissionsDrawer`, `/learn/question/:slug` URL sync, and cross-mode continuity deep links all keep their current behavior. |
| G-N8 | **Graceful degradation.** If the runtime backend predates task B1 (§3.4), the UI must feature-detect missing fields and render an honest em-dash `—` (unknown), never a fabricated `0`. |

---

## 2. Current State (verified at `origin/master` = `7012413`)

### 2.1 Frontend code map — `frontend/src/components/learn/`

| File | Lines | Role |
|------|-------|------|
| `LearnView.tsx` | 452 | Root view: header, track tabs, RetryQueueCard, TopicRail + QuestionTable, modal orchestration, data loading/polling |
| `QuestionTable.tsx` | 471 | Filtered table (difficulty EASY/MEDIUM/HARD, status SOLVED/UNSOLVED), columns `# / Title / …` |
| `TopicRail.tsx` | 181 | Left rail of topics with solved counts |
| `RetryQueueCard.tsx` | 110 | Retry queue strip (weak-spot resurfacing) |
| `SubmissionsDrawer.tsx` | 222 | Per-question attempt history drawer |
| `QuestionDetailModal.tsx` | 885 | Detail modal incl. notes (P8) + reference approaches |
| `ReferenceApproaches.tsx` | 258 | Locked/unlocked reference solutions |
| `*.test.ts` (5 files) | — | `node:test` + `node:assert/strict` suites (incl. `CrossModeContinuity.test.ts`, `LearnPracticeView.test.ts`) |

Routing: `/learn` renders `LearnView`; `/learn/question/:slug` opens the detail modal via
`popstate`-synced `detailSlug` state (keep this mechanism as-is).

### 2.2 API surface (all relative to gateway `/api/v1`, via `frontend/src/services/api.ts`)

| Endpoint | Returns | Used by |
|----------|---------|---------|
| `GET /catalog/topics?track=` | `CatalogTopicSummary[] {topic,total,solved,displayName,pressureGap?,resources?}` | rails, tiles |
| `GET /catalog/questions?track&topic&difficulty&q&page&size` | paged `CatalogQuestionSummary {slug,title,track,difficulty,topics[],estMinutes}` | tables |
| `GET /catalog/questions/:slug` | `CatalogQuestionDetail` (incl. `resources[]`) | modal |
| `GET /practice/progress?userId=` | `Record<slug, {attemptCount,solveCount,firstSolvedAt?,lastAttemptedAt?}>` | practice lane |
| `GET /practice/attempts/:slug` | `PracticeAttempt[] {verdict,testsPassed,testsTotal,runtimeMs,attemptSeq,createdAt}` | drawer |
| `GET /practice/questions/:slug/encounters` | `{practiceSolveCount,interviewPassCount,interviewAttemptCount,pressureGap,encounters[]}` | **proof that interview-lane counts are derivable** |
| `GET /learn/tree?userId=` | `{topics:[{topicId,topicName,track,total,attempted,solved,passed,failed,pressureGap,questions:[{slug,title,track,difficulty,verdict}]}],trackTotals,stale}` | primary structure |
| `GET /learn/retry?userId=` | `[{slug,title,topic,lastVerdict,failCount,lastAttemptAt}]` | retry panel/banner |
| `GET /learn/notes*` (P8) | user notes CRUD | detail modal (unchanged) |
| `GET /sessions/:id/questions` | `SessionQuestionItem[] {questionSlug,verdict:PASSED\|FAILED\|UNATTEMPTED,…}` | interview-lane source data |

### 2.3 Backend facts (interview-session-service)

- `LearnTreeController` + `LearnTreeService` and `RetryQueueController` + `RetryQueueService` own
  the `/learn/tree` and `/learn/retry` endpoints. **This is the only backend service touched by
  this spec.**
- `PracticeTrackingService` persists Judge0 verdicts as **free-form uppercase TEXT** (null →
  `FAILED`) into `practice_attempts.verdict` — the raw failure-mode signal G-N3 protects.
- Schema (`V8__add_practice_attempts_and_progress.sql`): `practice_attempts`, `question_progress`.
  **No practice-vs-interview lane column exists** — interview-lane counts must be derived from
  session questions (the join pattern already exists inside the encounters endpoint). **No new
  migration is required or allowed by this spec.**

---

## 3. Architecture

### 3.1 View mode model

```ts
type LearnViewMode = 'hub' | 'modules';
```

- Persisted in `localStorage` key `aiio.learn.viewMode`; invalid/missing values resolve to `'hub'`.
- Mirrored into the URL: `/learn?view=modules` (and `&topic=<topicId>` when a module is selected),
  using the same `pushState`/`popstate` mechanism the detail modal already uses.
- Switching views preserves the active **track** and (in modules view) the selected topic.
- Toggle UI: segmented control labeled **Hub | Modules** in the header right cluster (left of the
  Dashboard button). `aria-pressed` on both segments, visible focus ring, usable at mobile width.

### 3.2 Single data layer (no duplicated polling)

Extract LearnView's current data logic into one hook, `useLearnData` (new file):

- owns: `track/topics/questions/progressMap` load, `treeState` + `retryState` reducers and their
  15s polling, `verdictMap`, `enrichedTopics`, totals;
- exposes everything both views need as one object;
- **hard rule**: exactly one tree poll and one retry poll per interval regardless of which view is
  mounted (G-N5). `LearnView` becomes a thin shell: header + toggle + track tabs + view container.

### 3.3 Layout skeleton (both views)

```
Header (existing)                       [Hub|Modules] Dashboard Refresh Theme
Track tabs bar (existing, shared)
RetryQueueCard — Hub view only (Modules view uses the per-module RetryBanner)
<main> HubView | ModulesView </main>
SubmissionsDrawer / QuestionDetailModal (unchanged, shared)
```

### 3.4 Task B1 (backend, additive) — two-track counters on the tree

Extend `GET /learn/tree` payload additively (same route, same service):

- per `LearnQuestionNode`: `practiceAttemptCount`, `practiceSolveCount`,
  `lastPracticeVerdict` (nullable), `lastPracticedAt` (nullable),
  `interviewAttemptCount`, `interviewPassCount`;
- per `LearnTopicNode`: `interviewAttempted`, `interviewPassed`.

Sources: `question_progress` (practice lane) + session questions join (interview lane), reusing the
derivation pattern already proven by the per-question encounters endpoint (§2.2). Additive fields
only — the current frontend must keep working against the extended payload unchanged.

Rationale: the module table needs per-problem interview counts for ~300+ rows; per-row calls to
`/practice/questions/:slug/encounters` would be an N+1 burst and are **forbidden** (gate VP-9).

---

## 4. Verdict chip taxonomy (canonical, both views)

Rendered from raw verdict strings; unknown values fall through to a **neutral** chip that prints
the raw string verbatim (uppercase, monospace). Never guess, never translate an unknown into a
known state.

| Verdict (raw) | Lane | Chip | Token |
|---------------|------|------|-------|
| `PASSED` | both | green `PASSED` | `--verdict-pass` / `success` |
| `PARTIAL` | practice | amber `PARTIAL` | `--verdict-warn` / `warning` |
| `TIME_LIMIT_EXCEEDED` | practice | amber `TLE` | `--verdict-warn` |
| `MEMORY_LIMIT_EXCEEDED` | practice | amber `MLE` | `--verdict-warn` |
| `COMPILE_ERROR` | practice | red `COMPILE ERROR` | `--verdict-fail` / `danger` |
| `RUNTIME_ERROR` | practice | red `RUNTIME ERROR` | `--verdict-fail` |
| `WRONG_ANSWER` | practice | red `WRONG ANSWER` | `--verdict-fail` |
| `FAILED` | interview | red `FAILED` | `--verdict-fail` |
| `UNATTEMPTED` | interview | neutral | `text-3` |
| anything else | any | neutral, raw text | `text-3` |

Implementation lives in one new module (`verdictChips.ts(x)`) with a unit-tested mapping function;
both views and `RetryQueueCard` consume it.

---

## 5. Hub view (D1) — component inventory

New file `HubView.tsx`. Every element's data source is normative:

| Element | Data source (endpoint → field) | Honesty rule |
|---------|-------------------------------|--------------|
| **ContinueHero** (single primary CTA card) | Primary target = first item of `GET /learn/retry` (server order); if retry queue empty → first `UNATTEMPTED` question in `GET /learn/tree` order for the active track. Shows title, topic name, difficulty, last verdict chip (§4), relative `lastAttemptedAt`/`lastAttemptAt` | If both sources are empty the hero honestly shows the track-complete state (`trackTotals` all solved) — never a fake "next up" |
| **Hero CTAs** | `Solve now` → existing `onSolveQuestion(slug)`; `Preview` → existing detail modal | Flows unchanged (G-N7) |
| **RetryQueuePanel** | `GET /learn/retry` items; chip per §4 taxonomy; click → detail modal | Reuse/extention of existing `RetryQueueCard`; empty state text: "No retries due" |
| **TopicTiles** (grid) | `enrichedTopics` from tree: `displayName`, `solved/total` (honest), `pressureGap` chip when present, mini progress bar width = `solved/total` | Interview badge only when `interviewAttempted > 0` (B1 field); if B1 fields absent at runtime → no badge (G-N8). **Click tile → `viewMode='modules'` with that topic preselected** |
| **ProblemTable (compact)** | Existing `QuestionTable` with `selectedTopic = null` under the tiles | No behavior change |
| **RightRail — RetrySnapshot** | retry queue length + top 3 titles | Real data only |
| **RightRail — LastPracticed** | `max(lastAttemptedAt)` across `progressMap`; relative time; literal "Never practiced" when none | No streaks (§9) |
| **RightRail — TrackTotals** | `trackTotals` from tree for the 5 track tabs | Real counts only |

## 6. Modules view (D2) — component inventory

New file `ModulesView.tsx` (module rail + module workspace):

| Element | Data source | Rule |
|---------|-------------|------|
| **ModuleRail** | `enrichedTopics` in tree order; item = `01`-style index, `displayName`, mono `solved/total` count | Counts honest (G-N1); active module highlighted |
| **Module header** | selected topic `displayName` + `pressureGap` line | — |
| **Tabs: Problems / Resources / Notes** | Problems = default active. Resources = `CatalogTopicSummary.resources[]` (label+url list; empty → "No resources yet"). Notes = disabled tab with `SOON` badge (G-N4) | Per-question notes remain in the detail modal — module-level notes workspace is future scope (§9) |
| **RetryBanner** | retry items where `item.topic === selectedTopicId` → "N retries due in this module" + first item's verdict chip + Review → detail modal | Hidden when zero; never fakes urgency |
| **TwoTrackTable** | **Extended `QuestionTable`**: new columns — `Practice` = 5 pips, filled = `min(solveCount, 5)` in pass color; when `attemptCount > solveCount`, inline last-verdict chip (§4) beside pips. `Interview` = `n/1`: pass pip when `interviewPassCount ≥ 1`; fail pip when `interviewAttemptCount > interviewPassCount`; else empty; B1 fields absent → `—` | Two-track preserved (G-N2); failure semantics preserved (G-N3); degrade honestly (G-N8) |
| **Filters / paging** | Existing difficulty + status filters and catalog paging | No regression to existing tests |

## 7. Toggle behavior contract

1. Toggle renders in `LearnView` header (right cluster, before Dashboard).
2. Switch → `setViewMode`, write `localStorage`, `pushState` URL update.
3. On mount: URL `?view=` wins over localStorage; localStorage wins over default `'hub'`.
4. `popstate` (back/forward) re-syncs view mode, topic param, and detail modal slug — all three
   share the existing URL-sync effect style.
5. Both views stay mounted-cheap: switching must not re-trigger data loading (data lives in
   `useLearnData` above the switch, not inside view components).

---

## 8. Acceptance criteria & verification gates

Report results with the standard **four-number vocabulary per suite** (G3): files / test-cases /
assertions / failures. Evidence for every VP gate is mandatory in the execution report.

| Gate | Verification | Pass criteria |
|------|--------------|---------------|
| VP-1 | `cd frontend && npm run build` | green, zero new deps in `package.json` |
| VP-2 | frontend test suites (`node:test`) | existing 5 learn suites + new suites all green; four-number table pasted |
| VP-3 | backend `mvn -pl interview-session-service test` (or module-scoped equivalent) | green; new tree fields covered by controller/service tests; **no migration added** |
| VP-4 | Toggle persistence | switch to Modules → reload → still Modules; `?view=hub` deep link lands on Hub; back/forward buttons sync view |
| VP-5 | Hub honesty | with seeded data, hero target, tile counts, retry snapshot all match API responses exactly (screenshot + JSON side-by-side) |
| VP-6 | Modules two-track | table renders Practice pips + Interview `n/1` from B1 fields; with pre-B1 backend, cells show `—` (screenshot both states) |
| VP-7 | Chip taxonomy | seed one attempt of each §4 verdict; chips render per taxonomy; unknown verdict string renders verbatim in neutral chip (screenshot) |
| VP-8 | Polling discipline (G-N5) | browser network panel over 45s: exactly 3 tree + 3 retry calls while toggling views repeatedly; STALE badge still appears when tree poll aborted |
| VP-9 | No N+1 | opening Modules view with ~50 questions triggers **no** per-row fetch burst (network panel screenshot) |
| VP-10 | Flows + a11y | Solve hand-off from Hub hero and Modules row both reach the practice loop; `aria-pressed` on toggle; keyboard-only traversal of rail→table→toggle; light+dark screenshots of both views |

**Definition of done**: VP-1…VP-10 all PASS with evidence, fence (§10) respected, slice commits
per §11, execution report per §12.

---

## 9. Deviations from the approved mockups (honesty-driven — reviewer flag)

The mockups contained three elements with **no backing feature or endpoint**. They are consciously
omitted rather than faked:

1. **Daily-goal widget** (Hub right rail) — no goal feature exists; replaced by RetrySnapshot.
2. **Activity heatmap** (Hub right rail) — no endpoint; dropped.
3. **Module Notes tab** — user notes exist only per-question (P8, detail modal); the module-level
   notes workspace is future scope, so the tab renders disabled with `SOON` (matching the mockup's
   own `SOON` chips).

Additionally, no metric invented by the external Lovable drafts (12/56, 21%, 4-day streak, 316
totals) is ported — G-N1 supersedes the mockups wherever the mockup number cannot be derived from
an API field.

---

## 10. Fence (allowed files — everything else requires operator sign-off)

**Backend** (`interview-session-service` only):
- `LearnTreeService.java`, `LearnTreeController.java` (+ their test files)

**Frontend** (`frontend/src/...`):
- `components/learn/LearnView.tsx` (refactor to shell)
- `components/learn/QuestionTable.tsx` (two-track columns, additive props)
- `components/learn/RetryQueueCard.tsx` (chip taxonomy reuse)
- **new**: `components/learn/HubView.tsx`, `components/learn/ModulesView.tsx`,
  `components/learn/ViewToggle.tsx`, `components/learn/useLearnData.ts`,
  `components/learn/verdictChips.ts(x)` + `*.test.ts` suites
- `services/api.ts` (**additive** type fields for the extended tree payload)
- `lib/learnTree.ts`, `lib/retryQueue.ts` (additive only, if needed)

**Forbidden**: new npm dependencies · new migrations/schema changes · gateway/nginx route changes
(tree route path is unchanged) · touching other services · deleting or weakening existing tests ·
new top-level directories.

---

## 11. Execution order (one task → one slice commit)

1. **B1** — backend tree extension + tests (`feat(spec-006): B1 learn-tree two-track counters`)
2. **F1** — `useLearnData` extraction + `ViewToggle` + URL/localStorage persistence (+ tests)
3. **F2** — Hub view (hero, retry panel, tiles, right rail) (+ tests)
4. **F3** — Modules view (rail, tabs, retry banner, two-track table) (+ tests)
5. **F4** — verdict chip taxonomy migration across views + a11y pass (+ tests)
6. Final: four-number report + VP evidence → execution report for review.

---

## 12. Execution report template (paste into chat for review)

```
SPEC-006 EXECUTION REPORT
Branch: feat/spec-006-playground-redesign @ <sha> (base: origin/master <sha>)
Commits: B1/F1/F2/F3/F4 shas
VP-1..VP-10: PASS/FAIL each + evidence (command output, screenshots, network panel)
Four-number per suite: files / test-cases / assertions / failures
Fence deviations: none | list
Open questions for reviewer: none | list
```
