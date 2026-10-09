# VOICE-PTT FIXPACK EXECUTION REPORT: Recording Durability & Arena-Wide Hotkey

| Metadata | Value |
|---|---|
| **Specification / Scope** | Voice Lane: Push-to-Talk Recording Durability & Global Affordance |
| **Author / Execution Agent** | Gemini (Pair Programmer & Execution Agent) |
| **Base Commit** | `4591e70` (`master`) |
| **Working Branch** | `fix/voice-ptt-abort-and-hotkey` |
| **Date** | 2026-10-09 |

---

## 1. Executive Summary

This report delivers the verified, test-backed execution of the **Voice Push-to-Talk (PTT) Fixpack**, resolving the remaining unmerged audio issues from the quarantined branch `248006a` alongside arena-wide keyboard shortcut reliability:

1. **RC-1: Re-render Abort Loop in `useCoachVoice.ts`**:
   - `useCoachVoice.ts` previously had `useEffect(() => () => { abortTurn(); }, [abortTurn]);`.
   - Because `abortTurn` depends on `[capture, transcription]` which are recreated on every render, the previous effect's cleanup ran on every state update (e.g. `isRequestingMic: true`, timer ticks).
   - `abortTurn()` immediately executed `capture.abortCapture()`, `setPttState('IDLE')`, and `setIsListening(false)`, instantly killing recording before speech could start.
   - **Resolution**: Implemented `abortTurnRef = useRef(abortTurn)` updated on render, with an unmount-only cleanup `useEffect(() => () => abortTurnRef.current(), [])`. Recording survives all component re-renders and state transitions.

2. **RC-2: Stuck `isRequestingMic` Pointer & Click Guards in `AutoGrowingChatInput.tsx`**:
   - `AutoGrowingChatInput.tsx` previously had `disabled={isRequestingMic}` and `if (isRequestingMic) return;` in pointer/click handlers, which locked the UI when initiating audio capture.
   - **Resolution**: Replaced `disabled={isRequestingMic}` with accessible `aria-busy={isRequestingMic}`. Removed `if (isRequestingMic) return;` from pointer handlers and guarded direct button clicks with `!isRequestingMic`.

3. **RC-3: Global `Ctrl+M` Arena-Wide Accessibility in `ArenaShell.tsx`**:
   - The `Ctrl+M` keyboard shortcut was previously registered exclusively inside `AutoGrowingChatInput.tsx`, which unmounts when Coach Sam's drawer is closed (`if (!open) return null;` in `AiAssistantPanel.tsx`).
   - While `FloatingAiOrb.tsx` displayed the tooltip *"Recording via chat mic (Ctrl+M)"*, `Ctrl+M` was completely dead when the chat drawer was closed.
   - **Resolution**: Lifted the global `Ctrl+M` listener into `ArenaShell.tsx`, ensuring `Ctrl+M` toggles recording throughout the Arena regardless of whether Coach Sam's drawer is expanded or collapsed. Added `if (e.defaultPrevented) return;` guard to prevent duplicate firing.

4. **Advisory QB-29 §3: Playground Defense-in-Depth in `useSessionCatalog.ts`**:
   - Gated the C-1 playlist-restore effect in `useSessionCatalog.ts` with `if (sessionMode !== 'PLAYGROUND') return;` for defense-in-depth in proctored interview mode.

---

## 2. G3 Four-Number Report & Test Verification

Ran against Node test runner and Vite build:

| Metric | Baseline (`master` `4591e70`) | Post-Fix (`fix/voice-ptt-abort-and-hotkey`) | Delta | Verdict |
|---|---|---|---|---|
| **Test Files** | 49 | 49 | 0 | ✔ Identical |
| **Suites (`suites:`)** | 39 | 39 | 0 | ✔ Exact |
| **Test Cases** | 300 | 304 | +4 | ✔ Pass |
| **Static Assertions (`assert.`)** | 1,144 | 1,155 | +11 | ✔ Verified |
| **Failures** | 0 | 0 | 0 | ✔ 0 Failures |
| **Build (`tsc -b && vite build`)** | exit 0 | exit 0 (1.80s) | — | ✔ Exit 0 |

---

## 3. Census of Changed Files

```
frontend/src/components/arena/ArenaShell.tsx
frontend/src/components/arena/hooks/PushToTalk.test.ts
frontend/src/components/arena/hooks/useCoachVoice.ts
frontend/src/components/arena/hooks/useSessionCatalog.ts
frontend/src/components/ui/AutoGrowingChatInput.tsx
```

Total files modified: 5 files. All within the voice, arena navigation, and test scope.
Zero backend drift, zero unverified files.
