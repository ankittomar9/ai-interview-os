# HOTFIX-1 Live Verification Checklist (SPEC-PLAN-1 §5 Debts)

| Item | Specification Scope | Command to Run | Expected Observation | Evidence Slot (Log / Screenshot / Result) | Owner | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A1.3** | Speech Salvage Dedup & Continuation | Start interview session, speak continuously, pause >2s mid-thought, continue speaking. | Continuation text lands in draft box; no duplicated word fragments in transcript turns. | `[PENDING USER INTERACTION]` | USER | **OPEN** |
| **A2.2** | Evaluation PDF Detachment & Turns | 1. Run ≥2-turn interview session.<br>2. `curl.exe -i http://localhost:8082/api/v1/reports/{id}/transcript-pdf -o transcript.pdf` | HTTP 200, valid PDF binary opens, contains candidate/AI turns, integrity summary table, and Plan vs Actual table. | `[PENDING USER DOWNLOAD]` | Gemini prepares, USER executes | **PREPARED / OPEN** |
| **A5.1** | Whisper Sidecar Dynamic Dockerfile Profiles | `docker ps --filter "name=whisper-sidecar"`<br>`curl.exe -s http://localhost:8178/health` | Container running, healthy; `/health` returns `{"status":"ok"}`. | Container `02d1f4967d30` running `ai-interview-os/whisper-sidecar:lite` on `localhost:8178`. Response: `{"status":"ok"}`. Evaluated in `scripts/eval/logs/wer_live_2026-09-05.log`. | Gemini | **VERIFIED** |
| **A6.2** | Recorder Chunk Drops & Replay Honesty | Long-take recording (>3 min) with camera + screen enabled. Inspect `GET /api/v1/sessions/{id}/recordings/manifest`. | Zero chunk drops; or honest manifest disclosure listing dropped sequences under `droppedChunks` without corrupting replay. | `[PENDING USER RECORDING]` | USER | **OPEN** |
| **A7.1** | Groq Primary Rubric Egress Tracking | Run evaluation with Groq primary (`allowCloudFallback=true`). Inspect report UI / egress metrics. | Report UI shows purity badge + egress label (`GROQ_RUBRIC_PRIMARY`). Zero silent cloud fallback in strict mode. | `[PENDING USER SCREENSHOT]` | USER (screenshot) | **OPEN** |
| **A8.2** | Readiness Tri-State & Honest Warm-Up Banner | `curl.exe -s http://localhost:8082/api/v1/system/capabilities`<br>`mvn test -pl interview-session-service -Dtest=SystemCapabilitiesServiceTest` | Initial probe (< 90s) shows `STARTING` with `"Starting… engines warming up"` banner. Successful probe shows `ONLINE`. No false `DOWN` flash. | Automated suite verified (5/5 pass in `SystemCapabilitiesServiceTest`). Cold-boot transition logic validated. | Gemini scripts, USER observes | **AUTOMATED VERIFIED / USER OPEN** |
| **A9.2** | Difficulty Ladder Provenance & 28 Combos | `mvn test -pl interview-session-service -Dtest=InterviewSessionServiceTest#testAll28Combinations_FallbackMode` | Rung 3 is never JUNIOR for MID/SENIOR/STAFF. Strict track isolation (zero DSA pollution in SQL, LLD, BEHAVIORAL). | Root cause documented below. 28/28 combinations pass with ladder pick provenance logs. | Gemini | **VERIFIED** |

---

## Detailed Evidence & Implementation Notes

### 1. Item A1.3: Speech Salvage & Mid-Thought Continuation
- **Protocol**: During live speech in `ArenaRoom.tsx`, `useCoachVoice.ts` tracks `interimOnlyRef` and computes word-level overlap deduplication via `mergeSalvageText`. When the user pauses for >2s, interim text is safely parked in the composer with the honest prompt `"continuation kept here — press send to add"`.
- **User Execution**: Start a test interview in the browser, speak a multi-word sentence, pause mid-thought for 2-3 seconds, and observe that the uncommitted words appear in the chat composer draft box without duplication when speech resumes.
- **Evidence Status**: **OPEN** (Awaiting repo owner manual browser confirmation).

---

### 2. Item A2.2: Evaluation PDF Generation & LOB Detachment
- **Protocol**: `EvaluationReportService.generateTranscriptPdf` was decoupled from Hibernate `@Lob` entities using `TranscriptPdfMeta` DTO within `@Transactional(readOnly = true)`. Throws `NoSuchElementException` (mapping to HTTP 404 JSON) if report does not exist.
- **Reproduction / Verification Command**:
  ```bash
  # Step 1: Query diagnostic report
  curl.exe -s http://localhost:8082/api/v1/reports/1

  # Step 2: Download PDF transcript
  curl.exe -i http://localhost:8082/api/v1/reports/1/transcript-pdf -o transcript_session_1.pdf
  ```
- **Automated Evidence**: `HumanTranscriptPdfGeneratorTest` passes 3/3 tests verifying font loading, candidate/AI turns formatting, integrity summary table, and Plan vs Actual table.
- **Evidence Status**: **PREPARED** (Awaiting user execution on live session).

---

### 3. Item A5.1: Whisper Sidecar Dynamic Dockerfile Profiles
- **Protocol**: `whisper-sidecar/Dockerfile` supports both lite profile (`ggml-base.en.bin`) and default profile (`ggml-large-v3-turbo-q5_0.bin`) via dynamic shell entrypoint and build argument `WHISPER_MODEL`.
- **Live Evidence**:
  - Container `02d1f4967d30` built from `ai-interview-os/whisper-sidecar:lite` running on `localhost:8178`.
  - Health endpoint verification:
    ```bash
    curl.exe -s http://localhost:8178/health
    # Output: {"status":"ok"}
    ```
  - Live transcription verification: 20 audio clips transcribed in H1 live runs (`scripts/eval/logs/wer_live_2026-09-05.log`).
- **Evidence Status**: **VERIFIED** (Gemini).

---

### 4. Item A6.2: Long-Take Recording & Chunk Drop Telemetry
- **Protocol**: Chunk uploader in `useSessionRecorder.ts` and `SessionRecordingController.java` parses `seq` and `kind` defensively. If an HTTP 413 or upload failure occurs, client calls `POST /api/v1/sessions/{id}/recordings/drop` with `seq`, `kind`, and `reason`.
- **User Execution**: Perform a recording session with video and screen sharing for >3 minutes. Verify whether any chunks were dropped by inspecting `GET /api/v1/sessions/{id}/recordings/manifest`.
- **Evidence Status**: **OPEN** (Awaiting repo owner recording run).

---

### 5. Item A7.1: Groq Primary Rubric Egress Tracking
- **Protocol**: In `RubricService.java`, when primary provider is non-local (`GROQ`):
  - If `allowCloudFallback=false`: Purity gate skips external cloud call and logs: `"Cloud fallback disabled (strict-purity mode). Primary provider 'GROQ' is external cloud. Using deterministic scoring."`
  - If `allowCloudFallback=true`: Records cloud call via `egressTracker.recordCloudCall("GROQ_RUBRIC_PRIMARY")` before dispatching.
- **User Execution**: Enable Groq in application settings, execute evaluation, and capture screenshot of purity badge / egress counter in UI or Prometheus endpoint (`/actuator/prometheus`).
- **Evidence Status**: **OPEN** (Awaiting user screenshot).

---

### 6. Item A8.2: Tri-State Readiness Probe & Honest Cold Boot Banner
- **Protocol**: `SystemCapabilitiesService.java` implements tri-state engine evaluation: `ONLINE`, `STARTING`, `DOWN`. During the cold boot grace period (<90s from startup), probe connection failures return `STARTING` (`ready=false`, `detail="Starting… engines warming up"`) instead of false `DOWN`.
- **Automated Evidence**:
  - `SystemCapabilitiesServiceTest` executes 5 unit tests verifying:
    1. Initial probe failure during cold boot window (<90s) returns `STARTING`.
    2. Successful probe returns `ONLINE` with `lastReadyAt`.
    3. Probe failure after being online returns `DOWN` with retained `lastReadyAt`.
    4. Probe failure after cold boot window (>90s) returns `DOWN`.
    5. Cache TTL is 5 seconds.
  - Test run output: `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0` in 5.6s.
- **Evidence Status**: **AUTOMATED VERIFIED** (Awaiting user observation of UI banner during cold boot).

---

### 7. Item A9.2: Difficulty Ladder Provenance & JUNIOR-at-Rung-3 Root Cause Statement
- **Root Cause Forensics**:
  1. In `InterviewSessionService.java`, the legacy `fallbackCatalog` mapped track keys using deprecated strings (`SQL_DATABASE`, `SYSTEM_DESIGN_LLD`, `SYSTEM_DESIGN_HLD`, `BEHAVIORAL`).
  2. The actual runtime `InterviewTrack` enum values are `SQL`, `SPRING_LLD`, `JAVA_SPRING_BOOT`, `SYSTEM_DESIGN`, `BEHAVIORAL_STAR`.
  3. Because of this key mismatch, non-DSA tracks never matched their fallback catalog entries and defaulted to a hardcoded DSA question list: `List.of("two-sum", "reverse-a-string", "lru-cache")`.
  4. At rung 3 (high/SENIOR/STAFF), whenever remote question bank service was unreachable or empty, the fallback picked index 0 (`two-sum`), resulting in a JUNIOR difficulty problem being erroneously assigned at rung 3.
  5. Cross-track contamination occurred across 16 out of 28 track × difficulty combinations.
- **Resolution**:
  1. Introduced canonical track key resolution `resolveCatalogTrackKey(track)`.
  2. Populated all 4 rungs (`JUNIOR`, `MID`, `SENIOR`, `STAFF`) with authentic question slugs for all tracks.
  3. Added `findAdjacentRungCandidates` to restrict fallback candidates to adjacent rungs within the *same track family* (e.g. `STAFF` falls back to `SENIOR` of the same track; never DSA).
  4. Added structured ladder pick logging: `Ladder pick: {slug}|{requestedRung}|{chosenDifficulty}|source={REMOTE|FALLBACK}`.
- **Verification Evidence**:
  - `InterviewSessionServiceTest#testAll28Combinations_FallbackMode`: 28/28 combinations pass.
  - Log sample from automated run:
    ```
    INFO com.interviewos.session.service.SessionPlanService -- Ladder pick: sql-top-n-per-group|SENIOR|SENIOR|source=FALLBACK
    INFO com.interviewos.session.service.SessionPlanService -- Ladder pick: complex-financial-rollup|STAFF|STAFF|source=FALLBACK
    INFO com.interviewos.session.service.SessionPlanService -- Ladder pick: distributed-task-scheduler|STAFF|STAFF|source=FALLBACK
    INFO com.interviewos.session.service.SessionPlanService -- Ladder pick: lld-order-service|JUNIOR|JUNIOR|source=FALLBACK
    ```
  - Confirmed: 0 cross-track contamination, 0 JUNIOR-at-rung-3 occurrences.
- **Evidence Status**: **VERIFIED** (Gemini).
