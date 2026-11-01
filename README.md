# 🎯 AI Interview OS — Extensible Technical Evaluation Harness & AI Practice Arena

> **An open-source, production-grade technical evaluation harness and developer assessment platform that turns raw LLMs into deterministic, trustworthy technical interviewers and Socratic coaches.**

Run entirely on your laptop with your own API keys, or self-host in an enterprise VPC — with zero canned metrics, true containerized execution sandboxes, and complete data privacy.

---

## 📸 Platform Walkthrough (Visual Tour)

> 📷 *Screenshots will be populated following session recording. The visual gallery highlights the key assessment workflows:*

| Stage / View | Description | Preview |
|---|---|---|
| **1. Setup Studio & Calibration** | Configure candidate seniority (Junior $\to$ Staff), paste Job Description or upload resume PDF for automatic skill matching and rubric calibration. | *`<!-- Screenshot: Setup Studio & Track Selection -->`* |
| **2. Live Proctored Interview** | Dr. Anya Chen (Principal Bar Raiser) conducts a proctored assessment with real-time video HUD, anti-cheat telemetry (tab-blur, paste detection), and audio waveform. | *`<!-- Screenshot: Live Interview with Dr. Anya Chen & Proctor HUD -->`* |
| **3. Minimalist VS Code Arena** | 3-zone high-density workspace: ActivityBar, BreadcrumbBar, Monaco editor, Project Explorer, and bottom test execution drawer. | *`<!-- Screenshot: Multi-file LLD Workspace with Maven Test Runner -->`* |
| **4. React Flow System Design** | Full-canvas interactive whiteboard with drag-and-drop microservice nodes, databases, message queues, protocol connectors, and PNG export. | *`<!-- Screenshot: HLD Whiteboard Architecture Canvas -->`* |
| **5. Playground & Coach Sam** | Unproctored developer practice arena with Coach Sam, offering progressive Socratic hint ladders and targeted bug diagnosis. | *`<!-- Screenshot: Playground Arena with Coach Sam Socratic Panel -->`* |
| **6. Practice Center & Curriculum** | Interactive topic tree (`/learn`) spanning 29 taxonomy topics, 481+ questions, progress tracking, and curated study modules. | *`<!-- Screenshot: Practice Center Curriculum Tree & Modules -->`* |
| **7. 360° Diagnostic Scorecard** | Verbatim transcript evidence, 5-dimension rubric breakdown, hiring recommendation, and a 7-day personalized study roadmap. | *`<!-- Screenshot: 360 Diagnostic Scorecard & Study Plan -->`* |

---

## 🏛️ What is an Evaluation Harness?

A raw LLM cannot safely execute candidate code, grade system designs, prevent hallucinations, or guarantee zero session drops. **The Harness is the deterministic runtime envelope wrapping the model to enforce safety, rigor, and auditability.**

AI Interview OS structures this harness into four foundational pillars:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EVALUATION HARNESS                                     │
│                                                                                        │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │ 1. SENSORS &         │  │ 2. GUARDRAILS &      │  │ 3. EXECUTION                 │  │
│  │    ACTUATORS         │  │    RESILIENCE        │  │    SANDBOXES                 │  │
│  │  • AST Code Analyzer │  │  • 3-Provider Chain  │  │  • Judge0 CE Isolated Sandbox│  │
│  │  • HLD Graph Canvas  │  │    Failover          │  │    (cgroups / ptrace)        │  │
│  │  • Audio Duplex STT  │  │  • Multi-Phase       │  │  • Docker Maven Container    │  │
│  │  • Proctor Sentinel  │  │    JsonCleaner       │  │    (Offline / Network None)  │  │
│  │    (Focus/Paste/HUD) │  │  • Workspace Grounded│  │  • PostgreSQL Isolated       │  │
│  │  • Camera & Mic Chunks│ │    Socratic Fallbacks│  │    Sandbox (Schema & Query)  │  │
│  └──────────┬───────────┘  └──────────┬───────────┘  └──────────────┬───────────────┘  │
│             │                         │                             │                  │
│             ▼                         ▼                             ▼                  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 4. STATE, AUDIT & STORAGE LEDGERS                                                │  │
│  │  • Session State Machine              • Immutable Practice Attempt Ledger        │  │
│  │  • Anti-Cheat Telemetry Ledger        • Derived Mathematical Streak & Activity   │  │
│  │  • Topic Exposure Ledger              • Local Session Auto-Vault (P7-AUTOVAULT)  │  │
│  └────────────────────────────────────┬─────────────────────────────────────────────┘  │
│                                       │                                                │
│                                       ▼                                                │
│                      ┌─────────────────────────────────┐                               │
│                      │    Pluggable LLM Core (BYOM)    │                               │
│                      │  Gemini / Groq / OpenAI / Ollama│                               │
│                      └─────────────────────────────────┘                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Sensors & Actuators (Tools & Inputs)**: Captures candidate code, whiteboard architecture graphs (`HldWhiteboardCanvas.tsx`), push-to-talk audio (`useCoachVoice.ts`), video streams, and proctoring telemetry (`proctor-sentinel-service`) without relying on unstructured model impressions.
2. **Guardrails & Resilience**: A 3-provider failover chain (Primary $\to$ Secondary $\to$ Local Ollama), multi-stage `JsonCleaner` recovery (preventing inner-fence markdown corruption), grounded workspace file templates, and deterministic fallback loops ensuring **zero dropped turns** even during upstream API outages.
3. **Execution Sandboxing**: Zero-trust code execution via Judge0 CE containers (CPU/memory/time bounded), isolated offline Docker Maven runners, and sandboxed PostgreSQL instances. The platform **never hallucinates a test pass** — if the sandbox is unavailable, it reports an honest `ENGINE_UNAVAILABLE`.
4. **State & Storage Ledgers**: Append-only practice attempt ledgers, pure mathematical streak projections, verbatim dialogue transcripts with rubric citations, and cryptographic automated vault archival (`manifest.json` with SHA-256 signatures).

---

## 🎓 Seven Technical Evaluation Tracks

The platform provides dedicated interview screens, evaluation engines, and problem workspaces across 7 core engineering disciplines:

| Track | Execution Sandbox | Workspace & Interactive Tools | Evaluation Focus |
|---|---|---|---|
| **Algorithms & Data Structures (DSA)** | Judge0 CE (ptrace/cgroup isolate; Java, Python 3, JavaScript) | Single-file Monaco IDE with ActivityBar, testcase drawer, and execution telemetry | Time/space complexity, correctness, edge-case coverage, algorithmic optimization |
| **Low-Level Design (LLD / Spring Boot)** | Isolated Docker Maven Runner (`ai-interview-os/lld-runner:latest`, JUnit 5, offline `--network none`) | Multi-file VS Code workspace with Project Explorer, read-only locks, and Surefire reporting | Design patterns, SOLID principles, concurrency, domain modeling, clean code |
| **High-Level System Design (HLD)** | Multimodal Vision Evaluation + Topology Analyzer | Interactive React Flow canvas with microservices, queues, caches, load balancers, and PNG export | Component decomposition, data flow, scalability, trade-off analysis, failure modes |
| **Behavioral & Leadership** | Neural Socratic Dialogue Engine | Interactive audio duplex with real-time waveform, speech-to-text, and voice synthesis | STAR framework, engineering leadership, conflict resolution, technical ownership |
| **SQL & Database Engineering** | Sandboxed PostgreSQL Instance with isolated test schemas | Schema inspector, syntax-highlighted SQL editor, and result-set comparator | Query optimization, indexing strategies, CTEs, window functions, relational modeling |
| **Agentic Engineering & MCP** | Docker Maven Container + Structured Rubric Evaluator | Model Context Protocol (MCP) tool server workspace, schema contracts, JSON-RPC validation | Tool discovery, schema gating, injection defense, subagent permission scoping |
| **System Troubleshooting & DevOps** | Scenario-driven Simulation & Incident Triage | Production logs, metrics dashboards, architectural topologies, and root-cause ledger | Symptom isolation, log analysis, mitigation runbooks, post-mortem rigor |

### 🤖 Agentic Engineering & MCP Track — Deep Dive

The **Agentic Engineering track** (`AGENTIC_ENGINEERING`) evaluates engineers who *build* AI agents — not just use them. Three questions ship today, exercising two distinct evaluation modes:

| Question | Mode | Harness |
|---|---|---|
| `agentic-mcp-order-service` | **Executable code** | Full Maven workspace: hidden JUnit 5 suite injected server-side, offline `--network none` container |
| `agentic-debug-hallucinating-agent` | **Write-up / dialogue** | Architectural review, rubric grading and Socratic dialogue — no automated tests by design |
| `agentic-design-subagent-guardrails` | **Write-up / dialogue** | Same rubric + dialogue evaluation |

**What the executable question's harness enforces** (the `maven-workspace` build profile):
- The candidate implements `com.interviewos.workspace.Solution` — the only file on the `editablePaths` whitelist; the hidden test sources stay read-only.
- The hidden `SolutionTest` pins the MCP tool contract: a valid order (`ORD-123456`) returns `DELIVERED` with `"isError": false`; malformed IDs, unknown orders and blank/null inputs return `"isError": true` with a diagnostic — schema gating, failure isolation and injection-safe error envelopes.
- The question's `pom.xml` **must pin the exact plugin versions pre-warmed into the image** (`maven-resources-plugin` 3.3.1, `maven-compiler-plugin` 3.13.0, `maven-surefire-plugin` 3.5.2 — the effective set of the Spring Boot 3.4.1 skeleton in `docker/lld-runner/`). Unpinned plugins make Maven resolve the latest version from Central, which is unreachable in the offline sandbox and fails the run with `PluginResolutionException`.
- **No vacuous passes**: if a question declares zero test cases, the runner reports `NO_TESTS` — never `PASSED` — and the UI shows an explicit "NO TESTS RAN" warning instead of a success banner.
- Coach Sam grounds every hint and code reveal in the workspace's real file template (package, class name, method signatures), so answers paste cleanly into `Solution.java`.

**Authoring a new agentic question**: add a Markdown file with front-matter (`slug`, `track: AGENTIC_ENGINEERING`, `difficulty`, `kind`, `buildProfile`, `starterFiles`, `editablePaths`, `hiddenTestFiles`) under `question-bank-service/src/main/resources/content/questions/agentic/`, then restart `question-bank-service` — the seeder picks it up automatically. Playground sessions derive the correct Coach persona from the track (`AGENTIC_ENGINEERING` → LLD section, never DSA).

---

## 📚 Problem Catalog & Practice Center (`/learn`)

The platform ships with a comprehensive curriculum of **481 production-grade questions** mapped across **29 taxonomy topics**:

- **Curriculum Tree (`/learn`)**: Browse topics across Data Structures, Algorithms, Distributed Systems, Database Internals, Concurrency, and Agentic Workflows.
- **Detailed Solution Writeups**: Approach taxonomy featuring primary canonical solutions, alternative trade-offs, time/space complexity analysis, and key algorithmic concepts.
- **Playground Practice Arena**: Launch any question in unconstrained practice mode with interactive multi-track switching (DSA ⇄ SQL ⇄ LLD ⇄ HLD).
- **Socratic AI Coach (Coach Sam)**:
  - Guided hints ladder (progressive hints without revealing complete answers prematurely).
  - Explicit code reveals grounded directly in the question's workspace file structure and package declarations.
  - Bug diagnosis and edge-case probing.

---

## 🔌 Bring Your Own Model (BYOM) & Bring Your Own Key (BYOK)

AI Interview OS is completely vendor-agnostic. Keys are stored **strictly in your browser's `localStorage`** — never persisted on any server:

* **Cloud Frontier**:
  - **Google Gemini**: Gemini 2.0 Flash (high-throughput multimodal vision & fast dialogue).
  - **Groq**: Llama 3.3 70B & Whisper Large v3 Turbo (sub-200ms ultra-low latency voice & chat). Server-side fallback uses task-based model routing from `.env`: `GROQ_MODEL_DIALOGUE` (gpt-oss-120b), `GROQ_MODEL_FAST` (gpt-oss-20b), `GROQ_MODEL_EVAL` (qwen3.8-27b), `GROQ_MODEL_STT` (whisper-large-v3-turbo).
  - **OpenAI**: GPT-4o and GPT-4o mini.
* **100% Offline / Self-Hosted**:
  - Local **Ollama** (`qwen2.5-coder:7b`, `llama3.2:3b`) or any OpenAI-compatible **vLLM** endpoint.
* **Hot-Failover (SPEC-018)**: If your primary provider exhausts rate limits or encounters 5xx errors, the orchestrator dynamically fails over to your secondary provider without dropping session context.

---

## 🧭 How to Conduct an Interview (End-to-End)

**Unproctored practice (solo):**

1. Open [http://localhost:5173](http://localhost:5173) → **Practice Center** (`/learn`). Browse the 29-topic curriculum tree, open any question's write-up, then hit **Practice** to launch the Playground Arena.
2. Solve in the track-native workspace (Monaco for DSA, VS Code arena for LLD/Agentic, React Flow canvas for HLD, SQL editor for databases) and use **Coach Sam** for the progressive hint ladder, grounded code reveals and bug diagnosis.

*`<!-- Screenshot: Playground practice loop with Coach Sam hint ladder -->`*

**Proctored evaluation (interviewer-led):**

3. From the Dashboard (`/dashboard`), open the **Setup Studio**: select the evaluation track, calibrate seniority (Junior → Staff), and paste a Job Description or upload the candidate's resume PDF for automatic skill matching and rubric calibration.

*`<!-- Screenshot: Setup Studio — track selection, seniority calibration, JD / resume intake -->`*

4. Start the session — the platform creates it via `POST /api/v1/sessions` (through the gateway) and opens the arena room. For onsite loops, combine tracks into a multi-stage session (DSA ⇄ SQL ⇄ LLD ⇄ HLD) with the StageStepper.
5. Run the interview. Each track renders its native surface: single-file DSA editor with testcase drawer; multi-file LLD/Agentic VS Code arena with **Run Project Tests** (offline Maven, hidden tests injected server-side); HLD whiteboard with drag-and-drop components; SQL editor with live result comparison; Behavioral voice duplex. When proctoring is enabled, the HUD (webcam, tab-blur, paste detection, focus lockout) runs alongside.

*`<!-- Screenshot: Proctored multi-track interview in progress (proctor HUD visible) -->`*

6. Candidates run tests themselves — every verdict comes from the real sandbox: Judge0 for DSA, the offline Maven container for LLD/Agentic, sandboxed PostgreSQL for SQL. A success banner appears **only** when tests actually ran (`totalTests > 0`); a missing engine surfaces an honest `ENGINE_UNAVAILABLE`, and a question without declared tests surfaces `NO_TESTS` — never a fake green.
7. End the session → the **360° Diagnostic Scorecard** renders verbatim transcript evidence, the 5-dimension rubric breakdown, a hiring recommendation and a 7-day study plan.

*`<!-- Screenshot: 360 Diagnostic Scorecard with hiring verdict & study plan -->`*

8. On completion the entire session auto-archives to `VAULT_ROOT` (screen / webcam / audio recordings, transcript, report, code submissions) with a SHA-256-signed `manifest.json` — zero clicks, no browser downloads.

---

## 🔒 100% Local Mode (Zero Cloud Egress)

Run entire technical evaluations on your laptop with zero cloud bills and complete privacy:

1. **Start Ollama** locally:
   ```bash
   ollama run qwen2.5-coder:7b
   ```
2. **Start InterviewOS**:
   ```bash
   docker compose up -d
   ```
3. **Optional Local Neural STT**: Start the Whisper.cpp sidecar:
   ```bash
   docker compose --profile local-stt up -d
   ```
4. **Purity Verification**: The UI displays the green **`🔒 100% Local`** badge confirming zero external requests leave your machine.

---

## 🏗️ System Architecture

Built on Spring Cloud microservices with a modern React 19 + Vite 8 frontend.

| Service | Port | Primary Responsibility | Harness Role |
|---|---|---|---|
| `api-gateway-service` | 8080 | Central entry point, reverse proxy routing `/api/v1/**` | Ingress & Auth Gate |
| `interview-session-service` | 8081 | Sessions, state machine, GridFS, DSA/LLD/SQL runners, `/history` | State & Execution Sandbox |
| `ai-orchestrator-service` | 8082 | Dialogue management, provider failover, Whisper STT, vision eval | Evaluation & Guardrail Engine |
| `proctor-sentinel-service` | 8083 | Anti-cheat telemetry (tab-blur, paste events, focus), audit logs | Sensor & Proctor Ledger |
| `evaluation-report-service` | 8084 | 360° scorecard, rubric evidence extraction, 7-day study plan | Audit & Scoring Ledger |
| `question-bank-service` | 8086 | Curriculum repository (481 questions), topic taxonomy, rubrics | Curriculum & Exposure Ledger |
| `whisper-sidecar` | 8178 | Local Whisper.cpp speech-to-text inference (`--profile local-stt`) | Local Audio Sensor |

**Datastores:** PostgreSQL (sessions, practice attempts, reports) · MongoDB (`interviewos` + `questionbank` DBs, GridFS attachments).

**Frontend:** React 19, Vite 8, Tailwind CSS v4, Monaco Editor, React Flow, Recharts.

---

## 🚀 Quick Start

### Prerequisites
- Docker + Docker Compose (v2), ~6 GB free RAM for the full stack (core + Judge0)
- JDK 21 (only if compiling/testing services locally — must be a full JDK with `javac`; see [Local Development](#️-local-development-build-from-source))
- Node 20+ (for frontend development)
- An LLM API key (Gemini / Groq / OpenAI) or local Ollama — browser-side BYOK, or server-side fallback via `.env`

### 0. Configure Environment
```bash
cp .env.example .env
```
Review `.env`: PostgreSQL / Judge0 credentials, `FRONTEND_ORIGIN`, optional server-side LLM key fallbacks (`GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENAI_API_KEY`), Groq task-routing models, and **`VAULT_ROOT`** — the host directory where completed sessions are auto-archived (default `D:/AI OS Interview Media`; set a path that exists on your machine).

### 1. Boot the Full Stack
```bash
docker compose up -d --build
```
This builds every Spring service **from source** (each module ships its own `Dockerfile`) and starts: PostgreSQL 16, MongoDB 7.0, the Judge0 CE sandbox (db / redis / server / workers), the Docker socket proxy, all backend services, and the frontend (nginx) at `http://localhost:5173`. There is **no separate `engines` profile** — the execution sandboxes are part of the default stack.

### 2. One-Time: Build the Execution Images
The LLD / Agentic / multi-file workspace runners require two images that are **not** pulled from any registry — build them once:
```bash
docker compose --profile build-images build
```
This produces `ai-interview-os/lld-runner:latest` (offline Maven + JUnit 5 on the Spring Boot 3.4.1 skeleton) and `ai-interview-os/workspace:latest` (embedded VS Code server) from `docker/lld-runner/` and `docker/workspace/`.

### 3. Launch the Frontend
The compose stack already serves the UI at [http://localhost:5173](http://localhost:5173). For hot-reload development instead:
```bash
cd frontend && npm install && npm run dev   # dev server proxies /api → localhost:8080
```

| Profile | Command | Adds | When |
|---|---|---|---|
| *(default)* | `docker compose up -d --build` | Full stack incl. Judge0 CE + Docker socket proxy | Always |
| `build-images` | `docker compose --profile build-images build` | `ai-interview-os/lld-runner:latest`, `ai-interview-os/workspace:latest` | Required once, before any LLD / Agentic / workspace run |
| `local-stt` | `docker compose --profile local-stt up -d` | Whisper.cpp sidecar (`:8178`) | 100% offline speech-to-text |

### 4. Verify Your Installation
```bash
docker compose ps                          # all services healthy / running
curl -s http://localhost:8080/api/v1/problems | head -c 400   # question catalog served through the gateway
./scripts/count-tests.sh --markdown        # repository four-number receipt (see below)
```
If the catalog call returns question JSON and the counter prints `116 / 681 / 2605 / 2`, your replication is faithful to the verified baseline.

### 5. Observability Dashboard (Optional)
```bash
docker compose -f docker-compose.observability.yaml up -d
```
Prometheus + Grafana + Loki + Promtail + Tempo at [http://localhost:3000](http://localhost:3000) (`admin`/`admin`).

---

## 🛠️ Local Development (Build From Source)

Prefer compiling outside Docker:

| Tool | Version | Notes |
|---|---|---|
| JDK | **21** (Temurin recommended) | Must be a full JDK — a JRE-only Java 21 (no `javac`) fails with `release version 21 not supported`. Set `JAVA_HOME` explicitly if multiple JVMs are installed. |
| Maven | 3.9.x | Reactor build; run modules individually for speed. |
| Node.js | 20+ | Frontend tests run on the Node test runner via `tsx`. |

```bash
# Backend unit tests (per-module, fast)
mvn test -pl question-bank-service
mvn test -pl interview-session-service

# Frontend
cd frontend && npm install
npm test          # tsx --test over src/**/*.test.ts
npm run build     # tsc -b && vite build

# Repository-wide four-number receipt
./scripts/count-tests.sh --markdown
```

Services read datasource, Mongo, Judge0, Docker-socket and Vault configuration from environment (see `docker-compose.yaml`; per-service configuration in each service's `src/main/resources/application.yaml`). Question content is **auto-seeded**: `QuestionMarkdownSeeder` scans `classpath*:content/questions/**/*.md` at boot, validates every file through `ContentValidator`, and loads the taxonomy from `content/questions/_taxonomy.yaml`. To add a question, drop a Markdown file under `question-bank-service/src/main/resources/content/questions/` and restart `question-bank-service`.

---

## 💾 Data Persistence

All state lives in three named volumes (`postgres_data`, `mongodb_data`, `judge0_db_data`):

| Command | Effect |
|---|---|
| `docker compose down` → `docker compose up -d` | **Safe, routine.** Sessions, streaks, practice attempts, reports, resume data and the question bank all survive. |
| `docker compose down -v` | **Destroys everything** — calendar, streaks, attempts, session questions, resumes. Full reset; never use casually. |

---

## 🔒 Sandbox & Security Architecture

- **Judge0 (DSA Sandbox):** Zero-trust ptrace/cgroup isolates with strict CPU, memory, and timeout limits. Supported: Java (OpenJDK), Python 3, JavaScript (Node.js). *(Note: TypeScript is intentionally disabled due to isolate compilation timeouts).*
- **Maven Runner (LLD & Agentic Sandbox):** Ephemeral `--network none` containers (768 MB RAM, 2 CPUs) based on pre-warmed image `ai-interview-os/lld-runner:latest`. Candidate writes are constrained to an `editablePaths` whitelist; hidden JUnit 5 test suites are injected server-side.
- **SQL Runner (Database Sandbox):** Isolated PostgreSQL databases created per execution with pre-seeded table schemas, data assertions, and query performance checks.
- **Proctor Sentinel:** Frontal webcam HUD, tab-blur tracking, multi-monitor check, paste-dump detection, and focus-loss lockout.

---

## 🗄️ Local Session Auto-Vault (P7-AUTOVAULT)

Completed interviews are automatically archived to the local filesystem with zero clicks, no browser downloads, and a cryptographic manifest (`manifest.json` with SHA-256 signatures for every recording, transcript, report, and code submission):

```
<VAULT_ROOT>/<YYYY-MM-DD>/<HHmm>_<TRACK>_<DIFFICULTY>_<sessionId>/
├── manifest.json
├── report.json
├── report.pdf / report.md
├── transcript.json
├── recordings/
│   ├── screen.webm
│   ├── webcam.webm
│   └── audio.webm
└── submissions/
    └── Solution.java
```

---

## ⚖️ Honest-Judge Test Discipline (Four-Number Reporting)

AI Interview OS operates under the **Honest-Judge Test Standard** (SPEC-019 / QB-44). Every PR, audit, and commit reports verification health using the four-number vocabulary:
$$\text{Test Files (on disk)} \quad / \quad \text{Test Cases} \quad / \quad \text{Assertions} \quad / \quad \text{Skipped}$$

Run the checked-in test counter to verify the exact counts across the reactor:
```bash
./scripts/count-tests.sh --markdown
```

Current verified repository baseline:
| Module | Test Files (on disk) | Test Cases | Assertions | Skipped | Status |
|---|---|---|---|---|---|
| `ai-orchestrator-service` | 19 | 129 | 482 | 1 | PASS |
| `interview-session-service` | 44 | 223 | 836 | 1 | PASS |
| `frontend` | 53 | 329 | 1287 | 0 | PASS |
| **Total / Reactor** | **116** | **681** | **2605** | **2** | **PASS** |

---

## 🗺️ Milestone Roadmap Status

- ✅ **M1 — Real Code Execution**: Judge0 CE container integration with hidden test assertions
- ✅ **M2 — System Design Whiteboard**: React Flow canvas + GridFS attachments + multimodal vision rubric
- ✅ **M3 — Audio/Video Telemetry & AutoVault**: Screen/webcam/audio chunk recording + local filesystem AutoVault
- ✅ **M4 — Evidence-Grounded Scoring**: 5-dimension rubric with verbatim dialogue citations and hiring verdict
- ✅ **M5 — VS Code Arena IDE**: ActivityBar, BreadcrumbBar, StatusBar, test drawers, and multi-mode sizing
- ✅ **M6 — Multi-File LLD Workspace**: Spring Boot project workspaces + offline Docker Maven runner + JUnit 5
- ✅ **M7 — Centralized Question Bank**: 481 questions across 29 topics, capability probe, and curriculum ingestion
- ✅ **M8 — Multi-Stage Onsite Loop**: Multi-track switching (DSA ⇄ SQL ⇄ LLD ⇄ HLD), StageStepper, and proctored flow
- ✅ **SQL Track**: Isolated PostgreSQL database runner with schema generation and query result comparators
- ✅ **Practice / Coaching Playground**: Dedicated `/learn` hub, hints ladder, Coach Sam Socratic assistant
- ✅ **Agentic Engineering Track**: Model Context Protocol (MCP) tool servers, security guardrails, and debugging

---

## 🧱 Repository Layout

```
ai-interview-os/
├── docker-compose.yaml              # Core stack + `build-images`, `local-stt` profiles
├── docker-compose.observability.yaml # Prometheus, Grafana, Loki stack
├── docker/lld-runner/               # Pre-warmed offline Maven runner image
├── scripts/                         # count-tests.sh and automation tools
├── api-gateway-service/             # Port 8080 (Spring Cloud Gateway)
├── interview-session-service/       # Port 8081 (Session state, runners, vault)
├── ai-orchestrator-service/         # Port 8082 (Dialogue, failover, evaluation)
├── proctor-sentinel-service/        # Port 8083 (Telemetry, focus & anti-cheat)
├── evaluation-report-service/       # Port 8084 (360° scorecard, study plan)
├── question-bank-service/           # Port 8086 (Catalog, taxonomy, rubrics)
├── whisper-sidecar/                 # Port 8178 (Local Whisper.cpp STT)
└── frontend/                        # React 19 + Tailwind v4 + VS Code Arena
```

---

## 📄 License

Apache License 2.0. Built for high-signal technical evaluation and developer coaching.
