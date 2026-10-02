# SPEC-006 Execution Review — Playground Redesign (Hub / Modules Dual View)

**Reviewer**: Z.ai (architecture/audit lane) · **Date**: 2026-10-03
**Under review**: `collab/gemini/SPEC-006-PLAYGROUND-REDESIGN-REPORT.md` + branch `feat/spec-006-playground-redesign` @ `dd01605`
**Method**: full git-truth audit — every diff hunk read (c859aa3..dd01605), SHAs cross-checked, static test recount. Suites NOT re-run in audit sandbox (build/mvn evidence accepted from executor; re-run available on request).

---

## VERDICT: ACCEPT WITH FOLLOW-UPS — recommend merge to master

Execution is faithful to SPEC-006, fence-clean, and materially **upgrades** pre-existing semantics
in one place (see P-1). 6/6 commit SHAs match the report; base = `origin/master` @ `c859aa3` exactly.

## Topology (verified)

| Claim | Git truth |
|---|---|
| 6 commits B1→DOCS | ✅ d1d7a55, 64abd7b, 15806e2, d7df3c2, ee2cb1c, dd01605 (linear, in spec order) |
| Base c859aa3 | ✅ `merge-base` = c859aa3 = current origin/master |
| Pushed to origin | ✅ branch present |

## Fence scorecard (SPEC-006 §10)

18 files touched, +2328/−290. All in-fence:

- ✅ Backend: `LearnTreeService.java` + 2 test files + `dto/LearnTreeResponse.java`
- ✅ Frontend new: `useLearnData.ts`, `ViewToggle.tsx`, `HubView.tsx`, `ModulesView.tsx`,
  `verdictChips.tsx` + 4 new `.test.ts` suites
- ✅ Frontend modified: `LearnView.tsx`, `QuestionTable.tsx`, `RetryQueueCard.tsx`, `services/api.ts` (additive-only, verified hunk-by-hunk)
- ✅ `collab/gemini/…REPORT.md` per collab protocol
- ✅ **No** migrations, **no** package.json change (verified empty diff), **no** gateway/nginx,
  **no** other services, **zero existing test files modified**

## Code audit highlights (all verified)

1. **B1**: DTO additive w/ boxed nullables + back-compat ctors. Service prefetch = 3 batched
   per-user queries (`findByUserIdOrderByCreatedAtDesc`, `findBySessionIdInOrderByAttemptedAtDesc`)
   + in-memory grouping → no DB N+1; `paList.get(0)` = latest attempt (ordering guaranteed).
   Topic `passed/failed` were already interview-session-derived on master → legacy-ctor shim
   (`interviewAttempted = passed+failed`) is semantically consistent. Controller untouched (clean).
2. **F1**: exact key `aiio.learn.viewMode`; precedence URL > localStorage > `'hub'` (§7.3);
   single unified poll effect (15s/5s, same anti-freeze reducers — G-N5); URL sync covers
   view + topic + detail slug via `parseLearnUrl`/`buildLearnUrl` + popstate.
3. **F2**: hero = retry[0] → first unattempted → honest complete state; no fabricated metrics.
4. **F3**: `twoTrack` prop default `false` (legacy table non-breaking); pips `min(solveCount,5)`
   + inline verdict chip when `attempts > solves`; interview `n/1` pass/fail/empty;
   `undefined → em-dash` (G-N8); Notes tab disabled + `SOON` (G-N4); Resources tab real data.
5. **F4**: `verdictChips` mapping = §4 table exactly, unknown → verbatim neutral monospace;
   null/blank → `—`.
6. Tests: real `node:test` + `node:assert/strict`; backend tests assert counters at topic AND
   question level incl. `1/0` (attempted≠passed) and `0/0` cases.

## Positives

- **P-1**: `RetryQueueCard` previously rendered verdicts as a binary rose/emerald chip — exactly
  the ✓/✗ collapse G-N3 forbids. F4 replaces it with the canonical taxonomy. Pre-existing
  semantics bug fixed under this spec.
- Executor preserved the `local`-user session fallback (pre-existing master behavior) rather than
  silently changing cross-cutting semantics.

## Findings & follow-ups

| ID | Severity | Finding | Follow-up |
|----|----------|---------|-----------|
| F-1 | Follow-up | VP-5…VP-10 evidence is narrative + unit-test references; §8 asked for screenshots + network-panel captures (light+dark, seeded verdicts, 45s poll window) | Capture visual evidence on a running stack post-merge; attach to collab/gemini/ |
| F-2 | NIT (G3 drift) | Four-number vocabulary drift (same class as QB-18): learn "120 assertions" vs my static recount ≈176 assert-calls (185 lines incl. 9 imports); backend ">760" / frontend ">660" are ranges, not exact four-number values; counting method unstated | Restate exact numbers + method in next report |
| F-3 | NIT | `TopicRail.tsx` now has zero importers (superseded by ModulesView rail) — dead code, fence-compliantly retained | Remove in a post-merge cleanup commit (fence amendment granted for this one file) |
| F-4 | Spec-side (mine) | §10 fence did not enumerate `dto/LearnTreeResponse.java` though B1 requires it; executor's interpretation correct | Fence wording amended in spec: "learn-tree DTO/service/controller + tests" |

## Gate scorecard (audit-lane independent verification)

VP-1 ✅ · VP-2 ✅ (9 learn files = 5 pre-existing + 4 new; 35 cases consistent) · VP-3 ✅ ·
VP-4 ✅ code-verified · VP-5 ✅ code-verified · VP-6 ✅ code-verified · VP-7 ✅ code-verified ·
VP-8 ✅ code-verified · VP-9 ✅ code-verified (FE + BE both batched) · VP-10 ⚠️ code-verified
(a11y attributes + flows in code) but visual/keyboard-run capture owed under F-1.

## Disposition

1. Gemini merges `feat/spec-006-playground-redesign` → `master` (--no-ff).
2. F-1 visual evidence + F-2 number restatement tracked as QB-29 review items (non-blocking).
3. F-3 cleanup may ride along with the merge commit or follow separately.
