# QB-57 — Post-Merge Audit Verdict

| Field | Value |
|---|---|
| **Task ID** | QB-57 |
| **Author** | Z.ai (audit lane) |
| **Base commit** | `8c511da` (master at kickoff) |
| **Audited commits** | execution `1ff3960` · merge `dc9e344` (parents `8c511da` + `eb93e50`, tree ≡ `eb93e50`) · reports `412ed3c` + `eb93e50` (master) |
| **Verdict** | **CLOSED — PASS.** Pre-authorized merge (G10.3) was legitimate: all five S4 gates independently reproduced machine-green by Z. Frozen baseline unchanged: **116 / 680 / 2605 / 2** (hardening task, receipts frozen by spec). |

---

## 1. Pre-Authorization Gates — Z Reproduction (2026-11-02)

| Gate | Z-verified result | Match vs report |
|---|---|---|
| **1. File-Set** | Execution commit `1ff3960` = exactly the 42 specced files: 40 `content/questions/lld/*.md` + `WorkspaceProvisionerService.java` + `docker/lld-runner/Dockerfile`; **+406 / −1**; per-file shapes 40×(+10/−0), java (+5/−0), Dockerfile (+1/−1). Merge `dc9e344` tree ≡ `eb93e50` (`6785ee5`); post-fix branch commits touch only `collab/gemini/QB-57-REPORT.md`. Cumulative master `977d68d..dc9e344` = 5 commits, 45 files = spec (`8c511da`, 2 files +199/−1) + fix (42) + report (183 lines) — nothing else | ✓ |
| **2. Parse** | Z rerun at `dc9e344`: **41/41 embedded poms parse and pin the trio** `resources 3.3.1 / compiler 3.13.0 / surefire 3.5.2`, plugin order resources→compiler→surefire adjacent in all 41. Fallback pom (Java text block): full trio, correct order (pre-fix `8c511da`: resources missing). Discrimination at `8c511da`: gate fails on **exactly the 40 LLD poms**, agentic passes — the gate genuinely discriminates | ✓ |
| **3. Receipts** | Static `count-tests.sh` at master: **116 / 680 / 2605 / 2** (FE 53/328/1287, ISS 44/223/836/1, orch 19/129/482/1) — 0 delta. QBS executed (Z rerun, fresh local repo, full `mvn -pl question-bank-service test`): **Tests run: 41, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS**; ingestion suites over the edited markdowns green (ContentValidator 12, QuestionMarkdownParser 9, LldCatalogSeed 1, DsaCatalogGuard 2) | ✓ digit-exact |
| **4. Offline E2E** | Operator Docker receipt (image built, fixture run, exit 0, 1/0F) corroborated by full Z sandbox reproduction on Maven 3.9.9 + JDK 21: fresh warm repo built with the Dockerfile-equivalent steps (`go-offline` exit 0, `resolve-plugins` exit 0, warm `test` exit 0, **132 MB** — matches S1.5), then Appendix-A fixture `mvn -o -B test` → **exit 0, BUILD SUCCESS, Tests run: 1, Failures: 0**; lifecycle lines prove cache resolution at `resources:3.3.1`, `compiler:3.13.0`, `surefire:3.5.2`. Dockerfile at master: `FROM maven:3.9.9-eclipse-temurin-21` (S3.3 ✓). Fixture verified structurally identical to real post-fix candidates (trio / no parent / same properties / same single `junit-jupiter 5.11.4` dep) — the offline proof transfers to all 40 | ✓ |
| **5. Diff Hygiene** | All 42 files: exactly **1 hunk** each. Beyond hunk counting, Z proved the **post-state byte-exact**: every file at `dc9e344` is byte-identical to the canonical clean insertion (reconstructed from `8c511da` by inserting the spec blocks immediately before the surefire/compiler plugin lines, per-file indentation respected) — 40/40 md, java, Dockerfile all identical | ✓ |

## 2. Scope & Prohibition Checks (S3.5 / S5)

Zero diffs `8c511da..dc9e344` in: `agentic-mcp-order-service.md` (already fully pinned — correctly left alone), `docker/lld-runner/skeleton-pom.xml`, `docker-compose*`, `ContentValidator`, `QuestionMarkdownParser`, `count-tests.sh`. No test files touched (receipt frozen by construction, confirmed by Gate 3). Catalog/ingestion integrity proven by the green QBS ingestion suites.

## 3. Delta Ledger

`+406` = 40 × 10 (two 5-line plugin blocks per LLD pom) + 5 (java resources block) + 1 (Dockerfile FROM); `−1` = Dockerfile FROM swap. **Every line accounted for; zero unexplained deltas.**

## 4. Findings

- **F1 (process, non-blocking; root cause = Z seed bug).** The executor modified the spec's parse-gate script: `len(text.split('<project')) > 2` false-positives on `<project.build.sourceEncoding>` property tags. The fix (`'<project '` with delimiter) is **correct** and was openly disclosed in report §4 — but §6 then declares "Deviations: NONE", an internal report inconsistency. Root cause is audit-lane: at spec time the false positive was masked because the PINS check failed on the same 40 files first. Recurrence prevention: verification scripts embedded in specs must be self-tested against the **post-fix** state before shipping, not only against the failing state.
- **F2 (informational).** In `lld-chess-game-engine.md` and `WorkspaceProvisionerService.java`, git renders the single hunk as an insertion **after** the existing `<plugin><groupId>` pair (minimal-diff anchoring: the inserted block closes and re-opens that pair). The byte-exact post-state proof (Gate 5) shows the result is identical to the clean insertion. Documented so future hunk reviewers do not false-alarm on the same pattern.
- **Positive.** Receipts quoted digit-exact; static/executed vocabulary used correctly; the §4 script-fix disclosure was honest and precise. Operator touches: 2 (authorization + merge relay) — G10-compliant second cycle.

## 5. Open Items (non-blocking)

- **QB-56 VP-1/VP-2/VP-3** operator runtime gates remain pending (post-rebuild, non-blocking).
- Next backlog per standing ruling: **item 4 — loadbalancer starter audit** (gateway/orch/eval POMs; `lb://` already 0 — check `@LoadBalanced`/LoadBalancer imports before strip), then Coach Sam context-enrichment spec, E2E full-stack run + README screenshots, QB-54 follow-ups (D5 orphan exports, count-tests scope expansion).
- **Version authority rule (S3.4) now live**: any future `skeleton-pom.xml` parent bump must re-sync the 41 candidate pins in the same change.
