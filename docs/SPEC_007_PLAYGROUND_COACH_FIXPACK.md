> **STATUS: HISTORICAL SPECIFICATION** — Retained for architectural provenance. Current active development and audits are governed by collab/ protocol.

# SPEC-007 — Playground Coach Fixpack: Stage Integrity, Payload Honesty, URL Sync

**Status:** APPROVED — AWAITING EXECUTION
**Owner lane:** Gemini (execution) · Z.ai (spec + review)
**Trigger:** Operator screenshots (2026-10-02): playground session "Reverse a String" — Coach Sam badge `INTRODUCTION`, user asks *"what is the issue in this code?"*, coach deflects to HR questions while a Compile Error is on screen. Full causal chain independently verified by Z.ai against `origin/master` @ `10b3951`.

---

## §0 Problem Statement

A Playground practice session launched from Learn (`/learn?view=modules` → Solve) renders the **code editor immediately**, but the dialogue engine runs the **mock-interview INTRODUCTION stage**. Consequences, all verified:

1. `handleSolveFromLearn` sets `sessionPlan = undefined` (App.tsx ~L154).
2. `buildNavSections(undefined)` falls back to the default 4-stage interview plan — index 0 = `INTRODUCTION` (plan-navigation.ts L54–59).
3. `currentStage = 'INTRODUCTION'` → `buildCandidateTurnPayload` **strips the candidate's code** (`shouldAttachCode` allows only DSA/LLD) and **nulls question context/slug/title** (turnPayload.ts L49–66). Coach Sam is blind to the code.
4. Backend `AiOrchestratorService` L342 appends the interview `STAGE SPECIFICATION - INTRODUCTION` block **unconditionally** — it checks `currentStage`/`sectionType` but never `isPlayground` — ordering the coach: *"Do NOT present, evaluate, or interrogate coding problems yet."*
5. `ArenaShell.tsx` L87 (`isIntroRound = !isPlayground && …`) skips the intro *screen* but not the intro *state* — editor visible, coach in interview mode. The UI and the coach disagree; the coach wins.

Secondary defects on the same screens (verified): ROOM entry never updates the URL (`setView('ROOM')` without `pushState`), so Back is dead and refresh silently dumps the user back to Learn.

## §1 Non-Negotiables (carry over from SPEC-006 §1)

- **G-N1 Honest counting:** no fabricated metrics, streaks, or goals anywhere in this fixpack.
- **G-N3 Verdict semantics:** untouched.
- **G-N5 Single data layer:** no new polling or fetch loops.
- **G-N8 Graceful degradation:** unknown states render `—`, never fake zeros.
- Interview mode is **frozen**: every fix must be provably a no-op for `sessionMode === 'INTERVIEW'` unless explicitly stated.

## §2 Verified Evidence Ledger (Z audit of Gemini's findings)

| # | Gemini finding | Z verdict | Evidence |
|---|---|---|---|
| 1 | Coach deflects code questions; turn payload strips code in INTRODUCTION | **CONFIRMED** (incomplete — Gemini missed the backend prompt half) | turnPayload.ts L11–27, L49–66; **plus** AiOrchestratorService.java L342–355 (INTRO spec appended with no `isPlayground` guard) |
| 2 | Playground inherits mock-interview timeline (`sessionPlan=undefined` → 4-stage fallback; editor rendered via `isIntroRound=!isPlayground` while state stays INTRODUCTION) | **CONFIRMED** — root cause | App.tsx `handleSolveFromLearn`; plan-navigation.ts L54–59; ArenaShell.tsx L87; useDialogue.ts L125, L373 |
| 3 | URL desync: ROOM renders while URL stays `/learn?view=modules&topic=arrays`; refresh loses session | **CONFIRMED** | App.tsx — `handleNavigateToLearnQuestion`/`handleBackToSetup` push state; all four `setView('ROOM')` sites (L156, L290, L330, L451) do not; popstate handler (L67–81) has no ROOM branch |
| 4 | FloatingAiOrb should be hidden when AiAssistantPanel is open | **REJECTED — works as designed** | FloatingAiOrb.tsx: orb *is* the panel toggle (`aria-expanded`, title "Collapse Coach Sam", distinct open styling L127–128, mic/recording indicator). Hiding it removes the close affordance. Deferred cosmetic polish only (§9). |

## §3 Fix Design

### B-1 — Backend: no interview stage gating in Playground (ai-orchestrator-service)

In `AiOrchestratorService` (`buildSystemInstruction` path, L342):

- Change the INTRODUCTION stage-spec guard to `if (!isPlayground && ("INTRODUCTION".equalsIgnoreCase(...)))`.
- Inside the guard nothing else changes — interview INTRODUCTION behavior is byte-identical.
- Rationale: Playground has no phases. Defense in depth: even if a frontend regression re-labels a playground turn as INTRODUCTION, the coach must never again receive the anti-code directive.

### F-1 — Frontend: Playground always gets a real coding stage (App.tsx)

Do **not** special-case the stepper. Fix the data: playground sessions must never navigate from `sections === undefined`.

- Add helper `syntheticPlaygroundSection(q): PlannedSection` → `{ sectionType: 'DSA', track: q.track || 'ALGORITHMS_DATA_STRUCTURES', itemCount: 1, softTimeBudgetMinutes: 30, note: 'Playground practice', problemSlugs: [q.slug] }`.
- In `handleSolveFromLearn`: replace `setSessionPlan(undefined)` with a synthetic single-section `SessionPlan` (`{ source: 'SETUP_SELECTION', level: mappedDifficulty, sections: [synthetic], plannedTotalMinutes: 30 }`).
- Audit the other two PLAYGROUND ROOM entries (`handleStartInterview` PLAYGROUND branch ~L290, practice-playlist path ~L330): if `sessionPlan` is undefined **or** its first section is `INTRODUCTION`, apply the same synthesis (keep operator-chosen sections that already start with a coding stage as-is).
- Result: stepper shows exactly `1. Coding & DSA`, `currentStage === 'DSA'`, `isIntroRound` irrelevant, turn payload attaches code through the existing DSA path.

### F-2 — Frontend: payload honesty bypass for Playground (turnPayload.ts + useDialogue.ts + ArenaShell.tsx)

- `CandidateTurnInput` gains `isPlayground?: boolean`.
- `buildCandidateTurnPayload`: when `isPlayground` → attach code whenever a non-empty `codeSnapshot` exists (skip DSA/LLD-only and intro-nulling branches); never null `questionContext`/`problemSlug`/`sectionQuestionTitle`.
- `useDialogue` accepts `isPlayground` prop (threaded from `ArenaShell`, which already computes it) and passes it at the L373 call site.
- Interview mode: behavior byte-identical (bypass only fires when `isPlayground === true`).

### F-3 — Frontend: URL contract for ROOM (App.tsx)

- Every `setView('ROOM')` entry point pushes `window.history.pushState({}, '', `/session/${sessionId}`)`.
- `popstate`: if pathname starts with `/session/` **and** a session is active in state → `setView('ROOM')`; if pathname starts with `/session/` with no active session → `setView('SETUP')` (graceful, no crash).
- **Explicitly out of scope:** full refresh-recovery of a live session (rehydrating transcript/questions/report). Documented limitation in §9 — refresh on `/session/:id` lands on SETUP. Do not build session rehydration in this fixpack.

## §4 VP Gates (all mandatory)

- **VP-1** Playwright-free unit proof: with a synthetic playground plan, `buildNavSections(sections)` yields exactly one section, `stage === 'DSA'`, label `1. Coding & DSA…`; no INTRODUCTION key present.
- **VP-2** turnPayload unit tests: `isPlayground: true` + arbitrary `sectionType` (+ stale gate lock, + code==starter) with real code snapshot → payload carries the code and full context. `isPlayground` absent/false + INTRODUCTION → existing stripping intact (regression).
- **VP-3** Backend `AiOrchestratorServiceDialogueTest`: PLAYGROUND + `currentStage=INTRODUCTION` → built instruction must NOT contain the interview INTRO spec strings ("Do NOT present, evaluate, or interrogate coding problems"); INTERVIEW + INTRODUCTION → must contain them (regression).
- **VP-4** URL test: ROOM entry produces `/session/:id`; popstate with active session → ROOM; popstate on `/session/…` without session → SETUP.
- **VP-5** Regression: full `npm test` (all suites, 0 failures) and `mvn -pl ai-orchestrator-service test` 0 failures. Report the four numbers (files / test-cases / assertions / failures) for each side — never omit the assertion count.
- **VP-6** `npm run build` passes (`tsc -b && vite build`).
- **VP-7** Manual visual script (screenshots for the report): launch "Reverse a String" from Learn modules → confirm stepper shows a single coding stage → paste the broken StringBuilder code → ask "what is the issue in this code?" → Coach Sam must respond with code-aware coaching (type-mismatch diagnosis acceptable) → browser Back returns to Learn.

## §5 Fence (§10 discipline — hard)

**Allowed:**
- `ai-orchestrator-service`: `AiOrchestratorService.java` + its test files only.
- `frontend`: `src/App.tsx`, `src/lib/turnPayload.ts` (+ `turnPayload.test.ts`), `src/components/arena/hooks/useDialogue.ts`, `src/components/arena/ArenaShell.tsx` (prop pass-through only) + new/adjusted tests.

**Forbidden:** `plan-navigation.ts` fallback semantics (interview robustness), `personas.ts`, `FloatingAiOrb.tsx`, learn components shipped in SPEC-006, other services, new dependencies, DB migrations, route/table changes, weakening any existing test.

## §6 Execution Order & Commits

1. `B-1` backend guard + VP-3 tests → commit `fix(spec-007): B-1 gate INTRODUCTION stage spec to interview mode`
2. `F-2` payload bypass + VP-2 tests → commit `fix(spec-007): F-2 playground payload honesty bypass`
3. `F-1` synthetic plan + VP-1 tests → commit `fix(spec-007): F-1 playground always navigates a coding stage`
4. `F-3` URL sync + VP-4 tests → commit `fix(spec-007): F-3 push /session/:id on ROOM entry`
5. `VP-5/6/7` full verification → report commit `docs(spec-007): publish execution report for Z review`

Work on branch `fix/spec-007-playground-coach`; do **not** touch master; Z reviews before merge.

## §7 Honest Deviations & Rejections (§9 discipline)

- **Gemini's orb fix rejected** (§2 #4). Optional deferred polish: dim the orb when the panel is open — needs its own micro-spec if the operator wants it.
- **Refresh-recovery of live sessions explicitly out of scope** (§3 F-3). Do not promise it in the report.
- Gemini's proposed "hide the multi-stage interview stepper altogether" is **superseded** by F-1: a single honest coding stage is kept visible rather than hiding navigation.

## §8 Report Template (§12 discipline)

Executors must report: per-slice commit SHAs; four numbers per side (backend `mvn -pl ai-orchestrator-service`, frontend `npm test`); build result; VP-1..7 evidence (test names + VP-7 screenshots embedded in the report); any deviation with justification **before** merging. Missing assertion counts = report rejected.
