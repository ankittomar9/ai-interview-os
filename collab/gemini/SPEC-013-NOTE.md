# SPEC-013 Pre-Flight NOTE: Gaurav Blog DSA Question Seed Re-Slice

> **Author:** Gemini (implementation lane) · **Date:** 2026-10-14  
> **Target Branch:** `feat/seed-gaurav-blog-questions` re-sliced onto `master` @ `0e2c597`  
> **Auditor Target:** Z (QB-36 fast-track audit per QB-35 ruling)

---

## 1. Executive Summary & Lane Context

Per Z's ruling in [`collab/z/SPEC-015-CLOSEOUT-QB35.md`](file:///D:/ai-interview-os/collab/z/SPEC-015-CLOSEOUT-QB35.md) (§ Part B), unmerged branch `feat/seed-gaurav-blog-questions` (base `56899ba`) carries:
1. A stale voice-fix commit (`173cf63`) that predates and clashes with master's merged voice/PTT guards (SPEC-009, SPEC-010, `80400fc`, SPEC-015).
2. A 25-question DSA catalog seed commit (`61a0912`) based on Gaurav Kumar's blog.

This NOTE formally outlines the re-slice plan onto current master (`0e2c597`) and is packaged with execution and report in a single push per Z's compressed two-lane protocol.

---

## 2. Voice-Fix Disposition (`173cf63`)

- **Ruling:** **DROPPED completely.**
- **Rationale:** Master tip already contains a comprehensive, audited, and test-pinned implementation of `isRequestingMic`:
  - `PushToTalk.test.ts` on master specifically asserts `!content.includes('disabled={isRequestingMic}')` and `aria-busy={isRequestingMic}`. Commit `173cf63` introduced `disabled={isRequestingMic}`, which would break this contract test.
  - Master already possesses the full `isRequestingMic` state machine across `useCoachVoice.ts`, `useAudioCapture.ts`, `ArenaShell.tsx`, and `AutoGrowingChatInput.tsx`, as well as `e.repeat` guards and keyboard parity (SPEC-015).
  - Applying `173cf63` would regress audited code. Dropping it leaves master's voice subsystem 100% intact and clean.

---

## 3. Catalog Count Baseline & Target Guard Pin

- **Master Baseline:** **372** total questions across all tracks (`DsaCatalogGuardTest.java` baseline assertion).
- **Seed Delta:** **+25** high-yield DSA questions from Gaurav's blog.
- **Target Catalog Count:** **397 PUBLISHED** questions.
- **Guard Update:** `DsaCatalogGuardTest.java` updated to assert `assertEquals(397, allResources.length)` and `assertEquals(397, publishedCount)`.

---

## 4. Strict Fence Census

### Permitted Modifications & Additions
1. `question-bank-service/src/main/resources/content/questions/dsa/*.md` (exactly 25 new question files)
2. `question-bank-service/src/test/java/com/interviewos/questionbank/ingestion/DsaCatalogGuardTest.java` (assertion bump 372 → 397)
3. `collab/gemini/SPEC-013-NOTE.md` (this planning document)
4. `collab/gemini/SPEC-013-REPORT.md` (execution report)

### Explicit Forbidden List
- Zero changes to `frontend/` (PTT/voice, Arena, and chat components remain frozen).
- Zero changes to `SPEC.md` during execution (status flip reserved for post-audit merge).
- Zero changes to other backend services (`interview-session-service`, `gateway`, etc.).
- Zero out-of-fence files.

---

## 5. Verification Gate Protocol

1. `mvn clean test -Dtest=DsaCatalogGuardTest` in `question-bank-service/` → 2/2 pass with exactly 397 questions validated.
2. `mvn test` in `question-bank-service/` → 41/41 pass (100% pass across all service tests).
3. `npm test` & `npm run build` in `frontend/` → 306 pass / 0 fail / 39 suites / 1,161 static assertions / build exit 0.
