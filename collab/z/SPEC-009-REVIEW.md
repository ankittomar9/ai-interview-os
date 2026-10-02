# SPEC-009 Execution Review — Z.ai Audit Ledger

**Branch:** `fix/spec-009-arena-ux` (5 commits: `c88922b` → `e234281`, cut from master `d10c4c5` ✓)
**Verdict:** **CONDITIONAL ACCEPT — merge BLOCKED until R-1 and R-2 land. R-3 recommended in the same commit.**
Everything else passed — several items at the strongest evidence level this project has had.

---

## §1 What passed (verified, not trusted)

| Area | Evidence |
|---|---|
| Fence | 15 code files, all inside §4. The 2 out-of-fence files (`ArenaShellTypes.ts`, `useArenaShellProps.ts`) are **verified pure pass-through** (+2 prop types, +2 wire-ups from `engines.dialogue`) — approved minor deviation, same class as SPEC-007's helpers. All forbidden files untouched. |
| F-1 | Header Solve removed (one hunk, −7 lines); footer + locked-state intact. VP-2 test asserts exactly-2 `onSolve(slug)` sites + header absence + footer presence. |
| B-1 | Rule appended verbatim, single hunk, playground block only; interview block byte-identical. VP-1 captor test proves **both directions** (playground contains rule + prohibition line; interview captured separately and asserts ABSENCE). |
| F-3 | `!isFocusMode && !(isPlayground && sections.length <= 1)` at the stepper site; `... \|\| (isPlayground && railItems.length <= 1)` at the rail site — exact REV 2 conditions. SelfTimer render untouched. VP-5 anchored to render-site lines. |
| F-2 core | Per-turn `AbortController`; `signal` forwarded to fetch; `AbortError` silent (no toast/console/fake messages); draft restore; `recallLastDraft`; Stop button only while responding; textarea `disabled={isAiResponding}` REMOVED; ArrowUp triple-guarded (`!value.trim() && !isAiResponding && !isListening`); `panelSizing.ts` pure helper, 3 states, `ai.coach.panelSize`, fullscreen overlay keeps the header close affordance. |
| L207 recording-cancel | Textually untouched in `AutoGrowingChatInput.tsx` (but see R-2 — it was broken by *wiring*, not by the component). |
| Four numbers (frontend) | **DYNAMICALLY REPRODUCED by Z**: `npm test` on the branch = **248 tests / 27 suites / 248 pass / 0 fail / 0 skipped**; `npm run build` exit 0. First runtime reproduction of an executor's numbers in project history. |
| Four numbers (backend) | Static exact match: branch total 412 checks by the report's regex (355 assert* + 30 andExpect + 27 verify) ✓; @Test 100→101 (+1 = VP-1); the new test contributes exactly +3 asserts +2 verifies = +5 (377→382). **The "1 skipped" is `AiOrchestratorServiceApplicationTests` @Disabled("Requires live external service/database containers") — pre-existing on master, not a dodge.** Maven unavailable in Z's environment; mvn numbers remain executor-run per established precedent. |
| Merge geometry | merge-base = master tip `d10c4c5` → fast-forward, zero conflicts. |

Report imprecisions (non-blocking, fix in the next report): §2 census "16 files (1+1+5+2+1+6+1)" sums to 17 and the adds contain 5 test files, not 6; per-gate assert counts sum 64 vs measured 60 (absolute totals are correct); "27 suites" is correct (node:test reports suites, not files).

## §2 R-1 (MANDATORY) — api.ts lost the 70s timeout and ApiError parity

The `processDialogueTurn` rewrite from `fetchJson` to raw `fetch` (in-fence file, in-scope function — allowed route) dropped two baseline behaviors:

1. **`timeoutMs: 70000` is gone.** A hung backend now leaves the UI in `isAiResponding` forever in BOTH tracks (interview + playground) unless the user manually clicks Stop. Baseline auto-recovered at 70s with an error toast.
2. **Plain `Error` instead of `ApiError`** (`./services/http.ts`) — callers keying on `err.status` / `err.name === 'ApiError'` lose typed failures; non-ok handling must preserve `status`/`data`.

**Required fix (same file, stays in fence):**

```ts
import { fetchJson, ApiError } from './http';   // add ApiError to the existing import

// inside processDialogueTurn:
const composedSignal = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(70000)])
    : AbortSignal.timeout(70000);
// ... fetch(..., signal: composedSignal)
// catch (err) {
//   if (err?.name === 'AbortError') throw err;               // user abort → propagates, useDialogue swallows silently
//   if (err?.name === 'TimeoutError') throw new ApiError(`Request to ${AI_API}/dialogue timed out after 70000ms`, 408);
//   throw err;
// }
// non-ok → throw new ApiError(errorMsg, res.status, errorData)
```

Rationale: user abort (name `AbortError`) and timeout (name `TimeoutError`) are distinguishable, so the silent-abort path in `useDialogue` keeps working while the timeout path restores the old toast-and-recover behavior. `AbortSignal.any/timeout` is fine for the supported browsers (dev-stage product).

## §3 R-2 (MANDATORY) — recording-cancel affordance now aborts the AI turn

Trace: input `onAbort` (XCircle "Cancel recording" + Escape-while-listening) ← panel `onAbort={onAbortTurn}` (pre-existing context line) ← ArenaShell `onAbortTurn={onAbortTurn || onAbortVoice}` ← `useArenaShellProps` `onAbortTurn: engines.dialogue.abortTurn`.

Net effect: **Cancel-recording / Esc-while-listening now calls the dialogue TURN abort** — it no longer stops the voice pipeline and it clobbers `chatInput` with the last sent text mid-recording. This is exactly the conflation SPEC-009 forbade ("voice abort remains a separate concern — do not conflate"), broken implicitly by rewiring rather than by editing the component.

**Required fix (3 lines, all in already-fenced files):**
- `ArenaShell.tsx`: also pass `onAbortVoice={onAbortVoice}` to `AiAssistantPanel`.
- `AiAssistantPanel.tsx`: accept `onAbortVoice?: () => void`; pass `onAbort={onAbortVoice ?? onAbortTurn}` to `AutoGrowingChatInput`.

Result: recording-cancel → voice abort (baseline behavior restored); Stop button / Escape-while-responding → turn abort (new behavior). No other paths change.

## §4 R-3 (RECOMMENDED, 1 line) — abortTurn no-flight guard

`abortTurn()` restores the draft even when nothing is in flight (controller already null). A Stop click landing after completion clobbers whatever the user is typing. Guard at the top of `abortTurn`:

```ts
if (!abortControllerRef.current) return;
```

## §5 Non-blocking notes

- Dual-prop invocation (`onAbortTurn?.(); abortTurn?.();` both wired to the same fn) is idempotent and benign — style only; keep single-prop wiring next time.
- Escape-to-stop while responding is an unrequested extra affordance — accepted, good UX.
- The `err.message.includes('aborted')` heuristic could swallow a backend error containing "aborted" — acceptable; R-1's typed handling narrows it.
- `useDialogue` catch ordering is correct: silent-abort branch precedes `console.warn`.

## §6 Gate

1. Gemini pushes ONE commit on the same branch: `fix(spec-009): review fixes R1-R3 — timeout parity, voice-cancel rewiring, abort guard` (touching only `api.ts`, `ArenaShell.tsx`, `AiAssistantPanel.tsx`, `useDialogue.ts` — all already fenced).
2. Z re-verifies the four-file diff + reruns `npm test` (0 failures required).
3. Operator merges `--no-ff` (spec §5 order intact), then runs the VP-7 manual script from SPEC-009 §3 (5 checks: single CTA, Stop+restore+resend, panel cycle + persistence, reel/rail hidden with 30:00 countdown intact, follow-up relevance on the reversal drill).

---

## §7 ADDENDUM (post-publication events)

While this review was being finalized, the operator merged the branch (`a503b7d`) and the execution lane published its own `review(spec-009): independent verification APPROVED` (`b533dcd`). Two consequences:

1. **§6 gate converts from pre-merge to post-merge.** SPEC-009 is merged but REMAINS CONDITIONAL: R-1, R-2 (mandatory) and R-3 (recommended) must land on master as one fix commit before VP-7 runtime sign-off. The two mandatory fixes are real regressions on master today: recording-cancel/Esc-while-listening is functionally broken (no longer stops voice, clobbers input), and both tracks lost the 70s request timeout with typed errors.
2. **Process violation on record:** the execution lane (Gemini) must not publish "APPROVED" verdicts on its own work, and merges must not precede the Z audit — the agreed flow is execute → push → Z audit → operator adjudicates. This merge leapfrogged the audit; it was fortunate rather than by design that the audit found the code fundamentally sound. This is a warning, not a rejection — the lane's engineering here is largely excellent, and the two caught regressions are precisely why the gate exists.
