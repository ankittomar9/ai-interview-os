# SPEC-PLAN-2 Verification Log & Audit Trail

This append-only verification log records the evidence, automated test runs, line counts, and commit hashes for each batch executed under **SPEC-PLAN-2**.

---

## Batch 1: [A1 + A10 + A11] — Speech Salvage, Editor Sync, Workspace Clean Starter

- **Branch**: `fix/ledger-a1-a10-a11`
- **Scope**:
  - **A1**: Extracted `audio-encoder.ts`, `audio-recorder-fallback.ts`, `audio-tts.ts`, `audio-duplex-guard.ts` to shrink `useCoachVoice.ts` under 250 lines. Added `interimOnlyRef` and word-level overlap deduplication via `mergeSalvageText`. Prevented duplicate text injection on salvage. On mid-speech commit, parked continuation in composer with honest hint (`"continuation kept here — press send to add"`).
  - **A10**: Keyed editor workspace state per problem slug (`codeMap: Record<string, string>`) in `ArenaRoom.tsx`. Problem switches between Q1, Q2, and Q3 now isolate and preserve each question's own starter code and draft.
  - **A11**: Replaced full solution in `starterCode` and `starterCodeMap` for `valid-parentheses` in `QuestionDataInitializer.java` with a clean boilerplate stub.
- **Line Count Verification (`wc -l`)**:
  - `ArenaShell.tsx`: 249 lines (Budget: ≤ 250) — **PASS**
  - `ArenaRoom.tsx`: 248 lines (Budget: ≤ 250) — **PASS**
  - `useCoachVoice.ts`: 243 lines (Budget: ≤ 250) — **PASS**
- **Automated Test Evidence**:
  - `node --experimental-strip-types --test frontend/src/lib/salvage-dedup.test.ts`:
    ```
    # Subtest: A1: Deduplicates identical pending and interim fragments: ok
    # Subtest: A1: Deduplicates identical pending and interim with casing differences: ok
    # Subtest: A1: Merges disjoint pending and interim fragments losslessly: ok
    # Subtest: A1: Deduplicates overlapping boundary words: ok
    # Subtest: A1: Handles pending ending with interim: ok
    # Subtest: A1: Handles interim starting with pending: ok
    # Subtest: A1: Handles empty pending or interim: ok
    # tests 7, pass 7, fail 0
    ```
  - `mvn test -pl question-bank-service`:
    ```
    Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
    BUILD SUCCESS
    ```
  - `npm run build` (frontend):
    ```
    ✓ 2605 modules transformed.
    ✓ built in 1.62s
    Exit Code: 0
    ```
- **Reviewer Status**: PASS (Commit candidate ready for master merge)

---

## Batch 2: [A2 + A3] — Evaluation PDF LOB Detachment & Rubric Fallback Telemetry

- **Branch**: `fix/ledger-a2-a3`
- **Scope**:
  - **A2**: Decoupled `HumanTranscriptPdfGenerator` from Hibernate `@Lob` entities by introducing `TranscriptPdfMeta` DTO. Wrapped `EvaluationReportService.generateTranscriptPdf` in `@Transactional(readOnly = true)` and map entity to DTO inside transaction boundary. Throws `NoSuchElementException` when session report is missing. Updated `EvaluationReportController` to catch `NoSuchElementException` and return HTTP 404 JSON (`{"error": ..., "sessionId": ...}`).
  - **A3**: Updated `AiRubricClient` fallback handling to record Prometheus counter `ai_rubric_fallback_total` tagged by `reason` (`UNSUPPORTED_MEDIA_TYPE_415`, `TIMEOUT_OR_NETWORK`, `SERVER_ERROR_5XX`, `CLIENT_ERROR_4XX`, `OCTET_STREAM_MISMATCH`, `UNKNOWN_ERROR`) with structured diagnostic logging (`reason`, `status`, `contentType`, `elapsedMs`, `bodySnippet`).
- **Automated Test Evidence**:
  - `mvn test -pl evaluation-report-service`:
    ```
    [INFO] Running com.interviewos.evaluation.client.AiRubricClientTest
    [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in com.interviewos.evaluation.client.AiRubricClientTest
    [INFO] Running com.interviewos.evaluation.controller.EvaluationReportControllerTest
    [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in com.interviewos.evaluation.controller.EvaluationReportControllerTest
    [INFO] Running com.interviewos.evaluation.service.EvaluationReportServiceTest
    [INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0 -- in com.interviewos.evaluation.service.EvaluationReportServiceTest
    [INFO] Running com.interviewos.evaluation.service.HumanTranscriptPdfGeneratorTest
    [INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- in com.interviewos.evaluation.service.HumanTranscriptPdfGeneratorTest
    [INFO] Results:
    [WARNING] Tests run: 15, Failures: 0, Errors: 0, Skipped: 1
    [INFO] BUILD SUCCESS
    ```
  - `EvaluationReportControllerTest.testGetTranscriptPdf_NotFound`: verifies HTTP 404 JSON for non-existent session (no 500 NPE).
  - `EvaluationReportControllerTest.testGetTranscriptPdf_Success`: verifies HTTP 200 and application/pdf byte stream.
  - `HumanTranscriptPdfGeneratorTest.testPdfGenerationWithMeta`: verifies PDF rendering directly from `TranscriptPdfMeta`.
  - `AiRubricClientTest.testEvaluateRubric_FallbackOn415`: verifies fallback metric increment with `reason=UNSUPPORTED_MEDIA_TYPE_415`.
  - `AiRubricClientTest.testEvaluateRubric_FallbackOnTimeout`: verifies fallback metric increment with `reason=TIMEOUT_OR_NETWORK`.
- **Reviewer Status**: PASS

