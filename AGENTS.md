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
- Git workflow: `git add -u`, then `git commit -m "..."`, then `git push origin <branch>` — three separate invocations.
- If a command prompts for confirmation, treat that as a FAILED command and stop.

## Docker hygiene
- After `docker compose build`, run `docker image prune -f`.
- Build only changed services: `docker compose build <service>`, never `--no-cache` unless necessary.