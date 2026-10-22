# SPEC-018 EXECUTION REPORT: Dialogue Resilience, Provider Failover & Playground Fallback Integrity

| Metadata | Value |
|---|---|
| **Specification** | SPEC-018 (`collab/z/SPEC-018-DIALOGUE-RESILIENCE.md`) |
| **Author / Lane** | Gemini (Execution Lane, single-push protocol per QB-35/QB-44) |
| **Architect & Auditor** | Z (Audit Lane — QB-44 Audit) |
| **Base master** | `ab452ae22bf2fe1632d5059329c19c1d28c5f5e9` (`ab452ae`) |
| **Branch / HEAD** | `feat/spec-018-dialogue-resilience` |
| **Date** | 2026-10-22 |
| **Status** | READY FOR QB-44 AUDIT |

---

## 1. Fence `--stat` Receipt (Gate GA8)

```
 ai-orchestrator-service/src/main/java/com/interviewos/ai/client/GeminiClient.java       |   3 +-
 ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java | 299 +++++++++++++++++++++------
 ai-orchestrator-service/src/main/java/com/interviewos/ai/util/JsonCleaner.java           |  74 ++++++-
 ai-orchestrator-service/src/test/java/com/interviewos/ai/client/GeminiClientTest.java   |  66 +++++-
 ai-orchestrator-service/src/test/java/com/interviewos/ai/service/AiOrchestratorDialogueResilienceTest.java | 299 +++++++++++++++++++++++++++
 ai-orchestrator-service/src/test/java/com/interviewos/ai/util/JsonCleanerTest.java       |  72 +++++++
 collab/gemini/SPEC-018-REPORT.md                                                        | (this file)
 7 files touched (+813 / -99)
```

**Fence Verification:**
- `ai-orchestrator-service/src/**`: F1 structured output in `GeminiClient`, F2 double-encoded recovery & fence hardening in `JsonCleaner`, F3 parse-inside-failover attempt chain in `AiOrchestratorService`, F4 playground-aware deterministic fallback in `AiOrchestratorService`, F5 updated Coach Sam system instruction.
- `ai-orchestrator-service/src/test/**`: Acceptance suites for GA1 (`JsonCleanerTest`), GA2 (`GeminiClientTest`), GA3, GA4, GA5 (`AiOrchestratorDialogueResilienceTest`).
- `frontend/src/**`: 0 files touched (untouched; API response `generator: "LLM"` drives existing frontend degraded-mode logic without frontend code changes).
- Flyway migrations: 0 (No database schema changes).
- Branch operations: Single-push protocol strictly respected; zero branch deletions.

---

## 2. Gate Results (Four-Number Reporting: files / test-cases / assertions / failures)

| Gate | Suite / Source File | Four-Number Result | Status |
|---|---|---|---|
| **GA1** | `com.interviewos.ai.util.JsonCleanerTest` | **1 / 6 / 11 / 0** | **PASS** |
| **GA2** | `com.interviewos.ai.client.GeminiClientTest` | **1 / 3 / 8 / 0** | **PASS** |
| **GA3** | `AiOrchestratorDialogueResilienceTest` (tests 1–3: primary failover, all-fail fallback, handoff failover) | **1 / 3 / 10 / 0** | **PASS** |
| **GA4** | `AiOrchestratorDialogueResilienceTest` (test 4: playground fallback language & escalation loop) | **1 / 1 / 12 / 0** | **PASS** |
| **GA5** | `AiOrchestratorDialogueResilienceTest` (test 5: prompt rules playground vs interview) | **1 / 1 / 7 / 0** | **PASS** |
| **GA6** | Live docker stack turn receipt + provider attempt chain | **0 occurrences of code 92** | **PASS** |
| **GA7** | Full reactor / regression runs (see details below) | Digit-exact vs baseline | **PASS** |
| **GA8** | Fence discipline (`git diff --stat master...HEAD`) | Exactly 7 files in fence | **PASS** |
| **GA9** | Banner-driving field values for GA6 turns (`generator: "LLM"`) | Verified degraded banner = false | **PASS** |

---

## 3. GA6 Honest-Judge Live Stack Receipts

### 3.1 Live Probe Request
Dispatched against running Docker Compose stack through API Gateway (`POST http://localhost:8080/api/v1/ai/dialogue`):
```json
{
  "candidateExplanation": "can you provide the code",
  "modelProvider": "GEMINI",
  "sessionMode": "PLAYGROUND",
  "questionContext": "Two Sum: Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
  "sectionType": "ALGORITHMS_DATA_STRUCTURES"
}
```

### 3.2 Response Payload
```json
{
  "interviewerReply": "I'm glad you're looking for a solution. Let's start by thinking through the problem algorithmically. What data structure can we use to efficiently find the complement of each number as we iterate through the array?",
  "followUpQuestion": "What data structure can we use to efficiently find the complement of each number as we iterate through the array?",
  "isSolutionComplete": false,
  "codeAnalysis": "",
  "keyStrengths": [],
  "areasToImprove": [
    "Use a suitable data structure for complement lookup"
  ],
  "detectedIntent": "CLARIFYING",
  "turnSummary": "Candidate is looking for code but hasn't started yet. They are seeking guidance on the approach.",
  "recommendedAction": "OFFER_HINT",
  "approachAssessment": "NOT_APPLICABLE",
  "usedFollowUpSeedIds": [],
  "generator": "LLM",
  "generatorReason": null,
  "gateUnlockSource": null
}
```

### 3.3 Container Logs (`docker logs ai-orchestrator-service`)
Verbatim log lines demonstrating the F3 provider attempt failover chain:
```
2026-10-22T16:57:11.360Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.i.a.c.AiOrchestratorController         : 💬 AI Dialogue Turn Received: Provider='GEMINI', CodeProvided=false, ExplanationLength=24
2026-10-22T16:57:11.768Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] com.interviewos.ai.client.GeminiClient   : Dispatching prompt to Google Gemini using model: gemini-3.5-flash (multimodal: false)
2026-10-22T16:57:11.769Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.interviewos.ai.service.EgressTracker   : ☁️ [EgressTracker] Recorded external cloud API call #1: destination=GEMINI
2026-10-22T16:57:14.797Z  WARN 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.i.ai.service.AiOrchestratorService     : Attempt failure for provider GEMINI (ServiceUnavailable: 503 Service Unavailable: "{\n  \"error\": {\n    \"code\": 503,\n    \"message\": \"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.\",\n    \"status\": \"UNAVAILABLE\"\n  }\n}\n"). Advancing to next provider.
2026-10-22T16:57:14.797Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.i.ai.client.OpenAiCompatibleClient     : provider=GROQ model=openai/gpt-oss-120b
2026-10-22T16:57:14.798Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.i.ai.client.OpenAiCompatibleClient     : 🎯 GROQ Model Routing — Task/Requested: 'dialogue', Effective Model: 'openai/gpt-oss-120b', Fallback Chain: [openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.8-27b]
2026-10-22T16:57:14.798Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.i.ai.client.OpenAiCompatibleClient     : Dispatching prompt to OpenAI-compatible provider: GROQ using model: openai/gpt-oss-120b (vision: false)
2026-10-22T16:57:14.798Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.interviewos.ai.service.EgressTracker   : ☁️ [EgressTracker] Recorded external cloud API call #2: destination=GROQ
2026-10-22T16:57:17.816Z  WARN 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.i.ai.service.AiOrchestratorService     : Attempt failure for provider GROQ (IllegalArgumentException: Provider GROQ returned JSON missing required 'interviewerReply' field). Advancing to next provider.
2026-10-22T16:57:17.817Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] com.interviewos.ai.client.OllamaClient   : Connecting to Local Ollama at: http://host.docker.internal:11434/api/generate | Model: qwen2.5-coder:7b | Prompt length: 4194 chars
2026-10-22T16:58:07.285Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] com.interviewos.ai.client.OllamaClient   : Ollama inference completed in 49464ms (Output: 750 chars)
2026-10-22T16:58:07.290Z  INFO 1 --- [ai-orchestrator-service] [nio-8082-exec-1] [6ada4066b89f3ce5b1dfeb6a7e831772-5e2a13f3abc71f53] c.i.a.c.AiOrchestratorController         : ✅ AI Dialogue Evaluated: IsSolutionComplete=false, FollowUp='What data structure can we use to efficiently find the complement of each number as we iterate through the array?' in 55930ms
```

- **Zero occurrences of `Unexpected character ('\' (code 92))`** in container logs.
- Attempt chain seamlessly walked GEMINI (503) → GROQ (schema error) → OLLAMA (success).

---

## 4. GA7 Regression Runs (Four-Number Reporting)

| Test Target | Files / Suites | Test-cases | Assertions | Failures / Errors | Skipped | Status |
|---|---|---|---|---|---|---|
| **ai-orchestrator-service (HEAD)** | **15 files** | **115 run** | **428 assertions** | **0 failures / 0 errors** | 1 skipped | **PASS** |
| *ai-orchestrator-service (baseline)* | 13 files | 103 run | 383 assertions | 0 failures / 0 errors | 1 skipped | baseline |
| **frontend (HEAD)** | **41 suites** | **317 run** | **1301 assertions** | **0 failures** | 0 skipped | **PASS** |
| *frontend (baseline)* | 41 suites | 317 run | 1301 assertions | 0 failures | 0 skipped | baseline |
| **interview-session-service** | 18 files | **312 run** | 1056 assertions | **0 failures / 0 errors** | 1 skipped | **PASS** (SPEC-017 regression clean) |
| **question-bank-service** | 8 files | **41 run** | 187 assertions | **0 failures / 0 errors** | 0 skipped | **PASS** (SPEC-016 regression clean) |

---

## 5. GA9 Banner Semantics Receipt

Frontend condition for degraded mode banner in `frontend/src/components/ai/AiAssistantPanel.tsx`:
```tsx
const isDegradedAiMode = messages.some(
    (m) =>
        m.metadata?.generator === "DETERMINISTIC_FALLBACK" ||
        m.metadata?.generator === "OFFLINE_COACH" ||
        m.metadata?.offlineFallback === "true"
);
```

For the GA6 turn:
- `response.generator()`: `"LLM"`
- `response.generatorReason()`: `null`
- `response.interviewerReply()`: Coach response from winning provider in failover chain.
- Banner value: `isDegradedAiMode = false`.
- Result: **Degraded AI banner ("Degraded AI mode — responses automated / FALLBACK ACTIVE") is NOT rendered**. The user receives an active coach dialogue turn with full resilience.

---

## 6. Deviations

**DEVIATIONS: NONE**
- All 5 root causes (R1..R5) resolved strictly within designated fence.
- Second failover consumer `processHandoff` covered per §F3 item 7 and GA3-3.
- No Flyway migrations, no frontend code touch required, single push protocol maintained.
