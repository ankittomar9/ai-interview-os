# SPEC-ISSUE: P7-AUTOVAULT — Defect Fix-Pack (FIX-1..FIX-6) for Gemini Execution

| Metadata | Value |
|---|---|
| **Task ID** | `P7-AUTOVAULT-FIXPACK` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Base Commit** | `1beb87a` (fix-pack branched from current master) |
| **Supersedes** | `collab/z/P7-AUTOVAULT-ISSUES.md` queue refs table (same content, spec form); Qwen amendment branch-name suggestion `P7-AUTOVAULT-R2` (collides with audit item R2 — use the FIX-N naming below) |
| **Evidence Base** | Z audit `collab/z/P7-AUTOVAULT-AUDIT.md` @ `62eb4c6` (CONDITIONAL) + Qwen amendment `813dca8` (F2/F3 independently verified by Z in source before adoption) |
| **Executor** | Gemini |
| **Re-audit** | Z.ai (fix-pack report -> re-audit -> ACCEPT flip if FIX-1 + FIX-2 pass) |
| **Date** | 2026-10-01 |

---

## 1. Context

The P7-AUTOVAULT implementation (`e747dab..10b7d75`) is architecturally sound and its
receipts reproduced independently, but the Z audit returned **CONDITIONAL** with two
verdict-driving defects (R1/R2), and the Qwen deep-forensic amendment added two more that
Z verified in source (extension mislabeling; hardcoded section sequence). This fix-pack
bundles all six items into one execution contract. **ACCEPT of P7 is blocked on FIX-1 and
FIX-2 only**; the rest are MUST-process or SHOULD.

Status-machine contract being restored (spec §5 of `P7-AUTOVAULT-SPEC.md`):
`STAGED -> VERIFIED` only when every expected artifact exists and hash-verifies;
`PARTIAL` + `missing[]` is the honest terminal state for incomplete vaults.

## 2. Discipline gates (apply to every slice)

- **G1 image-only**: any runtime evidence is captured after `docker compose build` — no
  `docker cp`, no host-side patching.
- **G3 four-number**: every report table states files / test-cases / assertions / failures.
  files = count of surefire `Running <class>` lines; test-cases = executed cases;
  assertions = real assert invocations; failures = 0 required.
- **G4 honest-judge**: every claimed PASS names a real test method that exists in the tree;
  every FAIL is shown, not summarized away.
- **G5 secrets**: no tokens, no session transcripts, no vault folder contents in git.
- **Merge discipline**: one branch per slice `feat/p7-fix-N`, merge to master `--no-ff`,
  slice ID in the commit message, changes confined to the slice fence.

## 3. Slices

### FIX-1 (MUST, verdict-driving) — STAGED-not-VERIFIED + real missing[] + expected-artifact schema

**Problem (Z F4a + Qwen F1, both verified).** On a transient ERS outage at callback time:
`EvaluationReportClient.fetchReportJson/Pdf` swallow all exceptions -> `Optional.empty()`;
`finalizeWithReport` skips report writes but still writes the manifest as `VERIFIED`
(unconditional `markVerified`); `buildAndWriteManifest` hardcodes
`missing: Collections.emptyList()`; `verifyVaultFolder` only re-hashes files *listed in the
manifest it just wrote* (self-fulfilling — a silent `writeRecordings` failure also yields
omitted/0-byte entries with `valid: true`); the sweeper processes `null|STAGED` only, so
`VERIFIED` is terminal and the report is never backfilled. Net: a vault folder with no
report.json/report.pdf, status `VERIFIED`, `missing []` — violating REQ-AV-3 and REQ-AV-5,
and the UI chip lies.

**Required changes.**
1. `finalizeWithReport`: empty report-JSON fetch ⇒ manifest status stays `STAGED`, skip
   `markVerified` (sweeper then retries; existing 24 h `PARTIAL`+`missing:["report"]` path
   remains the terminal fallback).
2. `buildAndWriteManifest`: compute `missing[]` from the filesystem against the **§4
   expected-artifact schema** for the session type (session.json, 3 recordings, recordings
   manifest, transcript json+md, session-questions, submissions-ledger, code snippets, plan,
   integrity, attachments, report.json/report.pdf) — never hardcode.
3. `verifyVaultFolder`: validate presence against the same expected-artifact schema (not
   just re-hash manifest entries); report absent expected artifacts in `errors`/`missing`.
4. Sweeper: `STAGED` folders get report-backfill retry (fetch report again on a later pass).

**Fence.** `interview-session-service` vault package
(`com/interviewos/session/vault/**`) + vault test classes only. `EvaluationReportClient`
may gain a typed result (e.g. optional-or-status) if needed; Mongo `VaultMetadata` mirror
may gain fields only if required for retry bookkeeping.

**Tests required (G4).**
- Negative: report client returns empty ⇒ final status `STAGED`; manifest contains no
  `VERIFIED` claim; `missing[]` includes the report artifact.
- Recovery: later report-ready callback or sweeper pass backfills report and flips to
  `VERIFIED`, hashes intact.
- Schema: delete a recording post-archive ⇒ verification returns invalid with the missing
  artifact named.

### FIX-2 (MUST, verdict-driving) — platform-neutral "unmounted" health test

**Problem (Z F7a, verified on Linux).** `VaultControllerTest.testVaultHealthUnmounted`
hardcodes `Z:\nonexistent_vault_drive_xyz\forbidden`. Backslashes are legal filename
characters on Linux ⇒ `Files.createDirectories` succeeds ⇒ probe mounts a garbage dir ⇒
`mounted:true` assertion fails and a literally-named `Z:\…` dir litters the module root.
Any Linux CI stays red (it failed during the audit's G3 re-run of the otherwise-exact
264-case suite).

**Required changes (choose one).**
1. Preferred: platform-neutral uncreatable path — a **regular file** used as parent
   "directory" under `@TempDir`, so `createDirectories` fails on every OS; cleanup via
   `@TempDir`/`@AfterEach`.
2. Or `@EnabledOnOs(OS.WINDOWS)` on the current test + a Linux counterpart exercising the
   same `mounted:false` contract (e.g. permission-denied directory).

**Fence.** `VaultControllerTest.java` (plus a test helper if needed). No production code.

**Tests required.** Suite green on Linux AND Windows; `mounted:false` contract covered on
both; no littered directories.

### FIX-3 (MUST-process, non-blocking) — report corrections (four-number + G4 names)

**Problem (Z F7b + F8 NIT).** P7 report claimed ISS full suite files=25; actual surefire
classes = 40 (cases 264 exact) — recurring vocabulary drift. G4 prose cited non-existent
method names (`testVerifyVaultFolderDetectsTamperedArtifact`,
`testStage1ArchivingGeneratesManifestAndArtifacts`); the real pair is
`testStage1ArchiveSuccess` + `testStage1ArchiveCorruptDetection`.

**Required changes.** Docs-only addendum: `collab/gemini/P7-AUTOVAULT-REPORT-ADDENDUM.md`
(or edit the report file) restating the four-number table under the G3 rule (files=40) and
the correct G4 method names. **All future reports use the G3 vocabulary without exception.**

**Fence.** `collab/gemini/**` + `docs/**` only. No code.

### FIX-4 (SHOULD) — VP4/VP5 re-capture on the rebuilt stack (carried gate, QB-18 F1)

**Problem.** Original VP4 evidence showed `topic=arrays` -> 32 items; git truth on current
master is 110 PUBLISHED DSA questions with the exact topic token, `anyMatch` exact filter,
no implicit track filter ⇒ endpoint must return `totalElements=110`. Stale/pre-rebuild
container (M2 failure mode) invalidated the capture; VP5 perf numbers share the caveat.

**Required changes.** No code. G1 rebuild, then re-capture: `GET
/api/v1/questions?topic=arrays` ⇒ expect `totalElements=110` (note `size`); nonexistent
topic ⇒ empty page, not 500; VP5 latency receipts from the same runtime with container
image IDs. Append to the gate ledger (docs or `collab/gemini/**`).

### FIX-5 (MUST) — `resolveExtension` content-first (Qwen F2, Z-verified)

**Problem (verified, `VaultArchiveService.java` L638-643).** The track check is OR'd into
the content heuristic, so DSA/LLD sessions archive **any** snippet as `.java` — including
Python/JavaScript solutions. Additionally bare `contains("class ")` alone maps a Python
`class Foo:` to java even off DSA/LLD tracks. The vault's permanent record misrepresents
the candidate's work (Honesty Doctrine violation).

**Required changes.** Sniff content first with language-positive detection (Python
`def `/`import `/`print(`; JS `function `/`const `/`=>`; SQL keywords; etc.), return the
matching extension, and use the track default only when content gives no signal. Gate the
java branch on java-specific signals (`import java`, `public class`, `System.out`).

**Fence.** `VaultArchiveService.java` (`resolveExtension` + call site constants if needed)
+ vault test classes.

**Tests required.** Parameterized: python-snippet/DSA-track ⇒ `.py`; js-snippet/LLD-track
⇒ `.js`; java-snippet/DSA-track ⇒ `.java`; unknown/unknown ⇒ `.txt`.

### FIX-6 (SHOULD) — plan-sourced section sequence (Qwen F3, Z-verified)

**Problem (verified, `InterviewSessionService.java` L660 + L742-762).**
`recordSectionTransition` records manual-jump skipped sections by indexing the hardcoded
`DEFAULT_SECTION_SEQUENCE` (INTRODUCTION, CORE_TECH, CODING_DSA, SYSTEM_DESIGN). Custom
plans with a different section set/order get `indexOf == -1` ⇒ skipped sections silently
not recorded, or wrong types/indices written to `sectionProgress`.

**Required changes.** Derive the sequence from the session's actual plan
(`plan.sections()` / `planJson`); keep the constant only as default-plan fallback. When an
endpoint is not resolvable in the plan sequence: log WARN, record nothing (never invent
entries).

**Fence.** `InterviewSessionService.java` + `InterviewSessionServiceTest`
(± session test classes).

**Tests required.** Custom plan (reordered/extra sections) jump 1->3 ⇒ intermediates
recorded from the plan sequence with `reason=MANUAL_JUMP`, `turnCount=0`; unknown section
types ⇒ no fabricated entries, WARN logged.

## 4. Execution order

1. FIX-1, FIX-2, FIX-3, FIX-5 (all independent; may land in any order)
2. FIX-6
3. FIX-4 (runtime evidence, after any rebuild)
4. Fix-pack report (template below) -> Z re-audit -> ACCEPT flip (requires FIX-1 + FIX-2)
   -> operator VP11-m live closure (one live DSA interview ⇒ folder appears on D: with zero
   clicks; three webm files play; report.pdf opens; VERIFIED chip on the report screen)

## 5. Fix-pack report template (commit to `collab/gemini/P7-AUTOVAULT-FIXPACK-REPORT.md`)

- Metadata table (Task ID `P7-AUTOVAULT-FIXPACK`, base commit, branch/merge hashes per
  slice, date).
- Per slice: what changed (file:line), test names added/modified, four-number table (G3
  vocabulary), commit hash.
- G4 honest-judge section: full PASS/FAIL pair output for the FIX-1 negative + recovery
  tests (real method names, real output excerpts).
- G1 evidence for FIX-4: image IDs, curls, raw JSON receipts.
- Deviations: any fence crossing requires a stated, justified rider before merging.

## 6. Non-goals (unchanged from P7 spec)

- REQ-AV-10 (proctor telemetry export) remains a declared deferral; picking it up later
  requires a rider.
- No Flyway migrations, no schema rewrites, no changes outside the declared fences, no
  behavior changes to non-vault session flows.
