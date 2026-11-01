> **STATUS: HISTORICAL SPECIFICATION** — Retained for architectural provenance. Current active development and audits are governed by collab/ protocol.

# SPEC-008 — Client Telemetry Echo: Browser Logs into the Loki Pane

**Status:** APPROVED — AWAITING EXECUTION
**Owner lane:** Gemini (execution) · Z.ai (spec + review) · Qwen (originating analysis, adjudicated below)
**Trigger:** Operator directive "we need to this as well" after Qwen's frontend-observability analysis. Session #155-class defects currently require OBS video forensics because browser-side truth (`TIMER_TRANSITION`, `TIMER_EXTEND_BLOCKED`, recorder faults) never leaves the machine.

---

## §0 Problem Statement

The Loki pane shows only backend containers. Everything that mattered in Session #155 — timer stage transitions, blocked timer extensions, `EmptyTrackState` mounts, recorder `onerror` — lives and dies in the browser console. There is no shipper. Result: every frontend/state-machine defect is diagnosed from screen recordings instead of a 30-second LogQL grep.

## §1 Non-Negotiables

- **G-N1 Honest telemetry:** capture is allowlisted by tag; no fabricated or bulk-dumped events.
- **Local-first purity (SPEC-003 doctrine):** events echo to local gateway stdout → Loki. Zero cloud, zero new containers, zero external egress.
- **Never a failure path:** telemetry must be silent, bounded, drop-on-failure. A dead gateway must not produce ONE console error, thrown exception, or retry storm in the browser.
- **Privacy:** no transcript text, no code snapshots, no resume content, no keystrokes, no PII. Enforced in code (banned-key strip) and in tests.
- **Interview frozen:** interview-mode behavior changes are limited to (a) additional log routing and (b) one consent copy line. No flow, timing, or prompt changes.

## §2 Verified Facts Ledger (Z audit of Qwen's proposal — with corrections)

| Qwen claim | Z verdict | Evidence |
|---|---|---|
| "Add frontend container to promtail target list — one relabel change" | **INCORRECT in detail** | promtail-config.yml uses `docker_sd_configs` with **no allowlist** — it already scrapes every container including `frontend-cockpit` (nginx:alpine symlinks access/error logs to stdout). No config change needed when containerized. |
| (implied) nginx logs are a "free win today" | **PARTIALLY** | The operator's dev workflow runs `npm run dev` on the **host** (`localhost:5173`) — no container exists, so nothing reaches docker_sd. Container-scrape is only a win in compose runs. The real gap is browser telemetry (Qwen's point 2) — that part is **correct and is this spec's core**. |
| Option A (echo via gateway stdout) is doctrine-compliant | **CONFIRMED** | `GlobalLoggingFilter` (api-gateway-service) logs every request; promtail scrapes gateway stdout today. Echo design lands `[CLIENT]` lines in the same pane. **One landmine Qwen missed:** the gateway logs EVERY request — telemetry POSTs would self-log (2 lines/batch, feedback amplification). Filter must skip `/api/v1/telemetry/**`. |
| Option B (Grafana Faro) rejected as overkill | **CONFIRMED** | SDK surface + receiver config + version pinning for one laptop-first pane. Rejected. |
| Browser logger replaces raw `console.*` | **CONFIRMED with landmine** | Source-integrity tests assert **literal strings**: `VoiceVideoReportFixes.test.ts` L155 requires `console.warn('TIMER_EXTEND_BLOCKED mode=INTERVIEW')` verbatim in SelfTimer source. Replacing call sites breaks these tests. Integrity tests must be updated to the wrapper form with **equal assertion strength** (see T-4). |
| "Nothing new persisted to Mongo/GridFS" | **CONFIRMED required** | proctor-sentinel-service already owns Mongo-backed `TelemetryEvent` persistence (proctoring). Distinct subsystem — echo controller must hold **no repository dependency**. |

## §3 Design

### T-2 — Frontend `clientLogger.ts` (new, `src/lib/`)

- `clientLog.info/warn/error(tag, msg, ctx?)` — buffers structured events `{ts, level, tag, msg, sessionId?, mode?}`.
- Bounds: ring buffer max **50** events; flush on full or every **10 s**; body cap **64 KB**; `msg` truncated to 200 chars; `ctx` values stringified and truncated.
- Banned keys stripped everywhere: `code`, `transcript`, `resume`, `explanation`, `answer`, `apiKey` (case-insensitive, recursive one level). Unit-tested.
- Transport: `fetch(..., { keepalive: true })` fire-and-forget inside `try/catch`; response never awaited, never inspected; failure ⇒ silent buffer drop. No retry, no backoff, no `console.error` about its own failures.
- Global hooks: `window.addEventListener('error')` + `'unhandledrejection'` with tag `WINDOW_ERROR` / `UNHANDLED_REJECTION` — message + top stack line only, truncated.
- Initialized in **`main.tsx`** (deliberately NOT App.tsx — SPEC-007 owns App.tsx on its fix branch; this avoids cross-spec merge conflicts).
- Allowlisted tags (v1): `TIMER_TRANSITION`, `TIMER_EXTEND_BLOCKED`, `SECTION_HANDOFF`, `EMPTY_TRACK_STATE`, `RECORDER_ERROR`, `MONACO_ERROR`, `PROVIDER_ERROR`, `WINDOW_ERROR`, `UNHANDLED_REJECTION`. Unknown tags dropped in interview mode, allowed in dev (`import.meta.env.DEV`) for future call sites.

### T-3 — Gateway echo endpoint (api-gateway-service)

- New `TelemetryEchoController`: `POST /api/v1/telemetry/client-logs` → `202 Accepted` (or `204`).
- Validation: `events` array ≤ 50; per-event ≤ 512 chars; body ≤ 64 KB ⇒ violations return 400/413 (client drops silently).
- Echo: one `log.info` line per event — `[CLIENT] source=frontend sessionId={} mode={} {} | {}` (tag, message). No persistence, no repository beans, no Mongo.
- `GlobalLoggingFilter`: first line of `filter()` — `if (path != null && path.startsWith("/api/v1/telemetry/")) return chain.filter(exchange);` (skip both INBOUND and OUTBOUND self-logging).
- Route check (executor responsibility): confirm the gateway route table does not proxy `/api/v1/telemetry/**` to another service (controller must be reached locally). If a catch-all route shadows it, add an explicit exclusion — smallest possible change, noted in report.

### T-4 — Instrumentation (Session #155 call sites first)

- `SelfTimer.tsx` L39/L107/L118: route through `clientLog` **preserving the exact literal payloads** (`TIMER_TRANSITION fromSection=… toSection=… displayed=…`, `TIMER_EXTEND_BLOCKED mode=INTERVIEW`).
- `TrackScreenRouter.tsx`: `EMPTY_TRACK_STATE` tag on EmptyTrackState mount (one line).
- Recorder fault path: single `RECORDER_ERROR` tag on the existing `onerror` handler (executor greps for the MediaRecorder hook; one call site only).
- Section handoff: `SECTION_HANDOFF idx=…` at the existing section-transition commit point.
- **Integrity test updates (equal strength, mandatory wording):** `VoiceVideoReportFixes.test.ts` L155 and `Session146TimerRecorderFixes.test.ts` L154 must assert the wrapper form — e.g. source still contains `TIMER_EXTEND_BLOCKED mode=INTERVIEW` as the first argument of a `clientLog.warn(...)` call. Assertion must remain "tag literal present in source + behavior asserted"; deleting or loosening the assertion = fence violation.

### T-1 — Loki/nginx verification (expected zero-change)

- Verify `{container="frontend-cockpit"}` streams into Loki during a compose run (docker_sd should already cover it). If a genuine gap is found, the minimal relabel/target addition in `promtail-config.yml` is pre-approved — report what and why.
- Report includes two ready-made LogQL queries: `{app="api-gateway-service"} |= "[CLIENT]"` and `{container="frontend-cockpit"} | json | status >= 400`.

### Consent honesty (one line)

- `PreInterviewChecklist.tsx`: add one copy line — "Local diagnostics telemetry (UI events only) is collected and stays on this machine." No modal, no toggle.

## §4 VP Gates (all mandatory)

- **VP-1** clientLogger unit tests: 50-event ring eviction; 10 s flush; 64 KB body cap; banned-key stripping (`{code: "…"}` payload arrives without the key); fetch rejects ⇒ no throw, buffer cleared, zero console output.
- **VP-2** Gateway controller tests: happy path echoes N lines / returns 202; 51 events ⇒ 400; >64 KB ⇒ 413; malformed JSON ⇒ 400; **no repository/Mongo bean anywhere in the controller's dependency graph** (assert via context inspection).
- **VP-3** GlobalLoggingFilter skip test: request to `/api/v1/telemetry/client-logs` produces zero `INBOUND REQUEST` / `OUTBOUND` log lines; a control path still logs both.
- **VP-4** Integrity tests updated with equal strength (T-4 wording); full `npm test` green — **four numbers reported** (files / test-cases / assertions / failures).
- **VP-5** `mvn -pl api-gateway-service test` green — four numbers reported.
- **VP-6** `npm run build` passes.
- **VP-7** Manual script (evidence screenshots): (1) trigger `TIMER_EXTEND_BLOCKED` in an INTERVIEW run ⇒ Loki Explore shows `[CLIENT] … TIMER_EXTEND_BLOCKED mode=INTERVIEW` within ~10 s; (2) stop the gateway container mid-session ⇒ browser console stays clean, session continues unaffected (G4 negative path); (3) compose run shows `frontend-cockpit` nginx logs in Loki (T-1).

## §5 Fence (hard)

**Allowed:** `frontend`: `src/lib/clientLogger.ts` (+test, new), `src/main.tsx` (init only), `src/services/api.ts` (add `postClientLogs` only), `src/components/ide/SelfTimer.tsx` (3 call sites), `src/components/arena/TrackScreenRouter.tsx` (1 tag), recorder hook (1 tag), `src/components/PreInterviewChecklist.tsx` (1 copy line), the two integrity test files (equal-strength updates). `api-gateway-service`: `TelemetryEchoController.java` (+test, new), `GlobalLoggingFilter.java` (skip path only), route config exclusion if shadowed (minimal). `docker/observability/promtail-config.yml`: only if T-1 verification proves a real gap.

**Forbidden:** Faro/OpenTelemetry SDKs, new containers or compose services, Mongo/GridFS persistence, proctor-sentinel telemetry reuse, transcript/code/resume capture, prompt/persona/dialogue files, SPEC-006 learn components, SPEC-007 files (App.tsx, useDialogue.ts, turnPayload.ts, ArenaShell.tsx, LearnTree*), weakening any test.

## §6 Branching & Execution Order

- Branch `feat/spec-008-client-telemetry-echo` **cut from master** — zero file overlap with in-flight SPEC-007; both may execute in parallel.
1. `T-2` clientLogger + VP-1 → commit `feat(spec-008): T-2 client telemetry logger with bounded buffer`
2. `T-3` gateway echo + VP-2/3 → commit `feat(spec-008): T-3 gateway client-log echo endpoint`
3. `T-4` instrumentation + integrity updates → commit `feat(spec-008): T-4 route session-155 call sites through clientLog`
4. `T-1` verification + consent line + VP-4..7 → commit `docs(spec-008): publish execution report for Z review`

## §7 Honest Deviations

- Qwen's "add frontend to promtail target list" is corrected to "verify-only" (§2). The dev-workflow gap (host `npm run dev`) is inherent and accepted — Loki cannot see a host process, and we will not containerize the dev server for this.
- Sampling/retention tuning is out of scope; client logs inherit Loki's existing lifecycle unchanged.
- Faro (Option B) permanently rejected unless Option A proves insufficient in a future #155-class incident review.

## §8 Report Template

Per-slice SHAs; four numbers per side (frontend `npm test`, backend `mvn -pl api-gateway-service test`); build result; VP-1..7 evidence with VP-7 screenshots; T-1 verdict (change or no-change with reason); any deviation justified **before** merge. Missing assertion counts = report rejected.
