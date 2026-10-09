# SPEC-012 ARENA UX FIXPACK — Z AUDIT (QB-26)

**By:** Z.ai (architect/audit lane) · **Date:** 2026-10-09 · **Branch:** `feat/spec-012-arena-ux-fixpack` (db142d0 + c3a49c4) · **Base:** `8048875` (master tip, unmoved)

## Verdict

- **ACCEPT.** Merge authorized via `git merge --no-ff feat/spec-012-arena-ux-fixpack`. Zero fence violations, zero forbidden-zone touches, all numeric claims reproduced digit-for-digit in the Z sandbox.

## Check results

| # | Check | Result |
|---|---|---|
| 1 | Topology | ✔ Linear 2 commits off `8048875` (`db142d0` code, `c3a49c4` report); master unmoved; no merge commits, no strays. |
| 2 | VP-A fence census | ✔ Exactly 6 code files (2 new: `editorSizing.ts/.test.ts`; 4 modified: `ArenaShell`, `FocusModeToggle`, `DsaScreen`, `SqlScreen`) + 1 report. `ArenaShellTypes.ts` untouched (not needed). |
| 3 | VP-B forbidden zone | ✔ Zero edits across all 9 forbidden files (census-proven); `TestcasePanel.tsx` untouched — wiring is screen-side as required. |
| 4 | VP-C test suite (Z sandbox, warm node_modules) | ✔✔ **Reproduced: suites 31 / tests 272 / pass 272 / fail 0** (6.6s) = baseline 29/262 +2/+10 exactly. New file has exactly 10 `it()` blocks. |
| 5 | VP-D build (Z sandbox) | ✔ `tsc -b && vite build` exit 0 (1.08s; pre-existing chunk-size warning only). |
| 6 | VP-E unit quality | ✔ 10 tests / 31 asserts: cycle transitions, corrupt-`localStorage` fallback, SSR guard, storage isolation, tooltip/label mapping. Real coverage, not counter-tests. |
| 7 | Code review — Focus | ✔ Imperative `problem-panel` collapse (`collapsible=true, collapsedSize=0, panelRef`), effect-driven on `isFocusMode`, expand on toggle-off; interview-mode hide behavior (stepper/rail/webcam) retained. |
| 8 | Code review — sizing | ✔ `split/expanded/fullscreen` cycle persisted per-screen (`interviewos.editorSizing.dsa|sql`), SSR+try/catch hardened, corrupt→`split`; expanded = testcase collapse to `collapsedSize=5` residue (tab strip), editor absorbs to ~95%; fullscreen = `fixed inset-0 z-30` overlay; Esc listener scoped to fullscreen with cleanup; manual testcase expand in `expanded` returns to `split`. |
| 9 | Z-index contract | ✔ Overlay `z-30` < orb `z-40` (FloatingAiOrb L100) / panel `z-40` (AiAssistantPanel L218) — Coach Sam reachable in Zen mode. |
| 10 | Four numbers (G3, own regex over `*.test.ts`) | ✔ base 29 files/262 cases/1052 asserts/0 fail → tip 31/272/1083/0; delta +2/+10/+31 = exactly `editorSizing.test.ts`. ⚠ Executor report again omitted assertions (C-2 repeat — see N-2). |
| 11 | C-1 lane quarantine | ✔ Declared Option B (`fix/voice-and-track-nav`, `248006a`); census proves zero bleed into spec-012. ⚠ Branch is NOT on origin — unverifiable until pushed (see F-1). |
| 12 | Honest-judge | ✔ All checkable claims accurate. N-1 wording nit below. |

## Notes (non-blocking)

- **N-1:** Report §1 says the rail/stepper/webcam were "already conditionally hidden" in playground — that was inaccurate for the rail; the execution actually ADDED playground rail-hide (`railItems.length <= 1`). Outcome is correct and an improvement, but the delta was undeclared. Candor over polish next time.
- **N-2:** C-2 vocabulary repeat — four numbers must be files/test-cases/assertions/failures. Assertions missing from the report.
- **N-3:** In Zen fullscreen with Coach Sam panel open, `Esc` reaches both handlers (panel closes AND zen exits). Acceptable; flag if undesired later.
- **N-4:** Gate-label collision: executor used "VP-F" for the operator docker-cockpit step; Z's VP-F is sandbox dynamic reproduction (this audit). Use VP-G for operator visual/screenshots.

## Follow-ups

- **F-1:** Push `fix/voice-and-track-nav` when its lane activates; it needs its own NOTE + Pre-Flight + Z audit before any merge (voice files are post-mic fidelity zones).
- **F-2:** Operator visual pass (VP-G): screenshots of split/expanded/fullscreen + Focus collapse at 1080p.
- **F-3:** Gaurav seed remains SPEC-013 (on origin, unaudited — own lane with license + originality controls).
