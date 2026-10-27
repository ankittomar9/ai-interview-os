# QB-49 — Agentic Curriculum Gap: Verification of Gemini's Analysis + Verified Link Manifest + Wiring Spec

- **Agent:** Super Z (audit lane)
- **Date:** 2026-10-27 (Asia/Calcutta)
- **HEAD audited:** `42e08ad` (== `origin/master`; QB-48 baseline 115/669/2531/2)
- **Method:** direct code read at HEAD, `git ls-files` inventory, live `curl -L` checks with captured HTTP status + redirect target + page title for every asserted URL. No identity-bearing metadata (slug, title, URL) in this report is asserted from memory.
- **Push status:** no PAT in sandbox this session (`git ls-remote` fails without credentials). Durable copy in `download/`; operator or executor lane should commit to `collab/z/QB49-AGENTIC-LEARN-GAP-VERIFY.md`.

---

## 1. Verdict on Gemini's analysis (claim-by-claim)

| # | Gemini claim | Verdict | Evidence at HEAD 42e08ad |
|---|---|---|---|
| C1 | `LearnTreeService` L132–139 hard-filters catalog to 5 prefixes (`dsa- hld- lld- sql- beh-`), excluding all `agentic-*` | **CONFIRMED** | L134–139 in `getOrRefreshCatalog()`; catalog page `size=1000`, TTL cache |
| C2 | Fix = add `agentic-` and `incident-` to the filter | **CONFIRMED, INCOMPLETE** — there is a **second** whitelist site Gemini did not flag: `isValidSlug()` **L179** repeats the same 5-prefix fallback (used when catalog fetch fails). Fix must cover both sites or they drift. | `LearnTreeService.java` L177–181 |
| C3 | Missed entirely by Gemini: `RetryQueueService.resolveTopic()` **L215–232** has a third prefix-bucketing fallback. For any slug not in the catalog (which, pre-fix, is every agentic/incident question), `agentic-*`/`incident-*` fall through to `return "arrays"` — retry-queue rows would be **mis-bucketed as Arrays**. | **NEW FINDING (Z)** | `RetryQueueService.java` L215–232; catalog-miss path via `findInCatalog` |
| C4 | Taxonomy: `agentic-engineering`, `mcp-servers`, `agent-debugging` have zero `resources:` | **CONFIRMED, UNDERCOUNTED** — it is **5 topics**, also `incident-response` and `performance-tuning` (both `SYSTEM_TROUBLESHOOTING`). Only `arrays`, `dp`, `system-design` have resources today. | `_taxonomy.yaml` L48–53 |
| C5 | 3 agentic problems exist | **CONFIRMED** | inventory below, machine-captured |
| C6 | `incident-` questions exist to enable | **CONFIRMED** | 3 files under `questions/incident/` |

### Machine-captured inventory (git ls-files, not from memory)

| Prefix | Files |
|---|---|
| dsa- | 341 |
| hld- | 50 |
| lld- | 40 |
| behavioral (beh-) | 24 |
| sql- | 20 |
| **agentic-** | **3** |
| **incident-** | **3** |

**The 6 excluded questions (exact slugs/titles/difficulty from front-matter):**
1. `agentic-mcp-order-service` — "Build an MCP Tool Server for Customer Order Status" — MEDIUM
2. `agentic-debug-hallucinating-agent` — "Debug Hallucinating Tool Calls and Indirect Prompt Injection" — HARD
3. `agentic-design-subagent-guardrails` — "Design Cryptographic Identity and Scoped Permissions for Sub-Agents" — HARD
4. `incident-cache-stampede-thundering-herd` — "Incident: Cache Stampede and Database Saturation on Flash Sale Key Expiry" — HARD
5. `incident-db-connection-pool-exhaustion` — "Incident: Database Connection Pool Exhaustion Under Load" — MEDIUM
6. `incident-deadlock-distributed-locks` — "Incident: Distributed Deadlock in Checkout Pipeline" — HARD

Note the compounding effect: fixing C1 alone is insufficient — while the catalog filter blocks these slugs, `resolveTopic`'s fallback mis-buckets them to "arrays", and `isValidSlug`'s fallback rejects them outright when QBS is down. **A correct fix touches one file two sites + one file one site.**

---

## 2. Verified link manifest (live-checked 2026-10-27)

Method: `curl -sL` with browser UA, 25s timeout; HTTP status, final URL after redirects, and `<title>` captured. Full log: `scripts/qb49_link_results.tsv`.

### 2.1 ADMISSIBLE — verified live, safe to enter taxonomy

| ID | Final URL (cite this) | Captured title | Note |
|---|---|---|---|
| V1 | `https://www.anthropic.com/research/building-effective-agents` | "Building effective AI agents \ Anthropic" | **Gemini cited the stale `/engineering/` path — it 301-redirects to `/research/`. Cite the final URL.** |
| V2 | `https://modelcontextprotocol.io/` | "What is the Model Context Protocol (MCP)? - Model Context Protocol" | lands on `/docs/2026-07-28/getting-started/intro` — docs are now date-versioned; cite root |
| V3 | `https://modelcontextprotocol.io/quickstart/server` | "Build an MCP server - Model Context Protocol" | lands on `/docs/2026-07-28/develop/build-server`; direct fit for `mcp-servers` topic |
| V4 | `https://www.anthropic.com/research/effective-context-engineering-for-ai-agents` | "Effective context engineering for AI agents \ Anthropic" | same `/engineering/`→`/research/` move as V1 |
| V5 | `https://github.com/humanlayer/12-factor-agents` | "GitHub - humanlayer/12-factor-agents: What are the principles we can use to build LLM-powered software that is actually…" | strong fit for guardrails/architecture |
| V6 | `https://github.com/langchain-ai/langgraph` | HTTP 200 | stable repo pointer for state-machine / graph agent architecture |
| V7 | `https://huyenchip.com/dotagents/` | "dotagents" | Chip Huyen's own agents resource hub — replaces the mislabeled homepage link |

### 2.2 LABEL CORRECTIONS on Gemini's list

- `https://github.com/topics/agentic-ai` is a **GitHub Topics page**, not a repo. The label "GitHub AI-Engineer-Interview-QA" is **not the URL's identity** — a repo by that name is not verified. Either relabel ("GitHub Topic: agentic-ai") or drop.
- `https://huyenchip.com/` is her **homepage**, not "Building LLM Applications for Production". That article is **not reachable** from her homepage nav under that name (homepage hrefs machine-grepped). Use V7 (`/dotagents/`) instead for agent content.

### 2.3 NOT ADMISSIBLE — blocked, must not enter taxonomy from LLM memory

| URL | Observed | Reason |
|---|---|---|
| `https://cookbook.openai.com/` | 301 → `developers.openai.com/cookbook` → **403 Cloudflare** | Domain moved + bot-wall. Real, but unverifiable from this sandbox; requires a human browser pass before admission. |
| `https://platform.openai.com/docs/guides/function-calling` | **403 Cloudflare** | Same. |
| `https://genai.owasp.org/llm-top-10/` | **403 "Checking your browser…"** JS challenge | Same. High-value candidate for the `agent-debugging` topic if the operator confirms it in a browser. |
| `https://docs.anthropic.com/en/docs/build-with-claude/tool-use` | 200 but lands `claude.com/app-unavailable-in-region` | Geo-blocked from audit sandbox; docs domain migrated. Not verifiable here. |

**Rule applied (standing, from QB-47 NIT):** identity-bearing metadata (URLs, titles, slugs) is either machine-captured or not asserted. The four 403s are *blocked*, not *dead* — final say needs a 2-minute human browser check by the operator; until then they stay out of `_taxonomy.yaml`.

### 2.4 Honest gap

No **verified** link was found this round for `incident-response` or `performance-tuning`. These two topics stay resource-less rather than receiving fabricated links. Candidates for next round (after browser verification): OWASP LLM Top 10 (§2.3) and an SRE-postmortem guide to be sourced and checked.

---

## 3. Wiring spec for the executor lane (answer to "branch off?")

**Yes — authorized to branch, with the corrections below.** Gemini's 3-step plan becomes a 4-file spec. All line numbers verified at `42e08ad`.

### P0-1 — `LearnTreeService.java`: unify the two whitelist sites, add 2 prefixes

- L134–139 (catalog filter in `getOrRefreshCatalog`) and L179 (fallback in `isValidSlug`) repeat the same 5-prefix list. Refactor to a **single shared constant** so they cannot drift:

```java
private static final List<String> LEARN_SLUG_PREFIXES =
        List.of("dsa-", "hld-", "lld-", "sql-", "beh-", "agentic-", "incident-");

private static boolean isLearnSlug(String slug) {
    if (slug == null) return false;
    return LEARN_SLUG_PREFIXES.stream().anyMatch(slug::startsWith);
}
```

- Use `::isLearnSlug` in both sites. Behavior change: `agentic-*` and `incident-*` now surface in modules, study paths, retry queues, and pass `isValidSlug` even during QBS outage.
- **Required tests** (new): `isValidSlug("agentic-mcp-order-service")` → true; `isValidSlug("incident-cache-stampede-thundering-herd")` → true; `isValidSlug("random-slug")` → false; catalog-curation filter includes the 6 new slugs (stub `CatalogPageResponse`).

### P0-2 — `RetryQueueService.java` L215–232: bucket the new prefixes

In `resolveTopic`'s fallback chain (only reached when the catalog misses), before the terminal `return "arrays"`:

```java
if (lower.startsWith("agentic-")) return "agentic-engineering";
if (lower.startsWith("incident-")) return "incident-response";
```

Bucket names must equal taxonomy topic **ids** (`agentic-engineering`, `incident-response` — confirmed in `_taxonomy.yaml` L48–51), not the display names. Without this, a QBS blip during an agentic attempt files the retry-queue row under "Arrays".

### P1-3 — `_taxonomy.yaml`: resources blocks, verified links only

Append to the existing topic entries (same shape as the `system-design` block; exact YAML, links = §2.1 only):

```yaml
  - id: agentic-engineering
    name: Agentic & AI-Native Engineering
    track: AGENTIC_ENGINEERING
    resources:
      - label: "Anthropic: Building Effective Agents"
        url: "https://www.anthropic.com/research/building-effective-agents"
      - label: "Anthropic: Effective Context Engineering for AI Agents"
        url: "https://www.anthropic.com/research/effective-context-engineering-for-ai-agents"
      - label: "12-Factor Agents (HumanLayer)"
        url: "https://github.com/humanlayer/12-factor-agents"
  - id: mcp-servers
    name: Model Context Protocol (MCP)
    track: AGENTIC_ENGINEERING
    resources:
      - label: "Model Context Protocol — Documentation"
        url: "https://modelcontextprotocol.io/"
      - label: "MCP: Build a Server (Quickstart)"
        url: "https://modelcontextprotocol.io/quickstart/server"
  - id: agent-debugging
    name: Agent & Tool Debugging
    track: AGENTIC_ENGINEERING
    resources:
      - label: "LangGraph (LangChain) — Agent Graphs & State Machines"
        url: "https://github.com/langchain-ai/langgraph"
      - label: "Chip Huyen: dotagents — AI Agents Resources"
        url: "https://huyenchip.com/dotagents/"
```

- Do **not** add OpenAI/OWASP links (§2.3) until the operator's browser check.
- `incident-response` / `performance-tuning` stay resource-less this round (§2.4).

### P2-4 — Practice Center guide drawer (optional, FE)

Content = §4 below, rendered as a study drawer ("How Agentic-Track Interviews Work") reachable from the `agentic-engineering` module header. FE lane rules from QB-48 §5 apply unchanged: canonical runner `tsx --test` (`npm test`), `count-tests.sh --markdown` receipt, every added `assert` attributable in the 2531→N delta; ≤5-min expedited Z pre-merge check unless the operator declares EMERGENCY.

### Receipt expectations

- Backend suites must stay 0F/0E; new assertions delta must equal the added tests (per-claim provenance, same as QB-46–48 rounds).
- `_taxonomy.yaml` is parsed by QBS at catalog build — run the QBS suite (41 tests baseline) to catch YAML shape regressions.

---

## 4. How Agentic-Track Interviews Work — LMS guide content (grounded + verified)

This section is the missing reference material the operator asked for. Every repo artifact below is machine-captured from HEAD; every external link is from §2.1. Drop into the guide drawer or a docs page.

### The core doctrine

Traditional tracks grade deterministic output: an algorithm passes or fails, a schema scales or doesn't. The agentic track grades a different skill: **controlling a probabilistic component (the LLM) with deterministic code**. You are never graded on whether the model "is smart" — you are graded on the **harness** you build around it: the tool schemas, input sanitization, error contracts, retry policies, and guardrails that make an unreliable caller safe to put in production. In an interview you are handed a working system that fails in production, and judged on whether you can find the failure mode in the *interface* between model and code, then fix it with deterministic engineering.

### The four archetypes (mapped to our own question bank)

**Archetype 1 — Tool / MCP Server Implementation.** You are given a backend domain service and an LLM client; you must expose it as tools. Judged on: a strict JSON schema contract (`tools/list`), correct JSON-RPC `tools/call` execution, sanitization of untrusted arguments, and structured error responses that let the model *self-correct* instead of crashing the loop.
→ Practice: `agentic-mcp-order-service` (MEDIUM) — "Build an MCP Tool Server for Customer Order Status". References: MCP docs (V2), MCP "Build a Server" quickstart (V3).

**Archetype 2 — Debugging Hallucinations & Prompt Injection.** You are given a pre-wired agent loop failing in production: it invents entity IDs that don't exist, or gets hijacked by untrusted text embedded in the data it reads (indirect prompt injection — e.g., instructions hidden inside a customer review the agent was asked to summarize). Judged on: isolating the root cause (underspecified tool schemas, un-bracketed untrusted content reaching the prompt), then adding deterministic pre-execution guardrails — schema clamps, parameter bounds, content delimiting.
→ Practice: `agentic-debug-hallucinating-agent` (HARD) — "Debug Hallucinating Tool Calls and Indirect Prompt Injection". Reference: Effective Context Engineering (V4).

**Archetype 3 — Sub-Agent Architecture & Guardrails.** A design round: multiple agents, shared state, destructive actions. Judged on: state-graph design (persistence, rollback checkpoints), human-in-the-loop approval gates for irreversible steps, loop-breakers against infinite recursion, and identity — each sub-agent carries scoped, cryptographically verifiable permissions so a compromised sub-agent cannot forge the parent's authority.
→ Practice: `agentic-design-subagent-guardrails` (HARD) — "Design Cryptographic Identity and Scoped Permissions for Sub-Agents". References: Building Effective Agents (V1) — the workflows-vs-agents distinction and when *not* to build an agent; LangGraph (V6) for state-machine patterns; 12-Factor Agents (V5).

**Archetype 4 — Production Incident Ops.** The agentic track converges with classical incident response when the system in flames is agent-driven: cache stampedes on key expiry, connection-pool exhaustion under agent-fanout load, distributed deadlocks in checkout pipelines. Judged on: symptom → hypothesis → evidence discipline under time pressure, and producing a durable fix + postmortem, not a hotfix that regresses.
→ Practice: `incident-cache-stampede-thundering-herd` (HARD), `incident-db-connection-pool-exhaustion` (MEDIUM), `incident-deadlock-distributed-locks` (HARD).

### How it differs from the tracks you know

- **DSA round:** write an algorithm → deterministic pass/fail.
- **System-design round:** draw an architecture → judge on sharding, caching, replication trade-offs.
- **Agentic round:** build or repair a tool harness / workflow engine → judge on whether probabilistic reasoning is *contained* by deterministic code at every boundary: schema in, sanitized args down, structured errors back up.

### What "good" looks like to an interviewer

1. You never say "the LLM will handle it" — you enumerate the failure modes at each boundary and give each one a deterministic guard.
2. You design tool errors as information ("row 42 does not exist; valid ids are…"), not exceptions — so the agent can recover.
3. You delimit untrusted content explicitly and treat anything inside data as potential instructions.
4. You add a loop-breaker / max-step budget to every autonomous path by default.
5. You know when *not* to use an agent at all — a fixed workflow beats an autonomous loop when the steps are known (V1's central point).

---

## 5. Sandbox / process notes

- Working tree at the audit clone carries **mode-bit-only churn** (1343 files, `100644→100755`) plus a CRLF↔LF whole-file rewrite of `cloud-config-server/.../interview-session-service.yaml` — both are sandbox filesystem artifacts, **zero semantic delta**; never commit from this tree without `git checkout`-cleaning modes. Transient phantom deletions of 3 `sql-*.md` files appeared in the first `git status` and are **not present** on re-check — file exists, no deletion recorded.
- Link checks are region-dependent: the geo-block on `docs.anthropic.com` (→ claude.com region wall) and Cloudflare bot-walls on OpenAI/OWASP properties would likely pass from the operator's browser. Sandbox verdicts are conservative by design.
- Carried from prior rounds (unchanged): orchestrator image rebuild (QB-44 §4) still unconfirmed; SPEC-019.1 backlog unchanged.

