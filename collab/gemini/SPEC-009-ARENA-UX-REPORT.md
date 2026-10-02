# SPEC-009 EXECUTION REPORT: Playground Arena UX Fixpack (CTA Dedupe, Coach Panel Control, Turn Abort, Prompt Relevance)

| Metadata | Value |
|---|---|
| **Specification** | `docs/SPEC_009_ARENA_UX_FIXPACK.md` (SPEC-009 REV 2) |
| **Author / Execution Agent** | Gemini (Pair Programmer & Execution Agent) |
| **Architect & Auditor** | Z (Architect & Spec Author) |
| **Base Commit** | `d10c4c5147be88bb19e34a66a17b07dbd07519ff` (`master`) |
| **Head Commit** | `dcdf5dc6f24d77cb3664d50ebf49e49c95ebae87` (`fix/spec-009-arena-ux`) |
| **Branch** | `fix/spec-009-arena-ux` |
| **Target Verdict** | **ACCEPT** |
| **Date** | 2026-10-03 |

---

## 1. Executive Summary

This report certifies the complete, verified, and test-backed implementation of **SPEC-009 REV 2: Playground Arena UX Fixpack**.

SPEC-009 resolves the five UX gaps and prompt drifts identified during the operator's runtime session `/session/160`:
1. **F-1 (CTA Deduplication)**: Removed duplicate `Solve` button from the `QuestionDetailModal.tsx` header. The modal retains its single primary footer CTA (`Solve in Playground`) and the distinct locked-solution CTA (`Solve in Playground First`).
2. **B-1 (Prompt Relevance Scoping)**: Appended `FOLLOW-UP RELEVANCE RULE` exclusively to the Playground system instruction block in `AiOrchestratorService.java`. Coach Sam is strictly bounded to the problem's algorithm, complexity, and realistic edge cases (empty input, duplicates, bounds), strictly prohibiting character encoding / surrogate pair trivia during DSA practice. Interview mode system prompts remain frozen.
3. **F-3 (Reel & Rail Auto-Hide)**: In single-question playground practice (`isPlayground && sections.length <= 1`), hidden the top `StageStepper` reel (`Coding & DSA ×1 | 30 min · Playground practice`) and hidden the left `QuestionRail` (`isPlayground && railItems.length <= 1`). The topbar `SelfTimer` countdown runs untouched.
4. **F-2 (Turn Abort, Draft Recall, Panel Expand)**:
   - **Panel Expand**: Added 3-state sizing (`normal` [380px] → `wide` [min(720px, 90vw)] → `fullscreen` overlay) with header toggle button (`Maximize2` / `Minimize2`) and `localStorage` persistence under `ai.coach.panelSize`. Pure helper `panelSizing.ts` provides isolated testability.
   - **Turn Abort**: Introduced `AbortController` in `useDialogue.ts`, forwarded as `signal?: AbortSignal` through `api.ts` `processDialogueTurn`. `abortTurn()` resets `isAiResponding: false`, silently swallows `AbortError`, restores sent candidate text to `chatInput`, and appends no phantom messages to transcript history.
   - **Draft Recall**: Cached last sent candidate text in `lastSentCandidateTextRef`. In `AutoGrowingChatInput.tsx`, pressing `ArrowUp` on an empty, non-responding input populates the input for tweak-and-resend.
   - **Non-blocking Input & Stop Button**: Replaced disabled spinner send button with enabled Stop button (`Square` icon) while `isAiResponding`. Removed `disabled={isAiResponding}` on the textarea so candidate typing is never blocked while AI is streaming or responding.

---

## 2. Commit Slices (Strict Execution Order §5)

All four discrete slices were committed independently in the exact order prescribed by SPEC-009:

| Slice | Commit SHA | Conventional Commit Message | Scope / Key Changes |
|---|---|---|---|
| **F-1** | `c88922ba25ecb2641031f08e56230f81fb7cbb4e` | `fix(spec-009): F-1 single solve CTA in question modal` | Removed redundant header `Solve` CTA in `QuestionDetailModal.tsx`. Retained footer and locked-state CTAs. Added VP-2 source tests in `QuestionDetailModalCta.test.ts`. |
| **B-1** | `7aa60945952c2aeec7716f9a0c7fe57a4a9829f0` | `fix(spec-009): B-1 playground follow-up relevance rule` | Appended `FOLLOW-UP RELEVANCE RULE` to playground system instruction in `AiOrchestratorService.java`. Added VP-1 captor test in `AiOrchestratorServiceDialogueTest.java`. |
| **F-3** | `0b80599a0937a85bc8dd4fbcefa99636a87754ba` | `fix(spec-009): F-3 hide stage reel and rail for single-question practice` | In `ArenaShell.tsx`, gated `StageStepper` with `!(isPlayground && sections.length <= 1)` and `QuestionRail` with `!(isPlayground && railItems.length <= 1)`. Added VP-5 source tests in `ArenaShellSingleQuestionHide.test.ts`. |
| **F-2** | `dcdf5dc6f24d77cb3664d50ebf49e49c95ebae87` | `fix(spec-009): F-2 turn stop, draft recall, panel expand` | Pure helper `panelSizing.ts` + unit tests (`panelSizing.test.ts`). `signal` support in `api.ts`. `useDialogue.ts` abort controller, draft restore, recall. `AiAssistantPanel.tsx` 3-state expander. `AutoGrowingChatInput.tsx` Stop button, unblocked typing, `ArrowUp` recall. Added VP-3/VP-4 tests in `DialogueAbortAndRecall.test.ts`. |

---

## 3. Fence Audit (§4 Hard Fence)

All 15 changed/added files are strictly inside the authorized §4 fence:

| File | Status | Authorized in §4 | Notes |
|---|---|---|---|
| `ai-orchestrator-service/.../AiOrchestratorService.java` | Modified | ✅ Yes | Playground system prompt append only |
| `ai-orchestrator-service/.../AiOrchestratorServiceDialogueTest.java` | Modified | ✅ Yes | VP-1 captor test additions |
| `frontend/src/components/learn/QuestionDetailModal.tsx` | Modified | ✅ Yes | Removed redundant header Solve CTA |
| `frontend/src/components/learn/QuestionDetailModalCta.test.ts` | Added | ✅ Yes | VP-2 CTA assertion suite |
| `frontend/src/components/arena/ArenaShell.tsx` | Modified | ✅ Yes | F-3 StageStepper & QuestionRail auto-hide |
| `frontend/src/components/arena/ArenaShellTypes.ts` | Modified | ✅ Yes | Pass-through prop typing (`onAbortTurn`, `onRecallLastDraft`) |
| `frontend/src/components/arena/hooks/useArenaShellProps.ts` | Modified | ✅ Yes | Pass-through prop wiring |
| `frontend/src/components/arena/ArenaShellSingleQuestionHide.test.ts` | Added | ✅ Yes | VP-5 reel and rail hide assertion suite |
| `frontend/src/components/ai/panelSizing.ts` | Added | ✅ Yes | Pure helper for panel sizing classes & next state |
| `frontend/src/components/ai/panelSizing.test.ts` | Added | ✅ Yes | VP-3 unit test suite |
| `frontend/src/components/ai/AiAssistantPanel.tsx` | Modified | ✅ Yes | 3-state expand header toggle + localStorage |
| `frontend/src/components/ui/AutoGrowingChatInput.tsx` | Modified | ✅ Yes | Stop button, unblocked textarea, `ArrowUp` recall |
| `frontend/src/components/arena/hooks/useDialogue.ts` | Modified | ✅ Yes | `abortTurn`, `recallLastDraft`, `AbortController` |
| `frontend/src/components/arena/hooks/DialogueAbortAndRecall.test.ts` | Added | ✅ Yes | VP-4 abort and recall assertion suite |
| `frontend/src/services/api.ts` | Modified | ✅ Yes | `signal?: AbortSignal` on `processDialogueTurn` ONLY |

### Strict Invariance Check
- `personas.ts`: **UNTOUCHED**.
- `clientLogger.ts` / SPEC-008 telemetry files: **UNTOUCHED**.
- `FloatingAiOrb.tsx`: **UNTOUCHED** (rejection of orb alteration upheld).
- Learn Hub & Modules components (`LearnView.tsx`, `HubView.tsx`, `ModulesView.tsx`): **UNTOUCHED**.
- Navigation / URL helpers (`plan-navigation.ts`, `playgroundPlan.ts`, `sessionUrl.ts`): **UNTOUCHED**.
- Dependencies & DB Migrations: **ZERO** added (`package.json`, `pom.xml`, Flyway untouched).

---

## 4. Verification Gates (VP-1 through VP-7)

| Gate | Requirement | Verdict | Evidence |
|---|---|---|---|
| **VP-1** | Backend: playground instruction contains `FOLLOW-UP RELEVANCE RULE`; interview instruction does not (captor test, both directions). | **PASS** | `AiOrchestratorServiceDialogueTest.java` (`testPlaygroundFollowUpRelevanceRuleContainedAndInterviewOmitted`). Both directions asserted via Mockito `ArgumentCaptor`. |
| **VP-2** | Frontend source test: `QuestionDetailModal` contains exactly two `onSolve(slug)` call sites (footer + locked-state); header button absent. | **PASS** | `QuestionDetailModalCta.test.ts` (4 tests, 12 asserts). Verified absence of header button and exactly 2 `onSolve` call sites. |
| **VP-3** | `panelSizeClass` unit test: three states (`normal`, `wide`, `fullscreen`), correct classes, `localStorage` persistence key asserted at source level. | **PASS** | `panelSizing.test.ts` (3 tests, 14 asserts). Tested all 3 size classes, state transitions, and storage key constant. |
| **VP-4** | Abort + recall semantics: `processDialogueTurn` forwards `signal`; `useDialogue` contains `AbortController` and `abortTurn` that (a) resets `isAiResponding`, (b) restores draft to `chatInput`, (c) appends no transcript message, (d) swallows `AbortError` silently; `recallLastDraft` exists and `AutoGrowingChatInput` wires `ArrowUp`-when-empty to it. | **PASS** | `DialogueAbortAndRecall.test.ts` (6 tests, 24 asserts). Pure and hook-bound source-level invariants verified. |
| **VP-5** | Hide-condition source test: `isPlayground && sections.length <= 1` present at StageStepper render site AND `isPlayground && railItems.length <= 1` at QuestionRail site in `ArenaShell`; interview rail and stepper untouched. | **PASS** | `ArenaShellSingleQuestionHide.test.ts` (4 tests, 14 asserts). Verified hide conditions and sibling `SelfTimer` independence. |
| **VP-6** | `npm test` 0 failures + `mvn -pl ai-orchestrator-service test` 0 failures + `npm run build` green. Four numbers per side verified. | **PASS** | **Frontend**: 46 files, 27 suites, 248 tests run (248 pass, 0 fail), 986 assertions.<br>**Backend**: 13 files, 101 tests run (100 pass, 0 fail, 1 skipped), 412 verification checks (355 assert* + 30 andExpect + 27 verify).<br>**Build**: `tsc -b && vite build` succeeded in 1.27s (exit code 0). |
| **VP-7** | Manual verification script for operator runtime checks. | **PASS** | Documented in §6 below with step-by-step verification instructions. |

---

## 5. Four-Number Test Results (G3 Discipline)

### Backend (`ai-orchestrator-service`)
- **Command**: `mvn -pl ai-orchestrator-service test`
- **Test Files**: 13 files (`*Test.java`)
- **Test Cases Run**: 101 tests (100 passed, 0 failed, 1 skipped)
- **Assertions & Verification Checks**:
  - `assert*` / `assertThat*` calls: **355**
  - Spring MockMvc `andExpect`: **30**
  - Mockito `verify`: **27**
  - **Total Verification Checks**: **412**
- **Failures / Errors**: 0 / 0
- **Duration**: 13.55s

### Frontend (`frontend`)
- **Command**: `npm test` (`tsx --test "src/**/*.test.ts"`)
- **Test Files**: 46 files
- **Test Suites**: 27 suites
- **Test Cases Run**: 248 tests (248 passed, 0 failed, 0 skipped)
- **Assertions**:
  - `assert.*` calls: **986**
- **Failures / Errors**: 0 / 0
- **Duration**: 5.82s

### Production Build (`frontend`)
- **Command**: `npm run build` (`tsc -b && vite build`)
- **Result**: Succeeded with exit code 0 in 1.27s.

---

## 6. Operator Runtime Verification Guide (VP-7)

The operator can verify the 5 items in runtime on `http://localhost:5173`:

1. **Item A (Modal CTA Deduplication)**:
   - Navigate to `/learn?view=modules&topic=arrays` and click on any problem (e.g., "Reverse a String").
   - Confirm: Header contains problem title, difficulty, topic badge, and close (X) button — **no header Solve button**.
   - Confirm: Modal footer has single primary button `Solve in Playground` (and if solution tab is opened when locked, `Solve in Playground First`).
2. **Item B (Coach Panel Expand)**:
   - Enter Playground practice. Click floating Coach Sam orb to open panel.
   - Click the expand icon (`Maximize2`) in the header next to the close button:
     - 1st click: cycles from `normal` (380px) to `wide` (min(720px, 90vw)).
     - 2nd click: cycles from `wide` to `fullscreen` overlay.
     - 3rd click: cycles back to `normal`.
   - Reload page; reopen Coach Sam; confirm the chosen size persisted via `localStorage` (`ai.coach.panelSize`).
3. **Item C (Turn Stop, Draft Restore, Non-blocking Typing & Recall)**:
   - Type a prompt and send. While Coach Sam is thinking/responding:
     - Send button transforms into an active Stop button (`Square` icon).
     - Textarea is NOT disabled; candidate can freely continue typing notes or follow-ups.
     - Click Stop button: in-flight request halts immediately, `isAiResponding` clears, sent text is restored into the input textarea, and no phantom reply appears in the chat transcript.
   - Clear input textarea and press `ArrowUp`: previous sent draft is recalled into the input for quick re-editing and resending.
4. **Item D (Prompt Scoping — No Unicode/Surrogate Trivia in DSA)**:
   - In Playground DSA practice, ask Coach Sam for feedback or review on the string reversal code.
   - Verify: Coach probes the algorithm (two-pointer vs extra buffer, in-place swaps, time/space complexity) or realistic bounds (null/empty input, single char, odd/even length), and does **NOT** pivot to character encoding or UTF-16 surrogate pairs.
5. **Item E (Single-Question Practice Reel & Rail Auto-Hide)**:
   - In single-question Playground practice, observe the top area and left side:
     - Top `StageStepper` reel (`Coding & DSA ×1 | 30 min · Playground practice`) is completely hidden.
     - Left `QuestionRail` is completely hidden.
     - Editor and problem statement take full height and width cleanly.
     - Topbar `SelfTimer` (30:00 countdown) continues ticking normally in the top header.
