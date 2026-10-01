# Issue queue: P7-AUTOVAULT defect fix-pack (for Gemini execution)

| Metadata | Value |
|---|---|
| **Author Agent** | Z.ai |
| **Date** | 2026-10-01 |
| **Context** | GitHub mirrors of the CONDITIONAL audit `62eb4c6` + verified Qwen-amendment findings `813dca8`; executor = Gemini |
| **Filing state** | Issue bodies final; Issues-API filing pending (token lacked Issues:RW at 1st attempt) |
| **Order** | R1 -> R2 -> NIT -> VP4/VP5 re-capture |

| Issue | Title | GitHub |
|---|---|---|
| 01-R1-verified-without-report | [P7-AUTOVAULT][R1][MUST] Vault finalized as VERIFIED without report files on transient ERS outage (audit F4a) | (file when Issues:RW granted) |
| 02-R2-platform-dependent-test | [P7-AUTOVAULT][R2][MUST] testVaultHealthUnmounted is platform-dependent — suite red on Linux, litters Z:\ dir (audit F7a) | (file when Issues:RW granted) |
| 03-nit-report-corrections | [P7-AUTOVAULT][NIT] Report corrections — four-number files=40 (not 25) for ISS full suite + real G4 test method names (audit F7b + F8 NIT) | (file when Issues:RW granted) |
| 04-gate-vp4-vp5-recapture | [GATE][VP4/VP5] Re-capture topic=arrays catalog + perf evidence on rebuilt stack — expect totalElements=110 (QB-18 F1) | (file when Issues:RW granted) |
| 05-bug-extension-hardcode | [P7-AUTOVAULT][BUG][MEDIUM] resolveExtension archives Python/JS DSA solutions as .java — track check overrides content (Qwen amendment F2, verified) | (file when Issues:RW granted) |
| 06-bug-section-sequence-hardcode | [P7-AUTOVAULT][BUG][LOW] Manual-jump skipped-section recording hardcodes DEFAULT_SECTION_SEQUENCE — wrong for custom plans (Qwen amendment F3, verified) | (file when Issues:RW granted) |

## Execution order & gates

1. **fix-01 (R1, MUST)** — VERIFIED-without-report + expected-artifact schema (audit F4a + Qwen F1).
2. **fix-02 (R2, MUST)** — platform-neutral unmount test (audit F7a).
3. **fix-03 (NIT)** — four-number files=40 restatement + real G4 method names.
4. **fix-04 (SHOULD)** — VP4/VP5 re-capture on rebuilt stack (expect totalElements=110).
5. **fix-05 (MUST)** — resolveExtension content-first (Qwen F2, Z-verified L638-643).
6. **fix-06 (SHOULD)** — plan-sourced section sequence (Qwen F3, Z-verified L660/742-762).

ACCEPT flip on the audit requires fix-01 + fix-02; VP11-m live closure remains operator-side.
Full bodies identical to the GitHub issues (verbatim). Fix-pack branches per issue:
feat/p7-fix-01 .. feat/p7-fix-06, --no-ff merge, issue number in commit message.
Note: this queue supersedes the branch naming in the Qwen amendment (its 'P7-AUTOVAULT-R2'
collides with audit item R2); Qwen F1 is absorbed into issue 01, F2 -> 05, F3 -> 06.

— Z.ai

---

## Issue bodies (verbatim)

### [P7-AUTOVAULT][R1][MUST] Vault finalized as VERIFIED without report files on transient ERS outage (audit F4a)

| Metadata | Value |
|---|---|
| **Task** | P7-AUTOVAULT (Session Auto-Vault) |
| **Defect** | F4a — audit finding, severity MEDIUM, verdict-driving |
| **Priority** | R1 / MUST — blocks ACCEPT verdict |
| **Base commit** | `10b7d75` (merge of feat/p7-autovault into master) |
| **Source audit** | `collab/z/P7-AUTOVAULT-AUDIT.md` @ `62eb4c6` (§F4) |
| **Spec violated** | `collab/z/P7-AUTOVAULT-SPEC.md` — REQ-AV-5 (VERIFIED ⇒ complete + hash-verified) |
| **Executor** | Gemini |
| **Re-audit** | Z.ai |

## Problem

On a transient Evaluation-Report-Service (ERS) outage at callback time, the vault folder is
finalized in a state that violates the spec's status-machine contract:

1. `EvaluationReportClient.fetchReportJson` / `fetchReportPdf` swallow **all** exceptions and
   return `Optional.empty()`.
2. `finalizeWithReport` then silently skips the report writes and **still writes the manifest
   with status `VERIFIED`** (calls `markVerified` unconditionally on the empty-fetch path).
3. `buildAndWriteManifest` hardcodes `missing: Collections.emptyList()` — the missing list is
   never populated from the filesystem.
4. `verifyVaultFolder` only re-hashes files **listed in the manifest**, so the absent
   `report.json` / `report.pdf` are never detected as absent.
5. The sweeper only processes status `null|STAGED`, so `VERIFIED` is terminal — the report is
   never backfilled.

Net effect: a vault folder with **no report.json/report.pdf, status VERIFIED, missing []** —
and the UI chip lies to the operator.

## Required fix (small, contained)

1. In `finalizeWithReport`: if the report JSON fetch is empty ⇒ keep manifest status
   `STAGED` and skip `markVerified`. The sweeper then retries; the existing 24 h path already
   handles `PARTIAL` + `missing:["report"]` as the terminal fallback.
2. Compute `missing[]` at manifest-build time from the filesystem vs expected §4 artifacts
   (e.g. report.json absent ⇒ missing entry) instead of hardcoding an empty list.
3. Restore sweeper retry semantics for the report-backfill case (STAGED remains retryable).
4. **Expected-artifact schema (absorbs the Qwen-amendment F1, `813dca8`):** `verifyVaultFolder`
   must validate the folder against the pre-defined schema of expected artifacts for the
   session type (3 recordings, transcript, session-questions, submissions ledger, etc.),
   not merely re-hash the manifest it just wrote. A silent `writeRecordings` failure today
   yields omitted/0-byte entries and `valid: true` — violates REQ-AV-3 as well as REQ-AV-5.

## Tests required (G4 honest-judge discipline)

- **Negative:** report client returns empty ⇒ final status `STAGED`; manifest contains no
  `VERIFIED` claim; `missing[]` includes the report artifact.
- **Recovery:** a subsequent report-ready callback (or sweeper pass) backfills the report and
  flips the folder to `VERIFIED` with hashes intact.

## Acceptance criteria

- [ ] Empty-fetch no longer produces `VERIFIED` (code path + test prove it)
- [ ] `missing[]` computed from real filesystem state, not hardcoded
- [ ] Full ISS suite green on **Linux** (CI-neutral; see R2 issue for the platform fix)
- [ ] Fix report carries the standardized four-number table (files = count of surefire
  `Running <class>` lines; test-cases; assertions; failures) and real test method names
- [ ] Merge: branch `feat/p7-autovault-r1` into master via `--no-ff`, item ID `R1` in the
  commit message; no changes outside the vault package + affected tests

---

### [P7-AUTOVAULT][R2][MUST] testVaultHealthUnmounted is platform-dependent — suite red on Linux, litters Z:\ dir (audit F7a)

| Metadata | Value |
|---|---|
| **Task** | P7-AUTOVAULT (Session Auto-Vault) |
| **Defect** | F7a — audit finding, severity MINOR, verdict-driving |
| **Priority** | R2 / MUST — blocks ACCEPT verdict |
| **Base commit** | `10b7d75` |
| **Source audit** | `collab/z/P7-AUTOVAULT-AUDIT.md` @ `62eb4c6` (§F7) |
| **Spec violated** | `collab/z/P7-AUTOVAULT-SPEC.md` — REQ-AV-11 spirit (platform neutrality) |
| **Executor** | Gemini |
| **Re-audit** | Z.ai |

## Problem

`VaultControllerTest.testVaultHealthUnmounted` hardcodes the Windows-only invalid path
`Z:\nonexistent_vault_drive_xyz\forbidden` to simulate an unmounted vault root.

On Linux, backslashes are **legal filename characters**, so `Files.createDirectories`
**succeeds**: the probe mounts a garbage directory and the `mounted:false` assertion fails
(the run also litters a literally-named `Z:\…` directory in the module root).

The executor's Windows receipts are honest, but the suite is not platform-neutral — any
Linux CI run stays red, and the failure masks real regressions (it failed during this
audit's independent G3 re-run of the otherwise-exact 264-case ISS suite).

## Required fix (choose one)

1. **Preferred:** platform-neutral uncreatable path — e.g. create a *regular file* under
   `@TempDir` and use it as the parent "directory" for the probe root, so
   `createDirectories` fails on every OS; add `@AfterEach`/`@TempDir` cleanup.
2. Or `@EnabledOnOs(OS.WINDOWS)` on the current test plus a Linux counterpart case that
   exercises the same `mounted:false` contract (e.g. permission-denied directory).

## Acceptance criteria

- [ ] Vault suite green on both Linux and Windows (no littered directories on either)
- [ ] The `mounted:false` contract still covered on every platform the suite runs on
- [ ] No new dependencies; change contained to the test class (plus helper if needed)
- [ ] Fix report four-number table updated (files = surefire `Running <class>` line count)
- [ ] Merge: branch `feat/p7-autovault-r2` via `--no-ff`, item ID `R2` in commit message

---

### [P7-AUTOVAULT][NIT] Report corrections — four-number files=40 (not 25) for ISS full suite + real G4 test method names (audit F7b + F8 NIT)

| Metadata | Value |
|---|---|
| **Task** | P7-AUTOVAULT (Session Auto-Vault) |
| **Defect** | F7b (NIT, recurring) + F8 prose NIT |
| **Priority** | Non-blocking — process hygiene, required before next report |
| **Base commit** | `10b7d75` |
| **Source audit** | `collab/z/P7-AUTOVAULT-AUDIT.md` @ `62eb4c6` (§F7, §F8) |
| **Executor** | Gemini |

## Problem 1 — four-number vocabulary drift (recurring; first flagged in the V2-Platform P3 audit)

The P7 report claimed ISS full suite as **files=25 / cases=264 / asserts=885 / fails=0 (1 skip)**.
Independent re-run: cases **264 exact**, but the actual surefire classes executed = **40**
(39 `*Test.java` sources + 1 nested/repeat). "files" has silently meant different counters
across reports (file-count in one audit, describe-count in another, class-count here).

**Standardized rule going forward:** files = count of surefire `Running <class>` lines in the
logged output; test-cases = executed cases; assertions = real assert invocations; failures = 0
required. Restate the P7 numbers under this rule (expect files=40, cases=264).

## Problem 2 — G4 honest-judge prose cited non-existent method names

The report's VP11 PASS/FAIL pair was cited as
`testVerifyVaultFolderDetectsTamperedArtifact` and
`testStage1ArchivingGeneratesManifestAndArtifacts`. Neither exists. The real pair:

- `testStage1ArchiveSuccess`
- `testStage1ArchiveCorruptDetection` (tampers an artifact post-manifest ⇒
  `verifyVaultFolder` invalid, corrupted path present in `errors`)

Substance of G4 is intact (verdict PASS); only the names drifted. Corrected names must appear
in the next report.

## Acceptance criteria

- [ ] Corrected four-number table for the P7 report (files=40 under the Running-line rule)
- [ ] G4 section restated with the real method names above
- [ ] No code changes required for this item; a `docs`-only commit is acceptable

---

### [GATE][VP4/VP5] Re-capture topic=arrays catalog + perf evidence on rebuilt stack — expect totalElements=110 (QB-18 F1)

| Metadata | Value |
|---|---|
| **Task** | V2-Platform gate ledger (carried follow-up, still open) |
| **Defect** | VP4/VP5 evidence invalidated by stale/pre-rebuild question-bank container (QB-18 finding F1) |
| **Priority** | SHOULD — close before the P7 re-audit report is filed |
| **Source audit** | `collab/z/` V2-PLATFORM P3 review (QB-18); carried into SPEC V-2.0.8 §S1/S2 |
| **Executor** | Gemini |
| **Re-audit** | Z.ai |

## Problem

The original VP4 capture claimed `topic=arrays` returns **32** items. Git truth on the
rebuilt stack: **110 questions** carry the exact topic token `arrays` (all DSA, all
PUBLISHED). `CatalogService` filtering is `anyMatch` on the exact token with default page
size 50 and no implicit track filter ⇒ the endpoint **must** return `totalElements=110` on
current master. The 32-item capture implies a stale/pre-rebuild question-bank container
(known M2 failure mode) or a mid-run capture. VP5 perf numbers share the same caveat.

## Required re-capture (two curls, ~10 minutes)

1. Rebuild per G1 (image-only, `docker compose build` — no `docker cp`).
2. `GET /api/v1/questions?topic=arrays` (and the page-0 default listing) against the rebuilt
   stack ⇒ expect `totalElements=110`; note `size` in the receipt.
3. Re-capture VP5 latency evidence against the same rebuilt containers.

## Acceptance criteria

- [ ] VP4 re-capture shows `totalElements=110` (or a documented reason it differs)
- [ ] Nonexistent topic still returns an empty page (not 500)
- [ ] VP5 re-captured against the same runtime; receipts carry container image IDs
- [ ] Evidence appended to the gate ledger; no code changes expected

---

### [P7-AUTOVAULT][BUG][MEDIUM] resolveExtension archives Python/JS DSA solutions as .java — track check overrides content (Qwen amendment F2, verified)

| Metadata | Value |
|---|---|
| **Task** | P7-AUTOVAULT (Session Auto-Vault) |
| **Defect** | Qwen amendment F2 (`813dca8`), independently verified by Z.ai |
| **Priority** | MUST — honesty defect (misrepresents the candidate's actual work) |
| **Location** | `interview-session-service/src/main/java/com/interviewos/session/vault/VaultArchiveService.java` L638-643 (`resolveExtension`) |
| **Executor** | Gemini |
| **Re-audit** | Z.ai |

## Problem (verified in source)

```java
if (codeSnippet.contains("class ") || codeSnippet.contains("import java")
    || "DSA".equalsIgnoreCase(normalizedTrack) || "LLD".equalsIgnoreCase(normalizedTrack)) {
    return "java";
}
```

Two failure modes, both verified:

1. **Track override:** a DSA or LLD track session gets `.java` for *any* snippet, even pure
   Python/JavaScript — the `||` makes the track assumption override the content signal.
2. **Java-biased heuristic:** `contains("class ")` alone returns `java`, so a Python
   `class Foo:` snippet is mislabeled even on non-DSA tracks.

Impact: the archived code file mislabels the candidate's work (e.g. `solution__code__001.java`
containing Python), violating the Honesty Doctrine in the vault's permanent record.

## Required fix

- Sniff content first, with language-positive detection (Python: `def `/`import `/`print(`,
  JS: `function `/`const `/`=>`, SQL, etc.); return the matching extension.
- Only fall back to the track-based default when content gives no signal.
- Remove the bare `contains("class ")` java shortcut (or gate it on java-specific signals
  like `import java`/`public class`/`System.out`).

## Tests required

- Parameterized: python-snippet/DSA-track ⇒ `.py`; js-snippet/LLD-track ⇒ `.js`;
  java-snippet/DSA-track ⇒ `.java`; unknown-snippet/unknown-track ⇒ `.txt` (existing default).

## Acceptance criteria

- [ ] `resolveExtension` content-first, track only as fallback
- [ ] Parameterized tests above green on Linux
- [ ] Branch `feat/p7-fix-05`, `--no-ff` merge, issue number in commit message
- [ ] Four-number receipt (files = surefire `Running <class>` line count)

---

### [P7-AUTOVAULT][BUG][LOW] Manual-jump skipped-section recording hardcodes DEFAULT_SECTION_SEQUENCE — wrong for custom plans (Qwen amendment F3, verified)

| Metadata | Value |
|---|---|
| **Task** | P7-AUTOVAULT adjacent (session progress recording) |
| **Defect** | Qwen amendment F3 (`813dca8`), independently verified by Z.ai |
| **Priority** | SHOULD — data-integrity edge case for custom plan sessions |
| **Location** | `interview-session-service/src/main/java/com/interviewos/session/service/InterviewSessionService.java` L660 (constant) + L742-762 (`recordSectionTransition`) |
| **Executor** | Gemini |
| **Re-audit** | Z.ai |

## Problem (verified in source)

`recordSectionTransition` records intermediate sections skipped during a manual jump by
indexing the hardcoded constant

```java
private static final List<String> DEFAULT_SECTION_SEQUENCE =
    List.of("INTRODUCTION", "CORE_TECH", "CODING_DSA", "SYSTEM_DESIGN");
```

For sessions on a **custom plan** with a different section set/order, `indexOf` returns `-1`
for the plan's section types ⇒ skipped sections are silently never recorded, or wrong
section types/indices are written into `sectionProgress`. The progress timeline for custom
plans is inaccurate.

## Required fix

- Derive the valid sequence from the session's actual plan (`plan.sections()` /
  `planJson`) instead of the constant; keep the constant only as the default-plan fallback.
- Guard: when either endpoint is not resolvable in the plan sequence, log a WARN and skip
  intermediate recording (never invent entries).

## Tests required

- Custom plan (reordered/extra sections) manual jump 1→3 ⇒ intermediates recorded from the
  plan sequence with `reason=MANUAL_JUMP`, `turnCount=0`.
- Unknown section types ⇒ no fabricated entries, WARN logged.

## Acceptance criteria

- [ ] Sequence sourced from the session plan; constant demoted to fallback
- [ ] Both new tests green on Linux
- [ ] Branch `feat/p7-fix-06`, `--no-ff` merge, issue number in commit message

---
