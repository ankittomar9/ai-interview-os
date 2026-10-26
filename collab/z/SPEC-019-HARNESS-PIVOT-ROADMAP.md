# SPEC-019 — HARNESS PIVOT ROADMAP: From DSA Runner to Extensible Technical Evaluation Harness

| | |
|---|---|
| **Spec ID** | SPEC-019 (roadmap-class; each phase gets a detailed execution spec when scheduled) |
| **Author lane** | Z (audit lane) |
| **Status** | READY FOR OPERATOR REVIEW → phased execution |
| **Input** | Operator's strategy essay (harness definition, open-source positioning, market shift, pivot roadmap) — claims verified below |
| **Precondition** | M-1/M-2 prescriptions (QB-44/QB-45) are standing law; P0 below enforces them |

---

## S0. Claim Verification (Z ground-truth against master `3d6d8dc`)

| Essay claim | Z verification | Result |
|---|---|---|
| Platform already has HLD Whiteboard Studio | `frontend/src/components/HldWhiteboardCanvas.tsx` exists on master | **CONFIRMED** |
| Behavioral Studio with STAR progression + resume grounding | `frontend/src/components/behavioral/BehavioralStudio.tsx` exists | **CONFIRMED** |
| SQL & Data Query screen with isolated schema evaluation | `frontend/src/components/arena/screens/SqlScreen.tsx` exists | **CONFIRMED** |
| Real-time push-to-talk voice duplex engine | `frontend/src/components/arena/hooks/useCoachVoice.ts` + whisper-sidecar service exist | **CONFIRMED** |
| Session state machine + provider failover prevents interruptions | SPEC-018 delivered exactly this: `buildConfiguredProviderChain` (cap 3), parse-inside-failover, deterministic fallback; QB-45 ratified | **CONFIRMED** |
| Harness framing ("runtime envelope around raw LLM") | The repo literally ships the harness components the essay lists: sanitizers (JsonCleaner + unescape), provider failover, deterministic fallbacks, sandboxed execution (Judge0 + judge0-patches), state ledgers (transcript/progress/ SPEC-016 exposure ledger) | **CONFIRMED — and is the open-source narrative** |
| MCP as industry standard | Verified current (Oct 2026): adopted by OpenAI + Google DeepMind; 10k+ servers deployed by mid-2026; ~half of software companies report MCP in production; spec actively evolving (HTTP-native transport unification, agent identity/DPoP, progressive discovery) | **CONFIRMED — cite with dates** |
| MCP presence in this codebase | 0 references in frontend/src + orchestrator main — **greenfield** | **CONFIRMED** |
| "Pure DSA obsolete" | Directionally correct; calibrated position: DSA degrades to a sanity filter (one Medium, ~20 min) while HLD/incident/LLD/AI-native engineering carry differentiation. The existing catalog (E134/M258/H83) supports this WITHOUT deletion — difficulty tiers already map to "filter vs depth" roles | **ADOPTED with calibration** |

**Adjudication:** the essay's thesis is sound and the pivot is buildable on current infrastructure. The three-month work product is the hard 80% (multi-track arena, sandboxing, voice, failover, ledgers) — the pivot adds tracks and an MCP host, it does not replace anything.

## S1. Open-Source Positioning (docs work, P0-adjacent)

Reframe the repository as **"AI Interview OS — an extensible Technical Evaluation Harness"**:
1. README lead = harness definition (the essay's 4 pillars: sensors/tools, guardrails & resilience, execution sandboxing, state & memory) mapped to concrete modules that ALREADY exist — this is truthful today, no code needed.
2. Architecture diagram section: Provider Chain (SPEC-018), JsonCleaner sanitization ladder, deterministic fallback, Judge0 sandbox, session state machine, exposure ledger (SPEC-016), /history analytics (SPEC-017).
3. BYOM story: providers are pluggable (`ModelProvider` + `AiClientFactory` + configured-chain failover) — enterprises swap Gemini/Groq/Ollama/OpenAI/self-hosted vLLM without touching rubrics or the arena. SPEC-018's chain is the demo.
4. Honest-judge test suite is itself an adoption signal: publish the four-number discipline + gate methodology (with the M-1 counting script from the prescription).

## S2. Phased Roadmap

### P0 — Discipline & Close-out (immediate, small)
- M-2 prescriptions live: no post-verdict direct-to-master code; `merge(spec-0NN)` labels reserved for authorized merges; rider reports mandatory for mid-spec fixes; M-1 counting script (`scripts/count-tests.sh`) checked in and used in every report.
- Operator: rebuild orchestrator image from master (still outstanding from QB-44 §4).
- Gate P0-G1: Z verifies next execution report contains script-verbatim four-number output; any unlabeled master commit → revert authorization.

### P1 — MCP Host Foundation (backend, orchestrator + new module)
Make the platform an **MCP Host** (client) so candidate environments and evaluator tools plug in as MCP servers instead of hardcoded integrations:
1. Transport: **Streamable HTTP** primary (spec's 2026 direction; remote servers are "a normal HTTP workload" per modelcontextprotocol.io roadmap) + **stdio** for local tool servers.
2. Core host features: server registry (config-driven), capability negotiation, tool discovery (`tools/list`) with **progressive discovery** awareness (spec roadmap SEP work — design the registry so large catalogs don't need full ingestion), `tools/call` with `structuredContent` handling, per-tool permission gating + egress accounting (reuse `EgressTracker` doctrine), timeouts + deterministic "tool unavailable" degradation (reuse SPEC-018 fallback pattern).
3. First-party MCP servers to seed the ecosystem: **Database MCP** (read-only schema+query against the SQL screen's sandbox), **File/Repo MCP** (bounded workspace access for LLD review), **Terminal MCP** (sandboxed exec in the candidate container — NOTE: Judge0 already sandboxes arbitrary code; Terminal MCP exposes controlled shell behind the same isolation doctrine).
4. Fence: new `mcp-host` module or orchestrator-internal package; NO changes to interview flow logic, rubrics, or SPEC-016/017 behavior.
5. Gates (detailed in P1 spec): interop tests against ≥2 independent MCP server implementations; capability-negotiation unit matrix; permission-gating negative tests (tool denied → degradation not crash); egress ledger records every tool call; four-number regression digit-exact.

### P2 — "Agentic & AI-Native Engineering" Interview Track (question bank + frontend)
New track testing what the market now screens for (essay §3.4, verified current):
1. Scenario archetypes: (a) *Build*: "write an MCP server that securely exposes order status to a support agent" (scaffold repo + tests as judgeable artifacts); (b) *Debug*: a pre-wired agent workflow whose tool calls hallucinate parameters — candidate must find schema mismatch / missing validation / prompt-injection surface; (c) *Design*: tool-permission scoping for a sub-agent (ties to the DPoP/agent-identity direction in the MCP roadmap — interview question with real 2026 relevance).
2. Judging: artifact-based (server code runs, tests pass) + AI-probed methodology, reusing the existing dual-lane pattern (deterministic tests + LLM rubric with deterministic fallback).
3. Catalog integration: new topic tokens under the `_taxonomy.yaml` guard (SPEC-016 machinery reused; guard test extends automatically).
4. Gates: seeded-candidate E2E per archetype; rubric reliability sample; catalog guard green; four-number.

### P3 — Incident / Scenario Troubleshooting Track (infra + bank)
1. Pre-configured docker scenario images: microservice with injected faults (connection-pool exhaustion, lock contention, N+1, cache stampede, p99 regression under synthetic load).
2. Arena presents logs/metrics/traces pane + code; candidate's debugging methodology (hypothesis → isolation → fix) is scored; AI coach probes ("what would you check first and why") instead of revealing.
3. Reuses: judge0-patches container doctrine, section state machine, push-to-talk voice, deterministic fallbacks. No new orchestration primitives expected — fence-check in the P3 spec.
4. Gates: scenario reproducibility (fault fires deterministically on seed N); false-fault check (healthy service must be provably clean); methodology rubric sample; E2E.

### P4 — HLD AI Probing Elevation (frontend + orchestrator prompts)
1. Upgrade `HldWhiteboardCanvas` toward a structured architecture graph (nodes/edges typed: service, cache, DB, queue, LB) — the canvas already exists; add semantic extraction so the AI evaluator receives the topology, not a pixel dump.
2. AI challenge playbooks keyed to topology patterns: cache present → invalidation strategy + stampede/thundering-herd probes; queue present → backpressure + idempotency probes; DB replica → read-your-writes probes. These are prompt-pack + post-guard extensions (anti-hallucination doctrine from SPEC-008 carries).
3. Gates: topology→prompt mapping unit tests; probe-relevance sample judged honestly; no regression in existing HLD sessions.

## S3. Non-Goals
- **NG1.** No removal or demotion of the existing DSA catalog — it becomes the sanity filter by role, not by deletion (catalog stays E134/M258/H83).
- **NG2.** No vendor lock-in: MCP host must work with any conforming server; BYOM stays provider-agnostic.
- **NG3.** No proctored-flow or privacy-model changes (VA-c privacy gate doctrine stands).
- **NG4.** No rewrite of voice/STT/arena plumbing — the pivot consumes it as-is.
- **NG5.** No MCP server *exposed by this platform* accepts unauthenticated remote calls in P1 (auth design defers to the spec's agent-identity landscape; P1 ships config-scoped local/trusted-network only).

## S4. Sequencing & Effort Calibration
1. P0 (days) → P1 (the only genuinely new infrastructure; ~1-2 weeks with the existing failover/sandbox doctrine) → P2 (track content, parallelizable with P1 tail) → P3 (scenario images are content-heavy, mechanics reuse P1's Terminal/DB MCP) → P4 (canvas typing + prompt packs).
2. Each phase lands as its own SPEC-019.x execution spec with line-level fences and gates — this document fixes direction, sequencing, and non-goals only.
3. Open-source docs reframe (S1) can land immediately after P0 — zero code risk, maximum narrative benefit.

## S5. Standing Law Carried Forward
- M-1: script-verbatim four-number reporting, or the assertions slot is dropped.
- M-2: no post-verdict direct-to-master code; SPEC-labeled merges only per QB verdict; rider reports before push.
- Image-only deploy; no flyway hand-edits; no branch deletion; honest-judge gates.
