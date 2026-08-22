# 🎯 AI Interview OS — Honest Technical Assessment Engine

An enterprise-grade, autonomous technical interview platform. It pairs a **voice-driven AI bar-raiser** with **real sandboxed code execution** (Judge0 for DSA, an isolated Docker Maven runner for Spring Boot LLD), an **interactive HLD whiteboard** with multimodal vision evaluation, and a **structured 5-dimension rubric** backed by verbatim transcript evidence — with zero canned metrics.

> **Honesty by design:** every score is grounded in real sandbox test results and quoted candidate dialogue. If the execution engine is offline, the platform reports `ENGINE_UNAVAILABLE` — it never fabricates a pass.

---

## 🏗️ Architecture

Spring Cloud microservices (Eureka + Config Server + Gateway) with a React 19 + Vite 8 + Tailwind v4 frontend.

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway-service` | 8080 | Single entry point, routes all `/api/v1/**` |
| `interview-session-service` | 8081 | Sessions, resume ingestion (MongoDB), GridFS attachments, DSA + LLD runners, `/system/capabilities` preflight, storage hygiene |
| `ai-orchestrator-service` | 8082 | Question matching, live dialogue, Whisper STT, rubric + design evaluation |
| `proctor-sentinel-service` | 8083 | Telemetry (tab blur, paste dumps, focus), proctor audit summary |
| `evaluation-report-service` | 8084 | 360° diagnostic scorecard, hiring verdict, 7-day plan |
| `question-bank-service` | 8086 | Centralized problem catalog, resume-aware matching, coaching content |
| `service-discovery-service` | 8761 | Eureka |
| `cloud-config-server` | 8888 | Centralized config (`config-repo/`) |

**Data stores:** PostgreSQL (sessions, reports) · MongoDB (`interviewos` + `questionbank` DBs, GridFS attachments).

**Frontend:** React 19, Vite 8, Tailwind CSS v4 (design tokens in `frontend/src/styles/tokens.css`), Monaco editor, React Flow whiteboard, recharts. Reusable primitives live in `frontend/src/components/ui/`.

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose
- JDK 21 (only if building services locally)
- Node 20+ (frontend dev)
- Optional: an LLM API key (Gemini / Groq / OpenAI) or local Ollama for 100% offline

### 1. Boot infrastructure + core stack
```bash
docker compose up -d
```

### 2. Add execution sandboxes (DSA + LLD)
```bash
docker compose --profile engines up -d
```

| Compose command | What boots | ~Memory | Best for |
|---|---|---|---|
| `docker compose up -d` | Core stack (gateway, services, Mongo, Postgres, QuestionBank) | ~2.5 GB | Behavioral, HLD, resume ingestion, AI dialogue |
| `docker compose --profile engines up -d` | Core + Judge0 CE (server/workers/db/redis) + Docker Maven runner | ~4.5 GB | DSA coding + Spring Boot LLD execution |

### 3. Observability (optional)
```bash
docker compose -f docker-compose.observability.yaml up -d
```
Prometheus + Grafana + Loki + Promtail + Tempo. Grafana dashboards show service health, request latency, 5xx rate, and live logs.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## 🔑 Bring Your Own Key (BYOK)

Keys are stored **only in your browser localStorage** — never on any server. Choose a provider on the Setup screen:

- **Gemini** (Gemini Flash — free tier)
- **Groq** (Llama 3.3 70B — fast & free)
- **OpenAI** (GPT-4o mini)
- **Ollama** (local, zero keys, 100% offline)

Groq is also used for high-accuracy Whisper speech-to-text when available.

---

## 🎓 Interview Tracks

| Track | Execution engine | Format |
|---|---|---|
| Algorithms & Data Structures | Judge0 CE (stdin/stdout, hidden fixtures) | Single-file Monaco (Java / Python / JS) |
| Spring Boot LLD | Isolated Docker Maven runner (JUnit 5, hidden tests) | Multi-file workspace (explorer + tabs + locks) |
| High-Level System Design | React Flow canvas + multimodal vision eval | Drag/drop architecture nodes, PNG export |
| Behavioral & Leadership | Dialogue engine | STAR-method voice conversation |
| Java & Spring Boot | QuestionBank-matched deep dive | Dialogue + code |

---

## 🔒 Sandbox & Security Model

- **Judge0 (DSA):** zero-trust ptrace/cgroup containers, strict CPU/memory/time limits, per-test stdin/expected-output.
- **Maven runner (LLD):** ephemeral `--network none` containers (768 MB / 2 CPU), pre-warmed `~/.m2`, candidate edits confined to an `editablePaths` whitelist, hidden JUnit suites injected server-side.
- **Docker socket** is mounted only into `interview-session-service`. For production, proxy it (e.g. `tecnativa/docker-socket-proxy`) allowing only create/start/wait/delete.
- **Proctoring:** frontal webcam, tab-blur + paste-dump telemetry, single-monitor check, optional dual-camera phone link (QR), focus-loss lockout.

---

## 🧼 Storage Hygiene

- **GridFS attachments** (canvas PNG/JSON, etc.) are purged nightly for sessions `COMPLETED` > `storage.retention-days` (default 14) plus orphans — `StorageHygieneScheduledJob`.
- **Loki** logs retain 168 h with compaction enabled.

---

## 🧪 Honest Evaluation Pipeline

1. **Preflight** — `GET /api/v1/system/capabilities` probes engines, services, and storage; the checklist UI shows per-track readiness and the exact `docker compose --profile engines up -d` hint when a sandbox is offline.
2. **Execution** — real test runs produce `CODE_EXECUTION` transcript turns (`X/Y tests passed (STATUS)`).
3. **Rubric** — the LLM scores 5 dimensions and must attach **verbatim transcript evidence** to each; `rubricCheckpoints` from the QuestionBank ground the evaluation.
4. **Verdict gating** — `HIRE` / `STRONG_HIRE` require ≥ 1 verified passing execution; otherwise the score is capped and the report says so.

---

## 🗺️ API Directory (via gateway :8080)

| Area | Endpoints |
|---|---|
| Sessions | `POST /api/v1/sessions`, `GET /api/v1/sessions/{id}`, `POST /api/v1/sessions/{id}/messages`, `GET /api/v1/sessions/{id}/transcript` |
| Resume | `POST /api/v1/resume/upload`, `POST /api/v1/resume/text` |
| Attachments | `POST /api/v1/sessions/{id}/attachments` (multipart or JSON), `GET .../attachments/{attId}` |
| Execution | `POST /api/v1/sessions/{id}/execute` (DSA), `POST /api/v1/sessions/{id}/execute-project` (LLD) |
| Questions | `GET /api/v1/questions`, `GET /api/v1/questions/{slug}`, `POST /api/v1/questions/match` |
| AI | `POST /api/v1/ai/generate-question`, `/dialogue`, `/transcribe`, `/design-evaluate`, `/rubric-evaluate` |
| Proctor | `POST /api/v1/proctor/events`, `GET /api/v1/proctor/sessions/{id}/summary` |
| Reports | `POST /api/v1/reports/generate/{id}`, `GET /api/v1/reports/sessions/{id}` |
| System | `GET /api/v1/system/capabilities` |

Internal-only (not routed): `GET /internal/v1/questions/{slug}/full`, `POST /internal/v1/questions/import`.

---

## 🧱 Repository Layout

```
ai-interview-os/
├── docker-compose.yaml              # core + `engines` profile
├── docker-compose.observability.yaml
├── docker/lld-runner/               # pre-warmed Maven runner image
├── cloud-config-server/config-repo/ # per-service YAML config
├── api-gateway-service/
├── service-discovery-service/
├── interview-session-service/
├── ai-orchestrator-service/
├── proctor-sentinel-service/
├── evaluation-report-service/
├── question-bank-service/
└── frontend/                        # React + Tailwind v4 + ui/ library
```

---

## 🗺️ Roadmap

**Shipped:** Judge0 DSA sandbox · catalog-driven loop · HLD whiteboard + vision eval · structured rubric · Tailwind v4 design system + `ui/` library · LLD multi-file Maven workspace · QuestionBank + preflight + storage hygiene.

**Planned:** minimal VS Code-style IDE chrome · unified onsite loop (all stages in one session) · session recording & replay (M3) · SQL & DevOps tracks · practice/coaching playground.

---

## 📄 License

Apache License 2.0.