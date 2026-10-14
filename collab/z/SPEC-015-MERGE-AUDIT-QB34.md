# SPEC-015 Merge Audit — QB-34

> **Auditor:** Z (audit lane) · **Date:** 2026-10-14 · **Scope of review:** `feat/spec-015-voice-ptt-hardening` @ `ef7ce42` (3 commits: `000fefd` NOTE → `d74048e` code → `ef7ce42` report)
> **Verdict:** ✅ **MERGE AUTHORIZED** — all G3 pins hit digit-for-digit, all 5 behavior contracts satisfied, fence clean, dynamic reproduction executed by Z on Node v24.21.0.

---

## 1. Dynamic G3 Reproduction (Z-executed, not trust-based)

Z checked out `ef7ce42`, installed deps (`npm ci`), and ran the full gate on Node v24.21.0:

| Metric | QB-33 Pre-Pinned | Z Dynamic Run | Gemini Claim | Verdict |
|---|---|---|---|---|
| Test Files | 49 | 49 | 49 | ✔ digit-for-digit |
| Suites (`suites:`) | 39 | 39 | 39 | ✔ digit-for-digit |
| Test Cases | 306 pass / 0 fail | **306 pass / 0 fail / 0 cancelled / 0 skipped** (9.2s) | 306/0F | ✔ digit-for-digit |
| Static Assertions | 1,155 + N | **1,161** | 1,161 | ✔ digit-for-digit |
| Build (`tsc -b && vite build`) | exit 0 | **exit 0** (1.17s) | exit 0 (1.01s) | ✔ clean |

**N reconciliation (diff-derived):** AC-1 test = 2 `assert.ok` (both files' `e.repeat` pins); AC-2 test = 4 `assert.ok` (start-guard ×2 + deps-array pin ×2). 2+4=6. 1,155+6=1,161. ✔

## 2. Behavior Contracts (QB-33 §4)

| # | Contract | Verification |
|---|---|---|
| BC-1 | `e.repeat` return before any toggle logic | Both handlers: `if (e.defaultPrevented) return;` → `if (e.repeat) return;` → modifier match. Placed exactly as declared in NOTE. ✔ |
| BC-2 | Start branch `!isListening && !isAiResponding && !isRequestingMic`; stop branch unchanged | Both: `} else if (!isRequestingMic) {`; stop branch lines byte-identical to base. ✔ |
| BC-3 | `isRequestingMic` in both `useEffect` dep arrays | ArenaShell: `[isListening, isAiResponding, isRequestingMic, onStartListening, onStopListening, onMicToggle]`; ChatInput: same with `onToggleListening`. ✔ stale-closure risk closed |
| BC-4 | Diff touches only 3 fenced files + report docs | Census: `ArenaShell.tsx` (+5/−4 lines), `AutoGrowingChatInput.tsx` (+5/−4), `PushToTalk.test.ts` (+46), NOTE (+61), REPORT (+86). Zero out-of-fence. ✔ |
| BC-5 | Click paths / useCoachPttTranscription / abort-recall frozen | No hunks outside the two keydown handlers + deps arrays + test appends. SPEC-009/010 semantics untouched. ✔ |

## 3. Code Quality Assessment

- **Surgical minimalism:** 9 net production lines across 2 files; identical pattern in both handlers keeps the parity story legible.
- **Contract tests follow house style:** source-pin pattern (`fs.readFileSync` + `assert.ok` on literals) consistent with the file's existing VP-gate tests — they will catch regressions to either AC at test time, not at runtime.
- **Semantics note (accepted):** `e.repeat` guard sits before modifier matching, so held `Ctrl+M` produces one toggle per physical press regardless of modifier state — correct and intentional.
- **NIT (non-blocking):** `PushToTalk.test.ts` lost its trailing newline at EOF in `d74048e` (base had one). Fix opportunistically in the merge commit or the SPEC.md flip commit; not worth a re-review cycle.

## 4. Merge Topology

- Branch base `38c9e34`; master has since advanced docs-only to `ae3845d` (QB-33 approval). `git merge-tree` dry-run: **clean, no conflicts** (disjoint paths).
- **Authorization:** Gemini may merge `feat/spec-015-voice-ptt-hardening` into master as-is. Suggested merge commit: `Merge branch 'feat/spec-015-voice-ptt-hardening' into master` (matching `80400fc` convention).
- **Post-merge:** SPEC.md status flip for SPEC-015 → `COMPLETED & MERGED` is authorized as a separate docs-only commit on master (per SPEC-014 precedent; the lane's fence on SPEC.md applied to execution, not the post-merge bookkeeping flip).
- G3 for the merge commit itself is expected unchanged: 49 / 39 / 306 pass / 0 fail / 1,161 / build 0.

## 5. Process Record

- **First fully F-0-compliant lane end-to-end:** NOTE (`000fefd`) → Pre-Flight approval (QB-33, `ae3845d`) → Slice 1 code (`d74048e`) → Slice 2 report (`ef7ce42`) → this audit (QB-34) → merge pending. The F-0 rider is hereby considered absorbed into standard practice for future lanes.
- Operator reminder (standing): rotate/revoke the chat-shared PAT after this lane's merge completes — it has been used transiently by Z (never persisted to any tracked file or config).

**Next review trigger:** post-merge confirmation + SPEC.md flip → QB-35 close-out; then queue returns to SPEC-013 (Gaurav seed, `feat/seed-gaurav-blog-questions` unmerged).
