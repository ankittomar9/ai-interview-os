# 🎯 AI Interview OS — Autonomous Technical Assessment & Learning Engine

An enterprise-grade, autonomous technical interview and developer coaching platform. It pairs a **voice-driven AI bar-raiser** with **real sandboxed code execution** (Judge0 for DSA, an isolated Docker Maven runner for Spring Boot LLD), an **interactive HLD whiteboard** with multimodal vision evaluation, a **minimalist VS Code IDE workspace**, and a **structured 5-dimension rubric** backed by verbatim transcript evidence — with zero canned metrics.

> **Honesty by design:** Every score is grounded in real sandbox test results and quoted candidate dialogue. If the execution engine is offline, the platform reports `ENGINE_UNAVAILABLE` — it never fabricates a pass.

---

## 🏗️ Architecture

Spring Cloud microservices (Eureka + Config Server + Gateway) with a React 19 + Vite 8 + Tailwind v4 frontend.

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway-service` | 8080 | Single entry point, reverse proxy routing all `/api/v1/**` |
| `interview-session-service` | 8081 | Sessions, resume ingestion (MongoDB), GridFS attachments, DSA + LLD runners, `/system/capabilities` preflight, storage hygiene |
| `ai-orchestrator-service` | 8082 | Question matching, live dialogue (grounded in `followUpSeeds`), Whisper STT, rubric + multimodal vision design evaluation |
| `proctor-sentinel-service` | 8083 | Telemetry (tab blur, paste dumps, focus), proctor audit summary |
| `evaluation-report-service` | 8084 | 360° diagnostic scorecard, hiring verdict, 7-day actionable study plan |
| `question-bank-service` | 8086 | Centralized problem catalog, resume-aware matching, coaching curricula & rubric checkpoints |
| `service-discovery-service` | 8761 | Netflix Eureka Service Registry |
| `cloud-config-server` | 8888 | Centralized Git/Native Config Server (`config-repo/`) |

**Data stores:** PostgreSQL (sessions, reports) · MongoDB (`interviewos` + `questionbank` DBs, GridFS attachments).

**Frontend:** React 19, Vite 8, Tailwind CSS v4 (design tokens in `frontend/src/styles/tokens.css`), Monaco editor, React Flow whiteboard, recharts. Reusable design system primitives live in `frontend/src/components/ui/` and IDE chrome components live in `frontend/src/components/ide/`.

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose (v2)
- JDK 21 (only if building services locally: `mvn clean package`)
- Node 20+ (for frontend dev)
- Optional: an LLM API key (Gemini / Groq / OpenAI) or local Ollama for 100% offline assessment

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
Prometheus + Grafana + Loki + Promtail + Tempo. Grafana dashboards at [http://localhost:3000](http://localhost:3000) (`admin`/`admin`) show service health, request latency, 5xx rate, and live logs.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## 🔑 Bring Your Own Key (BYOK)

Keys are stored **only in your browser localStorage** — never on any server. Choose a provider on the Setup screen:

- **Gemini** (Gemini 2.0 Flash — fast multimodal vision + dialogue)
- **Groq** (Llama 3.3 70B & Whisper Large v3 Turbo — sub-200ms speech & chat)
- **OpenAI** (GPT-4o / GPT-4o mini)
- **Ollama** (local `qwen2.5-coder:7b`, zero keys, 100% offline)

Groq is also used for high-accuracy Whisper speech-to-text when available.

---

## 💻 Minimalist VS Code IDE Workspace (M5.5)

The assessment cockpit delivers a distraction-free, high-density 3-zone VS Code experience:

```
┌────┬───────────────────────────────────────┬──────────────────────────────────────────────────────────┐
│ 📋 │ 📑 Problem Specification              │ 📁 Spring Boot LLD Workspace             [ Java 21 ▾ ]   │
│    ├───────────────────────────────────────┼───────────────────────┬──────────────────────────────────┤
│ 🎙️ │ ## Order Service Implementation       │ 📂 Project Explorer   │ 📄 OrderService.java ✖   [+ Tab]  │
│    │                                       │  ▼ src/main/java      │ ──────────────────────────────── │
│ 📊 │ ### Requirements                      │    ▼ controller       │ 1  @Service                      │
│    │ 1. In `OrderController`:              │      📄 OrderCtrl.java │ 2  public class OrderService {   │ Monaco
│    │    • Implement POST /orders           │    ▼ service          │ 3    @Autowired                  │ Editor
│    │ 2. In `OrderService`:                 │      📄 OrderSvc.java  │ 4    private OrderRepo repo;     │
│    │    • Check stock invariant            │    ▼ model 🔒         │ 5  }                             │
│    │                                       │      📄 Order.java    │                                  │
│    │ ### Expected Output                   │  ▼ src/test/java 🔒   │ ──────────────────────────────── │
│    │ `{"status": "CREATED", "id": ...}`    │      📄 OrderTest.java│ Ln 14, Col 5 | Spaces: 4 | UTF-8 │
│    │                                       ├───────────────────────┴──────────────────────────────────┤
│    │                                       │ 🧪 Test Cases (5/5 Passed)                 [ ⬆ Expand ] │ Bottom
│    │                                       │  ✅ CreateOrderPersistsWithCreatedStatus (120ms)         │ Test
│    │                                       │  ✅ InsufficientStockThrowsException (45ms)              │ Drawer
└────┴───────────────────────────────────────┴──────────────────────────────────────────────────────────┘
```

- **ActivityBar**: 40px vertical rail with Explorer, Run action, and Proctor Sentinel indicators.
- **BreadcrumbBar**: File path navigation trail (`src › main › java › com › example › OrderService.java`).
- **StatusBar**: Caret position (`Ln {ln}, Col {col}` subscribing to Monaco caret movements), file encoding, language, and sandbox engine readiness chips (`Judge0 ready` / `Maven ready`).
- **MarkdownProblem**: Rendered markdown problem specifications with structured requirement lists and example assertions.
- **Workspace Lifecycle Guard**: Client-side tab collision detection preventing multiple active workspace tabs for the same session.

---

## 🎓 Interview Tracks

| Track | Execution engine | Workspace Format |
|---|---|---|
| **Algorithms & Data Structures** | Judge0 CE (stdin/stdout, hidden fixtures) | Single-file Monaco IDE with ActivityBar & StatusBar |
| **Spring Boot LLD** | Isolated Docker Maven runner (JUnit 5, hidden suites) | Multi-file workspace (Explorer + Tabs + Read-only Locks) |
| **High-Level System Design** | React Flow canvas + multimodal vision eval | Drag/drop architecture nodes, protocol handles, PNG export |
| **Behavioral & Leadership** | Neural dialogue engine | STAR-method voice conversation with live audio waveform |
| **Java Core & Frameworks** | QuestionBank-matched deep dive | Full dialogue + code review |

---

## 🔒 Sandbox & Security Model

- **Judge0 (DSA):** Zero-trust ptrace/cgroup containers, strict CPU/memory/time limits, per-test stdin/expected-output loops.
- **Maven runner (LLD):** Ephemeral `--network none` containers (768 MB / 2 CPU), pre-warmed `~/.m2`, candidate edits confined to an `editablePaths` whitelist, hidden JUnit suites injected server-side.
- **Docker socket** is mounted exclusively into `interview-session-service`. For production, proxy it (e.g. `tecnativa/docker-socket-proxy`) allowing only create/start/wait/delete.
- **Proctoring:** Frontal webcam HUD, tab-blur + paste-dump telemetry, single-monitor check, optional dual-camera phone link (QR), focus-loss lockout.

---

## 🧼 Storage Hygiene & Retention

- **GridFS attachments** (canvas PNG/JSON, etc.) are purged nightly for sessions `COMPLETED` > `storage.retention-days` (default 14) plus orphans — `StorageHygieneScheduledJob`.
- **Loki** logs retain 168 h (7 days) with compactor enabled.

---

## 🧪 Honest Evaluation Pipeline

1. **Preflight** — `GET /api/v1/system/capabilities` probes engines, services, and storage; the checklist UI shows per-track readiness and the exact `docker compose --profile engines up -d` hint when a sandbox is offline.
2. **Execution** — Real test runs produce `CODE_EXECUTION` transcript turns (`X/Y tests passed (STATUS)` in `Z`ms).
3. **Rubric** — The LLM scores 5 dimensions and must attach **verbatim transcript evidence** to each; `rubricCheckpoints` from the QuestionBank ground the evaluation.
4. **Verdict gating** — `HIRE` / `STRONG_HIRE` require ≥ 1 verified passing execution; otherwise the score is capped and the diagnostic report highlights the gaps.

---

## 🗺️ API Directory (via Gateway `:8080`)

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

*Internal-only (not routed externally):* `GET /internal/v1/questions/{slug}/full`, `POST /internal/v1/questions/import`.

---

## 🧱 Repository Layout

```
ai-interview-os/
├── docker-compose.yaml              # core + `engines` profile
├── docker-compose.observability.yaml
├── docker/lld-runner/               # pre-warmed Maven runner image
├── cloud-config-server/config-repo/ # per-service YAML config
├── api-gateway-service/             # port 8080 (Spring Cloud Gateway)
├── service-discovery-service/       # port 8761 (Eureka)
├── interview-session-service/       # port 8081 (Session & Code Execution)
├── ai-orchestrator-service/         # port 8082 (AI Dialogue & Evaluation)
├── proctor-sentinel-service/        # port 8083 (Telemetry & Anti-Cheat)
├── evaluation-report-service/       # port 8084 (360° Scorecard & Rubric)
├── question-bank-service/           # port 8086 (Curricula & Matching)
└── frontend/                        # React 19 + Tailwind v4 + VS Code IDE chrome
```

---

## 🗺️ Milestone Roadmap

- ✅ **M1** — Real Judge0 CE Sandbox with hidden test execution
- ✅ **M1.5** — Catalog-driven verification loop
- ✅ **M4** — Structured 5-dimension rubric with verbatim evidence
- ✅ **M5.3 & M5.4** — Tailwind v4 design tokens + 13-component `ui/` library + Visual QA
- ✅ **M2** — React Flow HLD whiteboard + GridFS attachments + multimodal vision rubric
- ✅ **M6** — Multi-file Spring Boot LLD workspace + isolated Docker Maven test runner + JUnit 5
- ✅ **M7** — QuestionBank microservice + preflight capability probe + compose profiles + grounded dialogue seeds
- ✅ **M5.5** — Minimalist VS Code IDE chrome (ActivityBar, BreadcrumbBar, StatusBar, MarkdownProblem, Lifecycle Guard)
- ⏸ **M8** — Unified multi-stage onsite loop (Screening ➔ DSA ➔ LLD/HLD ➔ Behavioral in a single session)
- ⏸ **M3** — Session recording, audio/video replay & media retention
- ⏸ **SQL & DevOps Tracks** — PostgreSQL sandbox & query evaluation
- ⏸ **Practice / Coaching Playground** — Developer learning mode surfacing common mistakes and model answers

---

## 📄 License

Apache License 2.0. Built for high-signal technical evaluation and developer coaching.