# V-2.0.8 — V8-01 + V8-02 Implementation Report (Z.ai)

| Metadata | Value |
|---|---|
| **Task ID** | `V208-V801-V802` |
| **Agent** | Z.ai (implemented the executor step per operator handoff, 2026-10-01) |
| **Branch** | `feat/v208-workspace-scaffolds` (pushed; merge to master **pending test execution**) |
| **Base** | `3c1f46a` (solution-unlock fix, merged) |
| **Commits** | `3158d3f` V8-01 + tests · `f1d1a76` V8-02 + tests · `708225e` SPEC Amendment A1 |
| **Status** | CODE COMPLETE — backend suites **not executed** in Z.ai sandbox (no JDK/Maven/Docker, no sudo — standing L1). Executor/operator must run before merge. |

---

## 1. What landed

### V8-01 — hidden-test exposure lock + seed/write observability (session-service)

| File | Change |
|---|---|
| `ProblemDocument.java` | `@JsonIgnore` on `hiddenTestFiles`. Safe by construction: inbound mapping is manual (DTO → builder in `QuestionBankClient`), Mongo uses the Spring Data converter, so only outbound Jackson is affected. |
| `ExecutionResultResponse.java` | Additive `int droppedWriteCount` (default 0). Frontend TS interface untouched — additive wire field is backward-compatible. |
| `LldMavenRunner.java` | Staging extracted to `stageWorkspaceFiles()`; whitelist rejections collected (previously `log.debug` per file), WARNed with dropped-path summary (capped at 10 shown), count surfaced in the run result. New `isEditablePath` policy: exact path OR non-empty `dir/**` prefix, fail-closed (bare `/**` whitelists nothing). Volume-run canonical overlay updated to the same policy. |
| `WorkspaceProvisionerService.java` | `WORKSPACE_SEED_EMPTY` WARN (sessionId + slug + track + buildProfile) when a workspace-profile question resolves 0 starter files; `isWorkspaceProfileProblem` = SPRING_LLD track or `maven*` buildProfile (future-proofs V8-05's `maven-workspace`). |

### V8-02 — validator hard gate (question-bank-service)

`ContentValidator`: workspace-profile questions (progressive trigger, see below) require
starterFiles non-empty **and** containing `pom.xml`; editablePaths non-empty with valid entry
syntax (explicit starter path → overwrite, non-empty `dir/**` → create-new; blank / bare `/**` /
trailing-slash entries rejected, every explicit entry must exist in starterFiles); hiddenTestFiles
non-empty with every key under `src/test/java/`. `SYSTEM_DESIGN` shares the branch so V8-04 HLD
scaffolds are gated identically once they declare the profile.

### Amendment A1 (recorded in `docs/SPEC_V208.md` §7)

1. **RC-7 severity corrected**: `ProblemPublicView` (since `efc4f97`) already excluded
   `hiddenTestFiles` — no active gateway leak at baseline; `@JsonIgnore` is defense-in-depth.
2. **V8-02 progressive trigger**: hard gate fires on declared Maven workspace buildProfile or
   SPRING_LLD + starterFiles present. Literal track-level enforcement would DRAFT all 11
   unscaffolded LLD questions at deploy time (catalog regression worse than the defect).
3. **Runner `/**` support** pulled into V8-01's scope (V8-02 syntax without runner support
   would recreate RC-3 silent drops under the new grammar).
4. `droppedWriteCount` DTO field documented as required by V8-01 wording.

## 2. Receipt (G3, four-number — static assertions computed, not n/r)

| Suite | Files | Test methods | Assertions | Failures |
|---|---|---|---|---|
| `LldMavenRunnerTest` (extended) | 1 | 7 (4 new) | 40 (22 new) | **PENDING EXECUTION** |
| `ProblemDocumentJsonContractTest` (new) | 1 | 2 | 6 | **PENDING EXECUTION** |
| `ProblemCatalogControllerTest` (new) | 1 | 2 | 11 | **PENDING EXECUTION** |
| `ContentValidatorTest` (extended) | 1 | 15 (12 new) | 43 (34 new) | **PENDING EXECUTION** |
| **Total** | **4** | **26** | **100** | **PENDING** |

Assertions counted statically per method (JUnit does not report assertion counts). All other
backend suites: not modified, expected unaffected (DSA/SQL paths untouched; legacy LLD docs keep
PUBLISHED status via the progressive trigger — `QuestionDataInitializer` behavior unchanged for
0/364 files that currently carry scaffold frontmatter).

Static verification performed in sandbox: string-aware delimiter-balance scan on all 9 touched
files (PASS); imports cross-checked; Lombok builder/record semantics verified (`@Builder` on
record defaults unset int to 0; no canonical-constructor call sites exist repo-wide).

## 3. Handoff — executor/operator (before merge)

```bash
git fetch origin && git checkout feat/v208-workspace-scaffolds
mvn -pl question-bank-service test
mvn -pl interview-session-service test
# then per V8-g2, optionally verify no-leak via running stack:
#   curl -s localhost:8080/api/v1/problems/lld-atm-system | grep -c hiddenTestFiles   # expect 0
git checkout master && git merge --no-ff feat/v208-workspace-scaffolds \
  -m "Merge branch 'feat/v208-workspace-scaffolds' into master (V8-01 + V8-02: hidden-test lock, seed/drop observability, validator hard gate)"
git push origin master
```

Report the four numbers from surefire output (`Tests run`, `Failures`) plus the static assertion
table above. If anything fails, drop a note in `collab/operator/` and ping Z.ai for R2.

## 4. Notes & carries

- `cloud-config-server/.../interview-session-service.yaml` phantom-dirty (CRLF blob) remains —
  excluded from the fence on purpose; renormalization commit still carried.
- Frontend untouched (additive DTO field only); no frontend test rerun required for this branch.
- Next work item: **V8-03.a** — first LLD scaffold batch (`lld-atm-system`, `lld-parking-lot`,
  `lld-vending-machine`) authored against the now-enforced validator rules, with a byte-identical
  frontmatter diff audit (V8-g4) for the legacy keys.
