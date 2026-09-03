# AI Interview OS — Architecture Documentation

This directory contains the authoritative, production-grade architecture documentation and Architectural Decision Records (ADRs) for **AI Interview OS**.

It serves as a **firm architectural contract** for human engineers and agentic LLMs working on this codebase.

---

## 📑 Documents Index

- [**`architecture.md`**](architecture.md) — High-level system architecture, service map, data flow pipelines, polyglot persistence, and architectural boundaries.
- [**`execution-model.md`**](execution-model.md) — Sandbox execution engines across tracks (Judge0 CE, SQL ephemeral schemas, Maven workspaces, canvas whiteboard).
- [**`evaluation-model.md`**](evaluation-model.md) — AI intelligence pipeline (Groq/Ollama routing, dialogue memory, rubric scoring, and deterministic post-guards).
- [**`security.md`**](security.md) — Zero-trust security model (BYOK key handling, container isolation, proctoring gates, and 7-day GridFS hygiene).
- [**`database.md`**](database.md) — Polyglot persistence schema (PostgreSQL relational entities, MongoDB transcripts & documents, GridFS video chunks).

---

## 🏛️ Architectural Decision Records (ADRs)

- [**ADR 001: Monolith to Microservices Split**](ADR/001-monolith-to-microservices.md) — Why the system is organized into 8 targeted microservices.
- [**ADR 002: Code Runner Isolation Strategy**](ADR/002-code-runner-isolation.md) — Multi-engine isolation using Judge0 cgroups, ephemeral Postgres schemas, and Maven containers.
- [**ADR 003: AI Evaluation Pipeline & Deterministic Guarding**](ADR/003-ai-evaluation-pipeline.md) — Sub-500ms Groq routing, multi-model evaluation, and deterministic post-guards against hallucinations.

---

## ⚠️ For LLMs & AI Assistants Working on this Codebase

> [!IMPORTANT]
> **DO NOT REBUILD OR RESTRUCTURE WORKING ARCHITECTURE.**
> 
> 1. **Do NOT split into more microservices or merge back into a monolith.** The 8-service boundary is intentionally balanced between build velocity, domain autonomy, and operational simplicity.
> 2. **Do NOT replace Judge0 with custom sandboxes.** Judge0 CE is battle-tested, isolated via Linux cgroups with `privileged: true`, and handles 50+ languages securely.
> 3. **Do NOT consolidate polyglot persistence.** PostgreSQL manages ACID relational lifecycles; MongoDB manages high-throughput nested transcripts; MongoDB GridFS stores binary video chunks with automated retention.
> 4. **Do NOT bypass `api-gateway-service`.** All frontend calls MUST route through the gateway for CORS, rate limiting, and BYOK credential sanitization.
> 5. **Do NOT remove deterministic post-guards.** Never trust LLMs on passing verdicts or persona self-naming; post-guards enforce ground truth deterministically.
>
> **Always consult the "⚠️ DO NOT" constraints in each document before proposing structural changes.**
