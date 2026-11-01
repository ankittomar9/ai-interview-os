# QB-56 — System-Capabilities Eureka Decoupling & Log Honesty SPEC

| Field | Value |
|---|---|
| **Task ID** | QB-56 |
| **Type** | Remediation spec (deliberate behavior change — receipt re-baseline authorized) |
| **Author** | Z.ai (audit lane), operator-directed |
| **Status** | READY FOR EXECUTION |
| **Base commit** | `9560704` (master at QB-55 closure; spec authored against this tree). Branch from **current** `origin/master` at kickoff — the S6 gates are commit-relative, not anchored to this hash |
| **Predecessor** | QB-55 (`fa82671`…`9560704`) removed the discovery module; this spec disposes of the residual `eureka` contract surface |
| **Decision record** | Operator approved QB-56 as next priority over remaining backlog (2026-11-02). Design decision: **full decoupling** (remove the vestigial key end-to-end) over minimal count-only fix. A hardcoded-`false` field is exactly the zombie-contract pattern QB-55 existed to kill. |
| **Amendment v1.1** | 2026-11-02, operator-directed: consolidated to **single-pass execution** under the new AGENTS.md **G10 two-touch protocol** — ONE commit, ONE execution report, **pre-authorized merge** on green gates (S6), Z audits **post-merge**. Supersedes the v1.0 two-slice / report-before-merge design. |

---

## S0 — Discipline (binding rules)

1. **Single-pass execution; pre-authorized merge (AGENTS.md G10).** Execute the ENTIRE spec (S3.1–S3.5) in ONE commit on the feature branch, then merge to `master` without waiting for the audit lane **iff every pre-authorization condition in S6 is machine-green**. Post the single consolidated report (S7) either way. Any condition failing: STOP, push what exists, report, wait for Z.
2. **Receipt vocabulary is mandatory.** Static four-number = `./scripts/count-tests.sh --markdown`. Executed = surefire `Tests run` per module and `npm test` totals. A suite line must quote **executed** numbers. Conflating the two is a logged process recurrence (QB-18, QB-51, QB-55-A).
3. **This spec intentionally re-baselines the receipt.** Unlike QB-55, the four numbers are NOT frozen. The executor reports **before/after tables plus a line-by-line delta ledger**; every delta must map to an edit enumerated in S3. Digits that move without a ledger line = FAIL.
4. **No improvisation.** Anything not enumerated in S3 is out of scope — report it, don't fix it.
5. One task = one execution commit + one report. No slicing. Commit message: `fix(qb56): system-capabilities eureka decoupling and log honesty (single pass)`.

---

## S1 — Evidence (all machine-verified by Z at `9560704`)

**S1.1 Backend contract.** `interview-session-service/src/main/java/com/interviewos/session/service/SystemCapabilitiesService.java` L170:
```java
services.put("eureka", false); // ADR-004: Eureka retired — hardcoded to runtime truth (QB-55)
```
The response `services` map otherwise carries 5 live probes: `postgres`, `mongo` (DB probes), `orchestrator`, `proctor`, `questionBank` (HTTP health probes).

**S1.2 Frontend logic defect (latent).** `frontend/src/lib/systemStatusAggregate.ts` L53–59:
```ts
export function computeDataStatus(services?: Record<string, boolean>) {
  if (!services) return 'DOWN' as const;
  const count = (services.postgres ? 1 : 0) + (services.mongo ? 1 : 0) + (services.eureka ? 1 : 0);
  if (count === 3) return 'ONLINE' as const;
  if (count > 0) return 'DEGRADED' as const;
  return 'DOWN' as const;
}
```
Since ADR-004 retirement, the backend can never send `eureka: true` → `count` can never reach 3 → this function can never return `'ONLINE'`.

**S1.3 IMPACT CORRECTION (supersedes the backlog claim).** The claim "the cockpit Data Status badge permanently displays DEGRADED" is **inaccurate**. Verified: `SystemStatusPill.tsx` is the ONLY component importing from `systemStatusAggregate`, and it consumes ONLY `computePillStatus` — which never counted `eureka` (it checks `questionBank`, `postgres`, `mongo`, `orchestrator`, `proctor` + 3 engines). The live pill already behaves correctly. `computeDataStatus`, `computeOverallStatus`, `computeSandboxStatus`, `computeIntelligenceStatus` are exported-but-unconsumed by any component (dead code — disposition owned by QB-54/D5, see S5.2).

**S1.4 Test pins.** `frontend/src/lib/systemStatusAggregate.test.ts`:
- L62–66: `test('Data status: ONLINE when postgres, mongo, eureka all true')` — 3 assertions.
- L110: fixture line `eureka: false // note: eureka is ignored as non-core` inside `healthyCapabilities`.
- L210–224: `test('Pill status: eureka false does NOT cause DEGRADED state')` — 1 assertion; tests a payload shape the backend can no longer produce.

**S1.5 Backend test fixture.** `SystemCapabilitiesControllerTest.java` L37–42 mock includes `"eureka", true`. No `$.services.*` jsonPath assertions exist (verified) — the fixture line is assertion-neutral. `SystemCapabilitiesServiceTest.java` contains zero references to the services map (verified) — untouched by this spec.

**S1.6 Startup log falsehoods.** Four Application classes still log "registered with Eureka" at boot:
- `interview-session-service/.../InterviewSessionServiceApplication.java` L21 — "…registered with Eureka/Prometheus."
- `ai-orchestrator-service/.../AiOrchestratorServiceApplication.java` L22 — "…and registered with Eureka."
- `proctor-sentinel-service/.../ProctorSentinelServiceApplication.java` L19 — "…and registered with Eureka."
- `evaluation-report-service/.../EvaluationReportServiceApplication.java` L21 — "…and registered with Eureka."

---

## S2 — Problem statement

Three real defects survive QB-55:
1. **Zombie API contract**: `/api/v1/system/capabilities` emits a `services.eureka` key that is hardcoded `false` forever — a dead field consumed by no one, misleading to any future consumer.
2. **Broken exported helper**: `computeDataStatus` implements a three-service ONLINE rule that is unsatisfiable since ADR-004. It is dead code today, but it is exported public surface — the next consumer inherits a function that can never report ONLINE.
3. **Lying startup logs**: four services claim Eureka registration that has not happened since SPEC-002.

---

## S3 — Change spec (exhaustive; nothing else changes)

**S3.1 Backend key removal** — `SystemCapabilitiesService.java`: delete L170 (`services.put("eureka", false);` and its comment). The `services` map now has exactly 5 keys.

**S3.2 Frontend logic fix** — `systemStatusAggregate.ts` L55–56:
```ts
const count = (services.postgres ? 1 : 0) + (services.mongo ? 1 : 0);
if (count === 2) return 'ONLINE' as const;
```
No other line in the file changes. `computePillStatus` is NOT touched (S5.3).

**S3.3 Frontend test updates** — `systemStatusAggregate.test.ts`:
- **Rewrite L62–66** to:
```ts
test('Data status: ONLINE when postgres and mongo are both true', () => {
  assert.equal(computeDataStatus({ postgres: true, mongo: true }), 'ONLINE');
  assert.equal(computeDataStatus({ postgres: true, mongo: false }), 'DEGRADED');
  assert.equal(computeDataStatus({ postgres: false, mongo: false }), 'DOWN');
  assert.equal(computeDataStatus({ postgres: true, mongo: true, eureka: false }), 'ONLINE'); // regression pin: retired key must not block ONLINE
});
```
(4 assertions, was 3.)
- **Delete L110** fixture line `eureka: false // note: …` from `healthyCapabilities` (the pill tests then exercise the real post-QB-56 payload shape).
- **Delete L210–224** test `test('Pill status: eureka false does NOT cause DEGRADED state')` — its scenario (backend emitting `eureka`) is unreachable after S3.1; the pill never counted it; the S3.3 regression pin covers the retired-key semantics.

**S3.4 Controller fixture hygiene** — `SystemCapabilitiesControllerTest.java`: remove the single line `"eureka", true,` from the L37–42 `Map.of` fixture. No `@Test`, assertion, or display-name changes.

**S3.5 Startup log honesty** — edit only the quoted log strings; no logic:
- ISS L21 → `"🚀 InterviewSessionService is LIVE, initialized JPA Repositories, and instrumented with Prometheus."`
- orch L22 → `"🚀 AiOrchestratorService is LIVE, initialized AI provider adapters (Ollama, Gemini, Groq, OpenAI)."`
- proctor L19 → `"🚀 ProctorSentinelService is LIVE, tracking real-time telemetry (tab switch, paste dump, bursts)."`
- eval L21 → `"🚀 EvaluationReportService is LIVE, configured with OpenFeign clients for Session & Proctor services."`

**S3.6 Receipt re-baseline (Z's predicted digits — executor reports actuals; deltas must match this ledger or be explained):**

| Metric | Before (`9560704`) | Predicted after | Ledger |
|---|---|---|---|
| FE static cases | 329 | **328** | −1 (L210 test deleted) |
| FE static assertions | 1287 | **1287** | +1 (regression pin) −1 (deleted test) = 0 |
| ISS static (files/cases/assertions/skipped) | 44/223/836/1 | **44/223/836/1** | fixture-line edit is count-neutral |
| Orch static | 19/129/482/1 | **19/129/482/1** | log-string edit is count-neutral |
| **Static total** | **116/681/2605/2** | **116/680/2605/2** | |
| FE executed | 329/0F/0S | **328/0F/0S** | |
| Maven reactor executed | 536/0F/4S | **536/0F/4S** | no test-method changes |

The reported actuals become the **new frozen baseline** for post-QB-56 work.

---

## S4 — Verification gates

1. `./scripts/count-tests.sh --markdown` — before/after tables + delta ledger (S3.6).
2. `cd frontend && npm test -- --run` → 0 failures; `npm run build` → exit 0.
3. `mvn -pl interview-session-service surefire:test` (or equivalent) → executed line quoted; 0 failures.
4. Full reactor build green (`mvn install -DskipTests` minimum; full `mvn test` preferred).
5. **VP gates (operator-run, post-rebuild, G1 image-only deploy applies):**
   - **VP-1**: `curl http://localhost:8080/api/v1/system/capabilities` → `services` contains exactly 5 keys, **no `eureka`**.
   - **VP-2**: Cockpit status pill behaves as before (ONLINE with all core services healthy) — proves the key removal broke nothing.
   - **VP-3** (optional, negative): stop MongoDB → pill DEGRADED with "MongoDB Storage down" tooltip.
6. Startup logs of the 4 services no longer contain the string "Eureka".

---

## S5 — Prohibitions

1. No changes to `computePillStatus`, `computeOverallStatus`, `computeSandboxStatus`, `computeIntelligenceStatus`, `EngineCap`, or `SystemCapabilitiesData` types.
2. **Do NOT delete the dead `compute*` helpers** (`computeDataStatus` stays; the other three stay). Their disposal belongs to the QB-54/D5 orphan sweep with its own receipt delta — not here.
3. No API shape change beyond the single key removal. No engine-status, storage, or runtimes changes.
4. `docs/ADR/004` and all historical records untouched. README untouched (makes no eureka claims post-QB-55 — verified).
5. No dependency, routing, or CORS changes. No "improvements while we're here".

---

## S6 — Single pass & merge pre-authorization

ONE commit containing S3.1 + S3.2 + S3.3 + S3.4 + S3.5 (S3.6 is the receipt ledger inside the report, not a code change).

**Pre-authorization conditions — ALL must be machine-green at execution time before merging to `master` without waiting for Z:**

1. **File-set gate**: (a) `git show --name-only --format='' <execution-commit>` returns EXACTLY 8 files: `SystemCapabilitiesService.java`, `systemStatusAggregate.ts`, `systemStatusAggregate.test.ts`, `SystemCapabilitiesControllerTest.java`, and the 4 Application classes (ISS, ai-orchestrator, proctor-sentinel, evaluation-report). (b) Post-merge, `git diff --name-only <master-before-merge>..<master-after-merge>` returns the SAME 8 files — governance/collab commits already on master before the merge are outside this gate. Zero others.
2. **Static receipt gate**: `count-tests.sh` equals the S3.6 predicted table — total **116/680/2605/2** (FE 53/328/1287, ISS 44/223/836/1, orch 19/129/482/1) — OR every digit deviation is explicitly ledger-explained in the report.
3. **Suite gate**: FE executed **328/0F/0S**; Maven reactor executed **536/0F/4S**; FE build exit 0; reactor build exit 0.
4. **Grep gate**: `rg -i eureka` over the 6 modules' `src/main/java` + `src/test/java` → **0 hits**; over `frontend/src` → hits ONLY inside the S3.3 regression pin (`systemStatusAggregate.test.ts`).
5. **Log gate**: the 4 rewritten startup strings contain no "Eureka".

Any condition ✗ → STOP: push, report, wait. VP-1/VP-2 (S4.5) remain operator-run post-rebuild and are NOT merge-blocking (they validate runtime, not the diff).

---

## S7 — Single consolidated report (the ONLY report for this task)

`collab/gemini/QB-56-REPORT.md`, containing: base commit; execution commit; merge commit + the S6 pre-authorization checklist with each condition marked ✓/✗ (if all ✓, state "merged under G10.3 pre-authorization"); file manifest with +/− line counts; static before/after four-number tables; FE + ISS + reactor executed lines (S0.2 vocabulary); delta ledger mapped to S3.6; grep-gate and log-gate output; deviations with reasons; VP-1/VP-2 marked operator-pending. Z audits post-merge per G10.4 and posts `collab/z/QB-56-AUDIT.md`.

## S8 — Non-goals

Dead-code disposal of unconsumed `compute*` exports (→ QB-54/D5); loadbalancer starter audit (separate backlog item 4); offline Maven plugin pinning (backlog item 2); any UI redesign of the status pill; expanding `count-tests.sh` scope (receipt re-baselining decision, separate spec).
