# AI Evaluation Model & Dialogue Architecture

This document defines the intelligence layer of AI Interview OS: real-time Socratic dialogue, automated rubric evaluation, speech recognition, anti-cheat signal synthesis, and deterministic post-guards.

---

## 1. AI Provider Routing & Latency Targets

AI Interview OS adopts a tiered inference architecture prioritizing sub-500ms conversational turnarounds:

| Task Domain | Primary Model | Provider | Target Latency | Purpose |
|---|---|---|---|---|
| **Interviewer Dialogue** | `llama-3.3-70b-versatile` / `gpt-oss-120b` | Groq Cloud | < 500 ms | Socratic coaching, adaptive probing, real-time feedback |
| **Turn Intent Classification** | `llama-3.1-8b-instant` | Groq Cloud | < 180 ms | Fast intent extraction (`EXPLAIN`, `CODE`, `HINT`, `COMPLETE`) |
| **360° Rubric Synthesis** | `qwen-2.5-32b` | Groq Cloud | < 1200 ms | Deep post-session evaluation across 5 competency dimensions |
| **Speech-to-Text (STT)** | `whisper-large-v3` | Groq Audio | < 350 ms | Low-latency candidate voice transcription |
| **Offline Local Fallback** | `qwen2.5-coder:7b` | Ollama (Local) | ~1500 ms | Air-gapped development and offline failover |

---

## 2. Real-Time Dialogue Pipeline

```
[Candidate Mic / Text Input]
            │
            ▼ (POST /api/v1/ai/dialogue)
[AiOrchestratorService.java]
            │
            ├─► 1. Ingests candidateName, currentStage, chatHistory
            ├─► 2. Attaches latestExecution (status, passedTests, totalTests)
            ├─► 3. Injects anti-cheat telemetry (tab switches, paste count)
            │
            ▼ (Generates System & User Prompts)
[Groq / Ollama LPU Inference]
            │
            ▼ (Raw JSON Response)
┌────────────────────────────────────────────────────────┐
│             DETERMINISTIC POST-GUARDS                   │
│                                                        │
│ 1. Anti-Hallucination Verdict Grounding:               │
│    If isExecutionFailed && reply claims tests passed:  │
│    -> Force failure-aware template & set complete=false│
│                                                        │
│ 2. Anti-Inversion Persona Sanitization:                │
│    If reply addresses candidate as "Mickey":           │
│    -> Replace with candidate's actual first name       │
└────────────────────────────────────────────────────────┘
            │
            ▼ (Clean AiDialogueResponse)
[Frontend: AiAssistantPanel / Audio Synthesis]
```

### Deterministic Post-Guards Implementation

To guarantee platform honesty and persona discipline, [`AiOrchestratorService.java`](../ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java) executes two deterministic post-guards after LLM completion:

```java
// POST-GUARD 1: Verdict Grounding
if (isExecutionFailed && reply.matches("(?i).*all (\\d+ )?(test cases? )?(passed|pass).*")) {
    log.info("POST-GUARD: Replaced LLM reply that incorrectly claimed tests passed");
    reply = String.format(
        "I noticed your latest test run had %d/%d test cases passing. Let's debug this together...",
        passedTests, totalTests
    );
    isSolutionComplete = false;
    recommendedAction = "OFFER_HINT";
}

// POST-GUARD 2: Anti-Inversion Persona Sanitization
if (reply.matches("(?i).*\\b(mickey|dr\\.? anya chen)\\b.*")) {
    log.info("POST-GUARD: Sanitized persona name inversion from reply");
    String properName = (candidateName != null && !candidateName.isBlank())
            ? candidateName.trim().split("\\s+")[0]
            : "there";
    reply = reply.replaceAll("(?i)\\b(mickey|dr\\.? anya chen)\\b", properName);
}
```

---

## 3. Rubric Scoring Model (Track-Specific Schemas — SPEC-004)

After an interview session finishes, [`evaluation-report-service`](../evaluation-report-service) and [`ai-orchestrator-service`](../ai-orchestrator-service) evaluate the session transcript across **track-specific rubric schemas**, guaranteeing that non-coding interviews (Behavioral, Resume, System Design) are assessed against track-relevant dimensions rather than mismatched coding criteria.

### Track-Specific Dimensions

#### 1. CODING (`ALGORITHMS_DATA_STRUCTURES`, `JAVA_SPRING_BOOT`, `SPRING_LLD`, `SQL`)
| Dimension | Weight | Criteria Evaluated |
|---|---|---|
| **ALGORITHMIC_REASONING** | 30% | Big-O time and space complexity, optimal data structures |
| **CODE_QUALITY** | 20% | Idiomatic syntax, clean naming, modularity, readability |
| **REQUIREMENTS_CLARIFICATION** | 20% | Clarifying questions, boundary definitions, constraint checks |
| **COMMUNICATION_CLARITY** | 15% | Structured explanations, professional cadence, responsiveness |
| **EDGE_CASE_THOROUGHNESS** | 15% | Null/empty inputs, boundary values, integer overflow, concurrency |

#### 2. BEHAVIORAL (`BEHAVIORAL_STAR`)
| Dimension | Weight | Criteria Evaluated |
|---|---|---|
| **LEADERSHIP** | 25% | Ownership, initiative, positive influence, technical conviction |
| **CONFLICT_RESOLUTION** | 20% | Constructive handling of disagreements and stakeholder misalignment |
| **TEAMWORK** | 20% | Psychological safety, mentorship, cross-functional collaboration |
| **COMMUNICATION_BEHAVIORAL** | 20% | Structured STAR storytelling (Situation, Task, Action, Result) |
| **ADAPTABILITY** | 15% | Navigating ambiguity, changing requirements, and shifting priorities |

#### 3. RESUME_BASED (`RESUME_BASED`)
| Dimension | Weight | Criteria Evaluated |
|---|---|---|
| **TECHNICAL_DEPTH** | 30% | Deep mastery of claimed resume technologies and architectures |
| **PROJECT_IMPACT** | 25% | Quantified business metrics, latency/throughput gains, reliability |
| **PROBLEM_SOLVING** | 20% | Root-cause analysis, production incident triage, debugging journeys |
| **COMMUNICATION_RESUME** | 15% | Transparent career narrative without resume exaggeration |
| **PROFESSIONALISM_RESUME** | 10% | Intellectual honesty, acknowledging past trade-offs and lessons learned |

#### 4. SYSTEM_DESIGN (`SYSTEM_DESIGN`)
| Dimension | Weight | Criteria Evaluated |
|---|---|---|
| **ARCHITECTURE** | 30% | Decomposition, component boundaries, asynchronous flows |
| **SCALABILITY** | 25% | Horizontal partitioning, caching tiers, backpressure |
| **TRADE_OFFS** | 20% | CAP theorem, consistency models (strong vs eventual), costs |
| **COMMUNICATION_DESIGN** | 15% | Whiteboard diagramming, structured presentation |
| **RIGOR** | 10% | Failover mechanics, monitoring, blast-radius containment |

### Verdict Determination

$$\text{Overall Score} = \sum (\text{Dimension Score} \times \text{Weight})$$

- **$\ge 85$**: `STRONG_HIRE`
- **$70 - 84$**: `HIRE`
- **$55 - 69$**: `LEAN_HIRE`
- **$< 55$**: `NO_HIRE`

---

## 4. Anti-Cheat Integrity Telemetry

[`proctor-sentinel-service`](../proctor-sentinel-service) continuously samples proctoring telemetry:
- **Keystroke Cadence**: Tracks typing intervals; an average inter-key latency below 50ms signals external text pasting or automated injection.
- **Copy/Paste Tracking**: Increments per-turn copy and paste event counters.
- **Tab & Window Focus**: Listens to browser `visibilitychange` events; logs total unfocused duration.
- **Secondary Companion Camera**: Verifies candidate posture and desk environment via mobile phone pairing.

> **Bias Separation Rule**: Integrity signals are included in proctoring audits and the candidate's diagnostic report, but **are never fed as negative weights to the algorithmic problem-solving rubric**. Coding competency and behavioral integrity remain distinct diagnostic axes.

---

## ⚠️ DO NOT (Evaluation Constraints)

> [!CAUTION]
> **STRICT EVALUATION CONSTRAINTS FOR FUTURE DEVELOPERS AND LLMs:**

1. **Do NOT remove deterministic post-guards.** LLMs will occasionally hallucinate test passes or invert identities. Post-guards are mandatory non-negotiable safety boundaries.
2. **Do NOT trust the LLM with binary pass/fail execution verdicts.** The ground truth source for code execution is Judge0 and the test runner, never the LLM prompt.
3. **Do NOT allow the LLM to invent its own persona name.** The interviewer name is fixed (`Dr. Anya Chen` in Interview mode, `Coach Sam` in Playground) and rendered by the frontend.
4. **Do NOT raise temperature above 0.7.** High temperatures degrade JSON schema conformance and produce inconsistent scoring.
5. **Do NOT mix integrity scores into algorithmic rubric scoring.** Keep integrity and technical scoring independent to eliminate subjective bias.
