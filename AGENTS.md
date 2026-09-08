# AGENTS.md — Rules for AI coding agents in this repo

## Repo facts
- Maven multi-module · Java 21 · Spring Boot 3.4.2 · Spring Cloud 2024.0.0
- Modules/ports: service-discovery 8761 · cloud-config 8888 · api-gateway 8080 · interview-session 8081 · ai-orchestrator 8082 · proctor-sentinel 8083 · evaluation-report 8084 · frontend (React 19 + Vite 8, dev 5173 / nginx 80)
- Package roots: com.interviewos.{ai,session,proctor,evaluation,apigatewayservice,servicediscoveryservice,cloudconfigserver}
- Runtime config lives ONLY in cloud-config-server/src/main/resources/config-repo/<service>.yaml. Service-local application.yaml stays minimal (name + config import).
- Frontend calls relative /api/v1/**; proxied by nginx (prod) and vite (dev). Any new WebSocket path must be added to BOTH proxies (nginx needs Upgrade headers).

## Conventions
- Constructor injection via @RequiredArgsConstructor; @Slf4j with sessionId/peerId context; no field @Autowired
- DTOs = Java records with static fromEntity mappers (match existing files)
- New endpoints under /api/v1/...; new config keys in config-repo with ${ENV:default} overrides
- Match the existing *ControllerTest style per module for new tests

## Multi-Machine & Multi-Session Sync (MANDATORY FIRST STEP)
Development occurs across multiple laptops and independent Antigravity sessions with local execution:
- **ALWAYS fetch and merge remote before touching code**: As the very first action of ANY fix, task, or SPEC implementation:
  1. `git fetch origin master`
  2. If on `master`: merge/fast-forward incoming remote commits (`git pull --ff-only origin master` or `git merge origin/master`).
  3. If creating a feature/spec branch: branch directly from updated `origin/master` (e.g. `git checkout -b <branch> origin/master`).
  4. Verify the baseline commit matches `origin/master` and the working tree is clean.
- **NEVER work on stale local refs**: Another laptop or session may have pushed updates. Starting from stale state leads to baseline drift, merge conflicts, and lost progress. Always sync first.

## Guardrails — DO NOT
- Add top-level Maven modules or change ports without asking
- Use H2 for any new feature; new persistent data → MongoDB (existing) or PostgreSQL (target)
- Log request bodies or API keys (GlobalLoggingFilter logs path/IP/latency only — keep it so)
- Hardcode values that have config keys (proctor.scoring.* is currently UNBOUND in code — bind via @ConfigurationProperties before extending)
- Set CORS allowed-origins "*" in anything new
- Fail open on security/integrity paths (unreachable dependency → neutral/deny, never max score)
- Commit .idea/, target/, node_modules/

## Verify before finishing
- mvn clean package -DskipTests (root) green
- cd frontend && npm run build green
- docker compose build succeeds from a CLEAN clone (no local target/) — backend Dockerfiles must stay multi-stage

## Shell rules (hard constraints)
- Run ONE shell command per invocation. Never concatenate commands on a single line.
- NEVER use Remove-Item / rm with wildcards inside the repository.
  If cleanup is needed, delete exact named paths only.
- Pre-task sync: `git fetch origin master` and merge incoming remote changes before editing any files.
- Git workflow: `git add <files>`, then `git commit -m "..."`, then `git push origin <branch>` — separate invocations.
- If a command prompts for confirmation, treat that as a FAILED command and stop.

## Docker hygiene
- After `docker compose build`, run `docker image prune -f`.
- Build only changed services: `docker compose build <service>`, never `--no-cache` unless necessary.

## Architecture Governance & Contracts (Mandatory for AI Agents)
- **Read `docs/` first**: Before proposing or implementing cross-service changes, read [docs/README.md](docs/README.md) and the relevant topic documents.
- **Single Source of Truth**: Active task priorities and acceptance criteria are governed by [docs/SPEC.md](docs/SPEC.md).
- **One spec → One commit**: Keep commits atomic and scoped to a single milestone or spec task.
- **Never rebuild working subsystems**: Honor the hard constraints in `docs/architecture.md` (e.g. do not replace Judge0, do not consolidate polyglot persistence without an accepted ADR, do not bypass the API gateway).
- **Topology changes**: Any service split or merge requires an accepted Architectural Decision Record (see [docs/ADR/](docs/ADR/)).

## Operational Guardrails (SPEC-V2 §3)
```text
G1 — IMAGE-ONLY DEPLOY (hard prohibition)
  Never `docker cp` application jars or build artifacts into running containers.
  Never hot-patch a running service. The only deploy path is:
      docker compose build <services> && docker compose up -d
  If a container seems out of sync with master, the fix is a rebuild — never a patch.
  No exceptions without explicit human approval recorded in the execution report.

G2 — FLYWAY RECEIPTS ARE NEVER FORGED (hard prohibition)
  Never hand-insert, hand-edit, or delete rows in flyway_schema_history.
  Failed migration? In order: (1) fix the migration SQL and re-run;
  (2) `flyway repair`; (3) drop & recreate the dev DB and let migrations
  re-apply from V1. A migration that "needs a hand-forged history row to
  apply" is a bug in the migration. Fix the SQL, not the receipt.

G3 — FOUR-NUMBER TEST REPORTING (mandatory vocabulary)
  files      = test source files executed
  test-cases = executed test cases (node:test `test()` blocks; JUnit "Tests run")
  assertions = actual assert/expect calls executed (node:assert.* calls;
               JUnit: write `n/r` if the runner does not report a count —
               NEVER substitute test-case counts into this slot)
  failures   = failed test-cases; list errors and skipped separately
  Report per module AND a total. A gate claim without its four numbers is
  treated as not run.

G4 — HONEST-JUDGE GATES (standing reminder)
  Every gate: known-good → PASS and deliberately-wrong → FAIL, both pasted.
```