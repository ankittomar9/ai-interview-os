# READINESS MATRIX — ai-interview-os vs. HackerRank AI-Interview Benchmark

> **Author:** Z (audit lane) · **Date:** 2026-10-14 · **Evidence pinned at:** `origin/master` `3cdb274`
> **Status:** PUBLISHED to `collab/z/READINESS-MATRIX.md` on origin/master (QB-32)
> **Purpose:** Gap analysis against the HackerRank AI-driven interview pipeline, feeding SPEC-016+ roadmap planning.

---

## 0. Verdict

**~65% of the full HackerRank pipeline — 100% of the candidate-side loop.**
The missing mass is concentrated in employer-market features (ATS sync, recruiter console, leak-resistance infrastructure) that are *deliberate* non-goals of the local-first mission, plus three hardening gaps that are genuine roadmap candidates.

| Layer | Ready | One-line state |
|---|---|---|
| 1. Skill assessments (screening) | ~75% | Real seeded catalog + hidden-test judging; thin non-DSA tracks, no variant generation |
| 2. Proctoring & anti-cheat (trust) | ~70% | Full event taxonomy + risk scoring + report fusion; no plagiarism corpus, no LLM-answer classifier |
| 3. AI interviewer (conversational) | ~80% | Strongest layer: coach, voice, arena, rubric scorecard, progress ledger |
| 4. ATS / recruiter console | ~15% | Absent — by design (candidate-side local-first tool, not employer SaaS) |

---

## 1. Benchmark model

HackerRank's AI-interview pipeline, as reference:

```
JD → role-based question set → proctored assessment → auto-grade + cheat flags
   → AI-conducted live interview → rubric scorecard with evidence → ATS → human decision
```

Three layers assessed: **(1)** screening assessments, **(2)** proctoring/anti-cheat, **(3)** AI interviewer — plus the ATS tail.

---

## 2. Layer 1 — Skill Assessments: ~75%

**Verified present:**

| Capability | Evidence (`3cdb274`) |
|---|---|
| Seeded question catalog, 372 PUBLISHED | `question-bank-service/src/main/resources/content/questions/` — **DSA 316 / HLD 27 / LLD 19 / SQL 8 / Behavioral 2** (=372, matches SPEC-011 catalog pin; `DsaCatalogGuardTest` bump 364→372) |
| Ingestion validation pipeline | `questionbank/ingestion/QuestionMarkdownParser.java`, `ContentValidator.java`, `QuestionMarkdownSeeder.java` |
| Catalog serving + matching | `questionbank/service/CatalogService.java`, `QuestionMatchService.java`, `dto/QuestionPublicView/QuestionFullView` |
| Hidden-test-case judging | Judge0 runner pattern (`judge0-patches/`, execution-model doc: sandbox/runner is the truth source; `ENGINE_UNAVAILABLE` honesty semantics) |
| Role calibration + resume-driven ladders | SPEC-004: `session/ResumeController.java`, `ResumeDocument.java`, PDF parser, per-track rubrics |
| Track-neutral rubrics | SPEC-004 (Behavioral STAR rubric, per-track dimensions) |
| Staged timed sessions | `StageStepper`, interview session machinery, asked-ledger lineage (`feat/ih5-asked-ledger`) |
| LLD live workspaces | SPEC-011: 8 Maven-workspace `SPRING_LLD` problems, live-schema conform |

**Gaps:** no MCQ/knowledge-question type in catalog; no AI-generated question *variants* (leak resistance); SQL (8) and Behavioral (2) catalogs too thin for repeated practice; no frontend-project scaffold lane.

## 3. Layer 2 — Proctoring & Anti-Cheat: ~70%

**Verified present — `proctor-sentinel-service/`:**

| Capability | Evidence |
|---|---|
| Tab-focus/blur detection | `model/TelemetryEventType.java`: `TAB_BLUR`, `TAB_FOCUS` |
| Paste-storm detection | `PASTE_DUMP` — threshold `pasteCharacterThreshold=200`, penalty 8 |
| Keystroke-cadence analysis (anti-AI proxy) | `KEYSTROKE_BURST` — `keystrokeBurstCpmThreshold=800`, penalty 10 |
| Inactivity/copy signals | `IDLE_TIMEOUT`, `COPY_ATTEMPT`, `NO_SPEECH_GAP` |
| Screen-share policy enforcement | `VERIFY_SCREEN_OK` / `VERIFY_SCREEN_REJECTED` (window/tab share rejected), `SHARE_LOST` / `SHARE_RESTORED`; UI: `ShareLostOverlay.tsx` |
| Second-camera proctoring | `SECONDARY_CAMERA_CONNECTED`, phone companion (`PhoneProctorView.tsx`, `CameraProctorHUD.tsx`, `WebcamTile.tsx`), single-camera fallback ack |
| Pre-flight hardware gates | `VERIFY_CAMERA_OK` / `VERIFY_MIC_OK` (`PreInterviewChecklist.tsx`) |
| Tiered risk scoring | `model/IntegrityRiskLevel.java`: `CLEAN` → `SUSPICIOUS` → `CHEATING_FLAGGED`; `ProctorScoringProperties` (initial 100, per-event penalties) |
| **Flag panel fused into scorecard** | `evaluation-report-service`: `EvaluationReportService` injects `ProctorServiceClient.getSessionSummary(sessionId)` into the report — the "score + integrity context" panel |

**Gaps:** no plagiarism corpus fingerprinting; no statistical LLM-written-answer detection (keystroke cadence is only a proxy); no webcam-image AI analysis.

## 4. Layer 3 — AI Interviewer: ~80%

**Verified present:**

| Capability | Evidence |
|---|---|
| AI agent conducts the interview | Coach Sam dialogue flow (`interview-session-service`, `frontend/src/components/arena/`, `useDialogue.ts`) |
| Voice in + voice out | `whisper-sidecar/` (local STT), `useCoachVoice.ts` (TTS), `useAudioCapture.ts`, `AiAvatarWaveform.tsx` |
| Push-to-talk with abort/recall | `useCoachPttTranscription.ts`, `PushToTalk.test.ts`, `DialogueAbortAndRecall.test.ts` — hardening in flight as **SPEC-015** (`e.repeat` guard, `!isRequestingMic` parity, contract pins) |
| Turn control | SPEC-009: turn stop, draft restore, recall — `metadata.stopped` honesty |
| Live coding with AI watching | Arena + `useExecution.ts` / `useArenaEngines.ts`, honest verdict mapping restored post-m13 |
| Hint guardrails | Coach Sam hint ladder (Addendum A lineage), never hands over solutions |
| Rubric scorecard | `evaluation-report-service`: `HiringVerdict` enum (`STRONG_HIRE`/`HIRE`/`LEAN_HIRE`/`NO_HIRE`), `DimensionScoreDto` list, executive summary, key strengths, areas for improvement, **7-day study plan**, `llmGenerated` flag |
| Human-auditable evidence | `HumanTranscriptPdfGenerator` + `TranscriptPdfMeta` — full transcript PDF accompanies the verdict |
| Cross-session progress | SPEC-005: `ProgressLedgerService/Controller/ProgressLedger`, `ProgressChart.tsx`, trajectory/radar deltas |

**Gaps:** mid-session adaptive escalation (raise difficulty on success / decompose on stall) not verified as a wired Coach Sam behavior; per-dimension scorecard entries lack cited transcript-moment evidence links (PDF is holistic, not per-dimension).

## 5. ATS / Recruiter tail: ~15% — non-goal by design

No ATS sync (Greenhouse/Lever/Workday), no multi-candidate recruiter console, no org-scale question-leak telemetry. This is the correct shape for a local-first, $0, BYOK, privacy-first candidate tool — `LocalPurityBadge`, `EgressTracker`, resume-never-leaves-machine. **Not counted against readiness**; listed for completeness of the benchmark map.

## 6. Differentiators (HackerRank does NOT have these)

1. **Local-first purity** — Ollama default, local Whisper sidecar, egress tracking, offline badge.
2. **Phone-as-secondary-camera proctoring** in a self-hosted stack.
3. **HLD whiteboard canvas** (`HldWhiteboardCanvas.tsx`) and LLD Maven live workspaces.
4. **Candidate-centric progress ledger** (trajectory, radar delta, 7-day plan) — HackerRank serves employers, we serve the candidate.
5. **Honest-judge semantics** (`ENGINE_UNAVAILABLE` never masked as Wrong Answer) — a trust guarantee theirs doesn't expose.

## 7. Gap register → SPEC-016+ roadmap candidates

| # | Gap | Severity | Proposed lane |
|---|---|---|---|
| G-1 | Statistical LLM-answer detection (perplexity/style classifier over transcript+code) | High | SPEC-016 candidate: extend `proctor-sentinel-service` with an `AI_ANSWER_SUSPECT` telemetry type + scoring weight; local heuristic first (no cloud dep) |
| G-2 | Plagiarism corpus fingerprinting | High | SPEC-017 candidate: fingerprint new submissions vs. prior `session_questions` answers (local Mongo, shingle/hash) |
| G-3 | Thin catalogs: SQL 8 / Behavioral 2 / LLD 19 | High | **Already queued: SPEC-013** (Gaurav blog seed, `feat/seed-gaurav-blog-questions` unmerged) directly deepens tracks |
| G-4 | Mid-session adaptive escalation | Medium | SPEC-018 candidate: Coach Sam difficulty ladder — promote on fast pass, decompose on stall; needs asked-ledger integration |
| G-5 | Per-dimension evidence citations on scorecard | Medium | Low-cost: anchor `DimensionScoreDto` entries to transcript turn IDs; extend PDF generator |
| G-6 | AI question-variant generation | Medium | Lower priority (single-user local tool ⇒ leakage risk is minimal for our market) |
| G-7 | MCQ / knowledge lane | Low | Only if roadmap targets screening-style assessments |

**Readiness is gated on the active queue, not new specs:** SPEC-015 (voice/PTT hardening — Layer 3 robustness) and SPEC-013 (catalog depth — Layer 1) are the two open items.

## 8. Method note

All evidence read directly from the working tree at `origin/master` `3cdb274` during the 2026-10-14 session (catalog counts enumerated from `content/questions/*` directories; enums and scoring properties read from source; service integration read from `EvaluationReportService`). Percentages are auditor judgment on coverage × depth, not measurements. Session note: a third sandbox rollback was detected mid-task (stale clone quarantined as `repo-ai-interview-os.stale3-013e501` at `013e501`); this matrix was re-pinned by fresh evidence gathered *before* the rollback, and the document was committed from the staged copy after a fresh authenticated re-clone (operator PAT restored post-rollback).
