# SPEC-015 NOTE & Pre-Flight Request: Voice/PTT Hardening

| Metadata | Value |
|---|---|
| **Spec** | SPEC-015 (Voice/PTT Hardening: `e.repeat` guard, `!isRequestingMic` keyboard parity, contract pins) |
| **Author / Execution Lane** | Gemini (Pair Programmer & Execution Lane) |
| **Architect & Auditor** | Z (Architect / Audit Lane) |
| **Base Commit** | `38c9e34` (`origin/master`) |
| **Working Branch** | `feat/spec-015-voice-ptt-hardening` |
| **Date** | 2026-10-14 |
| **Trigger** | Standing by for Z Pre-Flight Review (QB-33) |

---

## 1. Context & Purpose

Following Z's QB-31 post-hoc review ([`collab/z/VOICE-PTT-FIXPACK-REVIEW.md`](../z/VOICE-PTT-FIXPACK-REVIEW.md)) and QB-32 readiness matrix ([`collab/z/READINESS-MATRIX.md`](../z/READINESS-MATRIX.md)), this lane delivers the consolidated hardening requirements identified under findings F-1 and F-2:
1. **AC-1 (`e.repeat` guard)**: Both `Ctrl+M` / `Cmd+M` keydown handlers (`ArenaShell.tsx` and `AutoGrowingChatInput.tsx`) return immediately on `e.repeat` (after the `defaultPrevented` check, before modifier matching) to prevent rapid toggle flapping when the hotkey is held down.
2. **AC-2 (`!isRequestingMic` keyboard parity)**: Both keyboard handlers require `!isRequestingMic` on the start branch in addition to `!isListening && !isAiResponding` to match the click-path parity.
3. **AC-3 (Contract Pins)**: Add source-contract tests in `PushToTalk.test.ts` pinning the literals for AC-1 and AC-2 in both production files.

---

## 2. Hard Fence Acknowledgment

- **EDITABLE (3 files exactly):**
  1. `frontend/src/components/arena/ArenaShell.tsx`
  2. `frontend/src/components/ui/AutoGrowingChatInput.tsx`
  3. `frontend/src/components/arena/hooks/PushToTalk.test.ts`

- **FORBIDDEN (Tolerance = 0):**
  `useCoachVoice.ts`, `useSessionCatalog.ts`, `useAudioCapture.ts`, `useCoachPttTranscription.ts`, `ArenaRoom.tsx`, `TrackScreenRouter.tsx`, `TrackNavMenu.tsx`, `ArenaShellTypes.ts`, `lib/editorSizing.*`, `FocusModeToggle.tsx`, `AiAssistantPanel.tsx`, `backend/**`, `SPEC.md`, `collab/z/**`. No new files.

---

## 3. Pre-Flight Baseline Reproduction (at `38c9e34`)

Verified locally in Node 24 sandbox before any code edits:

| Metric | Canonical Baseline at `38c9e34` |
|---|---|
| **Test Files** | 49 files |
| **Suites (`suites:`)** | 39 runner suites (describe blocks) |
| **Test Cases** | 304 pass / 0 fail / 0 skip / 0 cancel / 0 todo |
| **Static Assertions (`assert.`)** | 1,155 static occurrences |
| **Build (`tsc -b && vite build`)** | Exit code 0 (1.62s) |

---

## 4. Execution Plan (Post-Approval)

Upon receiving Z's QB-33 Pre-Flight approval:
1. **Slice 1 (Code & Tests)**:
   - Edit `ArenaShell.tsx` (L82-98): Add `if (e.repeat) return;` and guard start branch with `!isRequestingMic` (add `isRequestingMic` to deps).
   - Edit `AutoGrowingChatInput.tsx` (L85-101): Add `if (e.repeat) return;` and guard start branch with `!isRequestingMic` (add `isRequestingMic` to deps).
   - Edit `PushToTalk.test.ts`: Add 2 unit/contract tests verifying the `e.repeat` and `!isRequestingMic` pins for both files.
   - Run `npm test` and `npm run build` to verify pass and zero regressions.
2. **Slice 2 (Report & Audit Request)**:
   - Author `collab/gemini/SPEC-015-REPORT.md` with G3 four-number verification, push branch `feat/spec-015-voice-ptt-hardening`, and await Z audit before merge.

**Status:** Code is untouched. Standing by for Z's QB-33 Pre-Flight authorization.
