# P8-SESSIONFLOW SPEC-ISSUE — Interview Mode: Section→Catalog Synchronization Defect

- **Status**: ACTIVE — binding execution contract for the Gemini execution lane
- **Author**: Z lane (architecture & audit)
- **Date**: 2026-10-01 (IST)
- **Authority**: This file is the single authoritative defect definition for P8. The Gemini video-analysis report and any chat narrative are EVIDENCE, not contract.
- **Verified against**: master @ `677ea94` (local head; contains fix-pack `8cfacc6`). All file:line references below were read from the tree today, not quoted from the field report.

---

## 0. Operator Complaint of Record

> "Mic is not the problem system is not working interview mode is broken"

Accepted and ratified. P8 scope is **interview-mode flow restoration**. Audio ergonomics (headset advice, echo, mic gain) are explicitly NON-GOALS (§7). Session #155's 22/100 `NO_HIRE` is a platform artifact of premature termination, not a candidate capability signal, and must not be cited as performance data anywhere in P8 documents.

## 1. Field Evidence (Session #155)

| Artifact | Location / Value |
|---|---|
| Vault media archive | `D:\AI OS Interview Media\2026-10-01\1422_DSA_JUNIOR_155\` (status VERIFIED — backend P7 performed correctly) |
| Full desktop recording | `C:\Users\tomar\Videos\2026-10-01 19-45-22.mp4` (OBS 32.2.2) |
| Assigned problems | `problems/session-questions.json`: `reverse-a-string` (displayOrder 0), `longest-substring-without-repeating-characters` (displayOrder 1) |
| Report artifacts | `report/report.json`, `report/report.pdf` — 22/100 `NO_HIRE`, premature-termination disclosure present |
| Failure window | OBS 05:35–07:18: dialogue handoff INTRODUCTION → "2. Coding & DSA ×2"; left panel renders "Reverse a String"; center IDE renders `EmptyTrackState` ("No Published Questions … Please select another track"); Monaco editor never mounts; candidate terminates via End & Report at vault t≈313s |

**Defect class**: state split — the section-handoff signal reaches one consumer (dialogue/StageStepper/problem panel) but not the other (session catalog → IDE router), which stays pinned to Section 0.

## 2. Root Cause Chain (verified in tree)

- **[R.1]** `frontend/src/components/arena/ArenaRoom.tsx` L129-138 calls `useSessionCatalog({ … activeSectionIndex: 0, … })` — **L133 is a hardcoded literal `0`**.
- **[R.2]** The live section index already exists: `useDialogue.ts` L124 owns `const [activeSectionIndex, setActiveSectionIndex] = useState(0)` and returns it (L584). `ArenaRoom.tsx` itself consumes it at L192-193 (`isApproachGateLocked`) and L201 (`buildArenaShellProps`) — proving the value was available and simply not plumbed to the catalog.
- **[R.3]** `useSessionCatalog.ts` is fully reactive to the prop: L55-60 derives `activeSectionList = sectionQuestions[activeSectionIndex] || []` (INTERVIEW + sectionQuestions present); L77-81 syncs `questionsList` to it; L51-53 resets the question index on section change (D2 binding). **The hook is not broken — the call site is.**
- **[R.4]** With the catalog pinned to Section 0 (INTRODUCTION, zero coding questions), `questionsList.length === 0` forever. `TrackScreenRouter.tsx` L90-92 then evaluates `questionsCount === 0 && effectiveSection ∈ {DSA, SQL, LLD, SYSTEM_DESIGN}` → returns `<EmptyTrackState>`. Note the split-brain inside that single condition: `effectiveSection` is derived from the LIVE section (`ArenaShell.tsx` L159 passes `sections[activeSectionIndex].sectionType`), while `questionsCount` is frozen at Section 0.
- **[R.5]** `EmptyTrackState.tsx` L25-28 renders "No Published Questions … Please select another track or browse the full question bank", with playground affordances only ("Browse Catalog", "Switch to DSA" — L44-54, the latter hardcoded to `onSelectTrack('ALGORITHMS_DATA_STRUCTURES')`). In a locked proctor session every affordance is unusable; the candidate's only exit is End & Report → session destroyed at 5m13s of a 28-min budget.
- **[R.6] Ordering constraint (why the naive fix does not compile-position-wise)**: at `ArenaRoom.tsx`, `useSessionCatalog` (L129) is called BEFORE `useArenaEngines` (L151), and engines genuinely consumes catalog outputs at render time (`useExecution({ activeQuestion })`, L67-70). Meanwhile `useDialogue` inside engines reads catalog values only through lazy getters (L89-95). So the catalog needs the dialogue's index at render time, while the dialogue needs the catalog's outputs lazily — a resolvable but real circular ordering that the fix must respect.
- **[R.7] Test-gap of record**: `frontend/src/components/arena/SectionQuestionBinding.test.ts` asserts on a locally-constructed array literal and imports **zero production code**. It provided false confidence that "section binding" was covered. P8 must replace it with tests that bind to the real tree (FIX-3).

**Rider interaction check (QB-27 cross-reference)**: `8cfacc6` changed `useSessionCatalog.ts` (removed `isInterview &&` from the playlist fallback branch; added `targetSlug` anchoring in the fetch path). With `sectionQuestions` present the hook early-returns at L77-81 before that branch — the rider is **inert for the Session #155 path** and did not cause this defect. It is operator-sanctioned live-issue work and MUST be preserved by P8 (FIX-3/T4).

## 3. Fix Contract

### FIX-1 (MUST) — Single source of truth for active section index
- `ArenaRoom.tsx` MUST NOT pass a literal `activeSectionIndex: 0` to `useSessionCatalog`.
- The catalog MUST consume the same reactive section index the dialogue uses, propagating **within the same React commit** — no render in which the DSA screen is visible while `questionsCount === 0` due to a stale index (no visible `EmptyTrackState` flash on handoff).
- Approved architectures (choose one; declare the choice in the report):
  - **(A, recommended)** Lift the section index: ArenaRoom owns the state; `useDialogue` becomes controlled (accepts `activeSectionIndex` + `onSectionIndexChange`, replacing its internal `useState`); the same value feeds `useSessionCatalog`. True single source of truth; zero extra commits.
  - **(B)** Instantiate `useDialogue` in ArenaRoom before the catalog and pass it into `useArenaEngines` as a parameter (engines stops calling it internally). Lazy getters that read `activeQuestion`/`questionsList` must switch to ref-based late binding (refs updated every render by ArenaRoom).
- **Forbidden**: an `useEffect` state-mirror of `engines.dialogue.activeSectionIndex` feeding the catalog (paint-flash risk and hidden ordering coupling); any ref-snapshot of the index taken at mount; changing `useSessionCatalog`'s reactive semantics.
- If `plan.sections`/`navSections` indexing and `sectionQuestions` indexing ever diverge, implement an explicit pure mapping (section id → sectionQuestions index) with unit tests; do not index blindly.
- **Acceptance**: on INTRODUCTION → DSA handoff, `questionsList === sectionQuestions[1]` (2 assigned problems), `DsaScreen` mounts with Monaco, the left problem panel and the center IDE show the same question set, and the first assigned problem (`reverse-a-string`) is active.

### FIX-2 (MUST) — Session-mode fault-state guard (defense in depth)
- In INTERVIEW mode (`isPlayground === false`), the playground-style `EmptyTrackState` ("No Published Questions … Please select another track") MUST NOT render for coding sections. Gate `TrackScreenRouter.tsx` L90-92 on `isPlayground`, and add a distinct non-playground fault state (suggested name `SessionSectionFaultState`; exact name flexible) that:
  1. states the true condition honestly — distinguishing "session questions exist but catalog failed to resolve" from "no questions assigned to this section in this session";
  2. offers a retry/re-resolve affordance (re-run the catalog resolution);
  3. never presents track-switching or catalog-browsing actions that are impossible in a locked proctor sandbox; End & Report stays where it is today (top bar) and must not be the only visible recovery path once retry exists.
- PLAYGROUND behavior is untouched: `EmptyTrackState` with its existing affordances remains the playground empty state.
- **Acceptance**: no code path in INTERVIEW mode can render a message directing the candidate to change track.

### FIX-3 (MUST) — Regression tests bound to the tree (G3 + G4 apply)
Runner stays `npm test` (`tsx --test`, node:test). Follow the established repo idiom (source-contract tests via `readFileSync` + TS compiler API; pure-function extraction for behavior). Required tests (names in the report must match the tree exactly — G4):
- **T1**: ArenaRoom source contract — the `useSessionCatalog({…})` call block contains no literal `activeSectionIndex: 0` and binds the live/lifted index (fail if reintroduced).
- **T2**: TrackScreenRouter source contract — the `EmptyTrackState` gate is playground-scoped and a non-playground fault branch exists (fail if the INTERVIEW-mode empty-state path returns).
- **T3**: behavior test for the section→question resolution (extract a pure resolver from `useSessionCatalog` or equivalent): given `sectionQuestions = [[], [q1, q2]]`, index 0 → `[]`, index 1 → `[q1, q2]`, out-of-range → `[]` without cross-section bleed. If a true hook-reactivity harness is feasible without adding dependencies, it is welcome but not required.
- **T4**: PLAYGROUND non-regression — source contract asserting the `8cfacc6` rider behaviors remain: playlist fallback without `isInterview` gate, and `targetSlug` anchoring in the fetch path.
- **T5**: replace/upgrade the sham `SectionQuestionBinding.test.ts` so that it imports and exercises production code (or delete it in favor of T3) — an array-literal test asserting on itself is banned by G4 spirit.
- Four-number report (G3, FE口径): `npm test` output quoted verbatim — files / tests / assertions / failures — BEFORE vs AFTER. Before-baseline measured today at `677ea94`: **204 tests / 0 failures** (23 suites; full verbatim numbers in the fix report).

### FIX-4 (MUST) — Process gates (restated, unchanged from P7)
- Branch per slice: `feat/p8-fix-01` (FIX-1), `feat/p8-fix-02` (FIX-2), `feat/p8-fix-03` (FIX-3 — or fold tests into 01/02 and say so explicitly in the report). Each merged to master with `--no-ff`. Single-branch squash-style merges are a repeat of the QB-27 red flag and will be rejected.
- **Riders**: any file touched outside a slice's declared scope must be listed under "Riders" with rationale in the report. Undeclared riders discovered at audit = red flag (G9 precedent: `8cfacc6`).
- Report file (G8): `collab/gemini/P8-SESSIONFLOW-FIXPACK-REPORT.md` — per-FIX status, architecture choice (A/B), test names, four-number before/after, rider list, G1 field evidence (screenshots of INTRO→DSA handoff on a live or staged run).
- G5: credentials env-only, never on disk. G8: collab/ files only — Issues API remains out of reach (PAT has no Issues RW).

## 4. Verification Plan (QB-28, Z lane)
1. Tree inspection of merged slices; `rg "activeSectionIndex: 0"` must return zero hits in `frontend/src` (the L133 literal is the target; `?? 0` defensive fallbacks elsewhere are out of scope).
2. G4: every declared test name exists and passes at the fix-branch head; T1-T5 present.
3. G3: four-number reconciliation against the 204/0 baseline.
4. Rider diff audit vs the declared list.
5. Operator field closure (VP11-m style, post-ACCEPT): one real DSA session — handoff must land on Monaco with "Reverse a String"; candidate codes and submits; End & Report → vault reaches VERIFIED; report.json reflects ≥3 minutes and real coding activity (no premature-termination disclosure).

## 5. Definition of Done
- FIX-1..3 merged on master per FIX-4 process; `npm test` green with T1-T5 included; QB-28 audit returns ACCEPT; operator field session completes with the editor accessible end-to-end.

## 6. Relationship to Open Items (explicitly orthogonal)
- **QB-27 outcome** (recorded in `collab/z/P7-AUTOVAULT-FIXPACK-AUDIT.md`): ACCEPT — all six P7 fixes PASS; the 92/110 contradiction is closed (the SPEC's "110" was a QB-18 miscount; runtime 92 = git truth EXACT). P8 does not reopen it.
- **FIX-7 (P7 follow-up, MUST next cycle)**: F-N2 dual-persistence in `VaultArchiveService` (disk manifest VERIFIED vs Mongo FAILED divergence) — queued separately; do not fold into P8.
- **F-N1 (SHOULD)**: seeder ghost rows (upsert-by-slug never deletes) — queued separately.
- **QB-27 push debt**: audit commits `d0df8fc` + `677ea94` are on local master but not yet on origin (sandbox PAT reset); push pending operator token re-injection. P8 work may proceed locally in parallel.

## 7. Out of Scope (NON-GOALS)
- Audio hardware/echo/headset/mic-gain guidance — the operator has explicitly rejected this framing.
- Scoring rubric, `report.json`/`report.pdf` content, vault backend behavior (P7 domain).
- PLAYGROUND mode behavior changes (must be preserved exactly as of `8cfacc6`).
- Any backend file — P8 is frontend-only unless a defect discovered during execution forces otherwise (then: declare in report, await Z-lane counter-signature before touching).
