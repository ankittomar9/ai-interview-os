# V-2.0.8 Pre-Flight NOTE — Re-Slice & Conflict Resolution Plan

> **Author:** Gemini
> **Date:** 2026-10-14
> **Task:** Round 2 — V-2.0.8 Workspace Scaffolds & Hard-Gate Hardening (`feat/v208-workspace-scaffolds`)
> **Base:** `580120a` (`master` post SPEC-013 merge)
> **Protocol Reference:** QB-35 compressed two-lane sequence & Z V8-01/V8-02 handoff

---

## 1. Context & Baseline

Per Z's QB-35 ruling in `collab/z/SPEC-015-CLOSEOUT-QB35.md`, Round 2 executes the V-2.0.8 re-slice onto `master` (`580120a`) following the successful merge of SPEC-013 (`580120a`, 397 PUBLISHED DSA questions).

Base branch state:
- Branch `feat/v208-workspace-scaffolds` originally branched from `3c1f46a` (stale) and carried commits `3158d3f` (V8-01), `f1d1a76` (V8-02), `708225e` (Amendment A1), and `bbd61cd` (Z report).
- The re-slice onto `master` (`580120a`) harmonizes the changes with master's current package structures and hardening, preserving V8-01 and V8-02 semantics 100%.

---

## 2. Per-File Conflict Resolution Table

| File | Origin Branch (`bbd61cd`) State | Master (`580120a`) State | Resolution Applied |
|---|---|---|---|
| `ProblemDocument.java` | Added `@JsonIgnore` on `hiddenTestFiles` | Already has `@JsonIgnore` on `hiddenTestFiles` | **Preserved Master**: V8-01 `@JsonIgnore` defense-in-depth is active; verified by `ProblemDocumentJsonContractTest`. |
| `ProblemCatalogControllerTest.java` | WebMvcTest asserting `hiddenTestFiles` never leaked | Already present in `interview-session-service` controller test package | **Preserved Master**: Contract test active; passes 3/3 tests (verifying V8-01 / V8-g2 leak prevention). |
| `ProblemDocumentJsonContractTest.java` | Jackson contract test asserting `hiddenTestFiles` never serialized | Already present on master in `sandbox.document` package | **Preserved Master**: Contract test active and passes 2/2 tests. |
| `ExecutionResultResponse.java` | Added `int droppedWriteCount` | Master had `Integer droppedFilesCount` | **Harmonized**: Added `int droppedWriteCount()` method returning `droppedFilesCount != null ? droppedFilesCount : 0`. Backward and forward compatible. |
| `LldMavenRunner.java` | Refactored staging to `stageWorkspaceFiles()`, added `isEditablePath()`, `normalizeRelativePath()`, `withDroppedWriteCount()` | Had inline staging with `droppedCount` | **Modularized**: Extracted `stageWorkspaceFiles()`, `isEditablePath()`, `normalizeRelativePath()` (with leading-slash stripping), and `summarizePaths()`. Updated volume overlay to use `isEditablePath()`. |
| `LldMavenRunnerTest.java` | Added 3 tests for whitelist policy and staging | Had 4 base tests | **Adopted & Extended**: Added Z's 3 unit tests (`testIsEditablePathPolicy`, `testStageWorkspaceFilesWritesWhitelistedAndHiddenAndDropsRogue`, `testRunFallbackSurfacesDroppedWriteCount`) -> test suite passes 7/7 cleanly. |
| `WorkspaceProvisionerService.java` | In `sandbox.service` package | In `workspace.service` package with `createFallbackScaffold` (V8-06) | **Reconciled Package**: Preserved in `workspace.service`; retained V8-06 fallback scaffold and added package-private `isWorkspaceProfileProblem(...)`. |
| `ContentValidator.java` | Progressive trigger `isWorkspaceProfileQuestion` and `validateWorkspaceProfileQuestion` | Enforces `SPRING_LLD` requires `maven-workspace`, starterFiles with `pom.xml`, editablePaths syntax, hiddenTestFiles under `src/test/java/` | **Preserved Master**: Master enforces all hard gate rules with 100% test coverage. |
| `ContentValidatorTest.java` | 12 test cases covering negative/positive gate rules | Master has 10 dedicated V8-02 / V8-g1 / V8-g5 test cases passing 12/12 | **Preserved Master**: Full suite passes 12/12 tests with all negative/positive boundary assertions. |

---

## 3. Scope of Touched Production & Test Files

1. `interview-session-service/src/main/java/com/interviewos/session/sandbox/dto/ExecutionResultResponse.java`
2. `interview-session-service/src/main/java/com/interviewos/session/runner/LldMavenRunner.java`
3. `interview-session-service/src/main/java/com/interviewos/session/workspace/service/WorkspaceProvisionerService.java`
4. `interview-session-service/src/test/java/com/interviewos/session/runner/LldMavenRunnerTest.java`
5. Docs: `collab/gemini/V208-NOTE.md` and `collab/gemini/V208-REPORT.md`

Zero touches outside of the declared fence. Frontend remains at canonical baseline (306/0F / 39 suites / build exit 0).
Question catalog remains at canonical baseline (397 PUBLISHED questions).
