# V-2.0.6-SPEC — Session #146 Adjudicated Fix-Pack (r1, re-issued)

> **Re-issue note (r1):** The original SPEC file was lost in a workspace environment rebuild before it
> reached the operator's download channel. This r1 is reconstructed from the adjudication record, with
> **every anchor re-verified against origin/master `b934e78` on 2026-09-28** via a fresh worktree.
> One prior adjudication claim is **corrected** in §1 (V5-07a). Item IDs (V6-01…V6-12) are preserved
> from the original issue so execution reports stay cross-referenceable. V6-10's scope is
> reconstructed from the §1 ledger (its original wording was not recoverable).

---

## §0 — Discipline Rules (inherited from V2-Platform SPEC, binding)

1. **Image-only deploy.** No `docker cp`, no bind-mount patches, no host-side file edits into running
   containers. A change that is not in the image does not exist.
2. **Flyway receipts are unfakeable.** Migrations ship as versioned files; `flyway_schema_history`
   output must be quoted in the report. Hand-edited DB state is a FAIL.
3. **Four-number test report, exact vocabulary:** `files / test-cases / assertions / failures`.
   `test-cases` = number of test functions (`test()` / `@Test`), `assertions` = real assert calls,
   `files` = test source files touched/run. Any other vocabulary is rejected at review.
4. **Honest-judge gates.** Every item ships a gate that must be *capable of failing*. Evidence is
   quoted from real runs (command + output), never paraphrased. A gate that cannot fail is not a gate.
5. **Branch development, `--no-ff` merges.** Work on `fix/v206-session146-fixes` (or per-item
   branches). Merge to master with `--no-ff` and the item IDs in the merge message.
6. **Fence scope.** Each item lists its allowed file fence. Touching files outside all fences
   requires a written justification in the report.
7. **Worklog in English only**; every report section quotes `file:line` evidence.

---

## §1 — Master State & V-2.0.5 Verification Ledger

**Baseline:** `origin/master` = `b934e78` — *Merge branch 'fix/v205-session144-fixes' into master
(V-2.0.5 Session #144 Adjudicated Fix-Pack)*. All anchors below re-verified on this commit.

| Claim from V-2.0.5 | Verdict on b934e78 |
|---|---|
| V5-07a TTS sanitization shipped | **CORRECTED (r1): it DID land.** `sanitizeTtsText` exists at `frontend/src/lib/audio-tts.ts:9`; `audio-tts.ts:40` and `behavioral/BehavioralStudio.tsx:96` build utterances from `cleanText`. The earlier "absent on master" finding was a false negative caused by checking the stale pre-V-2.0.5 checkout (`013e501`, 159 commits behind). **Residual gap remains:** `arena/VoiceCoachIndicator.tsx:57` still builds a raw utterance → folded into V6-06. |
| V5-05 gate = click-intercept only | Confirmed insufficient as *visibility* fix: interception happens but the operator-visible state does not change; keep under watch, no new V6 item. |
| Timer is non-monotonic | Confirmed: `SelfTimer.tsx:33-54` uses `setInterval`-decrement counting (drifts under throttling; interval is also torn down/re-created on every tick via the `secondsLeft` dep) → V6-09. |
| REC display can reset | Confirmed display path exists: `ArenaShell.tsx:167-168` renders `REC`/`REC ⚠ N unsent`/`REC INTERRUPTED` from `recordingSeconds` / `failedChunkCount`; monotonicity across chunk rotation/retry is unproven → V6-10. |

---

## §2 — Fix Pack V6-01…V6-12

### V6-01 (P0) — Editor code loss aborts session (NF1)
**Evidence (all on b934e78):**
- `frontend/src/components/arena/ArenaRoom.tsx:195-198` — effect `setCodeMap({ [activeSlug]: fallbackStarter })` keyed on `[sessionId, activeSlug, fallbackStarter]` **wipes the entire codeMap** on every slug change: code typed into the previous question's slug slot is destroyed.
- `frontend/src/components/arena/ArenaRoom.tsx:372-379` — `onSelectQuestion` calls `setCode(qFallback)` through a stale closure: the Q2 starter can be written into Q1's slug slot (cross-slot contamination).
- `frontend/src/components/arena/hooks/useExecution.ts:22` — single `executionResult` state, not keyed by slug → stale compile errors from Q2 render under Q1.

**Required:**
1. Preserve per-slug code: the wipe effect must never drop existing entries for other slugs (merge, not replace).
2. Starter seeding only when the target slug has no user content.
3. `onSelectQuestion` must write through the slug-keyed map (no stale `setCode`).
4. `executionResult` keyed by slug (or cleared on slug change) so no cross-question stale errors.

**Gate V6-01 (must be able to FAIL):** a test types code into Q1, switches to Q2 and back to Q1 —
Q1's text must survive byte-identical; and Q1 must never display Q2's starter or Q2's execution error.
Fail if any assert can be removed without the test failing.

**Fence:** `frontend/src/components/arena/ArenaRoom.tsx`, `frontend/src/components/arena/hooks/useExecution.ts`, `frontend/src/components/arena/hooks/useSessionCatalog.ts`, plus one new test file.

### V6-02 — Wrong question displayed as active (NF2)
**Evidence:** `frontend/src/components/arena/hooks/useSessionCatalog.ts:108` —
`return questionsList[activeQuestionIndex] || questionsList[0];` silently falls back to `questionsList[0]`, which can belong to a **different section** — the UI then shows Q1 while the session is on Q2 (Session #146 observation "Q2 shows Q1").

**Required:** an out-of-range / cross-section index must render an explicit empty/placeholder state
and surface a console error; it must never silently substitute another question.

**Gate V6-02:** index beyond list length renders placeholder, not `questionsList[0]`. Must be able to FAIL.

**Fence:** `frontend/src/components/arena/hooks/useSessionCatalog.ts`, plus one new test file.

### V6-03 — AI "final question" hallucination (G1)
**Evidence:** `ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java:395` — the prompt sends only `- Section Position: %d of %d`; there is **no question-level position**. The model has no grounds for "this is the final question" yet asserted it in Session #146.

**Required:** add question position within the section (`Question %d of %d`) to the system
instruction, plus an explicit rule: only describe a question as final/last when `position == total`.

**Gate V6-03:** the built prompt contains the question-position line for multi-question sections, and
an assert proves the line is **absent of the word "final"** unless mathematically last. Must be able to FAIL.

**Fence:** `ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java`, plus one new/updated test file.

### V6-04 — Citation sanitizer destroys verified text (G3)
**Evidence:** `evaluation-report-service/src/main/java/com/interviewos/evaluation/service/RubricService.java:253` —
`rat = quotePattern.matcher(rat).replaceAll("no observable evidence in transcript")` runs over the
**whole rationale** once `fabricatedInRationale` is true; a false-positive fabrication flag therefore
nukes already-verified quotes. Companion matcher `normalizeForQuoteMatch` (L263-265) lowercases and
strips punctuation — acceptable for *matching only*, but Session #146 showed output text mangled and
lowercased end-to-end.

**Required:** neutralize only the specific fabricated quote(s) that failed verification; verified
quotes pass through verbatim; output casing must never be altered by the sanitizer.

**Gate V6-04 (must be able to FAIL):** a rationale containing (a) a verified transcript quote and
(b) one fabricated quote keeps (a) byte-identical and only neutralizes (b); a false-positive flag
must not modify (a).

**Fence:** `evaluation-report-service/src/main/java/com/interviewos/evaluation/service/RubricService.java`, plus one new/updated test file.

### V6-05 — Practice timer controls leak into interview (VG-4)
**Evidence:** `frontend/src/components/ide/SelfTimer.tsx:18-20` —
`effectiveMode = mode ?? (autoStart ? 'INTERVIEW' : 'PLAYGROUND')`; a bare mount silently becomes
PLAYGROUND (practice UI: +15 minutes / Reset). `frontend/src/components/behavioral/BehavioralStudio.tsx:467`
mounts `<SelfTimer />` **bare** → practice controls visible in a live interview section.

**Required:** `mode` must be a required prop (or default to the *safe* mode INTERVIEW); BehavioralStudio
passes its real mode explicitly; practice-only controls never render when `effectiveMode === 'INTERVIEW'`.

**Gate V6-05:** render BehavioralStudio in INTERVIEW mode — assert no "+15" / "Reset" control exists in the
DOM. Must be able to FAIL (a test that passes with the bug present is rejected).

**Fence:** `frontend/src/components/ide/SelfTimer.tsx`, `frontend/src/components/behavioral/BehavioralStudio.tsx`, plus one new/updated test file.

### V6-06 — TTS reads raw emoji / unsanitized text (NF3) — **scope corrected in r1**
**Evidence:**
- Source emoji: `frontend/src/lib/personas.ts:18` — INTERVIEW welcome message contains `👋`.
- Sanitizer exists: `frontend/src/lib/audio-tts.ts:9` (`sanitizeTtsText`); `audio-tts.ts:40` and
  `behavioral/BehavioralStudio.tsx:96` already sanitized.
- **Remaining raw path:** `frontend/src/components/arena/VoiceCoachIndicator.tsx:57` —
  `new SpeechSynthesisUtterance(text)` with no sanitization.

**Required:**
1. `VoiceCoachIndicator.tsx:57` uses `sanitizeTtsText`.
2. Source-level: persona greeting strings contain no emoji (strip `👋` from `personas.ts:18`).
3. A regression test enumerates **every** `new SpeechSynthesisUtterance` site in `frontend/src` and
   asserts each is fed through `sanitizeTtsText` (grep-based or module-level), so new raw paths fail CI.

**Gate V6-06:** with emoji present in input, no emoji/zero-width/surrogate residue reaches any utterance
string; the enumeration test fails if a raw call site is added. Must be able to FAIL.

**Fence:** `frontend/src/components/arena/VoiceCoachIndicator.tsx`, `frontend/src/lib/personas.ts`,
`frontend/src/lib/audio-tts.ts`, plus one new/updated test file.

### V6-07 — "Mickey" persona residual (G4)
**Evidence:** `frontend/src/components/arena/FloatingAiOrb.tsx:27-28` —
`personaLabel = isPlayground ? 'Coach Sam' : 'Mickey'` and `personaDesc … 'Mickey (Principal Engineer & Bar Raiser)'` are **hardcoded**, contradicting the orchestrator's persona config (Dr. Anya Chen in INTERVIEW).

**Required:** labels derive from the persona configuration (or session-provided persona), no hardcoded
persona names in the orb; INTERVIEW must display the configured interviewer persona.

**Gate V6-07:** grep gate — no interview-persona name literal in `FloatingAiOrb.tsx`; render test asserts
the label matches the persona config. Must be able to FAIL.

**Fence:** `frontend/src/components/arena/FloatingAiOrb.tsx`, plus one new/updated test file.

### V6-08 — Introduction stage skippable without required exchange (NF5)
**Evidence:** `frontend/src/components/intro/IntroScreen.tsx:60-68` —
`onNextStage` button ("Begin Round 1") renders unconditionally; a candidate can enter Round 1 without
completing the required introduction exchange observed in Session #146.

**Required:** the advance control is gated on the intro's completion condition (minimum one candidate
reply recorded through the intro dialogue path); until then it is disabled (with visible reason) or hidden.

**Gate V6-08:** with zero candidate replies the control is disabled/absent; after the completion condition
it becomes enabled. Must be able to FAIL.

**Fence:** `frontend/src/components/intro/IntroScreen.tsx`, plus one new/updated test file.

### V6-09 — Countdown timer drifts (monotonicity)
**Evidence:** `frontend/src/components/ide/SelfTimer.tsx:33-54` — `setInterval(…, 1000)` decrementing
`secondsLeft`, with the effect re-created on every `secondsLeft` change. Under tab throttling/VM load the
countdown falls behind wall-clock time (Session #146: timer visibly slower than the recording).

**Required:** deadline-based implementation — compute remaining time from an absolute end timestamp
(`Date.now()` delta) on each tick; interval cadence may stay 1s but must never accumulate drift;
expiry must fire on wall-clock overrun.

**Gate V6-09:** a test mocks the clock (fake timers + manual `Date.now` advance) — after simulated
throttling (missed ticks) the remaining time still matches wall-clock. Must be able to FAIL with the
decrement implementation.

**Fence:** `frontend/src/components/ide/SelfTimer.tsx`, plus one new/updated test file.

### V6-10 — Recording indicator / elapsed integrity (reconstructed scope)
**Evidence:** `frontend/src/components/arena/ArenaShell.tsx:167-168` renders `REC` + `MM:SS` from
`recordingSeconds`; `frontend/src/hooks/useSessionRecorder.ts` rotates chunks with retry
(`retryFailedChunks`, `failedChunkCount`). Session #146 showed the REC elapsed display resetting during
the session; monotonicity across chunk rotation/retry/re-attach is unproven on b934e78.

**Required:** `recordingSeconds` is derived from a single monotonic start timestamp (not incremented
per-chunk / per-event) and never resets during chunk rotation, retry, or transient re-attach without an
explicit operator-visible interruption state (`REC INTERRUPTED` already exists and must be the only path).

**Gate V6-10:** a test simulates N chunk rotations + 1 retry while asserting `recordingSeconds` is
non-decreasing and continuous. Must be able to FAIL.

**Fence:** `frontend/src/hooks/useSessionRecorder.ts`, `frontend/src/components/arena/ArenaShell.tsx`, plus one new/updated test file.

### V6-11 — PDF report must map on-screen content 1:1 (NF6)
**Evidence:** `evaluation-report-service/src/main/java/com/interviewos/evaluation/service/HumanTranscriptPdfGenerator.java`
(and `TranscriptPdfMeta.java`). Session #146 observed PDF sections that did not correspond to what the
on-screen report showed (missing/renamed/misplaced fields between UI and PDF).

**Required:** the PDF generator renders exactly the report fields the UI exposes (same names, same
presence rules); no field may exist in UI but be absent from PDF or vice versa; provenance (score,
dimension, verdict, transcript excerpts) must match the JSON report payload.

**Gate V6-11 (must be able to FAIL):** for a fixture report JSON, generate the PDF, extract text, and
assert every UI field label/value appears; assert no extra fabricated section exists. The test must fail
when a field is removed from the generator.

**Fence:** `evaluation-report-service/src/main/java/com/interviewos/evaluation/service/HumanTranscriptPdfGenerator.java`, `TranscriptPdfMeta.java`, plus one new/updated test file.

### V6-12 — Hardcoded runtime label lies about environment (NF8)
**Evidence:** `frontend/src/components/ide/DsaScreen.tsx:102` —
`<option value="java">Java (OpenJDK 13.0.1)</option>` — a hardcoded JDK version presented as truth; the
actual runner JVM differs, and the label drifted across releases.

**Required:** replace with a neutral label (`Java`) or a runtime-fetched version (runner capability
endpoint); the UI must never assert a specific runtime version it cannot prove.

**Gate V6-12:** grep gate — no `OpenJDK` literal in `frontend/src`; if a version endpoint is added, a test
asserts the label equals the endpoint value. Must be able to FAIL.

**Fence:** `frontend/src/components/ide/DsaScreen.tsx` (+ optional runner endpoint files if version is
fetched — justify in report), plus one new/updated test file.

---

## §3 — Execution Order

1. **First:** V6-01 + V6-02 (both are session-integrity P0/P1 — a lost-code or wrong-question session is
   unusable regardless of everything else). Commit and report these two before continuing.
2. **Then:** V6-03 … V6-12 in any order (independent files/fences).
3. **Operator validation session:** run **only after the full pack is merged to master**. Do not burn a
   validation session mid-pack.
4. Merge: single branch `fix/v206-session146-fixes` with per-item commits, `--no-ff` into master,
   merge message: `Merge branch 'fix/v206-session146-fixes' into master (V-2.0.6 Session #146 Adjudicated Fix-Pack)`.

---

## §4 — Report Template (per item)

```
### V6-xx — <title>
Files changed: <list with +ins/-del numstat>
Four-number: files=N test-cases=N assertions=N failures=N
Gate evidence: <command> → <quoted output>
Honest-judge: <what would make this FAIL — and whether you verified it can>
Deviation: <anything outside fence, or NONE>
```

Plus a final section: merge commit hash, branch name, and any §0 rule touched (should be NONE).

---

## §5 — Non-Goals

- No new question-bank content, no schema migrations (none of V6-01…V6-12 require DDL).
- No refactor of ArenaRoom beyond the fenced hooks; no styling passes.
- No provider/model routing changes.
- V5-05 visibility rework and Addendum A (A1–A3 / VA gates) stay in the V2-Platform SPEC track.
