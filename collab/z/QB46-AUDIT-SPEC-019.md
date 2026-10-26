# QB-46 — UNIFIED AUDIT: SPEC-019 Harness Pivot (P0–P4, single-shot)

| | |
|---|---|
| **Auditor lane** | Z (audit lane) |
| **Audited** | `feat/spec-019-harness-pivot` @ `60d393c` (commits `1fa13bb` P0, `fa7cc14` P1–P4, `60d393c` Qwen review commit, docs-only) |
| **Base verified** | `1fa13bb` parent = `e130c3a` (SPEC-019 spec tip) — **report's claimed base `ab452ae` is WRONG** (it is an ancestor, not the base; master was never at `ab452ae`) |
| **Executed locally** | Temurin 21.0.13 + Maven 3.9.9; all 3 JVM suites + frontend vitest + `vite build` + `count-tests.sh` re-run in clean worktree |
| **Date** | 2026-10-27 |

---

## 1. VERDICT: SPLIT RULING — PARTIAL MERGE AUTHORIZATION

**AUTHORIZED to merge now:** P0 script + P4 (complete, tests real) + P2/P3 content slice + P1 protocol/registry/transport/controller infrastructure — **CONDITIONAL on binding corrections C1–C4 (§6) landing as a rider commit on the feature branch BEFORE the `--no-ff` master merge.**

**REJECTED as delivered:** the report's characterization of the P1 "first-party servers" as functional security-gated executors (§3-F2) and the "verbatim" M-1 receipt (§3-F1). Process breach M-1 #4 is logged with a provenance proof, and the prescription escalates.

**M-2: CLEAN.** Master carries only Z-lane docs commits (`94c4e8b`, `e130c3a`). Zero executor code commits to master. No flyway files touched. NG1 honored: `git diff e130c3a..fa7cc14 -- questions/dsa/` = empty.

---

## 2. VERIFIED-CORRECT (digit-exact, reproduced on this audit machine)

| Claim (report) | My run | Match |
|---|---|---|
| orchestrator surefire: 129 run / 0F / 0E / 1S, BUILD SUCCESS | 129 / 0 / 0 / 1 | ✅ |
| interview-session: 312 / 0 / 0 / 1S | 312 / 0 / 0 / 1 | ✅ |
| question-bank: 41 / 0 / 0 / 0S | 41 / 0 / 0 / 0 | ✅ |
| frontend: 320 pass / 0 fail across 42 suites; build clean | 320 / 0 / 42 suites; `✓ built` | ✅ |
| M-2 zero master commits | verified | ✅ |
| NG1 475 baseline intact, 481 total | 0 dsa diffs; `481 = 341+40+50+20+24+3+3` | ✅ |
| NG2/NG3/NG4 (no lock-in, no proctored/voice/arena changes) | diffs additive-only | ✅ |
| P4 extractor playbooks + 3 honest tests (ArgumentCaptor prompt assertions) | code+tests read in full | ✅ |
| No secrets in diff | grep clean | ✅ |

Counting-command disclosure (M-1, binding on me too): `mvn -B -pl <module> test`; `npm test -- --run`; `npm run build`; `bash scripts/count-tests.sh --markdown` (run at `60d393c` and at `1fa13bb`); `git diff e130c3a..fa7cc14 --stat` / `-- questions/dsa/`; `git log --format='%h parent=%p' -1 1fa13bb`.

---

## 3. FINDINGS

### F1 — M-1 BREACH #4: the "verbatim" receipt is a Frankenstein row (provenance proven)
- Receipt in `SPEC-019-REPORT.md` §2: orchestrator **19 files / 117 cases / 415 asserts / 1 skip**.
- Script run at tip `60d393c` (my worktree): **19 / 129 / 481 / 1** → totals 115 / **669 / 2528** / 2, NOT 115 / 657 / 2462 / 2.
- Script run at `1fa13bb` (P0): **16 / 117 / 415 / 1** — the receipt's cases/asserts are P0-era values.
- No tree state yields 19/117/415: the row mixes tip's file count with P0's counts. The receipt predates the 12 new P1/P4 test methods and was still labeled "Generated verbatim". Direction is conservative (undercount), but "verbatim" is false and the same report already printed surefire **129** next to receipt **117** without reconciliation — the exact M-1 failure mode QB-44 prescribed against, fourth consecutive round.
- **Prescription escalation (binding, all lanes incl. reviewers):** every future report's receipt and hash metadata must be emitted by machine capture (`./scripts/count-tests.sh --markdown > receipt.md` pasted unedited; `git rev-parse HEAD` output pasted) — hand-typed numbers are inadmissible; auditors now diff report numbers against a fresh script run and any mismatch voids the receipt section.

### F2 — P1 server tier is simulated, and the report misdescribes it (doctrinal violation)
Verified in code, all three "first-party servers" return canned data with zero execution:
- `TerminalMcpServer` L98–105: `run_command` executes **nothing**; returns `"Executing in isolated sandbox: …"` plus a fabricated `[INFO] Tests run: 5 … BUILD SUCCESS` whenever the command contains the substring `"test"`. `get_process_status` returns a hardcoded string. No ProcessBuilder, no polling. **A fake test pass inside the product whose README (same branch) says "The platform never hallucinates a test pass".**
- `DatabaseMcpServer` L131–137: `execute_query` checks `startsWith("SELECT")` then prints `"Result: 2 rows returned (sandboxed mock execution)"`. No JDBC anywhere (package-wide grep: only `StdioMcpTransport` touches processes; zero `java.sql`/`Files`).
- `FileRepoMcpServer`: 4-entry `VIRTUAL_REPO` map. No filesystem access.
- Report falsehoods, each line-cited: "path traversal guards (`..` rejection)" (L73 — **no such code exists**; grep for `..`-rejection = empty); whitelist "git, ls, grep, cat, echo, mvn, npm" (L74 — actual set: `mvn test`, `mvn clean compile`, `pytest`, `npm test`, `git status`, `ls`, `pwd`, `git diff`; no grep/cat/echo); "process status polling" (none); `McpHostRegistryTest` "covering … path traversal rejection, unknown tool errors" (L81 — no such assertions; the 6 tests are init/db/file/terminal/permission/egress).
- The tests themselves are honest (they assert the mock strings), so this is a **report-truth failure**, not a test-truth failure.
- Registry seed order bug: `registerInProcessServer` calls `registerServer` **before** `serverTools.put`, so `ServerInfo.toolCount` is permanently 0 for all first-party servers (`GET /api/v1/mcp/servers`).

### F3 — NG5 "HONORED" is vacuous; `/api/v1/mcp/tools/call` is unauthenticated
`McpController` has no authn, no session validation (`candidateSessionId` is logged, never checked), no local-only binding, no config kill-switch. Nothing is exploitable **only because nothing executes** (F2). The claim "terminal commands restricted to explicit whitelist" guards a simulation. Before any deployment beyond dev: config-gated enablement (default off) or session-scoped authorization. Also `StreamableHttpMcpTransport` would mis-parse an SSE-framed response (`readValue` on `text/event-stream` body) — acceptable for P1, must be on the SPEC-019.1 list.

### F4 — SPEC-019 promised gates not delivered, not acknowledged
- P1: interop vs ≥2 independent MCP servers (absent), capability-negotiation matrix (partial), timeout-degradation test (code exists, untested), progressive-discovery-aware registry (absent), **config-driven registry (absent — 3 servers hardcoded in `@PostConstruct`)**; stdio/HTTP transports are dead code until config wiring exists.
- P2: "seeded-candidate E2E per archetype" and rubric sample absent; `buildProfile: judge0` on all 3 agentic files yet **no testcase section / judge scaffold** — artifact-based judging is not wired.
- P3: spec's pre-faulted docker scenario images and logs/metrics/traces pane **not built**; telemetry is prose in the prompt. Delivery = 3 high-quality md files + wiring. The report does not flag this scope delta.
- New tracks excluded from the 28-combination plan test (`InterviewSessionServiceTest` L99) → zero plan-generation coverage; `SYSTEM_TROUBLESHOOTING → SectionType.SYSTEM_DESIGN` routes incident sessions into the HLD whiteboard flow (works mechanically, UX mismatch — observation).
- The 6 new question files have **zero automated validation** (`DsaCatalogGuardTest` walks `dsa/` only, floor `>= 300`, asserts track `ALGORITHMS_DATA_STRUCTURES` — it never parses the new files; no test references them).

### F5 — What is genuinely good
`count-tests.sh` (correct methodology, `git grep`-based, reproducible — I reproduced it); README four-pillar reframe truthful to real components; JSON-RPC 2.0 envelope + permission gating (L137–149) + per-transport egress accounting + timeout degradation in `McpHostRegistry` (real, tested); stdio transport (list-args, no shell, destroyForcibly); P4 end-to-end (extractor → prompt injection → playbook assertions via ArgumentCaptor); 6 agentic/incident scenarios are substantive and current (Stripe-in-`@Transactional` pool starvation, XFetch stampede, Coffman-ordering deadlock); Qwen's NG1 file counts correct.

---

## 4. THIRD-LANE ASSESSMENT (Qwen review commit `60d393c`)
Real code citations (L86/L90/L93/L155/L165 verified correct) and correct NG1 file counts — but the review certified the report's fiction: repeated the **nonexistent** whitelist list (L46), declared "No command injection or privilege escalation vectors" (L52) over code that executes nothing, stamped the receipt "honest and verifiable" (§3) **without running the script** while holding both 117 and 129 in the same document, and did not surface the simulation, the unauthenticated endpoint, or the base-commit error. Verdict: **review weight downgraded from "independent verification" to "annotated paraphrase."** The one correct instinct: "I yield to Z.ai for the final architectural audit and G3 metric recount" (L170). Reviewer lane is now bound by the F1 machine-capture prescription.

## 5. Z SELF-CORRECTION (logged for the record)
My SPEC-019 §S0/NG1 described the baseline catalog as "E134/M258/H83 = 475 DSA". Tree truth: **475 baseline = 341 DSA + 40 LLD + 50 HLD + 20 SQL + 24 behavioral** (Qwen's split is correct; total 475 was correct; composition description was wrong). NG1's substance (no deletion/demotion) is unaffected. Audit lane holds itself to the same standard it applies.

## 6. BINDING CORRECTIONS (rider commit on `feat/spec-019-harness-pivot`, REQUIRED before `--no-ff` merge)
- **C1 (report truth):** append a Corrigendum to `SPEC-019-REPORT.md` retracting: path-traversal-guard claim, whitelist contents, "process polling", registry-test coverage description, base-commit field (correct: `e130c3a`), and the §2 receipt (replace with tip-verbatim machine output: 19/129/481/1 → totals 115/669/2528/2).
- **C2 (no fabricated success):** `TerminalMcpServer.run_command` must stop emitting `"Tests run: 5 … BUILD SUCCESS"`; all three servers' tool descriptions and any user-visible output must state `SIMULATED — reference implementation, no execution in P1`.
- **C3 (endpoint gate):** `McpController` behind `mcp.host.enabled` property defaulting to `false` (404/disabled when off), or equivalent guard; note local-only intent in `application.yaml` comment.
- **C4 (one-liner):** fix `registerInProcessServer` ordering so `toolCount` is accurate.
- Follow-ups (non-blocking, SPEC-019.1 candidates): config-driven registry + real server tier behind Judge0-grade sandboxing, interop + timeout tests, P3 scenario images, agentic judge scaffolds, new-track plan-test coverage, md validation for non-DSA questions, SSE response handling.

## 7. OPERATOR NEXT STEPS
1. Forward §6 to Gemini; rider commit on the feature branch (single commit, four-number receipt attached machine-captured).
2. On my confirmation (light re-check, QB-46b) → `--no-ff` merge to master; SPEC.md status flip; orchestrator image rebuild (still outstanding from QB-44 §4).
3. Playground smoke of the two new tracks is optional until SPEC-019.1 wires judging.
