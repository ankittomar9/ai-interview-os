# AI Interview OS — Agents Addendum & Task Enforcement Rules

This document specifies mandatory development practices and guardrails for human contributors and agentic LLMs operating on this codebase.

---

## 🧭 Core Mission & Principles

> **Run your interview prep entirely on your laptop, with your own keys, forever free of cloud bills — so no learner is ever priced out of feeling confident.**
>
> *Your resume never leaves your machine. Your failures are never uploaded. $0/month, forever.*

1. **Local-First Purity**: Every feature must operate without mandatory cloud dependencies. Local Ollama and local speech recognition are first-class targets, not afterthoughts.
2. **Platform Honesty**: If execution engines or external services are unreachable, state so explicitly. Never fabricate test passes, never hallucinate verdicts, and never penalize the candidate for platform downtime.
3. **RAM Footprint Discipline**: Design services to run comfortably on an 8GB laptop. Avoid unnecessary daemon processes, heavy brokers, or bloated background jobs.

---

## 📋 Task Enforcement & Workflow Rules

0. **Sync Remote First (Multi-Machine / Multi-Session Rule)**:
   - Development is actively split across multiple laptops and local Antigravity agent sessions.
   - **FIRST ACTION OF ANY TASK OR SPEC**: Run `git fetch origin master` and merge incoming remote changes (`git merge origin/master` or branch from `origin/master`). Never implement fixes or specs against stale local state.
1. **One Spec $\to$ One Commit**:
   - Work is organized by SPEC ID (e.g. `SPEC-002`, `SPEC-003`).
   - Each spec task must be implemented and committed atomically. Never bundle unrelated features into a single commit.
2. **Read `docs/` First**:
   - Before modifying cross-service communication, database schemas, or routing, read [`docs/README.md`](docs/README.md), [`docs/architecture.md`](docs/architecture.md), and relevant Architectural Decision Records in [`docs/ADR/`](docs/ADR/).
3. **Never Rebuild Working Subsystems**:
   - **Do NOT replace Judge0** for DSA execution; Judge0 CE provides battle-tested memory and cgroup isolation.
   - **Do NOT consolidate polyglot persistence** without an accepted ADR. PostgreSQL manages ACID relational state; MongoDB manages transcripts and binary chunks via GridFS.
   - **Do NOT remove deterministic post-guards**. Always deterministically intercept LLM hallucinations on verdicts and persona identity.
4. **Topology Changes Require an Accepted ADR**:
   - Any service consolidation (such as `SPEC-002` edge-service merge) or service extraction requires a formal ADR with `Status: Accepted` and a staged migration plan (M0–M4).
5. **Shell & Git Discipline (Hard Constraints)**:
   - Run **ONE shell command per invocation**. Never concatenate commands with `&&` or `;`.
   - Never use `rm` or `Remove-Item` with wildcards inside the repository.
   - Git workflow must be split into three distinct invocations:
     1. `git add <files>`
     2. `git commit -m "<message>"`
     3. `git push origin <branch>`

---

## 🧪 Verification Checklist Before Committing

- [ ] `npm run build` in `frontend/` succeeds with 0 TypeScript/Vite errors.
- [ ] Line budgets for key frontend components are strictly respected:
  - `ProblemPanel.tsx` $\le 300$ lines
  - `MarkdownProblem.tsx` $\le 200$ lines
  - `ArenaShell.tsx` $\le 250$ lines
  - `ArenaRoom.tsx` $\le 250$ lines
  - `TrackScreenRouter.tsx` $\le 200$ lines
- [ ] `mvn test` passes cleanly on all modified Spring Boot modules.
- [ ] No secrets, API keys, or machine-specific absolute file paths (`file:///`) are committed.
