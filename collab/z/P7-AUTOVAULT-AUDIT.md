# Audit: P7-AUTOVAULT — Session Auto-Vault (Zero-Touch Local Archival)

| Metadata | Value |
|---|---|
| **Task ID** | `P7-AUTOVAULT` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Base Commit** | `10b7d75` (merge audited; full range `e747dab..10b7d75`, incl. Qwen's `7c70711`) |
| **Audited Artifact** | `collab/gemini/P7-AUTOVAULT-REPORT.md` |
| **Verdict / Status** | `CONDITIONAL` |
| **Date** | 2026-10-01 |

---

## 1. Scope & method

Independent git-truth audit of the five P7 slices against `collab/z/P7-AUTOVAULT-SPEC.md`.
Fresh sandbox clone; every claim re-verified from source, diff, and re-execution (Temurin
JDK 21.0.12.1 + Maven 3.9.9, Linux x64; node 22 for frontend). Auditor environment differs
from executor (Windows) — used deliberately as a portability probe.

## 2. Findings

### F1 — Commit chain & merge discipline: PASS
All five claimed hashes exist with exact subjects: `ffed8f8` (AV-1), `c9cb7ec` (AV-2),
`dba6f47` (AV-3), `16971de` (AV-4), `1324011` (AV-5), docs `f414ce0`, merge `10b7d75`
(true merge, parents `e747dab` + `f414ce0`, item IDs in message). No history rewrite.
Per-slice numstat matches the spec fences (see F9).

### F2 — Config, mount, health probe (AV-1): PASS
`vault.root: ${VAULT_ROOT:D:/AI OS Interview Media}`, `vault.sweep-cron: 0 30 3 * * ?`
(offset from the 03:00 hygiene purge as specced), compose bind
`- ${VAULT_ROOT:-D:/AI OS Interview Media}:/vault:rw` on `interview-session-service` ONLY,
with container env pin `VAULT_ROOT=/vault` (host `.env` interpolates the mount source —
correct split). `.env.example` + README carry the D:/E:/C: operator guidance.
**NIT:** `sweep-dry-run` defaults `false` in application.yaml where the spec wording said
"dry-run default true in tests"; tests override the property, prod default false is sensible.

### F3 — Stage-1 writer core (AV-2): PASS
Single-thread daemon executor (`vault-archive-worker`); GridFS→disk via the existing
`streamRecording(sessionId, kind, out)` with `.part` + `ATOMIC_MOVE` (fallback to
REPLACE_EXISTING for cross-volume moves); SHA-256 per artifact, manifest excludes
itself/status/.part; all §4 MUST artifacts have writers (session, 3 recordings, recordings
manifest, transcript json+md, session-questions, submissions ledger, code snippets, plan,
integrity, attachments). Mongo `VaultMetadata` mirror + atomic `vault-status.json` sidecar.
Status machine STAGED/VERIFIED/PARTIAL/FAILED/ABORTED complete.

### F4 — Finalize & Feign callback (AV-3): PASS with **FINDING F4a (MEDIUM — verdict-driving)**
Verified good: `notifyVaultReportReady` added to the existing ERS `SessionServiceClient`;
invoked after `reportRepository.save(report)` inside try/catch (warn-only, sweeper backstops);
`InternalVaultController` route matches spec exactly
(`POST /api/v1/internal/sessions/{id}/vault/report-ready`); idempotent `vaultVersion` bump;
report files written `.part`→atomic.

**F4a:** `EvaluationReportClient.fetchReportJson/Pdf` swallow ALL exceptions →
`Optional.empty()`. `finalizeWithReport` then skips the report writes silently and **still
writes the manifest with status `VERIFIED`**. `buildAndWriteManifest` hardcodes
`missing: Collections.emptyList()` (never populated), and `verifyVaultFolder` only re-hashes
files *listed in the manifest* — so a transient ERS outage at callback time produces a vault
folder with **no report.json/report.pdf, status VERIFIED, missing []**. The sweeper only
processes status `null|STAGED`, so VERIFIED is terminal: the report is never backfilled.
This violates REQ-AV-5 semantics (VERIFIED ⇒ complete + hash-verified) and makes the
UI chip lie. **Required fix R1 (small):** in `finalizeWithReport`, if the report JSON fetch
is empty ⇒ keep manifest status STAGED and skip `markVerified` (sweeper then retries; 24 h
path already handles PARTIAL+missing); compute `missing[]` at manifest build time
(report.json absent ⇒ missing entry) instead of hardcoding empty.

### F5 — Sweeper & abort (AV-4): PASS
1 h / 24 h cutoffs correct; dry-run flag honored; PARTIAL path sets
`missing: ["report"]` in both Mongo and manifest; `abortSession` hook mirrors the
completeSession hook (null-guarded, try/catch, async — REQ-AV-9 satisfied incl. test).
Note: PARTIAL is also terminal for the sweeper (same family as F4a); keeping STAGED on
empty-fetch (R1) preserves a retryable state, which is why R1 suffices.

### F6 — Frontend surfacing (AV-5): PASS (REQ-AV-10 deferred)
Additive only: `Vault: {status}` chip (success/danger/warning variants) + folder path,
`getSessionVault` in api.ts, graceful `.catch(()=>{})`, `UNARCHIVED` hidden, all manual
download anchors intact. New `VaultSurfacing.test.ts` (2 cases / 7 asserts).
**REQ-AV-10 (proctor telemetry export, SHOULD) not implemented** — acceptable deferral;
requires a declared rider when picked up.

### F7 — G3 independent re-run: receipts reproduce, with **FINDING F7a (MINOR) + F7b (NIT)**

| Suite | Claimed (files/cases/asserts/fails) | Independent re-run (Linux) |
|---|---|---|
| ISS vault 5-class suite | 5 / 20 / 48 / 0 | 20 run, **1 FAIL** (F7a), 0 skip |
| ISS full suite | 25 / 264 / 885 / 0 (1 skip) | 264 run, **1 FAIL** (F7a), 1 skip — otherwise identical |
| ERS full suite | 5 / 29 / 74 / 0 (1 skip) | **29 / 0 / 1 skip — exact match** |
| Frontend | 35 / 204 / 420 / 0 | **204 / 0 / 0 — exact match; 35 test files confirmed** |

**F7a:** `VaultControllerTest.testVaultHealthUnmounted` hardcodes the Windows-only invalid
path `Z:\nonexistent_vault_drive_xyz\forbidden`. On Linux, backslashes are legal filename
characters, so `Files.createDirectories` SUCCEEDS, the probe mounts a garbage directory, and
`mounted:true` fails the assertion (the run also litters a literally-named `Z:\…` dir in the
module root). Receipts are honest on the executor's Windows platform, but the suite violates
platform neutrality (REQ-AV-11 spirit) and any Linux CI will stay red. **Required fix R2:**
platform-neutral uncreatable path (e.g., a file used as a parent directory under `@TempDir`)
or `@EnabledOnOs(WINDOWS)` with a Linux counterpart case.

**F7b (G3 NIT, recurring):** four-number "files" for the ISS full suite claimed 25; actual
surefire classes executed = 40 (39 `*Test.java` sources, +1 nested/repeat). Cases (264) are
exact. Same vocabulary drift flagged in QB-18. Standardize: files = count of surefire
"Running <class>" lines in the logged output.

### F8 — G4 honest-judge: PASS (substance)
VP11 PASS/FAIL pair real: `testStage1ArchiveSuccess` + `testStage1ArchiveCorruptDetection`
(tampers an artifact post-manifest ⇒ `verifyVaultFolder` invalid with the corrupted path in
`errors`). VP13 isolation test real (vault crash ⇒ completeSession returns COMPLETED).
VP12 idempotency and VP14a/b covered. **NIT:** the report's prose cited method names that do
not exist (`testVerifyVaultFolderDetectsTamperedArtifact`, `testStage1ArchivingGeneratesManifestAndArtifacts`);
actual names above. Substance intact; name-drift only.

### F9 — Fence audit: PASS with two auditor-approved amendments
Diff-scope exactly the declared fences plus: `InterviewSessionDocument.java` (AV-2 — the
Mongo `VaultMetadata` mirror REQ-AV-6 mandates; **spec fence omission, mine**),
`EvaluationReportClient.java` (AV-3 — necessary report fetch client, vault-package-local),
`api.ts` (AV-5 — chip consumption). All three necessary and contained; **no scope creep**;
0 modifications outside declared areas confirmed.

### F10 — Evidence & discipline (G1/G2/G5/G6/G7): PASS
`docs/SPEC_P7_VERIFICATION.md` (110 lines) + `collab/gemini/P7-AUTOVAULT-REPORT.md` committed
(`f414ce0`); G1 image-only rebuild via `docker compose build` (no `docker cp` anywhere in
history); G2 not applicable (zero Flyway migrations, as designed); no secrets in any P7 diff
(G5); no session transcripts in git (G7).

## 3. Verdict: CONDITIONAL

Architecture is sound, execution is honest, and every substantive claim reproduces
independently — the two Qwen-missed defects below are contained and cheap to fix. ACCEPT is
blocked on:

- **R1 (MUST, from F4a):** STAGED-not-VERIFIED on empty report fetch + real `missing[]`
  computation + (implicitly restored) sweeper retry semantics. Add/extend one negative test:
  report client returning empty ⇒ final status STAGED, manifest has no VERIFIED claim.
- **R2 (MUST, from F7a):** platform-neutral health "unmounted" test (or `@EnabledOnOs`).
- Four-number re-statement with files=40 for ISS full (or the standardized Running-line rule)
  and the correct G4 test method names.

Then operator closes with **VP11-m** (one live DSA interview ⇒ folder appears on D: with zero
clicks; three webm files play; report.pdf opens; VERIFIED chip on the report screen), per
spec §7 — mirroring the V208 closure protocol.

## 4. Cross-review note

Qwen's `collab/qwen/P7-AUTOVAULT-REVIEW.md` verdict (APPROVED, all PASS) is consistent with
this audit on F1–F3, F5–F6, F8–F10; this audit additionally surfaces F4a, F7a, F7b. The two
audits are complementary, not conflicting — Qwen reviewed on the executor's platform where
F7a cannot manifest, and F4a requires reading the client's exception contract against the
finalize path.

— Z.ai
