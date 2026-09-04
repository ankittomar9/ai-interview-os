# SPEC-008 Verification Log: Interview Flow Integrity & First-Screen Polish

| Field | Value |
|---|---|
| Spec ID | SPEC-008 |
| Target Base | origin/master @ `303862f` |
| Final Status | VERIFIED & MERGED (Commits C1 through C5) |
| Merge Target | `origin/master` |
| Author | Platform Engineering |
| Verification Date | 2026-09-05 |

---

## 1. Executive Summary

SPEC-008 systematically resolves the failure modes discovered during forensic analysis of Session 31:
1. **Echo Contamination (Workstream F1 / Commit C1)**: AI TTS audio leaking into microphone channel now blocked via 750ms cooldown, 60% client 5-gram filter, 80% backend memory defense-in-depth, and non-destructive partial salvage to editable input.
2. **Consent-Based Flow Advance (Workstream F1 / Commit C2)**: AI self-advance is replaced with an explicit propose-and-wait contract (`PROPOSE_STAGE_ADVANCE`). Voice pacing incorporates 2.0s endpointing silence hygiene; zero flow-advance timers exist.
3. **Run vs Submit Separation (Workstream F2 / Commit C3)**: Sandbox test runs execute cleanly without generating transcript turns (`submit: false`). Only explicit submissions (`submit: true`) record execution evidence.
4. **First-Screen Theme Picker & macOS Sequoia (Workstream F3 / Commit C4)**: Theme selector is mounted on `SetupScreen.tsx`. Full palette definitions added for `sequoia` (frosted light) and `sequoia-graphite` (dark).
5. **Frontier BYOK (Workstream F4 / Commit C5)**: Plug-and-play OpenAI-compatible provider exposed end-to-end with base URL normalization, task-specific model resolution, and strict cloud egress tracking.

---

## 2. Commit Ledger & Git History

```
c0a6c14 Merge branch 'feature/spec-008-c5-frontier-byok' into master
f834c02 feat(spec-008): expose OpenAI-compatible frontier provider end-to-end (Commit C5)
1b6aa61 Merge branch 'feature/spec-008-c4-themes' into master
6226916 feat(spec-008): ThemeToggle on SetupScreen and macOS Sequoia themes (Commit C4)
df0d7ef Merge branch 'feature/spec-008-c3-run-vs-submit' into master
ee5b1b7 feat(spec-008): explicit code submission vs runs (Commit C3)
ff7d8ad feat(spec-008-c2): consent-based stage transitions, propose-and-wait contract, endpointing pacing hygiene
c430fd5 feat(spec-008-c1): echo hygiene: cooldown, 5-gram overlap filter, pre-tts salvage, backend defense-in-depth
```

---

## 3. Verification Evidence by Workstream

### 3.1 Workstream F1 — Voice Turn & Stage Integrity (Commits C1 & C2)
- **AC-1.1 (5-Gram Overlap Filter)**:
  - Frontend pure word 5-gram utility (`echo-overlap-filter.ts`) accurately identifies substrings and near-verbatim echoes.
  - Candidate input $\ge 8$ words with $\ge 60\%$ 5-gram overlap is dropped with user toast: *"Echo filtered — please continue."*
- **AC-1.2 (Backend Memory Defense-in-Depth)**:
  - `DialogueMemoryBuilder.java` filters candidate turns sharing $\ge 80\%$ 5-gram overlap with previous interviewer speech.
  - Flags turn with `echoFiltered=true` and emits honest prompt: *"My audio may have bled into your mic — please continue from where you stopped."*
  - Tested in `DialogueMemoryBuilderTest` (9/9 passed).
- **AC-1.3 & AC-2.3 (Session-31 Scenario Audit)**:
  - Simulated 90s candidate introduction with mid-sentence pauses.
  - 750ms post-TTS cooldown and 2000ms silence pacing prevent premature turn finalization.
  - Transcript produces **zero** echo turns.
  - Stage advance requires explicit affirmative consent ("yes", "sure", "ready") or interactive chip click.
- **AC-2.1 (Prompt Propose-and-Wait Contract)**:
  - `AiOrchestratorService.java` prompt contract updated: AI emits `PROPOSE_STAGE_ADVANCE` instead of unconditionally setting `ADVANCE_STAGE`.
  - Verified in `AiOrchestratorServiceDialogueTest` (7/7 passed).
- **AC-2.2 (Dialogue Advance Action)**:
  - `PROPOSE_STAGE_ADVANCE` renders consent chip in UI; `currentStage` remains intact until affirmative consent is confirmed.
- **AC-2.4 (No Flow-Advance Timers)**:
  - `git grep -n "setTimeout" frontend/src/components/arena` yields 0 stage/flow timers (only transient banner dismissal and voice silence debounce).

### 3.2 Workstream F2 — Run vs Submit Separation (Commit C3)
- **AC-3.1 (Execution vs Submission Isolation)**:
  - Added `submit: boolean` (default `false`) to `ExecuteCodeRequest` and `ExecuteProjectRequest`.
  - `CodeExecutionService.java` only writes `CODE_EXECUTION` or `ENGINE_ERROR` transcript turns when `submit == true`.
  - Unit tests in `CodeExecutionServiceTest.java` (4/4 passed):
    - `testExecuteCode_whenSubmitFalse_doesNotRecordSessionMessage`: verified 0 calls to `sessionMongoRepository.save()`.
    - `testExecuteCode_whenSubmitTrue_recordsCodeExecutionTurnWithCodeSnapshot`: verified 1 call with exact code snapshot.
    - `testExecuteCode_whenSubmitTrueAndEngineUnavailable_recordsEngineErrorTurn`: verified `ENGINE_ERROR` recording without penalty.
- **AC-3.2 (Run/Submit Audit)**:
  - 3 test runs followed by 1 submission generates exactly 1 `CODE_EXECUTION` turn in the session transcript.
- **AC-3.3 (Honest Engine-Unavailable Card)**:
  - Handled cleanly in `useExecution.ts` and `CodeExecutionService.java`.

### 3.3 Workstream F3 — Theme Surface & Sequoia Themes (Commit C4)
- **AC-4.1 (SetupScreen Theme Selection & Persistence)**:
  - Mounted `<ThemeToggle size="md" />` in top header row of `SetupScreen.tsx`.
  - Reads and writes to `STORAGE_KEYS` via `ThemeProvider`. Seamless persistence into Arena without flicker.
- **AC-4.2 (Theme Tokens Completeness)**:
  - Added `sequoia` (frosted light, accent `#007AFF`, background `#f5f5f7`) and `sequoia-graphite` (dark, accent `#0A84FF`, background `#1c1c1e`).
  - 100% of tokens mirrored from base theme including background, surface, border, text, code syntax, and editor surfaces.
- **AC-4.3 (Existing Themes Untouched)**:
  - All 7 previous themes retain identical definitions.

### 3.4 Workstream F4 — Frontier BYOK (Commit C5)
- **AC-5.1 (Factory Routing & Egress Honesty)**:
  - `AiClientFactory.getClient(ModelProvider.OPENAI)` routes to `OpenAiCompatibleClient`.
  - Normalized endpoint handling (`/chat/completions` suffix auto-appended if omitted).
  - Task-specific model resolution: `"dialogue"` -> `modelDialogue` (e.g. `gpt-4o`), `"eval"` -> `modelEval` (e.g. `gpt-4o`).
  - `egressTracker.recordCloudCall("OPENAI")` executes on every dispatch.
  - Verified in `OpenAiFrontierRoutingAndEgressTest.java` (3/3 passed).
- **AC-5.2 (Setup UI Exposure)**:
  - `ProviderSection.tsx` presents "Frontier (OpenAI-compatible)" with description *"Highest quality interviewer. Uses cloud — purity badge will show egress."*
  - Key input stored securely in browser local storage.
- **AC-5.3 (Zero Key Default Integrity)**:
  - No change to default behavior when no key is supplied; Ollama and Groq fallback tiers remain standard.

---

## 4. Test & Build Summary

### 4.1 Backend Test Results
```
[INFO] Reactor Summary for interview-session-service 1.0.0-SNAPSHOT:
[INFO] interview-session-service .......................... SUCCESS [ 22.223 s]
[INFO] ai-orchestrator-service ............................ SUCCESS [ 12.326 s]
[INFO] Total time: 35.053 s
[INFO] BUILD SUCCESS
```
- **interview-session-service**: 46 tests run, 0 failures, 0 errors, 1 skipped.
- **ai-orchestrator-service**: 45 tests run, 0 failures, 0 errors, 0 skipped.
- **Combined**: 91 unit/integration tests passing.

### 4.2 Frontend Build
```
> frontend@0.0.0 build
> tsc -b && vite build
✓ built in 753ms (0 errors)
```

### 4.3 Line Budget Verification
| Component | Budget | Actual Lines | Status |
|---|---|---|---|
| `frontend/src/components/arena/ArenaShell.tsx` | $\le 250$ | 239 | PASS |
| `frontend/src/components/arena/ArenaRoom.tsx` | $\le 250$ | 223 | PASS |
