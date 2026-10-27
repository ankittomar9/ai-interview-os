# QB-51 — False-Green "(0/0) PASSED" on `agentic-mcp-order-service`: Root Cause Machine-Verified + Corrected Diagnosis + Fix Spec

- **Agent:** Super Z (audit lane)
- **Date:** 2026-10-27 (Asia/Calcutta)
- **Evidence:** operator's live session `/session/188` (volume `ws_188`), 3 screenshots; all code claims below verified at master `45dbd85` (content identical to `9e704b6` for every file cited)
- **Also closes:** QB-50 post-merge check (§5)

---

## 1. Root cause — full chain, every link verified at HEAD

| # | Link | Evidence (machine-captured) |
|---|---|---|
| 1 | Question authored with **`buildProfile: judge0`** (DSA-template copy-paste) | `agentic-mcp-order-service.md` front-matter; all 3 agentic mds = `judge0`; lld convention = `maven-workspace` (e.g. `lld-atm-system.md` L17) |
| 2 | Wrong runner selected: `DsaJudge0Runner.supports()` returns **true** on `buildProfile: judge0` (first branch, L31-33) | `DsaJudge0Runner.java` L28-37; `CodeExecutionService.findRunner()` = first-match (L94-96) |
| 3 | Question ships **zero tests**: `sampleTests=0`, `hiddenTests=0`, `starterFiles=0` sections in all 3 agentic mds | grep across `questions/agentic/*.md`; cf. lld mds which carry test scaffolds (e.g. `lld-atm-system.md` with `editablePaths:` L561 + hidden tests) |
| 4 | With `totalTests == 0` the Judge0 submission loop is **skipped entirely** — no Judge0 call, no Docker, no Maven, no compile | `DsaJudge0Runner.run()` L68-74: `allTests` empty → loop body never entered |
| 5 | **The false green: `String overallStatus = passedCount == totalTests ? "PASSED" : …` — UNGUARDED → `0 == 0` → `PASSED`** | `DsaJudge0Runner.java` **L224** |
| 6 | FE banner prints `✅ [BUILD SUCCESS] All JUnit tests passed (0/0) in 179ms` — banner prints only on `status === 'PASSED'` (so BE really returned PASSED); counts are honest; the "All JUnit tests passed" phrasing is hardcoded and doesn't check `totalTests > 0` | `EmbeddedWorkspace.tsx` L137-143; `executeProject` is a real API call (`api.ts` L656-673) — 179ms roundtrip confirms no sandbox ran |
| 7 | Verdict recorded as PASSED → question badge **Solved** (`isSolved={… === 'PASSED'}`) | `CodeExecutionService.recordPracticeAttempt` L212+; `ArenaShell.tsx` L196 |

Every observed fact is explained deterministically at HEAD: `(0/0)` = no tests shipped; `179ms` = no execution engine involved; green banner = unguarded ternary; Solved = PASSED verdict.

## 2. Verdict on the executor's (Gemini) diagnosis

| Gemini claim | Verdict |
|---|---|
| "Vacuous pass — code never tested" | ✓ CONFIRMED |
| "No test files seeded in scaffold" | ✓ CONFIRMED (and worse: zero `starterFiles`/`hiddenTestFiles` sections at all) |
| "Maven Surefire ran against empty test dir; Maven compiled your Solution.java" | ✗ **FABRICATED** — `buildProfile: judge0` routed to the Judge0 runner; no Maven/Surefire/compile ever ran. 179ms is impossible for a containerized Maven run. |
| "`LldMavenRunner` False Pass: treats 0 tests as green" | ✗ **WRONG FILE** — `LldMavenRunner` has been guarded since its creation commit `efc4f97`: `(totalTests > 0 && passedTests == totalTests) ? "PASSED"` (L445). The unguarded ternary is in **`DsaJudge0Runner` L224**. |
| "status should be NO_TESTS/FAILED when totalTests == 0" | ✓ RIGHT FIX, WRONG FILE |
| "Missing Test Scaffold" | ✓ CONFIRMED — plus a second authoring defect Gemini missed: **`buildProfile: judge0` is itself wrong** for a Maven-workspace question (pom.xml + "Run Project Tests" UI imply `maven-workspace`). |
| Coach Sam `DSA` badge | ✓ CONFIRMED at HEAD — `playgroundPlan.ts` `syntheticPlaygroundSection()` **hardcodes `sectionType: 'DSA'`** and track fallback `'ALGORITHMS_DATA_STRUCTURES'` (L8-21), poisoning the plan for every non-DSA playground question. BE is already correct (`SessionPlanService` L663: `AGENTIC_ENGINEERING -> CORE_TECH`); FE resolver has the AGENTIC→LLD case since `fa7cc14` — the synthetic plan is the broken link. |
| Submit-time file-tree sync gap (container boundary) | PLAUSIBLE, not yet machine-verified — backlog P2, verify separately. |

**Net:** right symptom, 2 of 4 mechanism claims wrong. Per the standing rule (QB-47 NIT), narratives about runtime behavior must be code-verified before entering reports — this is the second occurrence of plausible-but-unverified mechanism storytelling from the executor lane.

## 3. Fix spec (executor branch `feat/qb51-*`, base = current master)

**P0-A — Runner honesty (`DsaJudge0Runner.java` L224):**
```java
String overallStatus = (totalTests > 0 && passedCount == totalTests) ? "PASSED"
        : (passedCount > 0 ? "PARTIAL" : (totalTests == 0 ? "NO_TESTS" : "FAILED"));
```
- `NO_TESTS` must never count as a pass anywhere downstream (history/dashboard/attempt-verdict checks use `"PASSED".equalsIgnoreCase(...)` — safe by default once the runner stops emitting it).
- FE `EmbeddedWorkspace.tsx`: add a `NO_TESTS` branch rendering `⚠️ No tests ran — question scaffold incomplete (0 test cases)` with `setTestStatus('failed')`; never the green banner.

**P0-B — Question authoring (`agentic-mcp-order-service.md`):**
- `buildProfile: judge0` → `buildProfile: maven-workspace` (matches the Maven workspace the UI presents).
- Add the lld-convention sections (copy shape from `lld-atm-system.md`): `starterFiles:` (pom.xml, `Solution.java` skeleton, README), `editablePaths:` (candidate's Solution.java path), `hiddenTestFiles:` — a `SolutionTest.java` grounded **only** in the md's own contract: `ORD-123456` → `"Order ORD-123456: Status = DELIVERED, Items = 3, ETA = 2026-10-28"` (md L72), invalid format → `isError: true` + "Invalid orderId format", unknown order → `isError: true` + "Order not found", blank → `isError: true`. (Gemini's drafted 4-test suite is contract-consistent with the md — admissible after adaptation to the md's actual starter signature.)
- **Audit the remaining 2 agentic mds** (`agentic-debug-hallucinating-agent`, `agentic-design-subagent-guardrails`): each is also `judge0` with zero test sections — executor must decide intended execution mode per question and supply scaffolds accordingly. Flag explicitly in the PR description; do not silently convert.

**P1 — Coach Sam track (FE, `playgroundPlan.ts`):**
- `syntheticPlaygroundSection()` must derive `sectionType`/`track` from `q.track` (mapping identical to `ArenaShellTypes.resolveSectionType`: `AGENTIC_ENGINEERING → 'LLD'`, `SYSTEM_TROUBLESHOOTING → 'SYSTEM_DESIGN'`, …); never hardcode `'DSA'`.
- Tests: tsx unit — `syntheticPlaygroundSection({track:'AGENTIC_ENGINEERING'})` must not yield `sectionType:'DSA'`; `resolveSectionType({track:'AGENTIC_ENGINEERING', isPlayground:true}) === 'LLD'` (passes at HEAD, pin it).

**P2 — backlog:** submit-time workspace file-tree sync (container boundary); ENGINE_UNAVAILABLE panel showing "(0/0 Tests Passed)" is misleading when `totalTests` is a `sampleTests.size()` fallback — cosmetic.

**Receipt expectations:** new asserts = zero-test `NO_TESTS` case (DsaJudge0RunnerTest), routing test (agentic md → `LldMavenRunner.supports` true after P0-B — via QBS content test or ISS contract test), FE NO_TESTS-branch + plan-mapping tests; suites stay 0F/0E; `count-tests.sh --markdown` delta must be itemized vs baseline **116/676/2573/2**.

## 4. Discipline notes

- The "All 3 JUnit tests passed" phrasing in screenshot 2's transcription: the FE template contains no "3"; treated as a vision-transcription artifact, **not asserted** as a platform defect (needs operator eyeballs if it really rendered that way).
- Executor lane: before writing a diagnosis, reproduce the code path from source — "Maven compiled your code" was asserted without reading the routing (`supports()` order) and was falsifiable in one grep.

## 5. QB-50 post-merge — CLOSED

- Merge `45dbd85` = true two-parent `--no-ff` (f75be76 + 9e704b6), merge message matches the QB-50 template.
- Content-free: `git diff 9e704b6 45dbd85` = only `collab/z/QB50-PREMERGE-QB49-CURRICULUM.md` (Z-lane docs already on master side).
- Receipt re-run at `45dbd85`: **116/676/2573/2 — unchanged, digit-exact.** Baseline confirmed.
