# QB-44 — MERGE AUTHORIZATION AUDIT: SPEC-018 (feat/spec-018-dialogue-resilience @ 0b10bff)

| | |
|---|---|
| **Auditor** | Z (audit lane) |
| **Scope** | Single commit `0b10bff` on base `ab452ae` (exact merge-base), 7 files +864/−99, branch `feat/spec-018-dialogue-resilience` |
| **Method** | Full diff review (line-level), orchestrator suite re-run in Z sandbox (Temurin JDK 21.0.13 + Maven 3.9.9), static reconciliation of all four-number claims, frontend coupling verified in tree |
| **VERDICT** | **MERGE AUTHORIZED** — merge to master `--no-ff` as-is |

---

## 1. Gate-by-Gate Adjudication

| Gate | Claimed | Z result | Verdict |
|------|---------|----------|---------|
| GA1 unescape recovery | 1/6/11/0 | Re-ran: JsonCleanerTest **6/6 green**. Tests use literal `{\"` payloads (the exact live-failure class), assert value round-trips, clean-JSON idempotence, fenced input, gibberish surfacing, `\\\\`→`\\` ordering, wrapper-strip | **PASS** |
| GA2 gemini payload | 1/3/8/0 | Re-ran: GeminiClientTest **3/3 green**. GA2 captures the *real outbound HTTP body* via interceptor for both text and vision paths; asserts `response_mime_type=="application/json"`, `temperature==0.3` on both | **PASS** |
| GA3 failover | 1/3/10/0 | Re-ran: **3/3 green** (GA3-1 malformed-primary→secondary, `generator=="LLM"`, ERROR/OK outcomes asserted; GA3-2 exhaustion→`DETERMINISTIC_FALLBACK`; GA3-3 `processHandoff` parse-fail→next provider). Spec's third handoff test implemented as required | **PASS** |
| GA4 fallback language | 1/1/12/0 | Re-ran: **1/1 green**. Pins the S0 escalation loop (two consecutive "give me the code" turns), forbidden-phrase asserts on reply AND followUp, editor-reference assert, interview-mode comparison | **PASS** |
| GA5 prompt rules | 1/1/7/0 | Re-ran: **1/1 green**. Captures real system instructions both modes; digit-exact rule-7 text assert in playground; asserts absence in interview + `usedFollowUpSeedIds` schema retention both modes | **PASS** |
| GA6 honest-judge E2E | live stack probe | **Accepted on log-consistency proof**: pasted log lines match committed code digit-exact (attempt-failure log format, `IllegalArgumentException: Provider GROQ returned JSON missing required 'interviewerReply' field` = committed message string). Evidence shows REAL multi-provider chain: Gemini 503 → Groq schema-miss → Ollama success, `generator: "LLM"`. Zero `code 92` claim consistent with parse-failures now being recovered in-chain | **PASS** |
| GA7 regression | orch 15/115/428/0; FE 41/317/1301/0; session 18/312/1056/0; qb 8/41/187/0 | **Re-ran orchestrator: 115 test cases / 0 failures / 0 errors / 1 skipped — digit-exact.** Session 312, qb 41, frontend 317/41: zero files touched in those modules (git-proven, 7-file diff is orchestrator+collab only) → QB-40/42 audited baselines **carry**. Two four-number components drift — see M-1 | **PASS** (with M-1) |
| GA8 fence | 7 files | `git diff --stat master...HEAD` = exactly 7 (3 main + 3 test + 1 report). No frontend, no flyway, no config | **PASS** |
| GA9 banner semantics | generator LLM → no banner | Verified in tree: `AiAssistantPanel.tsx` L209-212 keys `isDegradedAiMode` off `metadata.generator === "DETERMINISTIC_FALLBACK"` — backend now emits it **only** on all-provider exhaustion. Contract pre-existed; backend was the violator; now aligned | **PASS** |

## 2. Code Review Notes (all verified in diff)

- **F3 core restructure is correct and clean**: chain = primary + configured backups (preference-ordered), cap 3, one attempt per provider; attempt = call → `extractPureJson` → parse → unescape-retry-once → `interviewerReply` schema check; `recordOutcome` per attempt (422 parse/schema, 503 default, real HTTP code on RestClient errors); fallback only after loop exhaustion. Both `processDialogue` and `processHandoff` converted; legacy `executeWithProviderFailover` also rewritten to chain semantics for its remaining consumers.
- **Post-guards preserved**: engine-error guard, passed-tests guard, anti-inversion guard, consent guard all sit inside the `winningAttempt != null` block operating on the winning root — behavior identical to pre-refactor.
- **The "remove line 149" edit** removed only the now-dead `AiClient client` declaration. SPEC-008 echo-contamination check is untouched.
- **F4**: playground branch precedes gating pools in `buildRotatingFallbackFollowUp`; spec sentence shipped verbatim; interview legacy text (incl. "Before we unlock the editor") correctly retained for interview only; remaining fallback sites (engine-error/passed/failed) are factual, no gating language.
- **F5**: rule 7 replaced verbatim per spec §F5; schema-guidance sentence added; Dr. Anya block has zero diff hunks (NG1 honored).
- **F1**: single shared payload site covers text + vision (GA2 proves both).

## 3. Findings

### M-1 (process, non-blocking): four-number vocabulary drift — third occurrence
- **files**: claimed 15; 16 test classes on disk (15 `*Test.java` + `AiOrchestratorServiceApplicationTests.java`, which is the 1-skipped boot-context test). Defensible suite-counting, but the QB-18 standard is files-on-disk.
- **assertions**: claimed 428; Z measures **412** assert-call occurrences (two independent grep methods agree at 412; line-based also 412). +16 overstatement ≈ 3.9%.
- Load-bearing numbers (test-cases 115, failures 0, per-gate test-case counts 6/3/3/1/1) are **digit-exact**.
- This is the third occurrence (QB-18 NIT → QB-44). **Prescription (mandatory before next spec):** executor must publish the exact counting command in the report (e.g. a checked-in `scripts/count-tests.sh`) or drop the assertions slot from headline reporting. Silent recounting is no longer acceptable.

### O-1 (non-blocking, follow-up candidate): unescape-before-parse ordering in `extractPureJson`
`isDoubleEncoded`'s `contains("\":\"")` heuristic matches *every* ordinary JSON object with string values, so `unescapeDoubleEncoded` runs pre-parse on nearly all payloads. It is idempotent/no-op for clean JSON (GA1-b proves pass-through), but a payload whose *values* legitimately contain `\\` or `\"` sequences can be cosmetically mangled while remaining valid JSON. The service layer partially compensates (`parseAndValidateDialogueJson` tries plain parse first, unescape only on `JsonProcessingException`). Recommend a future slice: make `extractPureJson` recovery parse-gated (unescape only when a parse attempt fails), keeping the util pure. Not merge-blocking: no structural failure mode, GA1 suite green.

### O-2 (informational): GA6 revealed real-world chain behavior
Gemini 503 (transient outage at test time) AND Groq schema-miss (model omitted required field) were both absorbed by the chain — Ollama served the turn with `generator: "LLM"`. This is stronger evidence than a single-failure E2E: two independent failure classes recovered in one turn. No action needed.

## 4. Merge Instruction

```
git checkout master && git pull
git merge --no-ff feat/spec-018-dialogue-resilience -m "merge(spec-018): dialogue resilience, provider failover & playground fallback integrity (QB-44 authorized)"
git push origin master
```

Then flip SPEC-018 status to COMPLETED & MERGED in SPEC.md (docs commit, same pattern as SPEC-016/017). No image-rebuild skip: orchestrator image MUST be rebuilt from merged master before next playground use (image-only deploy rule).

## 5. Post-Merge Verification Queue (operator/Z)

1. Z verifies merge commit parentage + byte-identity of merged tree vs `0b10bff` (QB-42 close-out pattern).
2. Operator runs one Playground dialogue turn post-merge; expect no yellow banner under normal provider health.
3. M-1 counting prescription takes effect from the next execution report (SPEC-019+).
