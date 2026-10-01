# Spec: P7-AUTOVAULT — Session Auto-Vault (Zero-Touch Local Archival)

| Metadata | Value |
|---|---|
| **Task ID** | `P7-AUTOVAULT` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Base Commit** | `59a5984` |
| **Artifact** | `collab/z/P7-AUTOVAULT-SPEC.md` (self-contained — Z-lane write boundary is `collab/z/` only) |
| **Executor** | Gemini — execution report to `collab/gemini/P7-AUTOVAULT-REPORT.md` |
| **Post-execution audit** | Z.ai — `collab/z/P7-AUTOVAULT-AUDIT.md` (verdict PASS / CONDITIONAL / FAIL) |
| **Verdict / Status** | `ISSUED` — awaiting Gemini execution |
| **Date** | 2026-10-01 |

---

## 1. Problem statement

Today, after a finished interview, every artifact is retrievable only by hand: per-stream
download anchors on the report screen (`DiagnosticReportView.tsx:1020-1025, 1166-1167`),
a client-side `.txt` Blob export (`:272-319`), an on-demand PDF anchor (`:382-389`).
Nothing in the stack ever writes a session artifact to the operator's filesystem.

Three consequences make this urgent, not cosmetic:

1. **Silent 14-day deletion.** `StorageHygieneScheduledJob` purges GridFS recording chunks,
   canvas attachments and resume files for COMPLETED sessions older than
   `storage.retention-days:14` (cron `0 0 3 * * ?`). Recordings are permanently destroyed
   two weeks after every interview. Transcripts/verdicts/report rows survive; media does not.
2. **Browser-side loss windows.** If the tab closes before `handleFinishInterview` runs
   (`App.tsx:346-354`), the session stays `IN_PROGRESS` forever, `session_questions` verdicts
   are never materialized, no report row is created, and the last ≤5 s of each recording plus
   every chunk sitting in the in-memory retry queue (`useSessionRecorder.ts:127`,
   `useMicRecorder.ts:45`) vanish.
3. **Manual effort and broken evidence chain.** The user must click 3+ downloads per session
   and organize files themselves. P4 (proctored flow) will later need a durable evidence
   locker; the vault is that locker.

**Goal:** when an interview ends, ALL artifacts are written automatically to
`<VAULT_ROOT>\<date>\<session-folder>\` on the operator's machine (default
`D:\AI OS Interview Media`), with zero clicks, zero file dialogs, and a verifiable manifest.

## 2. Non-goals

- No cloud upload, no sync, no S3 — local disk only (local-first mission, AGENTS-addendum §local-first).
- No change to the 14-day GridFS hygiene job (vault is the permanent copy; purge stays).
- No practice-mode vaulting — `practice_attempts` are a cross-session ledger with no recordings.
- No resumable browser upload redesign (chunks already stream live every 5 s). The residual
  browser-side loss window (last ≤5 s + retry queue on hard tab-close) is acknowledged and
  deferred as a P7 follow-up candidate (`beforeunload` flush), not in this spec.
- No DB migration (no Flyway) — vault status mirrors into the existing Mongo session document.

## 3. Design overview

Single-writer architecture: **interview-session-service (ISS) is the only service that
touches the vault disk.** It already owns GridFS reads, transcripts, submissions ledger and
session questions. It lacks only the report — fetched over existing HTTP endpoints from
evaluation-report-service (ERS) when ERS signals report completion.

```
 frontend                    ISS                                ERS
    │                          │                                  │
    │ POST /sessions/{id}/     │  stage 1 (async, never blocks)   │
    │ complete                 ├────────────┐                     │
    │─────────────────────────>│  vault/    │ recordings (GridFS→  │
    │                          │  Archive   │ streamRecording),    │
    │                          │  Service   │ transcript, problems,│
    │                          │            │ plan, integrity      │
    │                          │  STAGED    │                     │
    │ POST /reports/generate/  │            │                     │
    │────────────────────────────────────────────────────────────>│
    │                          │            │  save(report) +     │
    │                          │ <──────────┤  Feign callback     │
    │                          │  stage 2:  │ POST /internal/v1/  │
    │                          │  fetch GET │ sessions/{id}/vault/│
    │                          │  /reports/ │ report-ready        │
    │                          │  session/{id} + /human-transcript.pdf
    │                          │  VERIFIED (manifest + sha256 verify)
```

- **No event bus exists** (verified: zero `ApplicationEventPublisher`/Kafka/Rabbit in repo);
  cross-service talk is Feign REST — the callback rides the existing
  `SessionServiceClient` (`evaluation-report-service/.../client/SessionServiceClient.java:11`).
- If the callback is missed (tab closed mid-report, AI eval failure), a **lazy sweeper**
  (same pattern as `StorageHygieneScheduledJob`) closes the vault on its next cron tick:
  VERIFIED if the report exists, PARTIAL if it never will.

## 4. Vault folder contract (REQ-AV-2)

```
D:\AI OS Interview Media\              ← VAULT_ROOT (bind-mounted into ISS container at /vault)
└── 2026-10-01\                        ← by completion date (UTC)
    └── 1432_DSA_MEDIUM_1042\          ← {HHmm}_{TRACK}_{DIFFICULTY}_{sessionId}
        ├── manifest.json              ← written LAST (full sha256 inventory)
        ├── vault-status.json          ← cheap-read status sidecar
        ├── session\session.json       ← id, roleTitle, track, difficulty, status, startedAt,
        │                                completedAt, durationSeconds, plannedSlugs, sessionMode
        ├── recordings\
        │   ├── screen.webm            ← reassembled from GridFS chunks (seq order)
        │   ├── camera.webm
        │   ├── mic-audio.webm
        │   └── manifest.json          ← per-kind chunk summaries + droppedChunks (existing payload)
        ├── transcript\
        │   ├── transcript.json        ← full Mongo transcript[] (turns + integrity fields)
        │   └── transcript.md          ← human-readable render (sender, turn no, timestamps)
        ├── report\
        │   ├── report.json            ← EvaluationReport DTO (stage 2)
        │   └── report.pdf             ← HumanTranscriptPdfGenerator bytes (stage 2)
        ├── problems\
        │   ├── session-questions.json ← verdict per slug (PASSED/FAILED/UNATTEMPTED, attemptedAt)
        │   ├── submissions-ledger.jsonl   ← every RUN/SUBMIT event (one JSON object per line)
        │   └── code\<slug>__<ACTION>__<seq>.<ext>   ← codeSnippet per ledger entry
        ├── plan\session-plan.json     ← planJson + plannedSlugs
        ├── integrity\
        │   ├── verification-receipt.json   ← existing /verification payload (if any)
        │   └── message-integrity.json      ← session_messages integrity signal columns
        └── attachments\…              ← GridFS CANVAS_PNG/CANVAS_JSON + resume files (if any)
```

**Naming rules (Windows-safe):** `HHmm` has NO colon; `TRACK`/`DIFFICULTY` uppercased and
restricted to `[A-Z0-9]`; sessionId is the PG identity (unique ⇒ idempotent folder identity);
no other reserved chars (`<>:"/\|?*`) anywhere; folder depth ≤ 3 (long-path safe).
Example: `2026-10-01\1432_DSA_MEDIUM_1042\`.

## 5. Requirements

Naming: REQ-AV-n. **MUST** = gate-blocking; SHOULD = in-slice but deferrable with a written
rider; MAY = optional.

- **REQ-AV-1 (Vault root & mount) — MUST.** New config `vault.root: ${VAULT_ROOT:D:/AI OS
  Interview Media}` in ISS `application.yaml` (pattern: `storage.retention-days`), passed
  through compose as `- VAULT_ROOT=${VAULT_ROOT:-D:/AI OS Interview Media}` plus bind mount
  `- ${VAULT_ROOT}:/vault:rw` on the `interview-session-service` service only. Documented in
  `.env.example` and README (including: set `E:/AI OS Interview Media` if D: is absent;
  Docker Desktop → Resources → File Sharing must include the drive — WSL2 backend shares
  fixed drives by default). A `GET /api/v1/sessions/vault/health` endpoint MUST return
  `{root, mounted, writable}` (probe: create+delete `.vault-write-probe` under `/vault`).
- **REQ-AV-2 (Folder contract) — MUST.** Section 4 layout and naming rules, verbatim.
- **REQ-AV-3 (Stage-1 archive) — MUST.** At the end of `completeSession`
  (`InterviewSessionService.java:539-579`, after `recordSessionQuestions`), ISS dispatches an
  async vault job (dedicated single-thread executor; MUST NOT throw into the request path,
  MUST NOT delay the response). The job writes every MUST artifact of §4: session.json, three
  recordings via the existing `streamRecording(sessionId, kind, OutputStream)`
  (`SessionRecordingService.java:356` — stream GridFS→disk, never materialize full byte[] in
  memory for the whole file), recordings/manifest.json (per-kind summaries incl.
  droppedChunks), transcript.json + transcript.md, session-questions.json,
  submissions-ledger.jsonl, code snippets, plan. Files are written as `<name>.part` then
  atomically moved into place (crash never leaves a half-written file claiming a final name).
- **REQ-AV-4 (Report finalize) — MUST.** After `reportRepository.save(report)` in
  `EvaluationReportService.generateReport` (~`:549-551`), ERS calls ISS via one new method on
  the existing Feign interface `SessionServiceClient`:
  `POST /api/v1/internal/sessions/{id}/vault/report-ready` (new `InternalVaultController` in
  ISS, following `InternalSessionController` precedent). ISS then fetches
  `GET /api/v1/reports/session/{sessionId}` (report DTO, `EvaluationReportController:61-66`)
  and `GET /api/v1/reports/{sessionId}/human-transcript.pdf` (`:33-52`), writes
  report/report.json + report/report.pdf, re-verifies the whole folder, writes final
  `manifest.json`, sets status VERIFIED. Idempotent: re-invocation (NEEDS_REGRADE path
  re-generates the report) rewrites the two report files and bumps `manifest.vaultVersion`.
- **REQ-AV-5 (Manifest & integrity) — MUST.** `manifest.json` (schema below) lists every
  artifact with `bytes` + `sha256`. The finalize pass re-reads every file from disk and
  re-hashes it; any mismatch ⇒ FAILED with the offending paths in `missing`/`errors`.
  Manifest is written last, atomically.
- **REQ-AV-6 (Status machine & surfacing) — MUST.** Status =
  `STAGED → VERIFIED | PARTIAL | FAILED` (+ `ABORTED` variant for REQ-AV-9). Mirrored on the
  Mongo session document as `vault: {status, folderPath, stagedAt, verifiedAt, attempts,
  lastError}` (dual-persistence pattern; no Flyway). Read endpoints:
  `GET /api/v1/sessions/{id}/vault` (status + manifest summary) and the REQ-AV-1 health
  endpoint. On the report screen, the vault path + status chip is displayed (small change to
  `DiagnosticReportView.tsx`).
- **REQ-AV-7 (Lazy sweeper) — MUST.** `VaultSweeperJob` (@Component/@Scheduled, cron
  `0 30 3 * * ?` — deliberately offset from the 03:00 hygiene job; overridable
  `vault.sweep-cron`): finds sessions COMPLETED > 1 h ago whose Mongo `vault.status` is
  absent/STAGED and (a) report exists ⇒ run finalize (REQ-AV-4 path), (b) no report after
  24 h ⇒ close as PARTIAL with `missing:["report"]`. Sweeper MUST also be safe to run
  manually (log-only dry-run flag `vault.sweep-dry-run:true` default true in tests).
- **REQ-AV-8 (Zero manual steps) — MUST.** No file chooser, no browser download, no user
  gesture anywhere in the flow. Failure surface is read-only (status chip + health endpoint),
  never a modal blocking the report view.
- **REQ-AV-9 (Abort path) — SHOULD.** `abortSession` (`:826-857`) triggers the same stage-1
  archive; folder carries `session.status=ABORTED_SHARE`, no report section, final status
  PARTIAL.
- **REQ-AV-10 (Proctor telemetry export) — SHOULD.** `proctor/telemetry-events.jsonl` via a
  small Feign client to proctor-sentinel-service (its PG `telemetry_events` is P4's future
  evidence base). Deferrable to a P7.1 rider with declared fence.
- **REQ-AV-11 (Test hygiene) — MUST.** All vault tests write ONLY to JUnit `@TempDir` /
  `vault.root` overridden to a temp path. No test may touch a real drive path. Container
  integration tests use a tmpfs mount, not `D:`.

### Manifest schema (`manifest.json`, schema `av1.manifest@1`)

```json
{
  "schema": "av1.manifest@1",
  "sessionId": 1042,
  "sessionFolder": "2026-10-01/1432_DSA_MEDIUM_1042",
  "status": "VERIFIED",
  "vaultVersion": 1,
  "generatedAt": "2026-10-01T14:47:22Z",
  "session": { "track": "dsa", "difficulty": "MEDIUM", "roleTitle": "SDE-2",
               "sessionMode": "INTERVIEW", "startedAt": "…", "completedAt": "…",
               "durationSeconds": 1523 },
  "counts": { "problems": 3, "solved": 1, "submissions": 12,
              "transcriptTurns": 41, "recordings": 3, "attachments": 0 },
  "artifacts": [
    { "path": "recordings/screen.webm", "kind": "recording", "bytes": 18433211, "sha256": "…" },
    { "path": "report/report.pdf", "kind": "report", "bytes": 91234, "sha256": "…" }
  ],
  "missing": [],
  "errors": []
}
```

`vault-status.json` (schema `av1.status@1`): `{schema, sessionId, status, stagedAt,
verifiedAt, attempts, lastError}` — small file rewritten on every transition.

## 6. Implementation slices & fences

Discipline per AGENTS.md / AGENTS-addendum: branch + one-spec-one-commit-series, atomic
per-item commits, **`--no-ff` merges with item IDs**, declared fences, G1 image-only deploy,
G2 no forged flyway receipts (no migrations here at all), G3 four-number reporting per gate,
G4 honest-judge, G5 no secrets, G6 in-repo evidence at `docs/SPEC_P7_VERIFICATION.md`.

**Slice AV-1 — config, mount, health** (fence: `docker-compose.yaml`, `.env.example`,
`interview-session-service/src/main/resources/application.yaml`, README.md, NEW
`.../session/vault/VaultProperties.java`, `.../vault/VaultController.java`).
No behavior change without mount — pure addition.

**Slice AV-2 — stage-1 writer** (fence: NEW `.../vault/VaultPathPolicy.java`,
`.../vault/VaultArchiveService.java`, `.../vault/VaultStatusService.java`, MODIFIED
`InterviewSessionService.java` (hook lines only, end of `completeSession`), NEW tests).
Reference sketch:

```java
// VaultArchiveService — async, failure-isolated
public void archiveSessionAsync(Long sessionId) {
    executor.execute(() -> {
        try { archiveSessionStage1(sessionId); }        // §4 MUST artifacts
        catch (Exception e) { statusService.markFailed(sessionId, e); } // NEVER rethrow
    });
}
// recording write — reuse existing assembly, stream to disk:
try (OutputStream out = Files.newOutputStream(tmpPart)) {
    recordingService.streamRecording(sessionId, "screen", out);   // SessionRecordingService:356
}
Files.move(tmpPart, finalPath, ATOMIC_MOVE, REPLACE_EXISTING);
```

**Slice AV-3 — report finalize** (fence: MODIFIED `evaluation-report-service/.../client/
SessionServiceClient.java` (one POST method), `EvaluationReportService.java` (one-line
callback after save), NEW `.../session/vault/InternalVaultController.java` (ISS),
`VaultArchiveService.finalizeWithReport(...)` + tests).

**Slice AV-4 — sweeper + abort** (fence: NEW `.../vault/VaultSweeperJob.java`, MODIFIED
`InterviewSessionService.abortSession` (hook only), tests).

**Slice AV-5 — surfacing + proctor export (SHOULD)** (fence: `DiagnosticReportView.tsx`
(≤ 15-line diff: status chip + path), NEW proctor Feign client + telemetry export in ISS,
tests).

Execution order: AV-1 → AV-2 → AV-3 → AV-4 → (AV-5). MVP usable after AV-3.

## 7. Gates

Four-number reporting (files / test-cases / assertions / failures) is REQUIRED for every
gate claim; a gate claim without its four numbers is treated as not run (G3).

- **VP11 (stage-1 archive).** Seeded session with fake GridFS chunks for all three kinds +
  transcript turns + ledger submissions; call `POST /complete`; assert folder name matches
  §4, all MUST artifacts exist, every manifest sha256 matches re-hash, `completeSession`
  returned before archiving finished (async proof), PG+Mongo session COMPLETED. PASS+FAIL
  pair required (G4): FAIL case = manifest listing a deliberately corrupted file.
- **VP12 (finalize + idempotency).** After report-ready: report.json+report.pdf in vault,
  status VERIFIED; invoke report-ready twice ⇒ identical artifact hashes for non-report
  files, report files replaced, `vaultVersion` incremented, no duplicate files.
- **VP13 (failure isolation).** Mount `/vault` read-only (compose tmpfs `:ro` in the test
  profile): `completeSession` still returns 200 and session is COMPLETED in PG+Mongo; vault
  status FAILED with `lastError` populated; `vault/health` reports `writable:false`.
- **VP14 (sweeper).** (a) Session completed, report generated, callback suppressed ⇒ next
  sweep tick closes VERIFIED. (b) Session completed, no report after simulated 24 h ⇒
  PARTIAL with `missing:["report"]`.
- **VP11-m (manual, operator).** One live DSA interview on the operator machine: folder
  appears under `D:\AI OS Interview Media\<date>\` with zero clicks; all three webm files
  play back from the vault copies; report.pdf opens; status chip shows VERIFIED on the
  report screen. Operator screenshots → `docs/SPEC_P7_VERIFICATION.md` (G6) → V208-style
  close.

## 8. Test plan (minimum)

| Layer | Target | Notes |
|---|---|---|
| Unit (ISS) | VaultPathPolicy naming/sanitization/collision; manifest hashing; status transitions | pure JUnit, `@TempDir` |
| Unit (ISS) | `completeSession` never propagates vault failure (VP13 core) | mocked writer throwing |
| Integration (ISS) | VP11, VP12, VP14 | test-profile compose, tmpfs `/vault` |
| Contract (ERS) | Feign callback invoked exactly once after save (success AND NEEDS_REGRADE paths) | MockRestServiceServer / Feign stub |
| Frontend | vault status chip renders STAGED/VERIFIED/FAILED; zero download anchors removed? — NO: manual anchors stay | node:test, source-contract style |
| Manual | VP11-m | operator |

Manual download anchors on the report screen remain (defense in depth) — the vault is
additive; nothing existing is removed.

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Large recordings (1 h ≈ hundreds of MB) block completion | async executor (REQ-AV-3); streaming GridFS→disk, no full-file byte[] |
| Vault write fails (drive absent/full/unplugged) | failure isolation (VP13), status FAILED + health endpoint; session flow unaffected |
| Report never generated (BYOK missing, AI failure) | sweeper closes PARTIAL after 24 h (VP14b); `missing` names the gap |
| Operator's machine has no D: | `.env` override to E:/C: documented (REQ-AV-1); compose default keeps working when drive present |
| Windows path hazards (colons, reserved chars, long paths) | VaultPathPolicy unit-tested sanitization (§4 rules); shallow depth |
| Double-writer races | single-writer design: only ISS writes; report files arrive only via ISS finalize |
| GridFS purge races vault | vault reads chunks immediately at completion; sweeper at 03:30 runs BEFORE 03:00-style purges only affect 14-day-old sessions — no overlap with 1 h-old sessions |

## 10. Evidence & report requirements

Gemini's execution report MUST include (G3/G4/G6): four numbers per gate, PASS+FAIL pair for
VP11, container rebuild proof (`docker compose build interview-session-service
evaluation-report-service` — G1, no `docker cp`), the exact commit hash list with `--no-ff`
merges, and `docs/SPEC_P7_VERIFICATION.md` committed in-repo. Operator then performs VP11-m
during their next live session to close the phase, mirroring the V208 closure protocol.

## Appendix A — Artifact → source map

| Vault artifact | Source (verified at `59a5984`) | Slice |
|---|---|---|
| recordings/*.webm | `SessionRecordingService.streamRecording(sessionId, kind, out)` `:356-364` (seq-ordered GridFS chunks) | AV-2 |
| recordings/manifest.json | existing per-kind summary payload (`/recordings/manifest` data, incl. droppedChunks) | AV-2 |
| transcript/transcript.json | Mongo `interview_sessions.transcript[]` (read path `InterviewSessionService:498-531`) | AV-2 |
| transcript/transcript.md | render of the same turns | AV-2 |
| report/report.json | ERS `GET /api/v1/reports/session/{sessionId}` (`EvaluationReportController:61-66`) | AV-3 |
| report/report.pdf | ERS `GET /api/v1/reports/{sessionId}/human-transcript.pdf` (`:33-52`, PDFBox bytes) | AV-3 |
| problems/session-questions.json | PG `session_questions` (written by `recordSessionQuestions`, `SessionQuestionService:28-100`) | AV-2 |
| problems/submissions-ledger.jsonl | Mongo `submissionsLedger` (`InterviewSessionDocument:104-119`) | AV-2 |
| problems/code/* | `codeSnippet` per ledger entry | AV-2 |
| plan/session-plan.json | `planJson` + `plannedPlugs→plannedSlugs` (`InterviewSession:63-67`) | AV-2 |
| integrity/* | `/verification` payload + `session_messages` integrity columns | AV-2 |
| attachments/* | GridFS CANVAS_PNG/CANVAS_JSON + resume (`AttachmentController:42-89`, `resume/upload:153-162`) | AV-2 |
| proctor/telemetry-events.jsonl | proctor-sentinel PG `telemetry_events` (needs small Feign client) | AV-5 (SHOULD) |

## Appendix B — Operator setup (README section to add)

1. Choose the drive: default `D:/AI OS Interview Media`; if D: does not exist, set
   `VAULT_ROOT=E:/AI OS Interview Media` in `.env` (forward slashes are correct for
   Docker Desktop on Windows).
2. Docker Desktop → Settings → Resources → File Sharing: ensure the chosen drive is shared
   (WSL2 backend: fixed drives are available by default).
3. `docker compose build interview-session-service evaluation-report-service && docker
   compose up -d` (G1 image-only; never `docker cp`).
4. Sanity: `curl http://localhost:8080/api/v1/sessions/vault/health` →
   `{"mounted":true,"writable":true,"root":"D:/AI OS Interview Media"}`.
5. Run one interview — the folder appears by itself; nothing to download, ever.
