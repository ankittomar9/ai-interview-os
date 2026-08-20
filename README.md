# 🎙️ AI Interview OS — Enterprise Autonomous Technical Interview Simulator

[![Java 21](https://img.shields.io/badge/Java-21%20LTS-orange.svg)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot 3.4.2](https://img.shields.io/badge/Spring%20Boot-3.4.2-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Spring Cloud 2024.0.0](https://img.shields.io/badge/Spring%20Cloud-2024.0.0-blue.svg)](https://spring.io/projects/spring-cloud)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-blueviolet.svg)](https://reactjs.org/)
[![MongoDB 7.0](https://img.shields.io/badge/Database-MongoDB%207.0%20%2B%20H2-green.svg)](https://www.mongodb.com/)
[![Observability](https://img.shields.io/badge/Observability-LGTM%20(Loki%2C%20Grafana%2C%20Tempo%2C%20Prometheus)-red.svg)](https://grafana.com/)
[![License](https://img.shields.io/badge/License-Apache%202.0-lightgrey.svg)](LICENSE)

**AI Interview OS** is a distributed, enterprise-grade autonomous technical interview platform. It combines real-time conversational AI interviewers, a Monaco-based code IDE, an Apache PDFBox resume ingestion pipeline, Groq Whisper neural speech-to-text, real-time proctoring telemetry, and an independent LGTM observability stack.

---

## 🏛️ System Architecture

```
                                  ┌──────────────────────────┐
                                  │   React 18 Cockpit UI    │
                                  │   (Port 5173 / Port 80)  │
                                  └─────────────┬────────────┘
                                                │
                                                ▼ HTTP / REST
                                  ┌──────────────────────────┐
                                  │   Spring Cloud Gateway   │
                                  │       (Port 8080)        │
                                  └─────────────┬────────────┘
                                                │
       ┌────────────────────────┬───────────────┼───────────────┬────────────────────────┐
       │                        │               │               │                        │
       ▼                        ▼               ▼               ▼                        ▼
┌──────────────┐        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        ┌──────────────┐
│  Discovery   │        │    Cloud     │ │   Session    │ │AI Orchestratr│        │   Proctor    │
│    Eureka    │        │Config Server │ │   Service    │ │   Service    │        │   Sentinel   │
│ (Port 8761)  │        │ (Port 8888)  │ │ (Port 8081)  │ │ (Port 8082)  │        │ (Port 8083)  │
└──────────────┘        └──────────────┘ └──────┬───────┘ └──────┬───────┘        └──────┬───────┘
                                                │                │                       │
                                                ▼                ▼                       ▼
                                       ┌────────────────┐ ┌──────────────┐        ┌──────────────┐
                                       │   MongoDB 7.0  │ │ Host Ollama  │        │  Evaluation  │
                                       │  (Port 27017)  │ │/ Groq Whisper│        │Report Service│
                                       └────────────────┘ └──────────────┘        │ (Port 8084)  │
                                                                                  └──────────────┘

─────────────────────────────────────── INDEPENDENT OBSERVABILITY STACK ───────────────────────────────────────
   ┌────────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
   │   Prometheus   │      │   Grafana Loki │      │  Grafana Tempo │      │    Grafana     │
   │  (Port 9090)   │      │  (Port 3100)   │      │  (Port 3200)   │      │  (Port 3000)   │
   └────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘
```

---

## 📦 Microservices & Port Matrix

| Service | Technology | Port | Primary Responsibilities |
|---|---|---|---|
| **`service-discovery-service`** | Spring Cloud Netflix Eureka | `8761` | Dynamic service registration, heartbeat health registry, and internal load balancing (`lb://`). |
| **`cloud-config-server`** | Spring Cloud Config | `8888` | Centralized external configuration repository with active native profile fallback. |
| **`api-gateway-service`** | Spring Cloud Gateway (Netty) | `8080` | High-throughput reverse proxy, CORS de-duplication, routing, and client gateway security. |
| **`interview-session-service`** | Spring Boot, H2, MongoDB, PDFBox | `8081` | Session lifecycle state machine, Apache PDFBox resume parser, transcript audit log persistence. |
| **`ai-orchestrator-service`** | Spring Boot, RestClient, Groq, Ollama | `8082` | AI prompt synthesis, conversational turn review, Groq Whisper neural speech-to-text (180ms ASR). |
| **`proctor-sentinel-service`** | Spring Boot, JPA, WebRTC Telemetry | `8083` | Real-time candidate proctoring, tab switch tracking, window blur anomaly detection, paste dump audits. |
| **`evaluation-report-service`** | Spring Boot, Multi-Dimensional Scorer | `8084` | 360° candidate scorecard, STAR behavioral analysis, skill radar matrices, hiring verdicts (`STRONG_HIRE` to `NO_HIRE`). |
| **`frontend`** | React 18, TypeScript, Vite, Monaco | `5173` / `80` | Cockpit UI, Monaco IDE, live dual-pass voice transcription, webcam HUD, transcript audit replay. |
| **`mongodb`** | MongoDB 7.0 Document Store | `27017` | Persistent document storage for full candidate resumes (`resumes`) and complete session audit transcripts (`interview_sessions`). |
| **Observability (LGTM)** | Prometheus, Loki, Tempo, Grafana | `3000`, `9090`, `3100`, `3200` | Decoupled monitoring stack for metrics, distributed tracing, live microservice logs, and error alerting. |

---

## 🌟 Key Features

### 1. 📄 Resume Ingestion & Parsing Pipeline (MongoDB + Apache PDFBox)
- Ingests candidate resumes in **PDF** or **plain text** format.
- Extracts candidate name, years of experience, technical skills dictionary (`Java 21`, `Spring Boot`, `Kafka`, `Microservices`, `PostgreSQL`, `Docker`, `GCP`, etc.), and project highlights.
- Persists raw text and structured fields in MongoDB **`interviewos.resumes`** collection with disk volume persistence (`mongodb_data`).
- Grounded AI prompt tailoring: The AI interviewer reads the candidate's actual resume to formulate deep, relevant technical questions.

### 2. 🎙️ High-Speed Voice & Groq Whisper Neural ASR
- **Dual-Pass Transcription**: Real-time client speech streaming for immediate visual typing feedback + **Groq Whisper LPU acceleration** (`whisper-large-v3-turbo`) for 180ms word-for-word accuracy.
- **Accurate Indian & Global Accents**: Recognizes complex names (*"Ankit Singh Tomar"*) and technical terminology (*"Virtual Threads"*, *"LRU Cache"*, *"Kafka Concurrency"*) without mishearing words.
- **Natural Conversational Pauses**: Generous 9.0-second silence thinking buffer with natural wake-phrase termination (*"That's my answer"*, *"Over to you"*, *"I am done"*).
- **Single-Play Greeting Guard**: AI welcome message plays strictly once on launch and never loops or repeats.

### 3. 🛡️ Proctor Sentinel Anti-Cheating HUD
- **Real-Time Webcam Feed**: Frontal camera preview HUD embedded in the interview cockpit.
- **Display Integrity**: Detects external HDMI/multi-monitor setups.
- **Anomalies Tracked**:
  - Window blur and tab switching counter.
  - Large clipboard paste dumps (> 50 characters).
  - Out-of-frame head movement tracking.
- **Companion Dual-Camera QR Link**: Scannable QR code to stream candidate desk feed from a mobile phone on the local network.

### 4. 💻 Monaco Editor & Sandbox Test Runner
- Integrated VS Code Monaco Editor supporting Java, Python, and JavaScript.
- Built-in live compilation test runner evaluating edge cases, capacity eviction, and thread safety.
- **Architecture Thought Scratchpad**: Candidate scratchpad notes read dynamically by the AI to ask deeper architectural trade-off questions.

### 5. 🛠️ Development Mode vs. Strict Production Mode
- **Dev Mode**: Instant bypass option (**`⚡ Instant Launch Interview`**) to skip camera/mic hardware checks during local testing.
- **Production Mode**: Strictly enforces all hardware permissions, single-display verification, and proctoring locks.

### 6. 📊 360° Candidate Diagnostic Scorecard & TXT Export
- Multi-dimensional skill radar scoring across:
  - Technical Correctness & Problem Solving (0–100)
  - Architectural & Concurrency Depth (0–100)
  - Code Cleanliness & Best Practices (0–100)
  - Communication & Behavioral STAR Alignment (0–100)
- Hiring Verdicts: `STRONG_HIRE`, `HIRE`, `LEAN_HIRE`, `NO_HIRE`.
- **1-Click Transcript Export**: Download complete chronological dialogue logs with code snapshots in `.TXT` format for hiring managers.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Java 21 LTS** (`java -version`)
- **Maven 3.9+** (`mvn -v`)
- **Docker Desktop** (with Compose v2)
- **Node.js 20+** (optional, for local frontend dev)
- **Ollama** (optional, for offline local LLMs: `ollama run qwen2.5-coder:7b`)

---

### Step 1: Clean Compile All Microservices
From the project root directory (`D:\ai-interview-os`):

```powershell
# Clean compile all 7 microservices
mvn clean package "-DskipTests"
```

---

### Step 2: Launch Independent Observability Stack (LGTM)
Observability runs in a standalone compose file so restarting application services never kills Grafana:

```powershell
docker compose -f docker-compose.observability.yaml up -d
```
- **Grafana Dashboard**: [http://localhost:3000](http://localhost:3000) (User: `admin` / Password: `admin`)
- **Prometheus Targets**: [http://localhost:9090/targets](http://localhost:9090/targets)
- **Loki Log Explorer**: [http://localhost:3000/explore](http://localhost:3000/explore)

---

### Step 3: Launch Core Application Microservices & MongoDB
```powershell
docker compose build --no-cache
docker compose up -d
```

Check running containers:
```powershell
docker compose ps
```

---

## 🌐 Application URL Directory

| Application / Dashboard | URL | Credentials / Notes |
|---|---|---|
| **AI Interview OS Cockpit** | **[http://localhost:5173](http://localhost:5173)** | React Frontend (Setup, Interview Room, Reports) |
| **Spring Cloud API Gateway** | **[http://localhost:8080](http://localhost:8080)** | Central Reverse Proxy & API Router |
| **Netflix Eureka Registry** | **[http://localhost:8761](http://localhost:8761)** | Live Microservice Discovery Cockpit |
| **Spring Cloud Config Server** | **[http://localhost:8888/actuator/health](http://localhost:8888/actuator/health)** | Configuration Server Health |
| **Grafana 360° Live Dashboard** | **[http://localhost:3000](http://localhost:3000)** | `admin` / `admin` (Live Logs, 5xx Rates, Health) |
| **Prometheus Metrics Engine** | **[http://localhost:9090](http://localhost:9090)** | Application Metrics Scraper |
| **MongoDB Document Store** | **`mongodb://localhost:27017`** | Connect via **MongoDB Compass** (Database: `interviewos`) |

---

## 🔌 API Endpoint Reference

### 1. Interview Session Service (`/api/v1/sessions`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/sessions` | Create a new candidate interview session. |
| `POST` | `/api/v1/sessions/{id}/start` | Transition session to `IN_PROGRESS`. |
| `POST` | `/api/v1/sessions/{id}/messages` | Add a message or code snapshot turn. |
| `POST` | `/api/v1/sessions/{id}/complete` | Complete session and calculate duration. |
| `POST` | `/api/v1/sessions/resume/upload` | Ingest and parse candidate PDF/TXT resume. |
| `POST` | `/api/v1/sessions/resume/text` | Ingest pasted candidate resume text. |
| `GET` | `/api/v1/sessions/resume/transcript/{id}` | Export full session audit transcript JSON. |

### 2. AI Orchestrator Service (`/api/v1/ai`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/ai/generate-question` | Generate a track-tailored technical interview question. |
| `POST` | `/api/v1/ai/dialogue` | Evaluate candidate explanation and generate follow-up. |
| `POST` | `/api/v1/ai/transcribe` | High-speed neural speech-to-text via Groq Whisper LPU. |

### 3. Proctor Sentinel Service (`/api/v1/proctor`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/proctor/events` | Record telemetry anomalies (Tab Switch, Blur, Paste Dump). |
| `GET` | `/api/v1/proctor/sessions/{id}/summary` | Retrieve full proctor audit telemetry summary. |

### 4. Evaluation Report Service (`/api/v1/reports`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/reports/generate/{id}` | Generate multi-dimensional hiring scorecard and verdict. |
| `GET` | `/api/v1/reports/sessions/{id}` | Fetch previously generated diagnostic report. |

---

## 🍃 Inspecting MongoDB with MongoDB Compass

1. Open **MongoDB Compass**.
2. Connect to: `mongodb://localhost:27017`
3. Select database: **`interviewos`**
4. Collections available:
   - **`resumes`**: Stored candidate resumes with raw text, word count, detected skills array, and experience metrics.
   - **`interview_sessions`**: Full session records containing chronological dialogue turns, code submissions, and final verdicts.

### Useful PowerShell Queries:
```powershell
# View all resumes
docker exec -it mongodb mongosh interviewos --eval "db.resumes.find().pretty()"

# View all interview transcripts
docker exec -it mongodb mongosh interviewos --eval "db.interview_sessions.find().pretty()"

# Purge test data
docker exec -it mongodb mongosh interviewos --eval "db.interview_sessions.deleteMany({}); db.resumes.deleteMany({});"
```

---

## ⚙️ Configuration & Environment Variables

Key properties configured in `cloud-config-server` or passed via Docker `.env`:

| Variable | Default Value | Description |
|---|---|---|
| `SPRING_DATA_MONGODB_URI` | `mongodb://mongodb:27017/interviewos` | MongoDB connection string. |
| `OLLAMA_ENDPOINT` | `http://host.docker.internal:11434/api/generate` | Host Ollama local LLM endpoint. |
| `OLLAMA_MODEL` | `qwen2.5-coder:7b` | Default local LLM model name. |
| `GROQ_API_KEY` | *(Optional)* | Groq Cloud API Key for Whisper Speech & Llama models. |
| `GEMINI_API_KEY` | *(Optional)* | Google Gemini API Key. |
| `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` | `http://service-discovery-service:8761/eureka/` | Eureka Discovery server URL. |

---

## 🛠️ Testing Workflow

```
[1. Upload Resume PDF] ➔ [2. Skills Extracted] ➔ [3. Pre-Assessment Checklist (Dev/Prod)]
                                                                  │
                                                                  ▼
[6. Export TXT Transcript] ◄── [5. 360° Diagnostic Report] ◄── [4. Monaco IDE + Voice Dialogue]
```

1. Open **[http://localhost:5173](http://localhost:5173)** in Chrome or Edge.
2. Enter Candidate Name and drop your **PDF resume** into the dropzone.
3. Review the extracted skills badges.
4. Click **Launch Technical Assessment** ➔ Select **Dev Mode** (or Production Mode) ➔ Click **Start Interview**.
5. Speak your solution or write code in the Monaco IDE. Run unit tests using **Run Test Suite**.
6. Conclude the assessment with **End & Report** to generate your hiring scorecard and export the transcript audit log!

---

## 📄 License

This project is licensed under the Apache License 2.0. Built for enterprise autonomous technical interviewing and developer talent evaluation.
