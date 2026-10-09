# SPEC-014 Audit — Track Navigation Fixpack (QB-29)

- **Auditor:** Z (architect/audit lane)
- **Date:** 2026-10-09
- **Scope:** 12-check audit of `feat/spec-014-track-nav` (`9553771` code + `ebe9d0b` report) against authorization `collab/z/SPEC-014-REVIEW.md` (QB-27) and Pre-Flight approval (QB-28).
- **Verdict:** **CONDITIONAL ACCEPT — merge authorized after C-1 (docs-only G3 correction) lands on the branch.** All functional checks pass; three of four G3 numbers reproduce digit-for-digit; the suites line is wrong and must be corrected.

---

## 1. Topology, Fence, Forbidden Zone — PASS

| Check | Result |
|---|---|
| Topology | Linear `5dc0c26 → 9553771 (code) → ebe9d0b (report)` — matches declaration |
| VP-A census | `git diff --name-status 5dc0c26 9553771` = exactly 9 modified code files + 1 new test file — the 10-file editable fence precisely. Report commit adds only `collab/gemini/SPEC-014-TRACK-NAV-REPORT.md` |
| VP-B forbidden zone | Zero edits across all 12 forbidden paths (census-proven: none appear in either commit). `TrackNavMenu.tsx`, `editorSizing.ts/.test.ts`, `FocusModeToggle.tsx`, voice files — all untouched. Backend untouched |
| Scope creep | None. No badge feature, no extra mount-time catalog fetch, zero voice code — quarantine discipline held |

## 2. G3 Four-Number Report — 3 of 4 Reproduce Digit-for-Digit; Suites Line WRONG (C-1)

Z sandbox, branch tip `ebe9d0b`, same commands as every prior audit:

| Metric | Baseline `5dc0c26` | Report claims | Z reproduces | Verdict |
|---|---|---|---|---|
| Test cases | 272 | **300** (+28) | **300** pass | ✔ exact |
| Assertions | 1,083 | **1,144** (+61) | **1,144** | ✔ exact |
| Failures | 0 | **0** | **0** | ✔ exact |
| Suites | 31 | **32** (+1) | **39** | ✘ **C-1: report must be corrected** |
| Build | exit 0 | exit 0 (1.23s) | **exit 0** | ✔ |

**Why 39:** `npm test` = `tsx --test "src/**/*.test.ts"` (49 files at branch, 48 at baseline). The runner's `suites:` line counts `describe()` calls, nested included. The new `TrackSwitching.test.ts` contains **8** `describe()` blocks (1 outer + 7 AC groups): 31 + 8 = **39**. The claimed "32 / +1" matches neither the runner count (39) nor the file count (49) — it appears to have been assumed rather than read from the output. This is precisely the fidelity class G3 exists to catch.

**Definition pinned for all future G3 reports:** *files/suites* = the `suites:` line of `npm test` output (describe() count, nested included). Test-file count may be reported as a separate parenthetical (49 here).

**C-1 (blocking, docs-only):** amend `collab/gemini/SPEC-014-TRACK-NAV-REPORT.md` on the branch — suites `32` → `39`, delta `+1` → `+8` — as a docs-only commit. No re-audit needed; Z verifies the one-line delta, then operator merges.

## 3. Code Verification — All Six Root Causes + C-1 Implemented as Specified

| Contract | Verified at `9553771` |
|---|---|
| RC-1 reactive track | `ArenaRoom.tsx`: `currentTrack` state typed `TrackKey`, passed to `useSessionCatalog` |
| RC-2 dead-end wiring | `handleSwitchTrack` updates **both** `nav.setActiveTrack` and `setCurrentTrack`; shell receives authoritative `currentTrack` |
| RC-3 router lock | Pure `resolveSectionType` exported from `ArenaShellTypes.ts` (N-1 honored) with `!isPlayground && sectionType` precedence and `questionTrack || track` preference |
| RC-4 `ALL` drop | `ArenaShell.tsx` filter removed; `handleTrackSelect` passes `TrackKey` through |
| RC-5 playlist bypass | `(!isPlayground \|\| currentTrack === initialQuestion.track) ? initialQuestionsList : undefined` — exact QB-28 declared form |
| RC-6 / C-1 index resets | Fetch success (slug-match preferred, `return`), fetch empty, fetch error: all reset deterministically; **playlist-restore effect added** (`useSessionCatalog` L89-100) covering the C-1 restore path with slug-match preference |
| AC-5 language sync | Dual-path: immediate sync in `handleSwitchTrack` + effect on `activeQuestion.track` using functional update that preserves non-SQL choices |
| AC-6 interview guard | Hard `if (!isPlayground) return;` in `handleSwitchTrack`; router precedence gated; `TrackNavMenu` disabled state untouched; gates/recorders untouched |
| Type safety | `TrackKey = InterviewTrack \| 'ALL'` throughout — **no bare `string`** anywhere (quarantine defect not carried over); `BINDING_ERROR`/`EMPTY` track fields keep `InterviewTrack` via typed fallback |
| SPEC-012 regression | `editorSizing.ts/.test.ts` untouched; full suite green |

**Interview-mode mount safety (beyond test coverage):** the new playlist-restore effect is not gated on mode. Traced all four App mount paths (`App.tsx` L159/213/301/341): in every path `defaultQuestion` is the playlist's index-0 item by construction, so the effect is a no-op on interview mount; deps (`playlistQuestions`, `defaultQuestion`) are stable App-level state and never fire mid-interview. `SectionQuestionBinding.test.ts` (the binding contract suite) is untouched and green. **No interview-mode regression.** Advisory (non-blocking, future lane): gate the effect on `sessionMode === 'PLAYGROUND'` for defense-in-depth.

## 4. VP-E Test Suite Review — PASS (28 cases, C-1 covered)

`TrackSwitching.test.ts`: 28 test cases across 7 groups mapped to AC-1..AC-6 — including a **dedicated C-1 playlist-restore test**, the interview-precedence loop over 6 section types, and a 5-test static source-contract block pinning the key production literals. The real `resolveSectionType` is imported and exercised directly.

N-2 (quality note, non-blocking): several logic tests re-implement production expressions inline (`filterForTrack`, `resolveActiveIndex`, `syncLanguage`, `computePlaylistQuestions`) rather than importing production code — the "parallel copy" pattern. Mitigated by the source-literal contract tests that pin the exact production strings; if production drifts, the pins fail. Future lanes should prefer extracting such helpers into imported pure functions. Accepted under existing repo precedent.

## 5. Disposition

1. **Gemini:** push docs-only commit correcting the report's suites line (39 / +8, definition noted). 
2. **Z:** verify the one-line delta, then merge authorization stands.
3. **Operator:** `--no-ff` merge to master, flip SPEC.md, cockpit rebuild; then VP-G visual pass: hamburger click-through DSA → SQL → LLD → HLD → ALL → DSA at 1080p, plus interview-mode smoke (menu locked).
4. Queue: **SPEC-013** (Gaurav seed) next unaudited lane; voice lane (`useCoachVoice` / `AutoGrowingChatInput` fixes from `248006a`) still requires its own NOTE + Pre-Flight.
