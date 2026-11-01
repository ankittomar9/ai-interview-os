# QB-55 — Infra Module Removal SPEC (Executor: Gemini)

| Field | Value |
|---|---|
| **Task ID** | `QB-55` |
| **Author** | Z (audit lane) — at operator direction |
| **Base commit** | `76ffa3c` (`origin/master`, post QB-54) |
| **Branch** | `feat/qb55-infra-module-removal` — MUST branch from current master |
| **Priority** | P1 (operator directive) |
| **Decision record** | Operator selected **Option 1 (remove completely)** from the executor's 3-way proposal. Rationale: git history IS the archive (both modules recoverable bit-exact via any prior commit); `docs/ADR/004-edge-service-consolidation.md` already preserves the retirement rationale; an `archive/` tree would keep IDE indexing, stale-doc drift, and a false "supported" signal. If the operator wishes to switch to Option 2, amend this spec BEFORE execution — do not improvise mid-slice. |
| **Hard rule** | **Zero behavior change.** Both target modules are already absent from `docker-compose.yaml` and disabled in every consumer. This task removes dormant weight; it must not alter any runtime path. |

---

## S0. Discipline (carried forward — applies to ALL changes, no exceptions)

1. **Report-before-merge**: every slice gets an execution report to the audit lane BEFORE merge. QB-51 (unreported hotfix) and QB-54 (merge before manifest sign-off) are the documented deviations — this task returns to full compliance.
2. **Four-number receipts** (files / test-cases / assertions / skipped) from `bash scripts/count-tests.sh --markdown`, in every report. Suite lines quote **surefire/runner EXECUTED counts**, never static counts (QB-18 + QB-51 recurrence rule).
3. **Honest-judge**: green receipts only from real runs on your machine. Any suite red at base = stop and report, do not "fix opportunistically".

## S1. Background — what and why (all evidence machine-verified by Z at `76ffa3c`)

- **ADR 004** (`docs/ADR/004-edge-service-consolidation.md`, Status: Accepted 2026-09-03) already retired both services from deployment: discovery (:8761) and config-server (:8888) were replaced by Docker internal DNS (`ai-interview-net`) + direct-URL gateway routing + direct-URL Feign clients. QB-55 completes that ADR by removing the dormant **source modules** and their dead wiring.
- **Runtime proof of deadness**:
  - `docker-compose.yaml` defines NEITHER service; note at L204-206 documents the retirement (~750MB host RAM saved).
  - All 5 backend service yamls hardcode `spring.cloud.config.enabled: false` (L8-9 of each `application.yaml`).
  - All 6 service yamls carry `eureka.client.enabled: ${EUREKA_ENABLED:false}`; compose passes `EUREKA_ENABLED=false` at L220/254/298/318/340/362.
  - Zero `lb://` in ANY live config (the only hits are inside the config-server's own unconsumed `config-repo/` — which contradicts the live gateway config: a drift hazard, see S2).
  - Gateway routes + all Feign clients use direct URLs (`${SESSION_SERVICE_URL:http://interview-session-service:8081}` pattern).
  - `frontend/vite.config.ts` proxies `/api` + `/ws` to `:8080` (gateway) — gateway is the sole ingress and STAYS.
- **Gateway is explicitly OUT of scope for removal** — it hosts the live `TelemetryEchoController` and all routing/CORS/WS-proxying.

## S2. Known liability being removed (do not "fix" it — delete it)

`cloud-config-server/src/main/resources/config-repo/api-gateway-service.yaml` routes via `lb://<service>` while the LIVE `api-gateway-service/src/main/resources/application.yaml` routes via direct URLs. The config-repo is a stale parallel config universe consumed by nobody. It is deleted wholesale with its module — do NOT port, reconcile, or preserve any of it.

## S3. Definition of Done

1. `cloud-config-server/` and `service-discovery-service/` directories no longer exist in the tree.
2. Root `pom.xml` `<modules>` contains exactly: `api-gateway-service`, `interview-session-service`, `ai-orchestrator-service`, `proctor-sentinel-service`, `evaluation-report-service`, `question-bank-service` (6 modules).
3. `spring-cloud-starter-netflix-eureka-client` removed from all 6 remaining module poms that declare it: `api-gateway-service` (L24), `ai-orchestrator-service` (L47), `question-bank-service` (L32), `proctor-sentinel-service` (L64), `interview-session-service` (L72), `evaluation-report-service` (L68).
4. `spring-cloud-starter-config` removed from all 5 module poms that declare it: `ai-orchestrator-service` (L42), `question-bank-service` (L36), `proctor-sentinel-service` (L69), `interview-session-service` (L83), `evaluation-report-service` (L77).
5. Dead yaml noise stripped (verify per-file before each strip; remove ONLY the named blocks, nothing else in the file may change): `eureka:` blocks from the 6 service `application.yaml` files; `spring.cloud.config.enabled: false` block from the 5 backend service yamls.
6. `docker-compose.yaml`: remove the 6 `EUREKA_ENABLED=false` environment lines; update the L204-206 retirement NOTE to state the modules were fully removed under QB-55 (one sentence, references ADR-004). No other compose change.
7. README: no current-state references to the removed modules remain (Repository Layout already omits them — verify); README L364 comment fixed from `# Core stack + 'engines' profile` to the real profile set (`build-images`, `local-stt`) — this closes audit finding QB-54/D6.
8. `docs/ADR/004-edge-service-consolidation.md` is NOT modified (historical decision record).
9. **Receipts gate (must be digit-identical to base)**:
   - Static: `count-tests.sh --markdown` = **116 / 681 / 2605 / 2** (the removed modules were never counted — receipt must not move).
   - Executed: FE `npm test` 329 pass / 0F / 0S + `npm run build` exit 0; orchestrator surefire **129/0F/1S**; ISS surefire **315/0F/1S**; QBS surefire **41/0F/0S**; full `mvn -B test` on the 6-module reactor = BUILD SUCCESS.
   - Repo-wide test-file total drops by exactly 2 (`SystemCapabilities`-class tests? NO — the 2 dropped files are the removed modules' own tests); record it in the delta ledger as an informational line OUTSIDE the four-number receipt.
10. Compose smoke on your machine: `docker compose config -q` passes; `docker compose up -d --build` brings the stack healthy; FE cockpit reaches the gateway and completes one dialogue turn (proves the starters' removal did not change boot behavior).

## S4. Required verification method (per item, before any deletion)

1. Re-run the reference scan yourself at execution time: `rg -n -i "eureka|configserver|spring-cloud-starter-config|netflix-eureka" -g '*.java' -g 'pom.xml' -g '*.yaml' -g '*.yml'` excluding `docs/`, `collab/`, and the two dying modules. Every remaining hit must be either (a) disposed by this spec, or (b) reported with a reason before you touch anything.
2. Grep `docs/` and `collab/` for current-state claims that config-server/discovery are deployed or required. Historical records (ADR, banner'd SPECs, QB reports) are exempt and untouched. If a CURRENT-STATE doc claims they run, report it — do not edit governance files unilaterally.
3. After each slice: full `mvn -B test` + FE `npm test` + `npm run build` + `docker compose config -q`. Slice receipts in the report.
4. `rg -n "service-discovery|cloud-config" README.md docs/*.md` post-removal: only historical hits may remain.

## S5. Hard Prohibitions

- No changes to `content/questions/**`, `docker/`, `judge0-patches/`, `LICENSE`, `collab/**` governance records, `docs/ADR/**`.
- No change to the gateway's routing tables, CORS config, filters, or `TelemetryEchoController` — gateway pom dep-strip (S3.3) and yaml noise-strip (S3.5) ONLY.
- No dependency version bumps, no dependencyManagement edits, no plugin changes, no formatting churn beyond the removal sites.
- No renaming, no "improvements while we're here", no README rewrites beyond S3.7.
- No compose changes beyond S3.6.

## S6. Phased Protocol (each slice = separate report, report-before-merge)

| Slice | Scope | Gate |
|---|---|---|
| **A — config-server removal** | Delete `cloud-config-server/`; root pom module line out; `spring-cloud-starter-config` out of 5 poms (S3.4); `spring.cloud.config.enabled` blocks out of 5 yamls; compose L204-206 note update | Full receipt set + report |
| **B — discovery removal** | Delete `service-discovery-service/`; root pom module line out; `netflix-eureka-client` out of 6 poms (S3.3); `eureka:` blocks out of 6 yamls; compose `EUREKA_ENABLED=false` lines out | Full receipt set + report |
| **C — docs closure** | README L364 fix + current-state reference sweep (S3.7); delta ledger finalization | Receipt set + report |

Slices A and B may be sequential commits on the same branch. A slice is mergeable only after its report is acknowledged by the audit lane.

## S7. Report Template (per slice)

```
Slice ID / base commit / files (N, +X/−Y)
Removed: <list> | Retained-with-reason: <list>
Four-number: before → after (must be identical; delta ledger line-by-line)
Suites: QBS n/0F · ISS n/0F · orch n/0F · FE n pass/0F · FE build exit 0 · mvn reactor BUILD SUCCESS
Compose: config -q OK · up -d healthy · FE→gateway dialogue smoke OK
Behavior-diff proof: none (list anything that even smells behavioral)
```

## S8. Non-Goals (open items live elsewhere — do not absorb them here)

- QB-54/D5: Tier-2 export-level orphan disposition (~137 symbols) — separate follow-up task.
- QB-54/D2/D4: inventory doc corrections — separate follow-up task.
- Receipt-tool scope expansion (QBS + 4 more JVM modules invisible to `count-tests.sh`) — separate follow-up task; do NOT edit `scripts/count-tests.sh` in QB-55.
- `origin/fix/voice-and-track-nav` triage — separate operator decision.
- Any scaling/service-mesh/registry roadmap work. If the project ever needs client-side LB, reintroduce it deliberately via a new ADR — not by resurrecting these modules.
