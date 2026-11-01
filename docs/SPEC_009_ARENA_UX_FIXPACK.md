> **STATUS: HISTORICAL SPECIFICATION** — Retained for architectural provenance. Current active development and audits are governed by collab/ protocol.

# SPEC-009 — Playground Arena UX Fixpack: CTA Dedupe, Coach Panel Control, Turn Abort, Prompt Relevance

**Status:** APPROVED — AWAITING EXECUTION · **REV 2** (2026-10-03: F-3 retargeted to the StageStepper reel after Gemini's independent analysis confirmed the operator's "reel" is the top bar, not the rail; stop-affordance pointer corrected; ↑ draft recall adopted from Gemini proposal — see §0.1)
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
| E | Top "reel" (`1. Coding & DSA ×1 \| 30 min · Playground practice`) hogs vertical space showing one question; "I don't think that reel is necessary" | **REAL (conditional hide ×2)** + one by-design note | The reel is the **StageStepper top bar** (`ArenaShell` L135, rendered whenever `!isFocusMode` — even in playground). Its `30 min · Playground practice` description is `playgroundPlan.ts` L14–15 → `plan-navigation.ts` L43. Separately, `ArenaShell` L137 hides the left QuestionRail only for `isFocusMode \|\| isIntroRound` — single-question playground still renders a 12-wide rail for zero information. **Both** are reclaimed by F-3. The **30:00 countdown is `SelfTimer` in the topbar (`ArenaShell` L125), NOT inside the stepper** — hiding the reel keeps the live timer. |

Also confirmed by screenshot: hub shows honest counters (`1/322 Solved`, verdict chips COMPILE_ERROR/FAILED/PARTIAL/RUNTIME_ERROR) — G-N1 holding.

## §0.1 Cross-Check vs Gemini's Independent 5-Item Analysis (2026-10-03)

Gemini (execution lane) independently analyzed the same 5 findings. Adjudication of that analysis:

| Item | Gemini proposal | Z ruling |
|---|---|---|
| #1 Solve buttons | Remove header Solve, keep footer | Already covered — Gemini saw 2 `onSolve` sites, missed the locked-state site (L606). F-1 unchanged (3 sites adjudicated; L606 is semantically distinct and stays). |
| #2 Panel expand | Maximize2 toggle, 2 modes → `w-[640px] max-h-[88vh]` | Already covered, F-2 is strictly stronger: 3-state `normal → wide min(720px, 90vw) → fullscreen` + persistence, matching the operator's "enlarge, **full screen**" ask. |
| #3 Stop + re-edit | Stop button + `AbortController` + restore text + **↑ recall** | Stop/restore already in F-2. **↑ recall ADOPTED** (client-side only, no backend mutation — see F-2). True history editing stays deferred (§6). |
| #4 Unicode directive | Ban encoding/runtime trivia in DSA follow-ups | Already covered by B-1, near-identical wording. **Scope correction**: Gemini says "in DSA rounds" which would touch the interview block — interview stays frozen (§1); B-1 playground block only. |
| #5 Reel | Hide `StageStepper` when playground / `sections.length <= 1` | **Gemini is right and SPEC-009 REV 1 was mis-targeted** (rail only). F-3 retargeted: hide **both** StageStepper reel and rail. SelfTimer topbar countdown unaffected (verified L125 ≠ L135). |

All files Gemini's plan touches are already inside the §4 fence. No fence change.

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

### F-2 — Turn stop + draft restore + recall (api.ts, useDialogue.ts, AutoGrowingChatInput.tsx, AiAssistantPanel.tsx, ArenaShell.tsx)

- **api.ts**: `processDialogueTurn` gains optional `signal?: AbortSignal` forwarded to its `fetch`. No other API changes.
- **useDialogue**: one `AbortController` per candidate turn (ref). New `abortTurn()`:
  - aborts the in-flight dialogue fetch; `isAiResponding` → false;
  - restores the sent text (+ code snapshot context) into `chatInput` for editing/resend;
  - appends nothing to the transcript (no fake messages); catch path must treat `AbortError` as silent — no toast, no console error;
  - voice abort (`onAbortVoice`) remains a separate concern — do not conflate;
  - tracks the last sent candidate text in a ref; expose `recallLastDraft()`.
- **AutoGrowingChatInput**: the **send button (L343–356)** — currently `disabled` with a spinning `Sparkles` while `isAiResponding` — becomes an enabled **Stop** button (Square/XCircle icon) wired to `abortTurn()`. ⚠️ Do NOT touch the L207 recording-cancel affordance (`onAbort` cancels voice recording, a different concern). Input remains editable during response (remove any disabled state on the textarea while responding — typing must never be blocked). **Draft recall**: when input is empty, not responding, and not recording, `ArrowUp` populates the input via `recallLastDraft()` for tweak-and-resend; sending creates a NEW turn — transcript history stays immutable.
- **AiAssistantPanel**: header gains an expand toggle cycling `normal` → `wide` (`min(720px, 90vw)`) → `fullscreen` (fixed overlay with close affordance). Persist in `localStorage` key `ai.coach.panelSize`. Extract a pure helper `panelSizeClass(state)` for testing. FloatingAiOrb remains untouched (still the open/close toggle — SPEC-007 rejection stands).

### F-3 — Reel + rail auto-hide for single-question practice (ArenaShell.tsx)

- **StageStepper (the top reel, L135)**: hidden when `isPlayground && sections.length <= 1` (synthetic single-question practice renders zero stages worth navigating). Interview mode (always 4 sections) and any future multi-section playground keep the stepper. The `30 min · Playground practice` static description dies with the reel — by design.
- **QuestionRail (left, L137)**: hidden when `isFocusMode || isIntroRound || (isPlayground && railItems.length <= 1)`. Interview mode unchanged (multi-question rails still render).
- **SelfTimer countdown (L125) is NOT touched** — the live 30:00 clock stays in the topbar. Verified: `SelfTimer` and `StageStepper` are sibling render sites; hiding one cannot unmount the other.

## §3 VP Gates (all mandatory)

- **VP-1** Backend: playground instruction contains `FOLLOW-UP RELEVANCE RULE`; interview instruction does not (captor test, both directions).
- **VP-2** Frontend source test: `QuestionDetailModal` contains exactly two `onSolve(slug)` call sites (footer + locked-state); header button absent.
- **VP-3** `panelSizeClass` unit test: three states, correct classes, localStorage persistence key asserted at source level.
- **VP-4** Abort + recall semantics (unit where pure, source-integrity where hook-bound): `processDialogueTurn` forwards `signal`; `useDialogue` contains an `AbortController` and `abortTurn` that (a) resets `isAiResponding`, (b) restores draft to `chatInput`, (c) appends no transcript message, (d) swallows `AbortError` silently; `recallLastDraft` exists and `AutoGrowingChatInput` wires `ArrowUp`-when-empty to it (source-level assertion).
- **VP-5** Hide-condition source test: `isPlayground && sections.length <= 1` present at the StageStepper render site AND `isPlayground && railItems.length <= 1` at the QuestionRail site in ArenaShell; interview rail and stepper untouched.
- **VP-6** `npm test` full suite 0 failures + `mvn -pl ai-orchestrator-service test` 0 failures + `npm run build` green. **Four numbers per side, assertions included — no assertion count = report rejected.**
- **VP-7** Manual script (operator, screenshots): (1) modal shows ONE solve CTA (+ locked-state variant when applicable); (2) send a prompt → Stop button halts the reply, text returns to input, edit and resend works, no phantom reply; (3) panel cycles normal→wide→fullscreen and remembers choice after reload; (4) single-question practice shows NO top reel (`Coding & DSA ×1 \| 30 min`), no left rail, and the 30:00 countdown still ticks in the topbar; (5) coach follow-up on the reversal drill references the algorithm or realistic edge cases, not Unicode trivia.

## §4 Fence (hard)

**Allowed:** `ai-orchestrator-service`: `AiOrchestratorService.java` + `AiOrchestratorServiceDialogueTest.java`. `frontend`: `QuestionDetailModal.tsx` (+ its test file if present/new), `AiAssistantPanel.tsx`, `AutoGrowingChatInput.tsx`, `useDialogue.ts`, `useArenaEngines.ts` (pass-through only if needed), `ArenaShell.tsx`, `api.ts` (signal param on `processDialogueTurn` ONLY), new pure helper file(s) for panel sizing (+tests), equal-strength updates to existing source-integrity tests.

**Forbidden:** `personas.ts`, `clientLogger.ts`/SPEC-008 files, `FloatingAiOrb.tsx`, learn Hub/Modules components, `plan-navigation.ts`/`playgroundPlan.ts`/`sessionUrl.ts`, other backend services, new deps, migrations, transcript persistence changes, weakening any test.

## §5 Branching & Execution Order

- Branch `fix/spec-009-arena-ux` — **must be cut from master AFTER SPEC-007 and SPEC-008 are merged** (api.ts overlap with SPEC-008; useDialogue/App.tsx overlap with SPEC-007).
1. `F-1` CTA dedupe → commit `fix(spec-009): F-1 single solve CTA in question modal`
2. `B-1` follow-up scoping + VP-1 → commit `fix(spec-009): B-1 playground follow-up relevance rule`
3. `F-3` reel + rail auto-hide + VP-5 → commit `fix(spec-009): F-3 hide stage reel and rail for single-question practice`
4. `F-2` abort + draft restore + recall + panel sizing + VP-3/4 → commit `fix(spec-009): F-2 turn stop, draft recall, panel expand`
5. VP-6/7 → report commit `docs(spec-009): publish execution report for Z review`

## §6 Honest Deviations & Deferrals

- **Studio-style editing of already-answered history is OUT OF SCOPE** — it requires backend message mutation/deletion APIs that do not exist today. v1 ships: stop + draft restore + edit + resend of the *aborted/in-flight* turn, plus **↑ recall of the last sent draft** (creates a new turn; history immutable). Full history editing needs its own spec with backend support; do not fake it client-side.
- The 30:00 single-question timer is by design (synthetic plan budget) — if the operator later wants per-difficulty budgets, that is a one-line change in `playgroundPlan.ts`, deferred until requested.
- FloatingAiOrb overlap/dim remains rejected-by-design (SPEC-007 §2 #4); the orb's only change in this spec is: none.
