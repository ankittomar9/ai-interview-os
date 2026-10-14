# QB-37 — V-2.0.8 Fast-Track Merge Audit (Round 2)

> **Auditor:** Z (audit lane)
> **Date:** 2026-10-14
> **Subject:** `origin/feat/v208-workspace-scaffolds` @ `01eb94d` (code `054d062` + docs `01eb94d`)
> **Base:** `580120a` (master post SPEC-013 merge)
> **Protocol:** QB-35 compressed two-lane sequence; F-0 gate discipline (compressed turnaround, gates NOT skipped)

---

## VERDICT: ✅ MERGE AUTHORIZED

Gemini may merge `feat/v208-workspace-scaffolds` into `master` with `--no-ff`, then flip SPEC.md V-2.0.8 status to COMPLETED & MERGED. All gates reproduced independently and digit-for-digit in a fresh sandbox clone.

---

## 1. Topology & Push Discipline (GitHub truth)

| Check | Required | Observed | Result |
|---|---|---|---|
| Branch tip | `01eb94d` | `01eb94d` | ✅ |
| Commit count over base | exactly 2 | `git rev-list --count 580120a..01eb94d` = 2 | ✅ |
| Parentage | parent of `054d062` = `580120a` | verified via `rev-parse 054d062^` | ✅ |
| Descendant of base | strict | `merge-base --is-ancestor` = 0 | ✅ |
| Single-push delivery | NOTE+REPORT+code in one push | yes (`054d062` code, `01eb94d` docs, one `--force-with-lease` push per approved re-slice) | ✅ |

## 2. Fence Census — exactly 6 files, zero drift

```
A  collab/gemini/V208-NOTE.md
M  collab/gemini/V208-REPORT.md
M  interview-session-service/.../runner/LldMavenRunner.java          (+147/-x)
M  interview-session-service/.../sandbox/dto/ExecutionResultResponse.java (+8)
M  interview-session-service/.../workspace/service/WorkspaceProvisionerService.java (+12)
M  interview-session-service/.../runner/LldMavenRunnerTest.java      (+104)
```

- `question-bank-service/` diff vs master: **EMPTY** ✅
- `SPEC.md` + `docs/` diff vs master: **EMPTY** ✅
- Zero frontend files: **CONFIRMED** (G3 baseline verified anyway) ✅

## 3. Pre-Flight Compliance

`collab/gemini/V208-NOTE.md` contains the **required 9-file per-file conflict-resolution table** (QB-36 condition). Every row verified against git truth: ProblemDocument/ContentValidator/contract tests "Preserved Master" claims all confirmed by direct inspection (see §5). No fabrication found.

## 4. V8-01/V8-02 Semantic Audit — semantics survive AND strengthen

The branch refines master's inline whitelist into the specified form:

1. **`isEditablePath` fail-closed, boundary-correct**: null/blank path → `false`; empty whitelist → `false` (all candidate writes dropped); bare `"/**"` matches nothing (dir must be non-empty); prefix match requires `candidate.charAt(dir.length()) == '/'`. **This fixes a real bug in master's inline version**, where `startsWith(prefix)` let `src/main/java2/X` match `src/main/java/**`.
2. **`normalizeRelativePath` unified**: backslash→slash, trim, leading slashes stripped; applied consistently in BOTH staging paths (run workspace + hidden-volume computation at ~L198 — master used raw exact-match there, branch now uses the same policy).
3. **`stageWorkspaceFiles` extraction**: skeleton → whitelisted candidates → server-only hidden tests (injection order guarantees hidden tests cannot be clobbered even by whitelisted paths); returns dropped paths; aggregate warn log capped at 10 + `...(N more)` via `summarizePaths`.
4. **V8-02 observability**: `droppedWriteCount()` null-safe accessor (null→0); `droppedFilesCount` now always set (master set only when >0) — wire-compatible (record component already serialized as null).
5. **`isWorkspaceProfileProblem`**: null-safe fail-closed (`null → false`), package-private, SPRING_LLD track or `maven*` build profile.
6. **Duplicate-class risk CLEARED**: `WorkspaceProvisionerService` lives at `workspace.service` on BOTH master and branch; `sandbox.service` existed only on the abandoned pre-reslice branch.

## 5. No-Drop / No-Drift Verification (master-side)

| Item | Evidence on master `580120a` | Result |
|---|---|---|
| `ProblemDocument.hiddenTestFiles` `@JsonIgnore` | lines 43–45 | ✅ active |
| ContentValidator hard gates (Rule 0 SPRING_LLD↔maven-workspace; Rule 3 hiddenTestFiles non-empty under `src/test/java/`) | L84–L119 | ✅ active |
| Contract tests (`ProblemDocumentJsonContractTest` 2/2, `ProblemCatalogControllerTest` 3/3) | ran green on branch tip | ✅ |

## 6. Dynamic Reproduction — digit-for-digit (fresh clone, JDK 21.0.12.1 / Maven 3.9.9 / Node v24.21.0)

| Gate | Claimed | Reproduced | Result |
|---|---|---|---|
| Targeted session suites | 12/12 | `LldMavenRunnerTest 7 + ProblemCatalogControllerTest 3 + ProblemDocumentJsonContractTest 2 = 12`, 0F/0E, BUILD SUCCESS | ✅ |
| Session full suite | 278/278 (1 skip) | `Tests run: 278, Failures: 0, Errors: 0, Skipped: 1` | ✅ |
| Question-bank full | 41/41 | `Tests run: 41, Failures: 0, Errors: 0, Skipped: 0` | ✅ |
| Catalog guard | 397 PUBLISHED | `DsaCatalogGuardTest` 2/0F enforces `assertEquals(397, ...)` | ✅ |
| Frontend G3 | 306/0F/39 suites | `tests 306 / suites 39 / pass 306 / fail 0` (node:test) | ✅ |
| Static assertions | 1,161 | `assert\.\w+` census over 49 test files = **1,161 exactly** | ✅ |
| Frontend build | exit 0 | `npm run build` exit 0 | ✅ |

New V8-01 tests verified live: whitelist policy matrix (exact + `/**` deep + backslash + 7 fail-closed cases incl. bare `/**`), staging integrity (2 rogue drops, skeleton survival), fallback run surfacing `droppedWriteCount=1`.

## 7. Rulings & Next Steps

1. **MERGE AUTHORIZED** (Gemini): `git merge --no-ff feat/v208-workspace-scaffolds` → SPEC.md V-2.0.8 status flip → single push. Report hashes back for close-out.
2. **Round 2 closes the approved two-lane sequence.** No further feature lanes are open.
3. **Final bookkeeping lane** (operator/Gemini): delete `fix/voice-and-track-nav` (superseded per QB-35 — merge would regress audited code) and **rotate the PAT** used for this lane (it transited chat in plaintext and has served its one-shot purpose).
4. Environment note: 5th sandbox anomaly this session (clone + credentials wiped pre-audit). Audit executed on a fresh clone; token scrubbed from `.git/config` immediately post-clone and never persisted.
