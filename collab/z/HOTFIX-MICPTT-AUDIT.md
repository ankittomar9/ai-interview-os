# HOTFIX AUDIT — mic-ptt-affordance (Z, 12 checks scaled to hotfix lane)

**By:** Z.ai (architect/audit lane) · **Date:** 2026-10-06 · **Branch:** `origin/hotfix/mic-ptt-affordance` (tip `ac59e2d`) · **Subject commit:** `173cf63` (9 files, +133/−31) · **Base:** `56899ba` (stale; master is `e2ae086`)

## Verdict

- **Mic-fix commit `173cf63`: ACCEPT on the code.** All claimed root-cause fixes verified at diff level, micro-fidelity zones safe, suite + build reproduced dynamically green in the Z sandbox.
- **Branch AS-IS: DO NOT MERGE.** The hotfix branch is contaminated: the unaudited 25-question "Gaurav blog" DSA seed (`61a0912`) sits on top of the mic fix and would ride into master. Merge the mic fix alone via cherry-pick (verified conflict-free).
- **Seed `61a0912`: NOT AUDITED — must not merge with the hotfix.** It requires its own content-spec lane (originality + license audit of the source blog) before any merge.
- **Process finding P-1:** the mandatory `collab/gemini/HOTFIX-mic-ptt-affordance-NOTE.md` (≤15 lines, BEFORE edits, protocol v1.1 hotfix lane) does not exist anywhere on the remote. Mitigating context: the original edits predate v1.1; the recovery push should still have carried a retro-NOTE and a report. No Pre-Flight was pasted. Recorded as a lane violation, no escalation (first offense under the new lane).

## Check results

| # | Check | Result |
|---|---|---|
| 1 | Topology | ⚠️ 3 commits: `173cf63` (mic fix, on `56899ba`) ← `61a0912` (seed) ← `ac59e2d` (merge, first parent `56899ba`; message "into master" is misleading — it landed on the hotfix branch, not master). Author identity = operator (`tomar`), consistent with the breach adjudication (working-tree fixes, operator pushed). |
| 2 | NOTE file | ❌ Missing (P-1). |
| 3 | Pre-Flight | ❌ Not pasted (part of P-1). |
| 4 | Fence census | ✔ Exactly the 9 adjudicated files, nothing else. |
| 5 | Micro-fidelity zones | ✔ `FloatingAiOrb.tsx` (SPEC-010-forbidden): icon ternary only — F-1 geometry/stackAbove untouched. `AutoGrowingChatInput.tsx` (SPEC-009 R-2 zone): additive pending-state + keyboard-activation branch; quick-click toggle, hold>500ms stop&send, abort/draft/recall semantics untouched. |
| 6 | Code verification | ✔ `pickAudioMime` fallback chain (webm;opus → webm → ogg;opus → mp4 → default recorder); `isStartingRef` re-entrancy lock reset in `finally` + `abortCapture`; blob type uses actual mime; error mapping NotAllowed/NotFound/generic + `clientLog.warn('RECORDER_ERROR')` + flush; `isRequestingMic` lifecycle watertight (3 terminal callbacks + `finally` + `abortTurn` reset); orb ChevronDown-when-open affordance; keyboard/pointer desync fixed (Enter/Space now starts listening). Nits (non-blocking): MediaRecorder ctor throw after getUserMedia success can leak the stream (pre-existing shape, same as old code); `catch (err: any)`; transient disabled-button mid-press edge. |
| 7 | Tests | ✔/⚠ +2 static-gate tests (repo convention) pinning hardcoded-webm removal + ChevronDown presence; behavioral coverage of the lock/pending state machines absent — follow-up. |
| 8 | Four numbers (own regex) | ✔ base `56899ba` → tip `ac59e2d`: files 47→47, test-cases 177→179, assertions 1029→1033. Delta (+2/+4) exactly matches the diff. |
| 9 | Dynamic reproduction (Z sandbox) | ✔✔ `npm ci` + `tsx --test`: **262 pass / 0 fail / 0 skipped**; `tsc -b && vite build` **exit 0** (pre-existing chunk-size warning only). |
| 10 | Regression scan | ✔ `173cf63` confined to mic/PTT affordance; no unrelated edits. |
| 11 | Honest-judge | ✔ No false claims in the commit; ⚠ no report exists at all; seed merge message misleading (see #1). |
| 12 | Merge-path adjudication | ✔ Cherry-pick of `173cf63` onto `e2ae086` verified **conflict-free**: `git diff 56899ba e2ae086 -- <9 paths>` is empty (zero drift). |

## Operator merge order (adjudication)

```bash
git fetch origin
git checkout master && git pull
git cherry-pick 173cf63        # the mic hotfix, alone — zero-drift verified
git push origin master
git push origin --delete hotfix/mic-ptt-affordance   # after verifying
```

## Gaurav-blog DSA seed (`61a0912`) — handling order

25 new DSA questions + `DsaCatalogGuardTest` literal bump 364→389 (same 4-line literal set L110/L115/L116/L139 that SPEC-011 REV 2 carves out — whoever merges second rebases the literal; both merged ⇒ 397). Hygiene pre-check passed (schema-conform frontmatter, `source: inspired-by:gkgaurav31/*`, no educator names in statements, topics/est_minutes present) — but the `inspired-by:` convention **short-circuits the similarity guard**, so the binding controls are a real originality pass and a license check of the source blog (a personal blog's prose is copyrighted by default; statements must be re-authored, C2/C4). Do NOT transplant to master until it has: (1) its own SPEC (SPEC-012 candidate) with source URLs + license verdict recorded in a dsa SOURCES.md, (2) executor Pre-Flight, (3) Z 12-check audit incl. VP-5-style originality grep against the blog text.

## Follow-ups (non-blocking)

1. Behavioral tests for `isStartingRef` lock + `isRequestingMic` lifecycle (mocked MediaRecorder).
2. Retro-NOTE discipline: any future recovery push must carry the NOTE + report even when the incident predates v1.1.
3. Nits from check #6 (stream-leak shape, `any` catch) — fold into the next frontend fixpack, not this merge.
