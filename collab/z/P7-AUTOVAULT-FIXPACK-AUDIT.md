# Audit: P7-AUTOVAULT-FIXPACK — Defect Fix-Pack (FIX-1..FIX-6)

| Metadata | Value |
|---|---|
| **Task ID** | `P7-AUTOVAULT-FIXPACK` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Base Commit** | `0f194c7` (SPEC-ISSUE); audited range `0f194c7..8cfacc6` |
| **Audited Artifact** | `collab/gemini/P7-AUTOVAULT-FIXPACK-REPORT.md` |
| **Verdict / Status** | `ACCEPT` |
| **Date** | 2026-10-01 |

---

## 1. Scope & method

Independent git-truth audit of the six-slice fix-pack against `collab/z/P7-AUTOVAULT-SPEC-ISSUE.md`.
Fresh clone (sandbox reset #2 detected and recovered; worklog restored from session memory first).
Every fix re-verified from source and diff; full G3 re-run executed on Linux (Temurin JDK
21.0.12.1 + Maven 3.9.9, node v24) — deliberately the platform where the pack's FIX-2 defect
used to fail. FIX-4's number claim re-derived with a **parser-mirroring YAML count**
(`topics` flat-list extraction like `QuestionMarkdownParser.getStringList` + `CatalogService`
exact-equals filter), not regex guessing.

## 2. Findings

### G1 — Commit chain & merge: PASS
`2ad4907` (branch commit) + `8cfacc6` (merge, parents `0f194c7`+`2ad4907` = true `--no-ff`).
12 files, 656 ins / 38 del. Worktree clean; 0 secret-pattern hits in the diff.

### G2 — FIX-1 (MUST): PASS
`VaultArchiveService.java`: `STAGE1_EXPECTED_ARTIFACTS` + `REPORT_EXPECTED_ARTIFACTS` schemas
declared; `finalizeWithReport` keeps status **STAGED** on empty report fetch (WARN log,
early return, `markVerified` skipped); `buildAndWriteManifest` computes real `missing[]`
from the schema + per-submission code files (no more hardcoded empty list); `verifyVaultFolder`
validates presence against the schema ("Expected artifact missing: …") before re-hashing
manifest entries. `VaultSweeperJob`: PARTIAL path bumps `vaultVersion` and keeps the
`"report"` token in `missing[]`. Retry chain verified: sweeper already had
fetch→`finalizeWithReport` for `null|STAGED` (pre-fix tree `0f194c7` confirmed) — the STAGED
fix is what activates it, exactly the "implicitly restored" semantics the audit required.
Tests: `testFinalizeWithReportEmptyReportClientMaintainsStaged` (asserts `never()::markVerified`,
no VERIFIED claim, `missing[]` contains both report artifacts),
`testFinalizeWithReportRecoveryTransitionsToVerified`, `testSchemaExpectedArtifactMissingFailsVerification`.
All present and green on Linux.

### G3 — FIX-2 (MUST): PASS (Linux-proven)
`VaultControllerTest.testVaultHealthUnmounted` now builds an uncreatable path by using a
**regular file as parent directory under `@TempDir`** — the audit's preferred option. The
`Z:\…` hardcode is gone. Direct before/after evidence from my own re-runs: this test FAILED
on Linux pre-fix (QB-23, 1 failure in the 264-case suite); post-fix the full ISS suite is
green on Linux. No litter.

### G4 — FIX-3: PASS
`collab/gemini/P7-AUTOVAULT-REPORT.md` and `docs/SPEC_P7_VERIFICATION.md`: files 25→40 (ISS),
totals 65→80, G4 method names corrected to the real pair (`testStage1ArchiveSuccess`,
`testStage1ArchiveCorruptDetection`). Stale names survive only in `collab/z/` files where
they are quoted *as the finding* — correct.

### G5 — FIX-4 (SHOULD): PASS — and a spec-expectation correction (see §3)
Re-captured on rebuilt images (G1 respected; image SHAs in report). Runtime:
`totalElements=92, size=50, totalPages=2`, latency receipts, nonexistent topic ⇒ empty page
200 OK. My parser-mirroring YAML count of the **current tree** returns exactly **92**
PUBLISHED docs with the exact topic `arrays` (all dsa) — runtime = git, exact.
The SPEC-ISSUE's "expect totalElements=110" was **wrong**: 110 was QB-18's miscount (loose
pattern), inherited by me into the spec. Numbers in this lane must henceforth be produced by
the parser-mirroring method (script kept at sandbox `scripts/count_arrays_truth.py`).
Gemini's execution is validated *despite* the wrong expectation — it captured reality and
reported it honestly.

### G6 — FIX-5 (MUST): PASS
`resolveExtension` now content-first (java-specific signals → py → js → sql → java-class
fallback), track default only when content gives no signal; bare `contains("class ")` java
shortcut removed. Parameterized `testResolveExtensionContentFirst` covers the four required
cases (py/DSA, js/LLD, java/DSA, unknown/unknown). **NIT (residual edge):** a JS snippet
using ES-module `import` (without java content) still maps to `.py` — acceptable known
limitation of content sniffing; declare it in the next report.

### G7 — FIX-6 (SHOULD): PASS
`deriveSectionSequence` (plan sections → planJson → default fallback) with WARN-and-skip on
unresolvable endpoints — no fabrication, exactly per spec. Tests
`testRecordSectionTransition_CustomPlanSequence` +
`testRecordSectionTransition_UnknownSectionType_SkipsFabrication` present and green.

### G8 — G3 independent re-run (Linux, JDK 21.0.12.1 + Maven 3.9.9, node 24): EXACT

| Suite | Claimed (files/cases/asserts/fails) | Independent re-run |
|---|---|---|
| ISS vault suite | 5 / 27 / 67 / 0 | 5 classes / 27 cases / **0 fail** — exact |
| ISS full suite | 40 / 273 / 907 / 0 (1 skip) | 40 classes / 273 cases / **0 fail / 1 skip** — exact |
| ERS full suite | 5 / 29 / 74 / 0 (1 skip) | 29 cases / **0 fail / 1 skip** — exact |
| Frontend | 35 / 204 / 420 / 0 | 204 pass / **0 fail** — exact (35 files confirmed QB-23) |

+9 cases vs the pre-fix 264 = 3 (FIX-1) + 4 (FIX-5 params) + 2 (FIX-6) — arithmetic checks.

### G9 — Fence audit: PASS with two sanctioned riders (process NIT)
All six slices stayed in-fence (vault package, `InterviewSessionService`, tests, docs,
report files; `EvaluationReportClient` +2 lines @Autowired is the FIX-1 fence's explicitly
allowed change). Two files crossed fences: `GlobalExceptionHandler.java` (notes-404 → DEBUG)
and `frontend/.../useSessionCatalog.ts` (PLAYGROUND single-question pin). Both are the
operator's live-session issues, verified sane and covered by green suites — but they were
bundled without the formal rider the SPEC-ISSUE §2 requires, and the pack used **one branch
(`feat/p7-fixpack`) + one merge** instead of `feat/p7-fix-01..06` + six merges. Accepted
this time (operator-directed, contained); process rule stands for future packs.

### G10 — Discipline (G1/G3/G4/G5): PASS
Image-only rebuilds, four-number table uses the standardized vocabulary and matches my
re-run exactly, G4 names real, no secrets, no transcripts.

## 3. Spec-expectation correction (owned by the auditor)

The SPEC-ISSUE carried "expect totalElements=110" from QB-18. Proper YAML-parse truth:
**92** (current tree; all PUBLISHED). QB-18's 110 was produced by a loose counting method;
this audit initially repeated the same class of error with a block-style-only regex (50).
Both wrong. The rigorous method (mirror `getStringList` + exact-equals) is now the lane
standard and reproduces the runtime exactly. Gemini's 92 stands as correct evidence.

## 4. Ledger follow-up (non-blocking): F-N1 — seeder ghost rows

`QuestionMarkdownSeeder` is upsert-by-slug and **never deletes** slugs removed from content.
On a persistent PG volume, deleted questions survive as ghosts, so any future content
*removal* silently diverges runtime from git (this capture happened to be consistent).
Recommended (SHOULD): volume-reset runbook before evidence captures
(`docker compose down -v` + fresh seed), and/or a seeder sweep that retires slugs absent
from the current content. File under the next spec cycle.

## 5. Verdict: ACCEPT

Both verdict-driving MUST items (FIX-1, FIX-2) are verified at source and proven on Linux;
all six slices reproduce; the four-number discipline is now correct and matches independent
re-runs exactly. The P7-AUTOVAULT lifecycle's remaining step is operator-side:
**VP11-m live closure** (one live DSA interview ⇒ folder appears on D: with zero clicks;
three webm files play; report.pdf opens; VERIFIED chip on the report screen).

— Z.ai
