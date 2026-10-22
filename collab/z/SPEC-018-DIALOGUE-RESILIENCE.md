# SPEC-018 — HOTFIX: Dialogue Resilience, Provider Failover & Playground Fallback Integrity

| | |
|---|---|
| **Spec ID** | SPEC-018 |
| **Class** | HOTFIX (P1 — user-facing degraded-mode loop in Playground dialogue) |
| **Author lane** | Z (audit lane) |
| **Status** | READY FOR EXECUTION (single-push protocol) |
| **Branch** | `feat/spec-018-dialogue-resilience` |
| **Fence** | `ai-orchestrator-service/src/**`, `frontend/src/**` (only where gates demand), spec/docs |
| **Verification basis** | Z audited clone @ `013e501` (R4-era lineage): `GeminiClient.java` + `JsonCleaner.java` matched the operator's diagnostic **digit-exact**; service file verified structurally. **Re-confirmed on live master `d106adf`**: `GeminiClient` still lacks `response_mime_type` (grep exit 1); `JsonCleaner` unchanged (41 lines); `AiOrchestratorService` (1265 lines) — failover call at L568 with parse at L578-579 **outside** it, `executeWithProviderFailover` def at L845, `buildRotatingFallbackFollowUp` at L894 with gating phrase "Before we unlock the editor" at L919, `DETERMINISTIC_FALLBACK` at 5 sites (L768/795/815/838), second failover consumer `processHandoff` at L1204. Line numbers are **anchors captured at spec time**, not positions for the executor. |

---

## S0. Problem Statement

In Playground mode, dialogue turns intermittently collapse into **"Degraded AI mode — responses automated / FALLBACK ACTIVE"** with a rotating canned sender ("Automated Fallback DSA"). Observed sequence on live stack:

1. Candidate asks *"can you provide the code"*.
2. Backend dispatches to Gemini (`gemini-3.5-flash`). Gemini returns JSON **double-encoded** (string starts `{\"` — escaped quote, ASCII 92, at line 1 column 2).
3. Jackson `readTree` throws `Unexpected character ('\' (code 92))`.
4. **No failover to Groq occurs** — output validation sits outside the failover path. System drops directly to `DETERMINISTIC_FALLBACK`.
5. Deterministic fallback emits **interview-gating language** ("Before we unlock the editor…") in **Playground**, where the editor is already unlocked. Nonsense escalates as the user repeats the request.

Net effect: user is trapped in a canned-response loop and never gets code they explicitly asked for. Live log evidence (operator-supplied):

```
WARN c.i.ai.service.AiOrchestratorService : ⚠️ LLM dialogue extraction notice (GEMINI_OUTAGE):
Unexpected character ('\' (code 92)): was expecting double-quote to start field name at line: 1, column: 2.
Using completion-aware structured fallback dialogue.
```

## S1. Verified Root-Cause Ledger

All five causes verified by Z against source. "Anchor" = how the executor locates the site on current master.

| ID | Root cause | Evidence (clone @ 013e501) | Anchor for executor |
|----|-----------|---------------------------|---------------------|
| **R1** | `GeminiClient` sends `generationConfig` with **only** `temperature` — no `response_mime_type: "application/json"`. Gemini output is free-form; double-encoded JSON is possible. | Lines 110–113: `"generationConfig", Map.of("temperature", 0.3)` — **digit-exact match with operator diagnostic** | `GeminiClient.generateCompletionWithVision`, requestPayload map |
| **R2** | `JsonCleaner.extractPureJson` handles markdown fences + brace slicing but has **no unescape pass** for double-encoded JSON. `{\"interviewerReply\": …}` passes through unchanged → Jackson crash. | `JsonCleaner.java` L16–41 (fence pattern, `indexOf('{')`/`lastIndexOf('}')` slicing only) | `JsonCleaner` class |
| **R3** | JSON validation is **outside** provider failover. Clone: parse sits in the same `try` as a single `client.generateCompletion(...)` call (L463–476); `catch` drops straight to structured fallback (L565–632). Live code has `executeWithProviderFailover` but keeps parse outside it, so a *parse* failure never counts as a *provider* failure. `resolveEffectiveProvider` only reroutes when the requested provider is **unconfigured** (L675–707) — it is a config router, not an output-quality failover. | `AiOrchestratorService` L463–476, L565–632, L675–707 | `processDialogue` try/catch; `executeWithProviderFailover` (live) |
| **R4** | Deterministic fallback is **not playground-aware**. Clone's generic catch-all (L621–631) emits interview-flavored coaching for both personas; live `buildRotatingFallbackFollowUp` emits "Before we unlock the editor…" — factually wrong in Playground (editor is open from turn 1) and escalates confusion. | L621–631; operator diagnostic L821–840 / L913–921 | `buildRotatingFallbackFollowUp` + every fallback `AiDialogueResponse` construction site |
| **R5** | Coach Sam persona rules **1 & 7** forbid full code reveals even on explicit request: rule 1 "do NOT give away the complete answer immediately"; rule 7 "reveal the approach cleanly and explain key lines" (approach-level only). | L230, L236 (playground system instruction block) | Playground system-instruction text block |

**Secondary finding (R6, informational):** the clone's `OpenAiCompatibleClient` (Groq path) sets no `response_format` either — Groq's clean turn-1 JSON was model behavior, not API enforcement. F1+F2 must therefore harden **both** provider paths; do not treat Groq as structurally safe.

## S2. Non-Goals

- **NG1.** No changes to interview-mode (Dr. Anya) persona rules. Socratic integrity in proctored mode is untouched by this spec.
- **NG2.** No provider-config UX work, no model renaming, no `.env` default-provider changes (operator's Groq-default workaround is documented in S7, not shipped as code).
- **NG3.** No STT / voice-coach / recording changes.
- **NG4.** No SPEC-016 (rotation catalog) or SPEC-017 (/history) behavior changes; their suites must pass digit-exact as regression proof.
- **NG5.** No retry-storm protection redesign; a simple bounded attempt chain is in scope, exponential backoff machinery is not.

## S3. Required Fixes

### F1 — Gemini structured output (fixes R1)

In `GeminiClient`, extend `generationConfig` to:

```java
"generationConfig", Map.of(
        "temperature", 0.3,
        "response_mime_type", "application/json"
)
```

- Applies to **both** text and vision call paths (they share `requestPayload`; verify).
- If the configured model rejects `response_mime_type` (HTTP 400), that failure MUST surface as a provider failure and trigger failover per F3 — it must NOT crash the dialogue turn. Prove this in GA3.

### F2 — Double-encoded JSON recovery (fixes R2)

Add to `JsonCleaner` a pure-string recovery pass. Required semantics:

1. New public method `unescapeDoubleEncoded(String raw)`.
2. Trigger condition inside `extractPureJson` **or** at the service parse site (executor's choice, but document it): the extracted payload fails `readTree`, OR a cheap heuristic hits (payload contains `\"` at a field-name position, e.g. starts `{\"` or contains `\":\"`).
3. Recovery algorithm (pure string, no ObjectMapper dependency inside the util):
   - If the payload is wrapped in a layer of literal quotes (starts `"{` and ends `}"` after trim), strip one wrapper layer.
   - Replace `\"` → `"`, then `\\\\` → `\\` (order matters; do not naive-replace all backslashes).
   - Re-run brace slicing (`indexOf('{')` … `lastIndexOf('}')`).
4. After recovery, exactly ONE re-parse attempt is made. If it still fails → treat as provider failure per F3. No silent swallowing.

Unit-prove in GA1, including the exact live failure payload class (`{\"key\": ...}`).

### F3 — Parse-inside-failover (fixes R3 — the core defect)

Restructure `processDialogue`'s provider invocation so that **output validity is part of provider success**:

1. Build an ordered attempt chain: effective provider first, then remaining configured providers (GEMINI ⇄ GROQ ⇄ OLLAMA as configured; never attempt an unconfigured one).
2. One attempt = `generateCompletion` → `JsonCleaner.extractPureJson` → optional F2 recovery → `objectMapper.readTree` → minimal schema check (`interviewerReply` non-null). Any exception in this chain = **attempt failure**; log at WARN with provider name + exception class + message, then advance to next provider.
3. `providerStatusService.recordOutcome(provider, "ERROR", status)` fires on each failed attempt (parse failures included), preserving the status-pill semantics the frontend already consumes.
4. Deterministic fallback (`DETERMINISTIC_FALLBACK`) is reached **only after every configured provider has failed**.
5. Bounded: at most one attempt per configured provider, max 3 attempts total. No intra-provider retry loops.
6. Keep the existing post-guards (engine-error guard, passed-tests guard, anti-inversion, consent guard) operating on the **winning** response exactly as today.
7. **Second consumer — `processHandoff` (anchor: L1204 on `d106adf`)**: same defect class (failover wraps only the network call; `extractPureJson` + `readTree` run after; parse failure silently degrades to raw-text passthrough). Less severe than the dialogue loop (no canned gating text), but it MUST adopt the same attempt-chain semantics (parse failure = provider failure → next provider) and receive the F2 recovery. Degradation after all-provider exhaustion may remain the existing neutral handoff text.

GA3 is the load-bearing gate: primary returns garbage → secondary answers → no fallback banner.

### F4 — Playground-aware deterministic fallback (fixes R4)

Every deterministic fallback construction site (live `buildRotatingFallbackFollowUp` **and** any generic catch-all response builder) must branch on `isPlayground` (`request.getEffectiveMode()`):

1. **Forbidden in Playground fallback:** gating phrases — "Before we unlock the editor", "unlock the editor", any stage-advance framing, any phrasing that implies the editor is locked or that code submission is gated.
2. **Required Playground fallback behavior:** acknowledge the candidate's last message; when the candidate's message mentions code/solution/implementation, the fallback MUST point them to the open editor and offer review-on-submit (e.g. "The editor is open — sketch your solution and run it; I'll review your implementation and we'll refine from there."), possibly with one approach-level nudge.
3. Interview-mode fallback text may remain as-is.
4. Cover the specific escalation loop from S0: repeated "can you provide the code" must not produce mismatched gating follow-ups. GA4 pins this.

### F5 — Playground code-reveal rule (fixes R5)

Amend the Playground system instruction (Coach Sam block):

- Rule 1 stays (progressive hints while the candidate is working).
- Rule 7 is replaced with:

  > 7. If the candidate explicitly asks for the code or the solution ("provide the code", "give me the solution", "show me the implementation"): provide the full working solution code with clear line-by-line commentary, then suggest one extension exercise. In Playground this is permitted and expected; do not stall with repeated Socratic deflection after an explicit request.

- Add one sentence to the JSON-schema guidance: set `"detectedIntent": "CLARIFYING"` and `"recommendedAction": "ANSWER_CLARIFICATION"` when revealing a requested solution.
- **Interview-mode (Dr. Anya) instruction MUST NOT contain the amended rule** (NG1). GA5 asserts both directions.

## S4. Acceptance Gates

Honest-judge doctrine applies: real outputs, real containers, no staged logs. Four-number reporting for suites: **files / test-cases / assertions / failures**.

| Gate | Proves | Method |
|------|--------|--------|
| **GA1** | F2 unescape recovery | Unit tests, min: (a) literal `{\"interviewerReply\": \"x\", \"followUpQuestion\": \"y\"}` → parses; (b) normal clean JSON passes through unchanged; (c) markdown-fenced clean JSON still works; (d) payload unrecoverable → exception surfaces (no silent `{}`); (e) backslash-order case `\\\\` survives as `\\`. |
| **GA2** | F1 payload | Unit test capturing the outbound request (MockRestServiceServer or arg-captor): `generationConfig.response_mime_type == "application/json"`, `temperature == 0.3`, for both text and vision paths. |
| **GA3** | F3 failover | Unit/integration test: primary stubbed to return `{\"broken` (or throw 400 on `response_mime_type` rejection variant) → response is produced by secondary provider; `recordOutcome` called ERROR on primary, OK on secondary; `DETERMINISTIC_FALLBACK` NOT set. Second test: all providers fail → fallback IS set. Third test: `processHandoff` with primary returning `{\"…` → next provider serves the handoff (raw-text passthrough on parse failure is NOT acceptable while a provider remains). |
| **GA4** | F4 fallback language | Test: force fallback in PLAYGROUND mode with candidate message containing "code" → returned text contains no forbidden gating phrase and contains an editor-open reference; same test in INTERVIEW mode may keep legacy text. Include the S0 escalation loop (two consecutive "provide the code" turns → both playground-correct). |
| **GA5** | F5 prompt rules | Test asserting the playground instruction contains the new rule-7 text and the interview instruction does not; assert `"usedFollowUpSeedIds"` and all existing schema fields remain present in both (SPEC-016 schema regression). |
| **GA6** | End-to-end, honest-judge | `docker compose up` full stack → Playground session on Gemini primary → send "can you provide the code" → expect either a real coach reply containing code (no yellow banner) or a failover evidence path. Capture: (a) screenshot of panel reply, (b) `docker logs ai-orchestrator-service` excerpt for the turn showing provider attempt chain. Zero occurrences of `Unexpected character ('\' (code 92))` across the session log. |
| **GA7** | Regression | `mvn -q test` (orchestrator module) + frontend suite, four-number reporting, digit-exact vs the branch's own baseline run (report baseline alongside). SPEC-016/017 suites green. |
| **GA8** | Fence discipline | `git diff --stat master...HEAD` file list matches: orchestrator sources + tests (+ frontend only if a gate test requires it) + this spec's execution notes. Any extra file = explicit deviation note in report. |
| **GA9** | Banner semantics | Frontend (if touched): degraded banner renders only when backend marks the response `DETERMINISTIC_FALLBACK` (all-provider exhaustion) — not on single-provider parse recovery. If frontend untouched, assert via the API response field driving the banner (paste that field's values for the GA6 turns). |

## S5. Execution Discipline (carried rules — all mandatory)

1. **Single push, one branch** `feat/spec-018-dialogue-resilience`, one commit (or logically-sliced commits F1..F5 + tests), merge to master `--no-ff` only after Z verdict.
2. **Image-only deploy:** no `docker cp` hot-patching of jars; containers must run images built from the branch (QB-16 M2 rule).
3. **No flyway hand-edits** (QB-16 M1 rule). No schema changes are expected in this spec at all; if any migration appears, it is a fence violation.
4. **Four-number reporting** everywhere: files / test-cases / assertions / failures (QB-18 NIT rule).
5. **No branch deletion**; no force-push.
6. Report deviations explicitly (deviation noted ≠ auto-reject; undeviated silence = reject).

## S6. Report Template (execution lane → Z)

```
SPEC-018 EXECUTION REPORT
Branch/HEAD: <sha>          Base master: <sha>
Files touched: <n> (+ins/−del per file)

GATE RESULTS (four-number per suite):
GA1: <files/tc/assert/fail>  GA2: ... GA3: ... GA4: ... GA5: ...
GA6: [screenshot ref + log excerpt; must show attempt chain, zero code-92 errors]
GA7: orchestrator <n/n/n/0> | frontend <n/n/n/0> (baseline: <same format>)
GA8: file list + any deviations
GA9: banner-driving field values for GA6 turns

DEVIATIONS: <none | list with rationale>
```

## S7. Operator Immediate Workaround (documented, not part of acceptance)

Until the hotfix merges, either of the following stops the degraded loop:

- Switch the AI provider to **Groq** in the session/top bar for Playground sessions (turn-1 evidence shows Groq emits clean JSON for this prompt class), or
- Set Groq as the default dialogue provider in `.env`.

This does not fix R1–R5; SPEC-018 remains required.
