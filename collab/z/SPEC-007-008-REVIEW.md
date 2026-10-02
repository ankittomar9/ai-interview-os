# Z Review — SPEC-007 & SPEC-008 Execution Audit

**Reviewer:** Z.ai (audit lane) · **Date:** 2026-10-03 · **Verdict: BOTH ACCEPTED — MERGE APPROVED** (VP-7 runtime checks deferred to operator, see §4)

## 1. Audit Method

Fetched both branches independently; every claim re-verified against actual diffs — commit topology, file lists vs fence, critical code paths, test quality, four-number consistency, and cross-branch merge compatibility. Claims not re-verified are marked as such.

## 2. SPEC-007 (`fix/spec-007-playground-coach`, base `8aa937a`) — **ACCEPT**

| Area | Verdict | Evidence (Z-verified) |
|---|---|---|
| Fence | **PASS** (1 minor note) | All 11 files match report. Zero forbidden files (`plan-navigation.ts`, `personas.ts`, `FloatingAiOrb.tsx`, learn components untouched). Note: `playgroundPlan.ts`/`sessionUrl.ts` (+tests) are new lib helpers not literally enumerated in the fence — approved as pure, additive, fully tested execution detail. |
| B-1 | **PASS** | Exactly 3 gates (`!isPlayground &&`) at system-instruction (L342), userPrompt (L523), fallback follow-up pool (L894, with correctly-scoped inline `isPlayground`). Interview path byte-identical. Scope expansion vs spec (2 extra gates) is logically required — approved. |
| F-2 | **PASS** | Early-return bypass in `buildCandidateTurnPayload`; interview path untouched. **Wiring verified live**: `useArenaEngines` L69 (`sessionMode==='PLAYGROUND'`) → L92 prop → `useDialogue` L382 → payload. Not dead code. |
| F-1 | **PASS** | All 3 playground ROOM entries synthesize a plan; `handleStartInterview` conditionally (plan missing **or** first section INTRODUCTION) — matches spec's "keep operator-chosen coding sections". |
| F-3 | **PASS** | All 4 ROOM entries push `/session/:id` (incl. interview CHECKLIST→ROOM); popstate refactored to pure `resolvePopStateView` with `sessionIdRef` (no stale closure); initial view on `/session/*` = SETUP (graceful). |
| VP-3 test | **STRONG** | ArgumentCaptor on real system prompt; playground asserts absence of stage-spec header AND anti-code directive; interview regression asserts presence of both. |
| Four numbers | **CONSISTENT** | Backend 13 files / 100 cases / 403 asserts (+30 andExpect +25 verify) / 0 fail (1 skip: no Gemini key). Frontend 41 / 225 / 895 / 0. Cross-checks vs SPEC-008 branch numbers are arithmetically coherent. |

## 3. SPEC-008 (`feat/spec-008-client-telemetry-echo`, base `8b9b5e0`) — **ACCEPT**

| Area | Verdict | Evidence (Z-verified) |
|---|---|---|
| Fence | **PASS** | All 14 files match allowed list; `api.ts` delta is exactly `postClientLogs` (5 lines, `keepalive`, silent catch); zero forbidden files; zero new deps. |
| T-2 | **PASS** | `clientLogger.ts`: allowlist = spec's 9 tags verbatim; banned keys (incl. `apikey`) with recursive sanitize; 50/10s/64KB constants; silent drop. Init in `main.tsx` (App.tsx avoided as required). |
| T-3 | **PASS** | `TelemetryEchoController`: `/api/v1/telemetry/client-logs`, 50/512/64KB validation, reactive, zero repository/Mongo imports. `GlobalLoggingFilter` skip placed before `START_TIME_ATTR` — telemetry POSTs produce zero self-log lines. |
| Route shadowing | **VERIFIED — NONE** | Executor responsibility discharged: `application.yaml` has no `/api/v1/telemetry/**` predicate (11 Path routes checked) → controller reachable locally, no config change needed. |
| T-4 | **PASS** | SelfTimer 3 sites routed with byte-identical literal payloads. `VoiceVideoReportFixes.test.ts` updated at **equal strength** (`clientLog.warn('TIMER_EXTEND_BLOCKED mode=INTERVIEW')` — tag literal preserved, second condition intact). `SectionQuestionBinding.test.ts` correctly left untouched (simulation-based, unaffected). |
| T-1 | **PASS (verify-only, as specced)** | docker_sd confirm-no-change; LogQL query delivered. |
| Four numbers | **CONSISTENT** | Gateway 3 files / 9 cases / 23 asserts / 0 fail. Frontend 40 / 225 / 886 / 0 (41−2 SPEC-007 test files +1 clientLogger.test.ts = 40 ✓). |
| Nit (non-blocking) | | Consent copy line committed inside `docs(spec-008)` commit instead of T-4 slice — slice-hygiene nit only. |

## 4. Merge Ruling & Deferred Items

- **Merge both — `--no-ff`, SPEC-007 first, then SPEC-008.** `git merge-tree` confirms zero conflicts; file sets are disjoint (verified).
- **VP-7 runtime evidence is PENDING for both specs** — Gemini correctly did not fake it (it cannot run the full stack). It did NOT claim fake screenshots; the report's VP-7 wording for SPEC-007 ("now received by Coach Sam…") is reasoning, not runtime proof — treat as unproven until the operator runs the script below.
- **Operator runtime script (post-merge, ~3 min):**
  1. `git pull && cd frontend && npm run dev` → Learn → Modules → Solve "Reverse a String" → expect stepper = `1. Coding & DSA`, URL = `/session/:id`; paste the broken StringBuilder code; ask "what is the issue in this code?" → Coach Sam must diagnose the type mismatch. Back button → returns to Learn.
  2. Refresh on `/session/:id` → lands on SETUP gracefully (documented limitation, not a bug).
  3. Grafana → Explore → `{app="api-gateway-service"} |= "[CLIENT]"` → extend timer in an INTERVIEW session → `TIMER_EXTEND_BLOCKED mode=INTERVIEW` line appears ≤10s.
  4. Stop gateway container mid-session → browser console stays clean, session unaffected (G4 negative path).

## 5. Process Notes for Future Specs

1. Fence lists should explicitly include "pure helper files the executor may create" — avoids ambiguity (SPEC-007).
2. Code changes must never ride in `docs(...)` commits (SPEC-008 nit).
3. When a spec mandates "thread prop X", the executor should state in the report whether the prop already existed (it did here — `isPlayground` was pre-existing on `useDialogue`); a one-line note would have saved audit time.
