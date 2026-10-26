# QB-48 — POST-HOC HOTFIX AUDIT: setup-screen layout + SPEC-019 track cards (master `8fc8e53`)

| | |
|---|---|
| **Auditor lane** | Z (audit lane) |
| **Audited** | hotfix commit `c78e050` merged as `8fc8e53` (parents `3b9f5d6` + `c78e050`); origin/master @ `8fc8e53` |
| **Executor lane** | Gemini (operator-authorized emergency hotfix) |
| **Trigger** | Operator live blocker: launch button clipped off-viewport (<~600px heights); SPEC-019 tracks missing from setup grid |
| **Protocol note** | Merged to master BEFORE Z audit — this is the post-hoc ratification audit (deviation D1, §5) |
| **Date** | 2026-10-27 |

## 1. VERDICT: HOTFIX RATIFIED (post-hoc) — no reverts required

Content PASS on every check (§2–§4). Protocol deviation D1 (executor merge without prior Z authorization) is real but operator-sanctioned — the operator was live-blocked and approved the fix plan in-session — hence ratification with binding process guidance (§5). Master `8fc8e53` becomes the new authorized baseline; the receipt baseline moves **115/669/2531/2** (supersedes QB-47's 2529; assertion-delta provenance closed in §4).

## 2. Topology & scope (machine-captured)

- HEAD == origin/master == `8fc8e53`; working tree clean; no force-push (chain `e130c3a → 489e570 → 5675b8b → 5bcd3da → e983b31 → 158a0b6 → 3b9f5d6 → 8fc8e53` intact and verified).
- Merge shape: `8fc8e53` is a true two-parent merge (`--no-ff`-shaped): p1 = `3b9f5d6` (master tip, incl. Qwen FINAL_APPROVAL `158a0b6` and Z's own QB-47 report commit `3b9f5d6`), p2 = `c78e050` (hotfix branch).
- Merge content-free: `git diff c78e050 8fc8e53` = **0 lines**.
- Scope `git diff 3b9f5d6..8fc8e53 --stat`: exactly **5 frontend files, +116/−51**; **zero changes outside `frontend/`** (backend services, `questions/`, `collab/`, `scripts/`, config all untouched).

| File | Δ lines | Change |
|---|---|---|
| `components/SetupScreen.tsx` | 91 | 3-zone restructure: docked header (`shrink-0`), scrollable body (`flex-1 overflow-y-auto min-h-0`), **permanently docked action bar** (`shrink-0 border-t bg-surface/95 backdrop-blur-md`); card viewport-bounded (`lg:h-[calc(100vh-2.5rem)] lg:max-h-[860px] lg:min-h-[560px]`); outer container regains `overflow-y-auto` |
| `setup/SetupHeroSidebar.tsx` | 2 | sidebar gains `h-full overflow-y-auto` (internal scroll inside the bounded card) |
| `setup/TrackGrid.tsx` | 28 | +`AGENTIC_ENGINEERING` ("Agentic AI", `Bot`, AI HARNESS badge) +`SYSTEM_TROUBLESHOOTING` ("Incident Ops", `AlertTriangle`, INCIDENT badge); both `isTechOnly`; grid → `lg:grid-cols-4` (2×4 with 8 cards) |
| `lib/plan-presets.ts` | 32 | 28-min presets for both tracks (Intro ×1/8m + Core 1–2 items/20m); `CUSTOM_AVAILABLE_DOMAINS` 5→7 (25m defaults); preview label mapping |
| `lib/trackCardsAndCustom.test.ts` | 14 | 6→8 cards, 5→7 domains (assertions **strengthened**); +2 new asserts (plannedTotalMinutes 28 ×2) |

## 3. Code-level review

- **Layout fix is sound and complete.** All four action-bar controls preserved (Practice Center → Catalog fallback chain, Progress Ledger, submit with `loading={isLoading}` and PLAYGROUND-aware label). Submit semantics intact: the `<form>` now wraps the entire right panel; `type="submit"` preserved. The original defect (`min-h-[640px]` card inside `overflow-hidden` pushing the action bar off-viewport with no page scroll) is structurally eliminated on all three breakpoints.
- **Track cards match backend truth.** `AGENTIC_ENGINEERING` / `SYSTEM_TROUBLESHOOTING` are already first-class in `InterviewTrack`/`SessionPlanService` (delivered and audited in SPEC-019 P0–P4); `isTechOnly` is consistent with NON_TECH persona filtering (test asserts visible = `[RESUME_BASED, CUSTOM]`); card order matches the test's `deepStrictEqual`.
- **No test weakening**: the test diff modifies two existing expectations upward (6→8, 5→7) and adds two new assertions; nothing deleted.
- **No smuggled scope**: no changes outside the five files; scratch tooling (`update_code.py`) was used during development and correctly kept out of the commit.
- NITS (cosmetic, non-blocking): (a) stale comment "Grid of 6 Cards (or 2 Cards if Non-tech)" now guards 8 cards; (b) `lg:h-[calc(100vh-2.5rem)]` vs `lg:p-6` outer padding (3rem total) leaves ≤0.5rem residual scroll on short desktop viewports — harmless (outer scrolls), but `calc(100vh-3rem)` would be exact.

## 4. Tests & receipt (Rule M-1, verbatim, machine-captured by Z at `8fc8e53`)

| Module | Test Files (on disk) | Test Cases | Assertions | Skipped | Status |
|---|---|---|---|---|---|
| `ai-orchestrator-service` | 19 | 129 | 482 | 1 | PASS |
| `interview-session-service` | 44 | 220 | 816 | 1 | PASS |
| `frontend` | 52 | 320 | 1233 | 0 | PASS |
| **Total / Reactor** | **115** | **669** | **2531** | **2** | **PASS** |

- FE suite on the canonical runner (`npm test` = `tsx --test`): **320 tests / 42 suites / 0 fail / 0 skipped** — includes the new 8-card, 7-domain and 28-min assertions, all green. `tsc -b && vite build`: exit 0, fresh `dist/`, zero error lines.
- Receipt **digit-identical** to the executor's published receipt. Delta vs QB-47 baseline (115/669/2529/2): **+2 frontend assertions = exactly the two new `assert.strictEqual` calls**; files/cases/skipped unchanged; backend lines unchanged (consistent with the proven zero backend diff). Assertion-delta provenance CLOSED — third consecutive round of executor/reviewer/auditor receipt reconciliation.
- Environment note (Z-side, no repo impact): fresh `npm ci` under npm 11 blocked esbuild's postinstall (all transforms failed until approved + `install.js` re-run). Runner note for all lanes: **the FE harness is `tsx --test` (node:test), not vitest** — a `vitest run` against these files reports 52 spurious "No test suite found" failures; that is harness mismatch noise, not a defect.

## 5. Protocol deviation D1 + binding hotfix lane rules

D1: executor merged to master without prior Z authorization. Mitigations accepted: operator was live-blocked; operator approved the fix plan in-session; change is frontend-only, fully scoped, tested, and now verified. → **Ratified; no revert.**

Binding going forward:

1. **Expedited pre-merge check**: when a hotfix is operator-sanctioned, request the Z-lane ≤5-min check (scope stat + receipt + diff skim) BEFORE `git merge`. Only skip when the operator explicitly declares EMERGENCY — then this post-hoc pattern applies automatically.
2. **Merge-message tag**: every hotfix merge message must cite operator authorization, e.g. `(operator-authorized hotfix, QB-48 lane rules)`.
3. **Same-session receipt**: machine receipt captured and reconciled in the same session as the merge; executor never publishes a receipt the auditor hasn't re-captured (M-1 standing law, now 3 rounds clean).
4. **Runner discipline**: receipts and test claims for `frontend` must come from `tsx --test` / `count-tests.sh`; vitest output is inadmissible for this repo.

## 6. Operator action items

1. **Visual confirmation** (frontend container was rebuilt by Gemini): hard-refresh `http://localhost:5173` (Ctrl+F5) → expect 8 track cards (incl. Agentic AI + Incident Ops) and the "Initialize Proctored Assessment" button permanently visible, including on the ~576px-high viewport that triggered the report.
2. **STILL OUTSTANDING since QB-44 §4**: `ai-orchestrator-service` container image rebuild — never yet confirmed. `docker compose build ai-orchestrator-service` (or `up -d --build`).
3. SPEC-019.1 backlog unchanged (carried from QB-46 §7 / QB-47: config-driven registry, real server tier, interop/timeout tests, P3 images, agentic judge scaffolds, plan-test coverage, non-DSA md validation, SSE handling).
