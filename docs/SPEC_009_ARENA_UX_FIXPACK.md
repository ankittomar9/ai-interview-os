# SPEC-009 — Playground Arena UX Fixpack: CTA Dedupe, Coach Panel Control, Turn Abort, Prompt Relevance

**Status:** APPROVED — AWAITING EXECUTION
**Owner lane:** Gemini (execution) · Z.ai (spec + review)
**Trigger:** Operator runtime session `/session/160` (2026-10-03, 5 screenshots). These screenshots also constitute **partial VP-7 runtime proof for SPEC-007**: URL `/session/160` ✓, single `1. Coding & DSA ×1` stage ✓, Coach Sam badge `DSA` ✓, code-aware debugging (operator solved 2/2 Accepted after applying the StringBuilder fix) ✓. Still pending from SPEC-007/008 VP-7: Back-button return, Loki `[CLIENT]` line, gateway-kill negative path.

---

## §0 Operator Findings — Z Adjudication Ledger

| # | Operator report | Verdict | Evidence |
|---|---|---|---|
| A | Two Solve buttons in the question modal — "same location or different?" | **REAL BUG — redundant CTAs** | `QuestionDetailModal.tsx` wires `onSolve(slug)` at **3** sites (L281 header, L606 locked-state, L846 footer). All call the identical handler → identical destination (`handleSolveFromLearn` → `/session/:id`). Header + footer are accidental duplicates. |
| B | Coach panel (orb window) fixed size — "very bad design, want enlarge/fullscreen" | **REAL GAP** | `AiAssistantPanel.tsx` L122: hard `w-[360px] sm:w-[380px] max-h-[70vh]`. No expand state. |
| C | "Once I send a prompt, it is sent indefinitely. I cannot stop it or re-edit" | **REAL GAP** | No `AbortController` anywhere in `useDialogue`. `onAbortTurn` (ArenaShell L213) is wired to `onAbortVoice` — it stops **text-to-speech only**, never the in-flight `processDialogueTurn` HTTP call. No draft restore, no re-edit path. |
| D | Coach asks about Unicode/surrogate pairs in a DSA reversal drill — "irritates me" | **REAL PROMPT-TUNE (playground only)** | Playground block (`AiOrchestratorService` L247–284) demands "a thought-provoking question" with **no relevance scoping** → model drifts to language-lawyer trivia. Note: *empty-input* is a legitimate DSA edge case and stays; *Unicode surrogate mechanics* is noise for this track. |
| E | Left "reel" (QuestionRail `Q1`) hogs space showing one question; "I don't think that reel is necessary" | **REAL (conditional hide)** + one by-design note | `ArenaShell` L137 hides rail only for `isFocusMode \|\| isIntroRound` — single-question playground still renders a 12-wide rail for zero information. The **30:00 timer is by design** (synthetic plan budget, SPEC-007 F-1) — operator accepted; documented, not a bug. |

Also confirmed by screenshot: hub shows honest counters (`1/322 Solved`, verdict chips COMPILE_ERROR/FAILED/PARTIAL/RUNTIME_ERROR) — G-N1 holding.

## §1 Non-Negotiables (carried)

- Interview mode frozen except: nothing. B-1 touches the **playground prompt block only**.
- Telemetry (SPEC-008) untouched; abort must not corrupt session transcript state.
- Honest states: an aborted turn must NOT render a fake AI reply or fake "cancelled by system" transcript entry. The candidate message that was already persisted stays; the AI reply simply never arrives, and the draft returns to the input.
- No new dependencies.

## §2 Design

### F-1 — CTA dedupe (QuestionDetailModal.tsx)

- **Remove** the header Solve button (L281). The modal's single primary CTA is the footer `Solve in Playground` (L846).
- The locked-state CTA (L606 "Solve in Playground First") is a **different context** (solution gating) and stays.
- Result: exactly two `onSolve` call sites, each semantically distinct.

### B-1 — Playground follow-up relevance scoping (ai-orchestrator-service)

Append to the playground system-instruction block only:

```
FOLLOW-UP RELEVANCE RULE: "followUpQuestion" must probe the current problem's algorithm,
correctness, complexity, or realistic boundary cases (empty input, duplicates, extremes,
overflow). Do NOT ask about language-lawyer trivia (Unicode encoding or surrogate mechanics,
JVM internals, language history) unless the problem itself is explicitly about text encoding.
```

- Interview block untouched. VP test via the existing ArgumentCaptor pattern.

### F-2 — Turn stop + draft restore (api.ts, useDialogue.ts, AutoGrowingChatInput.tsx, AiAssistantPanel.tsx, ArenaShell.tsx)

- **api.ts**: `processDialogueTurn` gains optional `signal?: AbortSignal` forwarded to its `fetch`. No other API changes.
- **useDialogue**: one `AbortController` per candidate turn (ref). New `abortTurn()`:
  - aborts the in-flight dialogue fetch; `isAiResponding` → false;
  - restores the sent text (+ code snapshot context) into `chatInput` for editing/resend;
  - appends nothing to the transcript (no fake messages); catch path must treat `AbortError` as silent — no toast, no console error;
  - voice abort (`onAbortVoice`) remains a separate concern — do not conflate.
- **AutoGrowingChatInput**: while `isAiResponding`, the existing stop affordance (L207) calls the **turn** abort; input remains editable during response (remove any disabled state on the textarea while responding — typing must never be blocked).
- **AiAssistantPanel**: header gains an expand toggle cycling `normal` → `wide` (`min(720px, 90vw)`) → `fullscreen` (fixed overlay with close affordance). Persist in `localStorage` key `ai.coach.panelSize`. Extract a pure helper `panelSizeClass(state)` for testing. FloatingAiOrb remains untouched (still the open/close toggle — SPEC-007 rejection stands).

### F-3 — Rail auto-hide for single-question practice (ArenaShell.tsx)

- Rail hidden when `isFocusMode || isIntroRound || (isPlayground && railItems.length <= 1)`. Interview mode unchanged (multi-question rails still render).

## §3 VP Gates (all mandatory)

- **VP-1** Backend: playground instruction contains `FOLLOW-UP RELEVANCE RULE`; interview instruction does not (captor test, both directions).
- **VP-2** Frontend source test: `QuestionDetailModal` contains exactly two `onSolve(slug)` call sites (footer + locked-state); header button absent.
- **VP-3** `panelSizeClass` unit test: three states, correct classes, localStorage persistence key asserted at source level.
- **VP-4** Abort semantics (unit where pure, source-integrity where hook-bound): `processDialogueTurn` forwards `signal`; `useDialogue` contains an `AbortController` and `abortTurn` that (a) resets `isAiResponding`, (b) restores draft to `chatInput`, (c) appends no transcript message, (d) swallows `AbortError` silently.
- **VP-5** Rail condition source test: `isPlayground && railItems.length <= 1` present in ArenaShell; interview rail untouched.
- **VP-6** `npm test` full suite 0 failures + `mvn -pl ai-orchestrator-service test` 0 failures + `npm run build` green. **Four numbers per side, assertions included — no assertion count = report rejected.**
- **VP-7** Manual script (operator, screenshots): (1) modal shows ONE solve CTA (+ locked-state variant when applicable); (2) send a prompt → Stop button halts the reply, text returns to input, edit and resend works, no phantom reply; (3) panel cycles normal→wide→fullscreen and remembers choice after reload; (4) single-question practice shows no left rail, 30:00 timer intact; (5) coach follow-up on the reversal drill references the algorithm or realistic edge cases, not Unicode trivia.

## §4 Fence (hard)

**Allowed:** `ai-orchestrator-service`: `AiOrchestratorService.java` + `AiOrchestratorServiceDialogueTest.java`. `frontend`: `QuestionDetailModal.tsx` (+ its test file if present/new), `AiAssistantPanel.tsx`, `AutoGrowingChatInput.tsx`, `useDialogue.ts`, `useArenaEngines.ts` (pass-through only if needed), `ArenaShell.tsx`, `api.ts` (signal param on `processDialogueTurn` ONLY), new pure helper file(s) for panel sizing (+tests), equal-strength updates to existing source-integrity tests.

**Forbidden:** `personas.ts`, `clientLogger.ts`/SPEC-008 files, `FloatingAiOrb.tsx`, learn Hub/Modules components, `plan-navigation.ts`/`playgroundPlan.ts`/`sessionUrl.ts`, other backend services, new deps, migrations, transcript persistence changes, weakening any test.

## §5 Branching & Execution Order

- Branch `fix/spec-009-arena-ux` — **must be cut from master AFTER SPEC-007 and SPEC-008 are merged** (api.ts overlap with SPEC-008; useDialogue/App.tsx overlap with SPEC-007).
1. `F-1` CTA dedupe → commit `fix(spec-009): F-1 single solve CTA in question modal`
2. `B-1` follow-up scoping + VP-1 → commit `fix(spec-009): B-1 playground follow-up relevance rule`
3. `F-3` rail auto-hide + VP-5 → commit `fix(spec-009): F-3 hide rail for single-question practice`
4. `F-2` abort + draft restore + panel sizing + VP-3/4 → commit `fix(spec-009): F-2 turn stop, draft restore, panel expand`
5. VP-6/7 → report commit `docs(spec-009): publish execution report for Z review`

## §6 Honest Deviations & Deferrals

- **Studio-style editing of already-answered history is OUT OF SCOPE** — it requires backend message mutation/deletion APIs that do not exist today. v1 ships: stop + draft restore + edit + resend of the *aborted/in-flight* turn. Full history editing needs its own spec with backend support; do not fake it client-side.
- The 30:00 single-question timer is by design (synthetic plan budget) — if the operator later wants per-difficulty budgets, that is a one-line change in `playgroundPlan.ts`, deferred until requested.
- FloatingAiOrb overlap/dim remains rejected-by-design (SPEC-007 §2 #4); the orb's only change in this spec is: none.
