# SPEC-014 — Track Navigation Fixpack: Root-Cause Review & Authorization (QB-27)

- **Reviewer:** Z (architect/audit lane)
- **Date:** 2026-10-09
- **Scope:** (A) SPEC-012 lifecycle closure verification; (B) verification of Gemini's 4-root-cause analysis of playground track navigation; (C) disposition of quarantined branch `fix/voice-and-track-nav` (`248006a`); (D) authorization decision for the fix lane.
- **Verdict:** **APPROVED TO SPEC (SPEC-014)** — with a re-author mandate on current master, two scope corrections Gemini must incorporate, and C-2 formally closed (assertions methodology recovered).

---

## A. SPEC-012 Lifecycle Closure — VERIFIED

| Check | Result |
|---|---|
| Merge topology | `0ee7f57` ← `2f4dbd9` (`--no-ff`, parents `b10932b` + `c3a49c4`) ← `db142d0`/`c3a49c4` — clean, matches report |
| Content identity | `git diff db142d0 origin/master -- frontend/` is **empty** — merge is byte-faithful to the audited branch |
| Census `8048875→master` | Exactly 6 SPEC-012 code files + 2 collab docs + SPEC.md. No bleed |
| SPEC.md flip | `0ee7f57` records SPEC-012 COMPLETED & MERGED with review/report links |
| Quarantine on origin | `origin/fix/voice-and-track-nav` = `248006a` (F-1 satisfied) |
| Master-tip reproduction (Z sandbox, this audit) | suites **31** / tests **272** / pass **272** / fail **0**; `tsc -b && vite build` exit 0 (1.06s) |

SPEC-012 ledger is fully closed. Remaining operator item: VP-G visual screenshots (3 editor states + focus collapse @1080p) — non-blocking.

## B. Root-Cause Verification — 4/4 CONFIRMED, with 2 mandatory additions

All four locations verified verbatim at master tip `0ee7f57`:

| # | Gemini's claim | Verdict | Evidence at `0ee7f57` |
|---|---|---|---|
| RC-1 | `useSessionCatalog` hardcoded to `initialQuestion.track` | **CONFIRMED** | `ArenaRoom.tsx` L136 passes static `track: initialQuestion.track \|\| 'ALGORITHMS_DATA_STRUCTURES'` |
| RC-2 | `onSwitchTrack` dead-end | **CONFIRMED** | `ArenaRoom.tsx` L208 wires `nav.setActiveTrack`; `useArenaNavigation.ts` L33 is a bare `useState` consumed only for menu highlight + router `track` prop |
| RC-3 | Router short-circuits on `sectionType` | **CONFIRMED — stronger than reported** | `TrackScreenRouter.tsx` L72 `if (sectionType) return sectionType;`. Playground plans are **synthetic with hardcoded `sectionType: 'DSA'`** (`lib/playgroundPlan.ts` L11) regardless of the question's track — so the router is permanently DSA in every playground session, even SQL ones |
| RC-4 | `'ALL'` clicks filtered out | **CONFIRMED** | `ArenaShell.tsx` L82 `trackKey !== 'ALL'` drop |

### Mandatory additions to the fix design (Gemini's chat plan missed both)

1. **RC-5 — playlist precedence blocks the track fetch.** `useSessionCatalog.ts` L95-98 returns early on non-empty `playlistQuestions` **before** the per-track `listQuestions({track})` fetch. Playground always passes a playlist (`App.tsx` L295 single-question launch, L345 playlist launch), so making `track` reactive alone fixes nothing — the playlist branch must be bypassed when the active track diverges from the initial question's track. (Note: the quarantined branch's code *does* handle this via `currentTrack === initialQuestion.track ? initialQuestionsList : undefined` — the chat plan text simply omitted it. It is now a formal acceptance criterion.)
2. **RC-6 — `activeQuestionIndex` never resets on track change.** The hook resets the index on `activeSectionIndex` change (L65-67) only. A stale in-range index after switching tracks selects an arbitrary question; out-of-range yields `BINDING_ERROR_QUESTION`. Every track-change fetch path must deterministically reset the index (default-question slug match preserved first, else 0).

Additional verified facts (context, not separate defects): `language` is initialized once from `initialQuestion.track` (`ArenaRoom.tsx` L144) and needs the switch-sync Gemini already proposed; `useSessionCatalog` is already fully track-reactive (L88-133, backend `listQuestions({track})`) so no backend changes are required; `TrackNavMenu.catalogQuestions` is never fed by `ArenaShell` (badge counts permanently empty — cosmetic, optional slice).

## C. Quarantined Branch `248006a` — DO NOT LAND AS-IS

Inspected in full. 11 files mixing **three concerns**: track-nav (9 files), voice/record (`useCoachVoice.ts` abort-on-unmount ref fix, `AutoGrowingChatInput.tsx` `isRequestingMic` guards), and a catalogQuestions badge feature. Base is `8048875` (stale — master has since modified `ArenaShell.tsx` via SPEC-012) and it contains **zero tests**.

The track-nav approach itself is largely sound: `currentTrack` state, mode-gated `handleSwitchTrack` (`if (!isPlayground) return`), playlist bypass, router precedence gated to `!isPlayground` with `question?.track || track` preference, `'ALL'` fetch semantics, index resets, language sync.

**Defects vs the SPEC-014 bar:**
- Type widening to bare `string` across 5 files degrades compile-time safety — must use an `InterviewTrack | 'ALL'` union (or `TrackKey` alias) instead.
- No unit tests — unacceptable for a stateful navigation change.
- Mixed concerns (the exact C-1 failure mode).
- Extra mount-time `listQuestions` call purely for menu badges = scope creep.

**Disposition:** the lane is **re-authored fresh** on branch `feat/spec-014-track-nav` from current master `0ee7f57`, under a new Pre-Flight. Referencing/reusing hunks from `248006a` is permitted and must be **declared** in the Pre-Flight for transparency. The voice half stays quarantined until it gets its own NOTE + Pre-Flight (per mic-audit follow-up #3).

## D. SPEC-014 Authorization

**Status: APPROVED TO SPEC.** Objective: hamburger track switching works in playground (DSA ⇄ SQL ⇄ LLD ⇄ HLD ⇄ ALL) with correct screen, catalog, language, and index behavior; interview mode is byte-for-byte unaffected.

### Acceptance criteria

- **AC-1** Playground menu click on SQL / SPRING_LLD / SYSTEM_DESIGN renders `<SqlScreen>` / `<LldScreen>` / `<HldScreen>` and the catalog list is fetched for that track (`listQuestions({track})`).
- **AC-2** Playlist precedence (RC-5): `playlistQuestions` is used only when the active track equals the initial question's track (or mode is INTERVIEW); otherwise the per-track fetch path runs. `'ALL'` always bypasses a single-track playlist.
- **AC-3** `'ALL'` renders the unfiltered catalog (`listQuestions` without track filter, no track post-filter).
- **AC-4** `activeQuestionIndex` deterministically resets on every track change: prefer default/original-question slug match, else 0. No stale index, no `BINDING_ERROR_QUESTION` on switch.
- **AC-5** Language syncs on switch: `'sql'` on SQL track; back to `'java'` when leaving it (LLD/DSA). Editor sizing keys per SPEC-012 (`...editorSizing.dsa/sql`) are untouched.
- **AC-6** Interview mode unaffected: `sectionType` precedence retained (`!isPlayground && sectionType`), track menu disabled, gates/stepper/recording paths untouched.
- **AC-7** SPEC-012 regression guard: existing 31 suites incl. `editorSizing.test.ts` pass unchanged.

### Fence

**EDITABLE (10):** `arena/ArenaRoom.tsx`, `arena/ArenaShell.tsx`, `arena/TrackScreenRouter.tsx`, `arena/hooks/useSessionCatalog.ts`, `arena/hooks/useArenaNavigation.ts`, `arena/hooks/useArenaShellProps.ts` (additive-optional), `arena/ArenaShellTypes.ts` (additive-optional), `arena/EmptyTrackState.tsx` (type-scope only, optional), `arena/SessionSectionFaultState.tsx` (type-scope only, optional), **new** test file(s) under `frontend/src` (suggested: `arena/TrackSwitching.test.ts` and/or `arena/hooks/useSessionCatalog.track.test.ts`).

**FORBIDDEN (12):** `ai/FloatingAiOrb.tsx`, `ui/AutoGrowingChatInput.tsx`, `ai/AiAssistantPanel.tsx`, `arena/hooks/useAudioCapture.ts`, `arena/hooks/useCoachVoice.ts`, `arena/hooks/PushToTalk.test.ts`, `ai/panelSizing.ts`, `arena/editorSizing.ts`, `arena/editorSizing.test.ts`, `arena/FocusModeToggle.tsx`, `ide/TestcasePanel.tsx`, `ui/TrackNavMenu.tsx` (it already emits all keys incl. `ALL`; the fix is shell-side).

Backend `question-bank-service`: untouched. No catalog/content changes.

### Gates

- **VP-A** Fence census: `git diff --name-only 0ee7f57 <branch>` ⊆ editable list; count reported.
- **VP-B** Forbidden-zone grep: zero edits across the 12 paths (tolerance 0).
- **VP-C** Test suite with the **G3 four-number report — files / test-cases / assertions / failures**. Assertions = static count of `assert.` occurrences in `frontend/src/**/*.test.*` (suite runs on `node:test`/`node:assert`, not Jest — see §E). State the methodology in the report.
- **VP-D** `tsc -b && vite build` exit 0.
- **VP-E** ≥ 10 new test cases covering AC-1..AC-6, including an interview-mode precedence regression test (AC-6) and an index-reset test (AC-4).
- **VP-F** Z sandbox dynamic reproduction of VP-C/VP-D on push (digit-for-digit).
- **VP-G** Operator visual pass @1080p on the cockpit: click-through DSA → SQL → LLD → HLD → ALL → DSA; screens, rail, and language switch correctly; interview session untouched.

**Baseline (master `0ee7f57`, Z-reproduced 2026-10-09):** suites 31 / tests 272 / assertions 1,083 / failures 0; build exit 0.

### Pre-Flight requirements

Branch `feat/spec-014-track-nav` from `0ee7f57`; full Pre-Flight paste (per AUDIT-PROTOCOL v1.1) declaring: fence acknowledgment, baseline four-number report, explicit declaration of any reused `248006a` hunks, and the interview-mode preservation strategy for AC-6.

## E. C-2 Closure — Assertions Methodology

The long-open C-2 (missing assertions in G3 reports) is **closed**. The frontend suite runs on `node:test` + `node:assert`; Gemini's reported figures are exactly reproducible as the static count of `assert.` occurrences in `*.test.*` files under `frontend/src`:

| Rev | assert.* count | Matches executor claim |
|---|---|---|
| `8048875` (SPEC-012 baseline) | **1,052** | ✔ |
| master tip `0ee7f57` | **1,083** (+31 = `editorSizing.test.ts`) | ✔ |

VP-C reports from SPEC-014 onward must carry all four numbers (files / test-cases / assertions / failures) under this methodology.

## F. Queue State After This Review

1. **SPEC-014** (this doc) — Gemini: author Pre-Flight, then execute.
2. **SPEC-013** (Gaurav blog seed, `61a0912` on origin) — unchanged; spec + license verdict + `dsa/SOURCES.md` + VP-5 originality grep; re-target guard literal 372 → 397 on rebase.
3. **Voice lane** (`useCoachVoice` unmount abort + `AutoGrowingChatInput` request-guard) — requires its own NOTE + Pre-Flight before any code lands.
4. **Operator:** VP-G screenshots for SPEC-012; `origin/hotfix/mic-ptt-affordance` now safely deletable.
