# ADR 003: AI Evaluation Pipeline & Deterministic Guarding

## Status
Accepted (2026-08-18, updated 2026-09-02)

## Context
The platform leverages Large Language Models (LLMs) to perform:
1. **Interactive Socratic Dialogue**: Real-time interviewer questioning, progressive hints, code reviews.
2. **Audio Transcription (STT)**: Converting candidate speech into prompt context.
3. **Comprehensive Rubric Evaluation**: Multi-dimensional grading and candidate hire recommendations.

Key challenges encountered during user testing:
- **Verdict Hallucinations**: When candidate code failed test cases (e.g. 0/2 passed), the LLM would occasionally praise the candidate and claim "All test cases passed perfectly!".
- **Persona Identity Inversions**: Under certain prompts, the model would address the candidate as "Mickey" or "Dr. Anya Chen" instead of addressing them by their real name.
- **Latency Spikes**: Traditional LLM APIs with 2–5s time-to-first-token resulted in awkward conversational pauses.

## Decision
1. **Groq LPU Inference Tier**: Standardize on Groq Cloud LPU acceleration (`llama-3.3-70b-versatile`, `whisper-large-v3`) for sub-500ms voice/dialogue turns.
2. **Local Ollama Failover**: Support local models (`qwen2.5-coder:7b`) when running offline or without external API keys.
3. **Deterministic Post-Guards**: Enforce hard rule-based post-guards in [`AiOrchestratorService.java`](../../ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java) that execute after LLM generation:
   - **Verdict Grounding Guard**: If code execution failed, any model claim that "tests passed" is deterministically rewritten to a failure-aware debugging prompt, and `isSolutionComplete` is forced to `false`.
   - **Anti-Inversion Name Guard**: If the model refers to the candidate using the interviewer persona name, the token is deterministically replaced with the candidate's actual first name.
4. **Independent Scoring Dimensions**: Keep proctoring integrity scores and algorithmic rubric scores strictly decoupled to avoid cognitive bias.

## Consequences

### Positive
- **Guaranteed Honesty**: The platform never confirms a solution that failed sandbox unit tests.
- **Conversational Immersion**: Sub-500ms latency creates a natural interview flow without awkward pauses.
- **Persona Consistency**: Strict name sanitization prevents identity confusion.

### Negative
- **Provider Reliance**: Groq API rate limits require careful key management (mitigated by BYOK and Ollama fallback).
- **Dual Pipeline Maintenance**: Requires keeping prompt engineering rules synchronized with regex post-guards.

## Alternatives Considered
1. **Trusting Pure Prompt Engineering**: Rejected. LLMs are non-deterministic; prompt rules alone consistently showed a ~3% hallucination rate on code pass/fail verdicts.
2. **OpenAI GPT-4o Exclusively**: Rejected. Higher latency (1200–2500ms) and 5x higher inference cost.
3. **Local-Only Model Deployment**: Rejected. 7B local models lack sufficient reasoning depth for complex architectural trade-offs, and 70B models require expensive GPU hardware.

## References
- Code: [`AiOrchestratorService.java`](../../ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java), [`AiOrchestratorServiceDialogueTest.java`](../../ai-orchestrator-service/src/test/java/com/interviewos/ai/service/AiOrchestratorServiceDialogueTest.java)
- Commits:
  - `b59626a` (M16-A-fix: deterministic post-guard for verdict grounding)
  - `1e1552c` (M18-B: fix persona name inversion and inject candidate name across dialogue pipeline)
