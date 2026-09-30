# Hotfix Review 1: Playground Launch 500 — Difficulty Taxonomy Mismatch

| Metadata | Value |
|---|---|
| **Task ID** | `V2P-HOTFIX1` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Reviewed Artifact** | Gemini root-cause analysis (chat, 2026-10-01) + Grafana Loki screenshots |
| **Verdict / Status** | **ROOT CAUSE CONFIRMED — proceed with AMENDED fix package** (§3): frontend mapping ACCEPTED (as shared helper, both call sites); backend `@JsonCreator` dual-taxonomy REJECTED; add 400-status resiliency instead |
| **Date** | 2026-10-01 |

---

## 1. Root-Cause Verification (independent)

Gemini's analysis is **confirmed in full** on the evidence chain:

| Claim | Independent check | Result |
|---|---|---|
| Jackson: `"MEDIUM"`/`"EASY"` not in `[SENIOR, JUNIOR, STAFF, MID]` | Loki screenshots (2) + `DifficultyLevel.java` (JUNIOR/MID/SENIOR/STAFF) | **CONFIRMED** |
| Frontend sends question difficulty as session difficulty | `App.tsx:144` and `App.tsx:313` — both `q.difficulty?.toUpperCase() as DifficultyLevel` | **CONFIRMED** |
| 100% of catalog affected | 364/364 content files use `difficulty: EASY/MEDIUM/HARD` | **CONFIRMED** |
| Interview mode unaffected | Setup screen collects user seniority — payload is always a valid enum | **CONFIRMED** |
| 404 on `/learn/notes/...` is benign | `GET .../learn/notes/lld-tic-tac-toe -> 404` = notes-lookup miss, handled as null | **CONFIRMED** |

**Amendments to the analysis (needed for a complete fix):**

- **A1 — Two call sites, one shared shape.** The quoted snippet is `handleSolveFromLearn` (`App.tsx:144`, alert *"Error launching playground practice"*); the second is `handleLaunchPlaylist` (`App.tsx:313`, alert *"Error launching practice playlist"*). Gemini's prose names both but the fix must explicitly patch both — a per-site inline ternary fix will drift.
- **A2 — The backend 500 is its own defect.** Spring maps `HttpMessageNotReadableException` to 400 by default; `GlobalExceptionHandler.handleGeneric(Exception.class)` (line 90–95) overrides it to 500 with *"An unexpected error occurred"*. A malformed client payload is a client error and must log/route as 4xx — otherwise dashboards and alerts misclassify contract misuse as server outages.
- **A3 — Regression attribution.** Introduced by `8a0c1fa` (V2-PLATFORM P1.3–P1.5, practice center/launch loop). **V-2.0.7 is not implicated** and its closure is unaffected. No frontend test covers the playground launch payload — that coverage gap is part of the fix (§3).

## 2. Why the receiver should stay strict (design position)

`DifficultyLevel` is **candidate seniority** — it seeds `SessionPlanService` question pools (`DSA_MAP`/`SQL_MAP`) and lands as `seniorityLevel` on the session document feeding AI persona/evaluation. Question difficulty (`EASY/MEDIUM/HARD`) is a different domain concept. Two consequences:

1. The repo already treats the taxonomies as interop-able **at the match layer**: `QuestionMatchService.matchesDifficulty` implements exactly `JUNIOR↔EASY`, `MID↔MEDIUM`, `SENIOR/STAFF↔HARD`. The proposed mapping therefore has in-repo precedent — use it verbatim (HARD→SENIOR; STAFF deliberately not produced).
2. But the session contract should keep **one vocabulary**. Accepting both schemas inside the shared enum makes the API permanently ambiguous, hides future sender bugs, and silently defaults to MID — a fail-open pattern this repo forbids on contract paths. The loud 500 was the receiver correctly refusing an invalid payload; the actual bugs are the sender's wrong value and the receiver's wrong status class.

## 3. Amended Fix Package (what Gemini should implement)

**F1 (frontend, both call sites):** new shared helper, e.g. `frontend/src/utils/difficulty.ts`:
`mapQuestionDifficultyToSeniority(d): DifficultyLevel` — `EASY→JUNIOR`, `MEDIUM→MID`, `HARD→SENIOR`, fallback `MID` (matches `matchesDifficulty` groups; undefined/unknown → MID). Use at `App.tsx:144` and `App.tsx:313`; delete both `as DifficultyLevel` casts. Add a unit test asserting the full map + fallback.

**F2 (backend, status-class fix only):** in `GlobalExceptionHandler`, add `@ExceptionHandler(HttpMessageNotReadableException.class)` → `400 BAD_REQUEST` with a message naming the offending field/enum values. **Do not** add `@JsonCreator` dual-taxonomy tolerance to `DifficultyLevel`; keep the enum strict.

**F3 (contract tests, both directions):**
- Backend: POST `/api/v1/sessions` with `difficulty: "EASY"` → expect **400** (not 500) — documents the strict contract and the status-class fix.
- Frontend: assert `mapQuestionDifficultyToSeniority` covers all three catalog values (gate against future catalog taxonomy drift).

**Discipline:** `fix/playground-difficulty-taxonomy` branch off latest `origin/master`, per-item commits (F1, F2, F3), `--no-ff` merge, four-number receipts in the merge report. Suggested gate run for receipts: playground launch of one EASY question end-to-end (expect 201 + ROOM opens) + one forced bad payload (expect 400).

## 4. Risk Assessment

- Mapping only affects PLAYGROUND launches (interview mode unchanged); plan pools are overridden by the launched question in playground, so the mapped value effectively feeds `seniorityLevel`/persona context — low blast radius.
- F2 makes one currently-500ing malformed payload class return 400; no legitimate client sends these values post-F1, so no behavioral regression is expected.
- Post-fix, the "every question fails" operator-facing symptom should be fully resolved; request the two Loki screenshots as the closure receipt.

— Z.ai, auditor. Cross-refs: `8a0c1fa`, `App.tsx:144/313`, `DifficultyLevel.java`, `GlobalExceptionHandler.java:90`, `QuestionMatchService.matchesDifficulty`.
