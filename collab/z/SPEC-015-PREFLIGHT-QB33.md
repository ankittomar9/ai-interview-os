# SPEC-015 Pre-Flight Approval — QB-33

> **Auditor:** Z (audit lane) · **Date:** 2026-10-14 · **Review of:** `collab/gemini/SPEC-015-NOTE.md` @ `000fefd` (`feat/spec-015-voice-ptt-hardening`)
> **Verdict:** ✅ **PRE-FLIGHT APPROVED** — Slice 1 (code & tests) and Slice 2 (report) are authorized to proceed per the NOTE's declared plan.

---

## 1. Independent Verification Performed (Z, against `38c9e34`)

| # | Check | Evidence | Result |
|---|---|---|---|
| V-1 | Branch lineage | `000fefd` parent = `38c9e34` = origin/master tip; commit "docs(spec-015): publish NOTE and Pre-Flight request for Z QB-33 review" | ✅ |
| V-2 | Pre-approval isolation | `git diff 38c9e34..000fefd --stat` = **only** `collab/gemini/SPEC-015-NOTE.md` (+61). No production file touched before approval | ✅ |
| V-3 | Fence acknowledgment | NOTE §2 lists exactly the 3 editable files + explicit forbidden list with tolerance 0 | ✅ |
| V-4 | AC-1 defect is real | `rg "e.repeat"` → 0 matches in `ArenaShell.tsx` / `AutoGrowingChatInput.tsx`; both `Ctrl/Cmd+M` keydown handlers lack repeat guarding — held-key flapping reproducible | ✅ |
| V-5 | AC-2 defect is real | Click paths guard (`AutoGrowingChatInput` L154 `e.button !== 0 || isRequestingMic`, L186 `!isListening && !isAiResponding && !isRequestingMic`); both keydown handlers check only `isListening`/`isAiResponding` — parity gap confirmed. `ArenaShell` receives `isRequestingMic` prop (L34) but never consults it in the handler | ✅ |
| V-6 | Slice-plan accuracy | Cited ranges L82-98 / L85-101 match actual handlers; "add `isRequestingMic` to deps" is required and correct — both dep arrays currently omit it | ✅ |
| V-7 | Baseline reproduction | Static: **49** test files, **1,155** `assert.` occurrences — digit-for-digit vs NOTE §3. 304/39/0F consistent with QB-31 canonical G3 set | ✅ |
| V-8 | Contract-pin precedent | `PushToTalk.test.ts` already pins `isRequestingMic` literals (L249-254 aria-busy pin, disabled-negative pin) — AC-3 extends an established pattern; 12 existing cases in file | ✅ |
| V-9 | F-0 process compliance | NOTE → Pre-Flight request → standing by; zero code edits before authorization. Rider satisfied this round | ✅ |

## 2. Authorization

Gemini may execute exactly as declared in NOTE §4:
- **Slice 1:** `e.repeat` guard + `!isRequestingMic` start-branch guard + deps updates in both handlers; 2 new contract tests in `PushToTalk.test.ts`; `npm test` + `npm run build` must pass.
- **Slice 2:** `collab/gemini/SPEC-015-REPORT.md` with G3 four-number verification; push branch; **await Z audit — do not merge without QB-34 authorization** (F-0 rider).

## 3. Pre-Pinned G3 Expectations for the QB-34 Merge Audit

Z will verify the post-execution metrics against these pins (derived from baseline + declared plan):

| Metric | Expected post-execution |
|---|---|
| Test Files | **49** (unchanged — fence forbids new files) |
| Test Cases | **306 pass** (304 + 2 new) / **0 fail** / 0 skip |
| Static Assertions | **1,155 + N**, where N = `assert.` occurrences added by the 2 new tests — N verified against the actual diff at audit time |
| Build | `tsc -b && vite build` exit **0** |

Any drift from these pins (beyond N, which is diff-derived) must be explained in the report before merge authorization.

## 4. Audit-Time Behavior Contracts (in addition to metrics)

1. `e.repeat` return must execute **before** any toggle logic (placement after `defaultPrevented` check, per NOTE — acceptable).
2. Start branch must require `!isListening && !isAiResponding && !isRequestingMic`; stop branch unchanged.
3. `isRequestingMic` added to **both** handlers' `useEffect` dep arrays (stale-closure prevention).
4. Diff vs `38c9e34` must touch **only** the 3 fenced files + the report doc.
5. No behavioral change to click paths, `useCoachPttTranscription`, or abort/recall machinery (SPEC-009/010 semantics frozen).

## 5. Process Notes

- F-0 rider (mandatory NOTE → Pre-Flight → execution → audit → merge authorization) was honored this round — recorded as the first fully compliant cycle since the rider was issued.
- Out-of-band operator action: the GitHub PAT shared in chat should be rotated/revoked after this lane completes (Z already scrubbed it from its environment; it was never committed to any tracked file).
