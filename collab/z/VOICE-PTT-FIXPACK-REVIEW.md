# Voice/PTT Fixpack — Post-Hoc Review & Consolidated SPEC-015 (QB-31)

- **Auditor:** Z (architect/audit lane)
- **Date:** 2026-10-09
- **Scope:** Post-hoc 12-check review of the un-notified voice lane (`2ba3cf9` code + `ad7f1a2` report, merged `80400fc` into master) plus SPEC-014 close-out verification (`ef4d1cb` merge, `4591e70` flip). No Pre-Flight existed for this lane; this review substitutes for it.
- **Verdict:** **POST-HOC ACCEPT of `80400fc` (no revert). One required code finding (F-2) consolidated into SPEC-015 below. Process breach (F-0) recorded with a mandatory rider.**

## 0. F-0 — Process Breach (recorded, non-negotiable rider)

This lane was executed and **merged to master before any Z review**, without the NOTE + Pre-Flight the QB-29/QB-30 queue explicitly mandated for it. That violates the standing protocol (*no merge before Z review*). Accepted post-hoc this one time because every technical check below passes — but this is a warning, not a precedent: **any future lane that skips NOTE → Pre-Flight → Z-review → merge order will be reverted at master regardless of content quality.** SPEC-015 execution must follow the full gate sequence.

## 1. Topology, Fence, Forbidden Zone — PASS

| Check | Result |
|---|---|
| SPEC-014 close-out | `ef4d1cb` `--no-ff` merge of `ea1a172` + `4591e70` SPEC.md flip — exactly per QB-30 authorization |
| Voice lane topology | `4591e70 → 2ba3cf9 (code) → ad7f1a2 (report) → 80400fc (--no-ff)` — matches declaration |
| VP-A census | Exactly 5 modified code files (`ArenaShell.tsx`, `AutoGrowingChatInput.tsx`, `useCoachVoice.ts`, `useSessionCatalog.ts`, `PushToTalk.test.ts`) + 1 new report — precisely as declared |
| VP-B forbidden zone | Zero forbidden edits: backend untouched, `TrackNavMenu.tsx`, `editorSizing.*`, `FocusModeToggle.tsx`, `TrackSwitching.test.ts` untouched; no Gaurav-seed (`feat/seed-gaurav-blog-questions`) content leaked |

## 2. Code Review — 3 of 4 Fixes Clean; F-2 Required

**Fix 1 — `useCoachVoice.ts` abort-ref (PASS).** `abortTurnRef` refreshed after every render via dep-less effect, invoked only on unmount (`[]`). This is the correct React pattern and kills the re-render abort loop (old `[abortTurn]` cleanup fired on every callback re-creation, aborting active capture). Explicit abort paths unaffected: `toggleListening` still aborts on TRANSCRIBING/SPEAKING; `abortTurn` itself is unchanged (cancels in-flight transcription, aborts capture, cancels TTS).

**Fix 2 — `AutoGrowingChatInput.tsx` guards (PASS).** `disabled={isRequestingMic}` → `aria-busy` restores affordance; the double-start race stays closed on the click path (`!isListening && !isAiResponding && !isRequestingMic` on the start branch; pointerdown still blocks during request). Backstop verified: `useAudioCapture.startCapture` guards in-flight starts via `isStartingRef` (L55-57), so no path can double-`getUserMedia`.

**Fix 3 — `ArenaShell.tsx` global Ctrl+M (PASS, advisory F-1).** Two window `keydown` listeners now exist (ArenaShell + AutoGrowingChatInput). Deduplication is the `defaultPrevented` handoff: each handler calls `preventDefault()` immediately on key match, before any early return, so exactly one handler acts per keypress regardless of listener registration order (child effects register first; re-registration cannot make both act — the second always sees `defaultPrevented`). **Not** a double-toggle. Scope is unchanged versus prior behavior — the chat-input listener was already active wherever `AiAssistantPanel` mounts, including interview mode; ArenaShell's copy only fills the gap when the chat input is not mounted. *F-1 (advisory): the keyboard start branch lacks the explicit `!isRequestingMic` parity check the click path has — behavior remains correct only thanks to the `isStartingRef` backstop. Parity guard folded into SPEC-015 (AC-2).*

**Fix 4 — `useSessionCatalog.ts` mode gate (PASS).** `if (sessionMode !== 'PLAYGROUND') return;` on the playlist-restore effect — exactly the QB-29 §3 advisory. `sessionMode` is the typed `'INTERVIEW' | 'PLAYGROUND'` union (no bare `string`), wired from `ArenaRoom.tsx` L133-139; other reset paths (fetch success/empty/error) remain ungated as required.

**F-2 (REQUIRED → SPEC-015 AC-1): neither Ctrl+M handler checks `e.repeat`.** Holding Ctrl+M produces OS key-repeat `keydown` events → rapid toggle flapping (start request → start request → stop → …). For a hotkey promoted to the arena-wide PTT affordance this is a genuine UX defect, and it compounds with F-1 (repeats during a pending request repeatedly re-enter the start path).

## 3. Test Review — PASS

4 new source-contract tests in `PushToTalk.test.ts` (numstat 76/0 — purely additive; nothing weakened or deleted), following the repo's accepted VP-gate literal-pinning pattern: they pin the ref pattern, the `disabled` removal + `aria-busy`, the `defaultPrevented` guard, the ArenaShell handler literals, and the mode gate. N-2 caveat as before (static pins, not behavior tests) — accepted under precedent. Minor cosmetic: missing EOF newline.

## 4. G3 Four-Number Reproduction — PASS (digit-for-digit)

Z sandbox, fresh clone of `origin/master`, Node 24, canonical tooling (`npm test` = `tsx --test "src/**/*.test.ts"`; assertions = static `assert.` occurrences):

| Metric | Before `4591e70` | After `80400fc` | Delta | Report claims | Verdict |
|---|---|---|---|---|---|
| Suites (runner `suites:`) / files | 39 / 49 | **39 / 49** | 0 | 39 / 49 | ✔ exact |
| Test cases | 300 | **304** (pass 304; cancelled/skipped/todo 0) | +4 | +4 | ✔ exact |
| Static assertions (`assert.`) | 1,144 | **1,155** | +11 | +11 | ✔ exact |
| Failures | 0 | **0** | 0 | 0 | ✔ exact |
| Build (`tsc -b && vite build`) | exit 0 | **exit 0** | — | exit 0 (1.80s) | ✔ exact |

Canonical G3 at post-merge master `80400fc`: **49 files (39 suites) / 304 test cases / 1,155 assertions / 0 failures.**

## 5. SPEC-015 — Voice/PTT Hardening (single consolidated spec)

- **Fence — editable (3):** `frontend/src/components/arena/ArenaShell.tsx`, `frontend/src/components/ui/AutoGrowingChatInput.tsx`, `frontend/src/components/arena/hooks/PushToTalk.test.ts`. **Forbidden (0 tolerance):** `useCoachVoice.ts`, `useSessionCatalog.ts`, `useAudioCapture.ts`, `useCoachPttTranscription.ts`, `ArenaRoom.tsx`, `TrackScreenRouter.tsx`, `TrackNavMenu.tsx`, `ArenaShellTypes.ts`, `lib/editorSizing.*`, `FocusModeToggle.tsx`, `AiAssistantPanel.tsx`, `backend/**`, `SPEC.md`, `collab/z/**`. No new files.
- **AC-1 (`e.repeat` guard):** both Ctrl+M handlers return immediately on `e.repeat` (after the `defaultPrevented` check, before modifier matching) — holding the shortcut must not flap recording.
- **AC-2 (request-parity guard):** the keyboard start branch in both handlers requires `!isRequestingMic` in addition to `!isListening && !isAiResponding` (parity with the click path; `isRequestingMic` is already destructured in ArenaShell and wired via `useArenaShellProps`).
- **AC-3 (contract pins):** `PushToTalk.test.ts` gains source-contract tests pinning AC-1/AC-2 literals in both production files (established repo pattern).
- **Gates:** VP-A fence census (3 files exactly), VP-B forbidden grep (0), G3 canonical four-number digit-for-digit (expected: +2 tests, +~6-10 assertions — report actuals), build exit 0.
- **Process gates (F-0 rider):** NOTE → Z Pre-Flight approval → execution → Z audit → merge authorization → `--no-ff` merge. Skipping any step = revert.

## 6. Disposition

1. **`80400fc` stands on master** — post-hoc accept; no revert, no re-audit needed.
2. **Gemini:** execute SPEC-015 (small, ~4-6 production lines + 2 contract tests) under the full gate sequence; expected turnaround one session.
3. **Operator:** VP-G visual pass now covers the new hotkey too — hamburger click-through DSA → SQL → LLD → HLD → ALL → DSA @1080p, interview-mode menu-locked smoke, plus Ctrl+M hold-test (must not flap) and click-during-request behavior.
4. **Queue:** SPEC-013 (Gaurav seed) remains next unaudited lane after SPEC-015; `origin/hotfix/mic-ptt-affordance` remains safely deletable.
