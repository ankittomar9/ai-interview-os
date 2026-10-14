# QB-40 PRE-AUDIT — SPEC-016 (transcript-level, branch verification pending)

> **Author:** Z · **Date:** 2026-10-15 · **Input:** operator-relayed Gemini execution transcript + status report (single push to `origin/feat/spec-016-rotation-catalog-depth`)
> **Basis:** SPEC-016 @ `ddbe91a` (full text re-read) · **Branch access:** NOT YET AVAILABLE (sandbox has no credentials — `git ls-remote` fails)
> **Doctrine:** transcript-consistency is necessary, not sufficient. MERGE AUTH requires the A1–A9 branch checks below (QB-37 precedent: digit-for-digit dynamic re-verification). No rubber-stamping.

---

## 1. Transcript-vs-SPEC verdict table

| # | SPEC-016 requirement | Gemini claim (transcript) | Verdict |
|---|---|---|---|
| 1 | §2.2 nonce: injectable `LongSupplier`, default `nanoTime ^ UUID hash` | `sessionNonceSupplier` injected into `createSession`, default `nanoTime ^ UUID` | ✅ consistent |
| 2 | §2.1 exposure query via `session_questions JOIN interview_sessions`, non-playground | `QuestionExposureService` querying exactly that join; `timesServed`/`lastServedAt` | ✅ consistent |
| 3 | §2.1 V13 `idx_sessions_candidate_track ON interview_sessions(candidate_id, track)` | `V13__add_exposure_lookup_index.sql` with identical index name | ✅ consistent |
| 4 | §2.3 ladder STRICT / D1 adjacent-rung / D2 LRU / D3 fallback; never throw | Full ladder implemented; D2 marks `DEGRADED_LRU` + `reusedSlugs`; "session creation never fails" | ✅ consistent |
| 5 | §2.3 `rotationPolicy` persisted in plan JSON; `[ROTATION_DEGRADED]` log | Claimed in `SessionPlan` + telemetry; **sample log receipt not shown in transcript** → A6 | ⚠️ pending branch |
| 6 | §3 guard floors — spec LITERALLY pins RED floors `dsa 341 / hld 27 / lld 19 / sql 8 / behavioral 2` + `assertTotalAtLeast(397)` | "monotonic track floors (dsa: 341, hld: 27, lld: 19, sql: 8, behavioral: 2)" | ✅ exact spec match (floors are old counts **by design** — hard floors deferred to a future spec) |
| 7 | §3 starvation alarms (soft) | "embedded starvation alarms, 0 unpopulated rungs" | ✅ consistent (soft-assert form → A1 diff) |
| 8 | §4.1 targets lld ≥40 / hld ≥50 / behavioral ≥24 / sql ≥20 / total ≥473 | delivered 40 / 50 / 24 / 20 / **475** (+78) | ✅ targets met |
| 9 | §4.1 difficulty mix: no new batch >60% one difficulty; EASY gained where EASY=0 | behavioral 7/10/7, sql 7/6/7, hld 8/17/25, lld 7/17/16; all families gained EASY (was 0 for behavioral/hld) | ✅ consistent (dsa 61% MEDIUM is pre-existing, Δ0 — out of scope) |
| 10 | §4.2 LLD contract (maven-workspace, starterFiles+pom, editablePaths, hidden tests) | gen_lld.py iterated against existing-file `kind`/`starterCode` structure; guard green | ✅ consistent (structural byte-check → A4) |
| 11 | §4.4 copyright: `source: ai-generated:v1`, zero brand/source names | "100% original, AI-generated" asserted; **grep proof not shown** → A4 | ⚠️ pending branch |
| 12 | §4.5 stray `content/` disposition | `git rm -r content` after `git ls-files content/`; claims SOURCES.md (SPEC-011 notes) removed | ✅ consistent (exact tracked-file list → A7) |
| 13 | §6 VP-09: session ≥278/0F (report exact), qb 41+growth/0F, frontend 306/0F/39 + 1,161 asserts + build 0 | session **287/0F/1skip** (+9), qb **41/0F**, frontend **306/0F/39, 1,161 asserts, build exit 0** | ✅ digits match baselines; qb growth=0 acceptable (in-test assertions, not new classes) → A8 confirms no qb tests removed |
| 14 | §6 VP-10 fence: diff ⊆ §5 | not yet checkable | ⚠️ pending → A1/A2/A3 |
| 15 | §7 single push, sliced commits, G4 real outputs | 8 commits, one `git push -u`, real numbers in report | ✅ consistent |
| 16 | Fence: frontend FORBIDDEN | "frontend 100% untouched" | ⚠️ pending A1 |

## 2. Branch-verification checklist (A1–A9) — the actual QB-40 audit, runs the moment fetch access exists

- **A1 fence receipt:** `git fetch origin feat/spec-016-rotation-catalog-depth` → `git diff --stat ddbe91a..FETCH_HEAD` — every path must ∈ §5 fence; zero frontend; SPEC.md untouched; `_taxonomy.yaml` diff (allowed only if needed — check whether used).
- **A2 `QuestionMarkdownParserTest.java` diff:** NOT named in §5 fence. Determine why touched: if it carried a second hard count-pin (spec §3 missed it), the change is legitimate but must be documented as a deviation in REPORT §6; gratuitous change → reject.
- **A3 additive-only proof:** `SessionQuestionRepository` (spec: +1 query method) and `SessionPlan` (+rotationPolicy field) diffs must not drop existing methods/fields. Transcript said "Created" — verify it was modify-not-recreate.
- **A4 copyright sweep:** grep all 78 new .md files for brand/source identifiers (`bytebytego|systemdesign\.one|bosscoder|takeuforward|neetcode|leetcode|geeksforgeeks|interviewing\.io|hallden|coder\s*academy` case-insensitive) → must be zero hits; sample 6 files (per family) for frontmatter `source: ai-generated:v1` (+ optional `inspiration:`), `status: PUBLISHED`, taxonomy membership; ContentValidator diff must be empty.
- **A5 dynamic gates digit-for-digit (QB-37 precedent):** `mvn test` interview-session-service → expect **287/0F/1skip**; `mvn test` question-bank-service → **41/0F**; frontend `npm test` → **306 pass/39 suites/0F/1,161 assertions**; `npm run build` → exit 0. Any digit mismatch → report reconciliation before MERGE AUTH.
- **A6 VP receipts in `collab/gemini/SPEC-016-REPORT.md`:** VP-01..06 named test receipts; `[ROTATION_DEGRADED]` sample line (present in D2 test, absent in green path); per-family sample slug lists; §6 deviations section (empty = "NONE"); VP-11 disposition receipt.
- **A7 hygiene verification:** exact list of files removed from root `content/`; confirm nothing unique was lost without migration (SPEC-011 SOURCES.md notes were stray — confirm content overlapped nothing in the live catalog).
- **A8 qb suite integrity:** 41 tests = same 41 test methods as baseline (none deleted to make room); starvation alarms are additive assertions.
- **A9 rotationPolicy persistence:** inspect `plan_json` write path — `rotationPolicy` + `reusedSlugs` actually serialized (VP-04/§2.3), not just set in-memory.

## 3. Interim ruling

- **Transcript-level: PASS with 2 warning items (A2 fence question, A4 unproven copyright sweep) and 7 pending verifications.**
- **MERGE AUTH: WITHHELD until A1–A9 complete.** This is protocol, not distrust — QB-37 authorized only after dynamic digit-for-digit reproduction.
- Post-audit sequence (unchanged from SPEC-016 §8): Z MERGE-AUTH doc → Gemini merges to master (+ SPEC-016 status flip per report) → Z close-out in the same round as the SPEC-017 audit.

## 4. Queued lane status (unchanged)

- SPEC-017 (streak/calendar/history) committed locally @ `4436183`, push blocked on the same missing credential.
- One token paste unblocks: branch fetch → A1–A9 → MERGE-AUTH publish **and** SPEC-017 push, in one session.
