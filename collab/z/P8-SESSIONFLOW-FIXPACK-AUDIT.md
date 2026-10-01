# QB-28 AUDIT — P8-SESSIONFLOW Fix-Pack + P7 FIX-7 (Dual-Persistence)

- **Auditor**: Z lane (architecture & audit)
- **Date**: 2026-10-01 (IST)
- **Scope**: Gemini's P8-SESSIONFLOW fix-pack (`cfd4dff`/`0589210`, `e58c273`/`fb4db34`, `869e715`/`9e2cd6f`, report `33aa198`) against `collab/z/P8-SESSIONFLOW-SPEC-ISSUE.md` @ `6fb01e2`, PLUS the queued P7 FIX-7 slice (`af6d320`/`fa0c2db`).
- **Method**: fresh clone (sandbox reset #3), full diff read, independent test re-runs on Linux (Temurin JDK 21.0.12.1 + Maven 3.9.9; node tsx runner). No claim accepted from the report without tree or build evidence.

---

## VERDICT: **ACCEPT**

P8 unblocks the operator's field closure (VP11-m) immediately. One MUST follow-up (**F-N3**, retry-wiring) is queued for the next cycle and must not be deferred more than one cycle. FIX-7 (P7) is **PASS**.

---

## 1. P8-SESSIONFLOW Fix-Pack

### FIX-1 — Single source of truth for active section index: **PASS**
- Literal `activeSectionIndex: 0` eliminated from `ArenaRoom.tsx`; independent `rg` scan confirms zero production-code hits (only T1's own assertion strings match).
- **Architecture A implemented as specified**: lifted `useState` in ArenaRoom; controlled `useDialogue` (`isControlled` branch preserves uncontrolled fallback for other callers — backward compatible); `useArenaEngines` plumbs index + `onSectionIndexChange: setActiveSectionIndex`.
- **Same-commit propagation verified in source**: `useSessionCatalog` now returns `effectiveQuestionsList = activeSectionList !== null ? activeSectionList : questionsList`, where `activeSectionList` is a memo derived directly from the `activeSectionIndex` prop. Catalog output flips in the SAME render commit as the dialogue's handoff — the one-render lag of the old effect-synced state is gone. This satisfies and exceeds the SPEC's no-flash requirement.
- Pure exported `resolveSectionQuestions(sectionQuestions, index, isInterview)` with explicit bounds handling (out-of-range → `[]`, non-interview/undefined → `null`); no cross-section bleed.
- **No forbidden patterns**: no useEffect index-mirror; no mount-time ref snapshot; no split-brain leftovers (remaining `dialogue?.activeSectionIndex` references in `useArenaEngines` L106-109 are fallbacks behind `activeSectionIndex ??` for uncontrolled callers — in the controlled flow both values are identical by construction).
- Interpretation note: the SPEC's "do not change `useSessionCatalog`'s reactive semantics" is ruled as intent-based — the change preserves and STRENGTHENS reactivity; PLAYGROUND path is preserved and regression-pinned (T4). Compliant.
- Interplay verified: `transitionSection` uses exactly one direct-value call site (`setActiveSectionIndex(toIdx)`, useDialogue L244) — no functional-updater staleness possible.

### FIX-2 — Session-mode fault-state guard: **PASS with F-N3 follow-up (MUST)**
- `TrackScreenRouter` L90-92 gate is playground-scoped; the previously-unused `_sectionQuestions` prop now powers an honest triage signal; the default branch is also gated — no INTERVIEW-mode path renders the playground "select another track" card. SPEC acceptance ("no code path in session mode can direct the candidate to change track") met.
- `SessionSectionFaultState`: honest two-way copy ("assigned but failed to resolve" vs "No Questions Configured for Round" + chat guidance), no track-switch/catalog-browse affordances. Copy quality is good.
- **F-N3 (MUST next cycle)**: `onRetry` is optional and `TrackScreenRouter` never passes a resolver — the rendered "Retry Resolution" button spins 600ms and does nothing. The SPEC required "a retry/re-resolve affordance (re-run the catalog resolution)"; a dead button is the affordance's shell without its function. Blast radius is contained (post-FIX-1, the fault state is unreachable on the standard sectionQuestions path, and useless-on-data-errors anyway), so this does not block ACCEPT — but the report's "Provides a Retry Resolution button" must be read against this audit. Prescription: expose a catalog re-resolve (e.g., fetch-nonce bumped by a drilled `onRetry`), or hide the button when no resolver exists. Either is a small slice; declare as `feat/p8-fix-02b`.
- NITs: `hasAssignedQuestions` is any-section (not active-section) — acceptable approximation given the router lacks the active index; the 600ms spinner is cosmetic.

### FIX-3 — Regression tests bound to the tree: **PASS (G4)**
- All five names exist and run: T1 (ArenaRoom source contract — would have caught the original #155 literal), T2 (router gate scoping), T3 (real behavior test on `resolveSectionQuestions` with Session #155-shaped data, bounds, null semantics), T4 (both `8cfacc6` rider behaviors source-pinned), T5 (production-import verification). The sham array-literal test is fully replaced.
- NIT: T2's exact-whitespace `includes` assertions are brittle (repo idiom tolerates it — Session146Fixes does the same).

### FIX-4 — Process: **PASS**
- Three branches `feat/p8-fix-01/02/03`, three `--no-ff` merges (`0589210`, `fb4db34`, `9e2cd6f`), then the report commit — exactly the SPEC's slice map.
- **Rider audit: ZERO undeclared riders.** Full fix-pack diffstat = 7 files, all frontend, all mapped in report §5. No backend files touched (SPEC §7 holds).

### G3 — Independent four-number reconciliation: **PASS**
- FE, this audit's own run at `9e2cd6f` (fresh clone, fresh `npm install`): `tests 208 / suites 23 / pass 208 / fail 0` — **EXACT** match to the report. Arithmetic: 204 baseline − 1 sham + 5 new = 208 ✓.
- Report's DoD claim "git grep `activeSectionIndex: 0` returns zero hits in production code" independently verified ✓.
- Report gap (NIT): SPEC FIX-4 requested G1 field evidence (handoff screenshots); absent from the report. The operator's VP11-m field closure supersedes this — record only.

## 2. P7 FIX-7 — Dual-persistence integrity (F-N2): **PASS**
- `finalizeWithReport` failure branch now rewrites the on-disk manifest via the SAME builder (errors[] parameterized, backward-compatible 8-arg delegate) before `markFailed(sessionId, sessionDir, err)` — the new overload updates Mongo AND writes the `av1.status@1` sidecar reusing the existing `writeStatusSidecar` (3 pre-existing call sites confirmed). Divergence class F-N2 (disk VERIFIED vs Mongo FAILED) is closed; fail-safe ordering means disk can only go FAILED-or-stay-updated, never lie VERIFIED.
- Both tests are genuine end-to-end assertions: staged archival → deliberate artifact deletion → `assertThrows(IllegalStateException)` → `verify(markFailed(sessionId, sessionDir, …))` → on-disk manifest re-read asserting `FAILED` + errors[] citing `recordings/screen.webm`; sidecar existence + payload via a real (non-mock) VaultStatusService. NIT: the sidecar test lives in `VaultArchiveServiceTest` though it targets `VaultStatusService` — placement only.
- G3 backend (this audit's own run, Linux): **ISS = 275 tests / 0 failures / 1 skip (pre-existing) — BUILD SUCCESS**. Reconciliation: QB-27's 273 + FIX-7's 2 = 275 EXACT ✓. VaultArchiveServiceTest 14/0 includes both new names ✓.

## 3. Gates Summary
| Gate | Result |
|---|---|
| FIX-1 dynamic binding | PASS |
| FIX-2 session fault guard | PASS — F-N3 (retry wiring) MUST next cycle |
| FIX-3 tests T1-T5 (G4) | PASS |
| FIX-4 branch/merge/riders | PASS — zero riders |
| G3 four-number FE | PASS — 208/23/208/0 EXACT (independent re-run) |
| G3 four-number ISS | PASS — 275/0/1-skip EXACT (independent re-run) |
| FIX-7 dual-persistence | PASS |
| G5 credentials | PASS — env-only, no disk artifacts found |
| G1 field evidence in report | NIT — absent; superseded by VP11-m field closure |

## 4. Environment Record (audit reproducibility)
Sandbox reset #3 detected during this audit (clone and toolchain lost; worklog rolled back to a Sep-8 snapshot). Rebuilt: fresh clone, Temurin JDK 21.0.12.1 + Maven 3.9.9 reinstalled under `/home/z/my-project/tools/`, PAT re-injected env-only from session history. Prior worklog entries (QB-27, VA-1, P8-SPEC-1, P8-PUSH-1) restored from session memory alongside this entry.

## 5. Next Steps
1. **Operator**: proceed to VP11-m field closure NOW — one real DSA session; INTRODUCTION → DSA handoff must land Monaco with "Reverse a String"; code + submit; End & Report; vault reaches VERIFIED; report.json shows ≥3 minutes and real coding activity (no premature-termination disclosure).
2. **Gemini**: `feat/p8-fix-02b` — F-N3 retry wiring (or honest hiding of the dead button), plus the two NITs if convenient. Do NOT start new surface work before F-N3 lands.
3. **Z lane**: QB-29 will audit F-N3 delta + field-closure evidence.
