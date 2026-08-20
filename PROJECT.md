# AI Interview OS - Technical Project Documentation

## Executive Summary

AI Interview OS is an enterprise-grade autonomous technical interview platform built on a microservices architecture. It combines real-time conversational AI interviewers, Monaco-based code IDE, Apache PDFBox resume ingestion pipeline, Groq Whisper neural speech-to-text, real-time proctoring telemetry, and an independent LGTM observability stack.

**Project Type:** Distributed Microservices Platform  
**Primary Language:** Java 21 LTS  
**Framework:** Spring Boot 3.4.2, Spring Cloud 2024.0.0  
**Frontend:** React 19.2.8 + TypeScript + Vite  
**Build Tool:** Maven  
**Containerization:** Docker + Docker Compose  
**Database:** MongoDB 7.0 (Document Store), H2 (Relational)  
**Observability:** LGTM Stack (Loki, Grafana, Tempo, Prometheus)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         React 18 Cockpit UI                      │
│                    (Port 5173 / Port 80)                         │
│  - Monaco Editor, Voice Transcription, Webcam Proctoring HUD    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Spring Cloud API Gateway                       │
│                        (Port 8080)                                │
│  - Reverse Proxy, CORS, Routing, Load Balancing                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Discovery   │    │    Cloud     │    │   Session    │
│   Eureka     │    │Config Server │    │   Service    │
│  (Port 8761) │    │  (Port 8888) │    │  (Port 8081) │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                             │
        ┌────────────────────────────────────┼───────────────────┐
        │                                    │                   │
        ▼                                    ▼                   ▼
┌──────────────┐                   ┌──────────────┐      ┌──────────────┐
│AI Orchestratr│                   │   Proctor    │      │  Evaluation  │
│  (Port 8082) │                   │   Sentinel   │      │   Report     │
└──────┬───────┘                   │  (Port 8083) │      │  (Port 8084) │
       │                           └──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐
│ Host Ollama  │
│/ Groq Whisper│
│  (External)  │
└──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    INDEPENDENT OBSERVABILITY STACK              │
│  Prometheus (9090) | Loki (3100) | Tempo (3200) | Grafana (3000)│
└─────────────────────────────────────────────────────────────────┘
```

### Microservices Overview

| Service | Port | Technology Stack | Primary Responsibilities |
|---------|------|------------------|-------------------------|
| **service-discovery-service** | 8761 | Spring Cloud Netflix Eureka | Dynamic service registration, heartbeat health registry, internal load balancing |
| **cloud-config-server** | 8888 | Spring Cloud Config | Centralized external configuration repository with native profile fallback |
| **api-gateway-service** | 8080 | Spring Cloud Gateway (Netty) | High-throughput reverse proxy, CORS de-duplication, routing, client gateway security |
| **interview-session-service** | 8081 | Spring Boot, MongoDB, PDFBox, H2 | Session lifecycle state machine, resume parser, transcript audit log persistence |
| **ai-orchestrator-service** | 8082 | Spring Boot, RestClient, Groq, Ollama | AI prompt synthesis, conversational turn review, Groq Whisper neural speech-to-text |
| **proctor-sentinel-service** | 8083 | Spring Boot, JPA, WebRTC Telemetry | Real-time candidate proctoring, tab switch tracking, window blur detection, paste dump audits |
| **evaluation-report-service** | 8084 | Spring Boot, OpenFeign, Multi-Dimensional Scorer | 360° candidate scorecard, STAR behavioral analysis, hiring verdicts |
| **frontend** | 5173/80 | React 18, TypeScript, Vite, Monaco | Cockpit UI, Monaco IDE, voice transcription, webcam HUD, transcript audit replay |
| **mongodb** | 27017 | MongoDB 7.0 Document Store | Persistent document storage for resumes and session audit transcripts |

---

## Technology Stack

### Backend Technologies

**Core Framework:**
- Java 21 LTS
- Spring Boot 3.4.2
- Spring Cloud 2024.0.0
- Maven (Multi-module project)

**Microservices Infrastructure:**
- Spring Cloud Netflix Eureka (Service Discovery)
- Spring Cloud Config (Centralized Configuration)
- Spring Cloud Gateway (API Gateway)
- Spring Cloud OpenFeign (Declarative REST Clients)
- Spring Cloud Load Balancer (Client-side Load Balancing)

**Data Persistence:**
- MongoDB 7.0 (Document Store for resumes and transcripts)
- Spring Data MongoDB
- Apache PDFBox 3.0.3 (Resume PDF parsing)
- H2 Database (Relational data for some services)
- Spring Data JPA

**AI & ML Integration:**
- Ollama (Local LLM hosting - qwen2.5-coder:7b)
- Groq Cloud (Whisper LPU acceleration for speech-to-text)
- Google Gemini API (Alternative AI provider)
- RestClient (Spring Boot 3.2+ HTTP client)

**Observability & Monitoring:**
- Micrometer Tracing (Brave)
- Micrometer Registry Prometheus
- Spring Boot Actuator
- LGTM Stack (Loki, Grafana, Tempo, Prometheus)

**Utilities:**
- Lombok (Code generation)
- Jackson (JSON processing)
- Validation API (Input validation)

### Frontend Technologies

**Core Framework:**
- React 19.2.8
- TypeScript 6.0.2
- Vite 8.2.0 (Build tool)

**UI Components & Libraries:**
- Monaco Editor (@monaco-editor/react 4.7.0) - VS Code editor
- Lucide React 1.31.0 - Icon library
- QR Code React 4.2.0 - QR code generation

**Development Tools:**
- ESLint 10.8.0 - Code linting
- @vitejs/plugin-react 6.0.4 - React plugin for Vite
- @vitejs/plugin-basic-ssl 2.3.0 - SSL support

### Infrastructure & DevOps

**Containerization:**
- Docker
- Docker Compose v2
- Multi-stage Docker builds for each service

**Observability Stack (LGTM):**
- Prometheus v2.50.1 - Metrics scraping
- Grafana Loki 3.0.0 - Log aggregation
- Grafana Tempo 2.4.1 - Distributed tracing
- Grafana 10.4.1 - Visualization dashboard
- Promtail 3.0.0 - Log forwarding

---

## Project Structure

```
ai-interview-os/
├── ai-orchestrator-service/          # AI orchestration and speech-to-text
│   ├── src/main/java/com/interviewos/ai/
│   │   ├── client/                   # AI provider clients (Ollama, Groq, Gemini)
│   │   ├── config/                   # AI provider configuration
│   │   ├── controller/               # REST endpoints
│   │   ├── dto/                      # Data transfer objects
│   │   ├── exception/                # Global exception handling
│   │   ├── model/                    # Enums and domain models
│   │   ├── service/                  # Business logic
│   │   └── util/                     # JSON cleaning utilities
│   └── pom.xml
├── api-gateway-service/              # API Gateway and routing
│   ├── src/main/java/com/interviewos/apigatewayservice/
│   │   └── filter/                   # Global logging filter
│   └── pom.xml
├── cloud-config-server/              # Centralized configuration
│   ├── src/main/resources/
│   │   └── config-repo/              # Service-specific configurations
│   │       ├── ai-orchestrator-service.yaml
│   │       ├── api-gateway-service.yaml
│   │       ├── evaluation-report-service.yaml
│   │       ├── interview-session-service.yaml
│   │       └── proctor-sentinel-service.yaml
│   └── pom.xml
├── evaluation-report-service/        # Candidate evaluation and scoring
│   ├── src/main/java/com/interviewos/evaluation/
│   │   ├── client/                   # Feign clients for other services
│   │   ├── controller/               # REST endpoints
│   │   ├── dto/                      # Data transfer objects
│   │   ├── entity/                   # JPA entities
│   │   ├── exception/                # Global exception handling
│   │   ├── model/                    # Enums and domain models
│   │   ├── repository/               # JPA repositories
│   │   └── service/                  # Business logic
│   └── pom.xml
├── interview-session-service/        # Session management and resume parsing
│   ├── src/main/java/com/interviewos/session/
│   │   ├── controller/               # REST endpoints
│   │   ├── document/                 # MongoDB documents
│   │   ├── dto/                      # Data transfer objects
│   │   ├── entity/                   # JPA entities
│   │   ├── exception/                # Global exception handling
│   │   ├── model/                    # Enums and domain models
│   │   ├── repository/               # JPA and MongoDB repositories
│   │   └── service/                  # Business logic
│   └── pom.xml
├── proctor-sentinel-service/        # Real-time proctoring
│   ├── src/main/java/com/interviewos/proctor/
│   │   ├── controller/               # REST endpoints
│   │   ├── dto/                      # Data transfer objects
│   │   ├── entity/                   # JPA entities
│   │   ├── exception/                # Global exception handling
│   │   ├── model/                    # Enums and domain models
│   │   ├── repository/               # JPA repositories
│   │   └── service/                  # Business logic
│   └── pom.xml
├── service-discovery-service/        # Eureka service registry
│   ├── src/main/java/com/interviewos/servicediscoveryservice/
│   └── pom.xml
├── frontend/                         # React TypeScript frontend
│   ├── src/
│   │   ├── components/               # React components
│   │   │   ├── CameraProctorHUD.tsx
│   │   │   ├── DiagnosticReportView.tsx
│   │   │   ├── InterviewRoom.tsx
│   │   │   ├── PhoneProctorView.tsx
│   │   │   ├── PreInterviewChecklist.tsx
│   │   │   └── SetupScreen.tsx
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API service layer
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── App.tsx                  # Main application component
│   │   └── main.tsx                 # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── docker/                           # Docker configurations
│   └── observability/               # LGTM stack configurations
│       ├── dashboards/              # Grafana dashboard definitions
│       ├── grafana-dashboards.yml
│       ├── grafana-datasources.yml
│       ├── loki-config.yml
│       ├── prometheus.yml
│       ├── promtail-config.yml
│       └── tempo-config.yml
├── docs/                             # Additional documentation
│   └── GROQ_WHISPER_AUDIO_ENGINE.md
├── docker-compose.yaml               # Main application services
├── docker-compose.observability.yaml # Observability stack
├── pom.xml                           # Root Maven POM
└── README.md                         # User-facing documentation
```

---

## Core Services Deep Dive

### 1. Service Discovery Service (Eureka)

**Purpose:** Central service registry for dynamic service registration and discovery.

**Key Features:**
- Netflix Eureka Server implementation
- Health check monitoring via Spring Boot Actuator
- Automatic service registration from all microservices
- Client-side load balancing support via Spring Cloud Load Balancer

**Technology Stack:**
- Spring Cloud Netflix Eureka Server
- Spring Boot Actuator

**Port:** 8761

**Health Endpoint:** http://localhost:8761/actuator/health

---

### 2. Cloud Config Server

**Purpose:** Centralized configuration management for all microservices.

**Key Features:**
- Native profile support for local development
- Git-based configuration repository (classpath:/config-repo)
- Service-specific configuration files
- Dynamic configuration refresh
- Integration with Eureka for service discovery

**Technology Stack:**
- Spring Cloud Config Server
- Spring Cloud Netflix Eureka Client
- Native file system backend

**Port:** 8888

**Configuration Repository Structure:**
```
config-repo/
├── application.yaml                  # Default configuration
├── ai-orchestrator-service.yaml    # AI Orchestrator specific config
├── api-gateway-service.yaml        # Gateway specific config
├── evaluation-report-service.yaml  # Evaluation service config
├── interview-session-service.yaml  # Session service config
└── proctor-sentinel-service.yaml   # Proctor service config
```

---

### 3. API Gateway Service

**Purpose:** Single entry point for all client requests, providing routing, load balancing, and cross-cutting concerns.

**Key Features:**
- Spring Cloud Gateway with Netty runtime
- Dynamic route configuration via Eureka service discovery
- Global logging filter for request/response tracking
- CORS handling
- Client-side load balancing via Spring Cloud Load Balancer

**Technology Stack:**
- Spring Cloud Gateway
- Spring Cloud Netflix Eureka Client
- Spring Cloud Load Balancer
- Spring Boot Actuator

**Port:** 8080

**Key Components:**
- `GlobalLoggingFilter`: Logs all inbound requests and outbound responses with latency tracking

---

### 4. Interview Session Service

**Purpose:** Manages interview session lifecycle, resume parsing, and transcript persistence.

**Key Features:**
- Session state machine (INITIALIZED → IN_PROGRESS → COMPLETED)
- MongoDB document storage for resumes and session transcripts
- Apache PDFBox integration for PDF resume parsing
- Dual storage strategy (H2 for relational data, MongoDB for documents)
- Resume text ingestion and skill extraction
- Session duration tracking
- Message transcript persistence with code snapshots

**Technology Stack:**
- Spring Boot Web
- Spring Data MongoDB
- Spring Data JPA with H2
- Apache PDFBox 3.0.3
- Spring Cloud Netflix Eureka Client
- Spring Cloud Config Client
- Spring Boot Actuator
- Micrometer Prometheus

**Port:** 8081

**Key Components:**
- `InterviewSessionService`: Session lifecycle management
- `ResumeParsingService`: PDF resume parsing and text extraction
- `InterviewSessionMongoRepository`: MongoDB document operations
- `InterviewSessionRepository`: H2 relational operations

**Data Models:**
- `InterviewSession`: Session entity with status tracking
- `SessionMessage`: Individual message/code snapshot turns
- `ResumeDocument`: MongoDB document for resume storage
- `InterviewSessionDocument`: MongoDB document for session transcripts

**API Endpoints:**
- `POST /api/v1/sessions` - Create new session
- `POST /api/v1/sessions/{id}/start` - Start session
- `POST /api/v1/sessions/{id}/messages` - Add message/turn
- `POST /api/v1/sessions/{id}/complete` - Complete session
- `POST /api/v1/sessions/resume/upload` - Upload PDF resume
- `POST /api/v1/sessions/resume/text` - Submit text resume
- `GET /api/v1/sessions/resume/transcript/{id}` - Export transcript

---

### 5. AI Orchestrator Service

**Purpose:** Manages AI interactions, question generation, and speech-to-text processing.

**Key Features:**
- Multi-provider AI support (Ollama, Groq, Gemini)
- AI question generation with JSON schema enforcement
- Conversational dialogue processing with follow-up questions
- Groq Whisper LPU acceleration for high-speed speech-to-text (180ms)
- Fallback curated questions for reliability
- JSON cleaning utilities for LLM response parsing
- BYOK (Bring Your Own Key) architecture

**Technology Stack:**
- Spring Boot Web
- Spring Cloud Netflix Eureka Client
- Spring Cloud Config Client
- RestClient (Spring Boot 3.2+)
- Spring Boot Actuator
- Micrometer Prometheus
- Lombok

**Port:** 8082

**Key Components:**
- `AiOrchestratorService`: Core AI orchestration logic
- `WhisperTranscriptionService`: Groq Whisper speech-to-text
- `AiClientFactory`: Multi-provider client factory
- `AiClient`: Interface for AI providers
- `OllamaClient`: Ollama local LLM implementation
- `GeminiClient`: Google Gemini API implementation
- `OpenAiCompatibleClient`: OpenAI-compatible API implementation
- `JsonCleaner`: LLM response JSON extraction

**AI Providers:**
- **Ollama**: Local LLM hosting (qwen2.5-coder:7b default)
- **Groq**: Cloud API with LPU acceleration
- **Gemini**: Google's Gemini API

**API Endpoints:**
- `POST /api/v1/ai/generate-question` - Generate interview question
- `POST /api/v1/ai/dialogue` - Process conversational dialogue
- `POST /api/v1/ai/transcribe` - Speech-to-text via Groq Whisper

**Prompt Engineering:**
- System prompts enforce JSON-only responses
- Curated fallback questions for System Design and DSA tracks
- Context-aware question generation based on resume and job description

---

### 6. Proctor Sentinel Service

**Purpose:** Real-time candidate proctoring and anti-cheating monitoring.

**Key Features:**
- Real-time telemetry event recording
- Tab switch/blur detection
- Large paste dump detection (>100 characters)
- Keystroke burst detection
- Integrity scoring algorithm (0-100)
- Risk level classification (CLEAN, SUSPICIOUS, CHEATING_FLAGGED)
- Anomaly flagging with detailed descriptions

**Technology Stack:**
- Spring Boot Web
- Spring Data JPA with H2
- Spring Cloud Netflix Eureka Client
- Spring Cloud Config Client
- Spring Boot Actuator
- Micrometer Prometheus
- Lombok

**Port:** 8083

**Key Components:**
- `ProctorSentinelService`: Telemetry processing and scoring
- `TelemetryEventRepository`: Event persistence
- `TelemetryEvent`: Individual telemetry events

**Telemetry Event Types:**
- `TAB_BLUR`: Window focus loss
- `PASTE_DUMP`: Large clipboard paste operations
- `KEYSTROKE_BURST`: Unnatural high-frequency typing

**Scoring Algorithm:**
- Tab switch: -5 points per occurrence
- Paste dump: -15 points per occurrence
- Keystroke burst: -10 points per occurrence
- Score capped between 0-100

**Risk Levels:**
- **CLEAN** (85-100): High integrity, natural progression
- **SUSPICIOUS** (60-84): Moderate suspicion, multiple anomalies
- **CHEATING_FLAGGED** (0-59): High cheating risk detected

**API Endpoints:**
- `POST /api/v1/proctor/events` - Record telemetry event
- `GET /api/v1/proctor/sessions/{id}/summary` - Get session proctor summary

---

### 7. Evaluation Report Service

**Purpose:** Generate comprehensive 360° candidate evaluation reports and hiring decisions.

**Key Features:**
- Multi-dimensional scoring (Technical, Problem Solving, Communication, Code Quality, Integrity)
- Hiring verdict generation (STRONG_HIRE, HIRE, LEAN_HIRE, NO_HIRE)
- Premature session detection (<3 minutes or <3 responses)
- OpenFeign integration with Session and Proctor services
- Seven-day study plan generation
- Strengths and weaknesses analysis
- Executive summary generation

**Technology Stack:**
- Spring Boot Web
- Spring Cloud OpenFeign
- Spring Data JPA with H2
- Spring Cloud Netflix Eureka Client
- Spring Cloud Config Client
- Spring Boot Actuator
- Micrometer Prometheus
- Lombok

**Port:** 8084

**Key Components:**
- `EvaluationReportService`: Report generation logic
- `SessionServiceClient`: Feign client for session service
- `ProctorServiceClient`: Feign client for proctor service
- `EvaluationReportRepository`: Report persistence

**Scoring Dimensions:**
- **Technical Accuracy** (0-100): Based on candidate turns and code submissions
- **Problem Solving** (0-100): Algorithmic thinking and approach
- **Communication Clarity** (0-100): Verbal explanation quality
- **Code Quality** (0-100): Implementation and best practices
- **Integrity** (0-100): Proctor sentinel score

**Hiring Verdicts:**
- **STRONG_HIRE**: Aggregate score ≥85, integrity ≥80, ≥2 code submissions
- **HIRE**: Aggregate score ≥72, integrity ≥70, ≥1 code submission
- **LEAN_HIRE**: Aggregate score ≥55
- **NO_HIRE**: Below thresholds or premature session

**API Endpoints:**
- `POST /api/v1/reports/generate/{id}` - Generate diagnostic report
- `GET /api/v1/reports/sessions/{id}` - Fetch existing report

---

### 8. Frontend (React Cockpit)

**Purpose:** User interface for candidate setup, interview room, and report viewing.

**Key Features:**
- React 18 with TypeScript and Vite
- Monaco Editor integration for code editing
- Real-time voice transcription (Web Speech API + Groq Whisper)
- Webcam proctoring HUD with live feed
- Mobile phone companion view via QR code
- Development mode vs Production mode
- Echo-safe text-to-speech for AI responses
- Natural phrase termination detection
- 9-second silence buffer for candidate responses
- Single-play greeting guard
- Scratchpad for architectural notes
- Code test runner with mock execution
- Transcript export functionality

**Technology Stack:**
- React 19.2.8
- TypeScript 6.0.2
- Vite 8.2.0
- Monaco Editor (@monaco-editor/react 4.7.0)
- Lucide React 1.31.0 (Icons)
- QR Code React 4.2.0

**Port:** 5173 (development), 80 (production)

**Key Components:**
- `App.tsx`: Main application router and state management
- `SetupScreen`: Candidate configuration and resume upload
- `PreInterviewChecklist`: Hardware checks and mode selection
- `InterviewRoom`: Main interview interface with voice, code, and proctoring
- `DiagnosticReportView`: Report display and export
- `CameraProctorHUD`: Webcam feed and monitoring
- `PhoneProctorView`: Mobile companion interface

**Voice Features:**
- Dual-pass transcription (Web Speech API + Groq Whisper)
- Echo-safe full-duplex audio
- Natural phrase termination ("that's my answer", "over to you")
- 9.0-second thinking buffer
- AI text-to-speech with automatic mic management

**Proctoring Features:**
- Real-time webcam feed
- Tab switch and blur detection
- Paste dump monitoring
- Window focus tracking
- Mobile phone QR companion link

**Code Editor:**
- Monaco Editor with Java, Python, JavaScript support
- Live syntax highlighting
- Mock test runner with execution feedback
- Architecture scratchpad for notes

---

## Data Models

### Session Management

**InterviewSession (H2 Entity):**
```java
- id: Long
- candidateId: String
- roleTitle: String
- track: InterviewTrack (enum)
- difficulty: DifficultyLevel (enum)
- targetCompany: String
- jobDescription: String
- status: SessionStatus (enum)
- startedAt: Instant
- completedAt: Instant
- durationSeconds: Long
```

**SessionMessage (H2 Entity):**
```java
- id: Long
- session: InterviewSession
- senderRole: String (AI/CANDIDATE)
- messageType: MessageType (enum)
- content: String
- codeSnippet: String
- timestamp: Instant
```

**InterviewSessionDocument (MongoDB):**
```java
- sessionId: Long
- candidateId: String
- candidateName: String
- targetRoleTitle: String
- interviewTrack: String
- seniorityLevel: String
- targetCompany: String
- status: String
- transcript: List<TranscriptTurn>
- createdAt: LocalDateTime
- startedAt: LocalDateTime
- completedAt: LocalDateTime
```

**ResumeDocument (MongoDB):**
```java
- id: ObjectId
- candidateName: String
- rawText: String
- skills: List<String>
- experience: String
- uploadedAt: LocalDateTime
```

### Proctoring

**TelemetryEvent (H2 Entity):**
```java
- id: Long
- sessionId: Long
- eventType: TelemetryEventType (enum)
- characterCount: Integer
- durationSeconds: Long
- metadataDetails: String
- isFlagged: Boolean
- timestamp: Instant
```

### Evaluation

**EvaluationReport (H2 Entity):**
```java
- id: Long
- sessionId: Long
- candidateId: String
- roleTitle: String
- track: String
- difficulty: String
- verdict: HiringVerdict (enum)
- overallScore: Integer
- technicalAccuracyScore: Integer
- problemSolvingScore: Integer
- communicationClarityScore: Integer
- codeQualityScore: Integer
- integrityScore: Integer
- executiveSummary: String
- keyStrengths: List<String>
- areasForImprovement: List<String>
- sevenDayStudyPlan: List<String>
- generatedAt: LocalDateTime
```

---

## API Gateway Routing

The API Gateway routes requests to appropriate microservices based on service discovery via Eureka. Routes are dynamically configured and load-balanced across available service instances.

**Route Patterns:**
- `/api/v1/sessions/**` → interview-session-service
- `/api/v1/ai/**` → ai-orchestrator-service
- `/api/v1/proctor/**` → proctor-sentinel-service
- `/api/v1/reports/**` → evaluation-report-service

**Load Balancing:**
- Client-side load balancing via Spring Cloud Load Balancer
- Round-robin strategy by default
- Health check integration with Eureka

---

## Configuration Management

### Cloud Config Server Structure

**Native Configuration Repository:** `classpath:/config-repo`

**Service-Specific Configurations:**
- Each microservice has its own YAML configuration file
- Centralized management of environment-specific settings
- Support for profile-based configuration (dev, prod, etc.)

**Environment Variables:**
- `SPRING_CONFIG_IMPORT`: Config server URL
- `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE`: Eureka server URL
- `SPRING_DATA_MONGODB_URI`: MongoDB connection string
- `OLLAMA_ENDPOINT`: Ollama LLM endpoint
- `OLLAMA_MODEL`: Default LLM model
- `GROQ_API_KEY`: Groq API key (optional)
- `GEMINI_API_KEY`: Gemini API key (optional)

---

## Observability Stack (LGTM)

### Prometheus (Metrics)
- **Port:** 9090
- **Purpose:** Metrics scraping and time-series database
- **Configuration:** `docker/observability/prometheus.yml`
- **Scrapes:** All Spring Boot Actuator `/actuator/prometheus` endpoints

### Grafana Loki (Logs)
- **Port:** 3100
- **Purpose:** Log aggregation and querying
- **Configuration:** `docker/observability/loki-config.yml`
- **Ingestion:** Promtail forwards Docker container logs

### Promtail (Log Forwarder)
- **Purpose:** Forwards Docker container logs to Loki
- **Configuration:** `docker/observability/promtail-config.yml`
- **Source:** Docker socket `/var/run/docker.sock`

### Grafana Tempo (Tracing)
- **Port:** 3200 (HTTP), 4317 (OTLP gRPC), 4318 (OTLP HTTP)
- **Purpose:** Distributed tracing storage
- **Configuration:** `docker/observability/tempo-config.yml`
- **Protocol:** OpenTelemetry

### Grafana (Visualization)
- **Port:** 3000
- **Credentials:** admin/admin
- **Purpose:** Unified dashboard for metrics, logs, and traces
- **Configuration:** 
  - `docker/observability/grafana-datasources.yml`
  - `docker/observability/grafana-dashboards.yml`
- **Dashboards:** Pre-configured dashboards in `docker/observability/dashboards/`

---

## Build and Deployment

### Prerequisites
- Java 21 LTS
- Maven 3.9+
- Docker Desktop with Compose v2
- Node.js 20+ (for local frontend development)
- Ollama (optional, for local LLMs)

### Build Commands

**Clean compile all microservices:**
```bash
mvn clean package "-DskipTests"
```

**Build individual service:**
```bash
cd <service-directory>
mvn clean package
```

### Docker Deployment

**Start observability stack (independent):**
```bash
docker compose -f docker-compose.observability.yaml up -d
```

**Build and start application services:**
```bash
docker compose build --no-cache
docker compose up -d
```

**Check running containers:**
```bash
docker compose ps
```

**Stop all services:**
```bash
docker compose down
```

### Service Startup Order

1. **MongoDB** - Database initialization
2. **Service Discovery** - Eureka registry
3. **Cloud Config Server** - Configuration server
4. **Business Services** - Session, AI, Proctor, Evaluation
5. **API Gateway** - Gateway (depends on Discovery)
6. **Frontend** - React application (depends on Gateway)

---

## Development Workflow

### Local Development

**Backend Services:**
1. Start MongoDB: `docker compose up mongodb`
2. Start Service Discovery: `cd service-discovery-service && mvn spring-boot:run`
3. Start Cloud Config: `cd cloud-config-server && mvn spring-boot:run`
4. Start business services as needed

**Frontend Development:**
```bash
cd frontend
npm install
npm run dev
```

### Testing Workflow

1. **Resume Upload:** Upload PDF or paste resume text
2. **Skill Extraction:** System extracts technical skills
3. **Pre-Assessment:** Hardware checks (Dev/Prod mode)
4. **Interview Room:** Voice dialogue + code implementation
5. **Report Generation:** 360° diagnostic scorecard
6. **Transcript Export:** Download complete audit log

---

## Key Features

### 1. Resume Ingestion & Parsing
- PDF and plain text support
- Apache PDFBox for PDF parsing
- MongoDB document storage
- Skill extraction and categorization
- AI question tailoring based on resume

### 2. High-Speed Voice Transcription
- Dual-pass transcription (Web Speech API + Groq Whisper)
- 180ms word-for-word accuracy with Groq LPU
- Natural accent recognition (Indian and global)
- 9.0-second silence buffer
- Natural phrase termination detection
- Echo-safe full-duplex audio

### 3. Proctor Sentinel Anti-Cheating
- Real-time webcam monitoring
- Tab switch and blur detection
- Paste dump monitoring
- Integrity scoring algorithm
- Risk level classification
- Mobile phone companion view

### 4. Monaco Editor & Test Runner
- VS Code Monaco Editor integration
- Java, Python, JavaScript support
- Live syntax highlighting
- Mock test runner
- Architecture scratchpad

### 5. Development vs Production Mode
- Dev Mode: Instant launch, bypass hardware checks
- Production Mode: Strict hardware enforcement

### 6. 360° Candidate Evaluation
- Multi-dimensional scoring
- Hiring verdict generation
- Seven-day study plan
- Strengths and weaknesses analysis
- Transcript export

---

## Security Considerations

### Current Implementation
- API Gateway as single entry point
- CORS configuration
- Environment variable for sensitive keys
- Docker network isolation

### Recommendations
- Implement OAuth2/JWT authentication
- Add API rate limiting
- Enable HTTPS/TLS
- Implement role-based access control
- Add input sanitization
- Secure MongoDB with authentication
- Implement secrets management (Vault)

---

## Performance Considerations

### Current Optimizations
- Client-side load balancing
- Connection pooling via RestClient
- MongoDB document storage for large transcripts
- Async non-blocking gateway (Netty)
- Groq LPU acceleration for speech-to-text

### Monitoring
- Prometheus metrics for all services
- Request/response latency tracking
- Error rate monitoring
- Resource utilization tracking

---

## Troubleshooting

### Common Issues

**Services not registering with Eureka:**
- Check Eureka server is running: http://localhost:8761
- Verify `EUREKA_CLIENT_SERVICEURL_DEFAULTZONE` configuration
- Check service health endpoints

**MongoDB connection failures:**
- Verify MongoDB container is running: `docker compose ps mongodb`
- Check connection string in environment variables
- Ensure MongoDB health check passes

**AI provider failures:**
- Verify API keys are set correctly
- Check Ollama is running if using local LLM
- Test API endpoints independently
- Check fallback question generation

**Frontend build issues:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Vite configuration
- Verify API Gateway is accessible

---

## Future Enhancements

### Planned Features
- [ ] OAuth2/JWT authentication
- [ ] Multi-language support
- [ ] Advanced code execution sandbox
- [ ] Video recording of interview sessions
- [ ] Collaborative interviewing (multiple interviewers)
- [ ] Integration with ATS systems
- [ ] Mobile-responsive design improvements
- [ ] Advanced analytics and reporting
- [ ] AI model fine-tuning
- [ ] Real-time collaboration features

### Technical Improvements
- [ ] Kubernetes deployment manifests
- [ ] CI/CD pipeline integration
- [ ] Automated testing suite
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Documentation improvements
- [ ] API versioning strategy
- [ ] Circuit breaker implementation
- [ ] Distributed caching layer
- [ ] Message queue integration (Kafka/RabbitMQ)

---

## Contributing Guidelines

### Code Style
- Follow Java 21 best practices
- Use Lombok for boilerplate reduction
- Implement proper exception handling
- Add logging at appropriate levels
- Write meaningful commit messages

### Testing
- Write unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical flows
- Mock external dependencies (AI providers)

### Documentation
- Update API documentation for changes
- Document configuration changes
- Add comments for complex logic
- Keep README.md updated

---

## License

This project is licensed under the Apache License 2.0. Built for enterprise autonomous technical interviewing and developer talent evaluation.

---

## Contact & Support

For technical issues, questions, or contributions, please refer to the project repository or contact the development team.

---

**Document Version:** 1.0  
**Last Updated:** August 2026  
**Project Version:** 1.0.0-SNAPSHOT
