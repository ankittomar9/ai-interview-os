# QB-42 MERGE AUTHORIZATION — SPEC-017 Streak, Calendar & Question History

| Field | Value |
|---|---|
| **Audit round** | QB-42 (one-shot, branch-level) — covers combined close-out: SPEC-016 post-merge verification + SPEC-017 full audit |
| **Auditor lane** | Z @ `dde7743` (master tip) |
| **Subject** | `feat/spec-017-streak-calendar-history` @ `53898af` (single commit on `dde7743`) |
| **Method** | Fresh clone (sandbox recycled); branch checked out; every gate re-executed by Z; static claims re-derived from source |
| **Verdict** | **✅ MERGE AUTHORIZED** — H-01..H-12 all PASS, 0 blocking findings, 1 non-blocking observation (O-1) |

---

## 0. SPEC-016 Close-Out Verification (master, post-merge)

| Item | Verdict | Evidence |
|---|---|---|
| Merge topology | **PASS** | `07b9c2c` = true merge commit, parents `1feabfd` (QB-40 verdict) + `ff249b7` (N-1/N-2 fixes) — `--no-ff` as authorized, no rebase, branch preserved |
| N-1 eponym reword | **PASS** | `hld-distributed-unique-id-generator.md` L44 → "Snowflake-style Distributed ID Architecture"; `hld-ride-hailing-driver-dispatch.md` L44/47 → "Geohash/H3 Spatial Indexing" / "H3 hexagonal cells". "Twitter"/"Uber" zero hits on master |
| N-2 deviations doc | **PASS** | `SPEC-016-REPORT.md` updated on the fix commit, merged |
| SPEC.md status flip | **PASS** | SPEC-016 = `COMPLETED & MERGED` with honest gate summary + links to pre-audit, merge audit, and execution report |
| Branch deletion | **NONE** | `feat/spec-016-rotation-catalog-depth` still on remote per operator standing order ✓ |

## 1. H-01..H-12 Verdict Table (Z re-executed everything)

| # | Gate | Verdict | Evidence (independently re-derived) |
|---|---|---|---|
| H-01 | session suite | **PASS — digit-exact** | Z run on branch: `Tests run: 312, Failures: 0, Errors: 0, Skipped: 1` + BUILD SUCCESS. 287→312 = +25 (HistoryServiceTest + HistoryControllerTest). |
| H-02 | frontend suite | **PASS — digit-exact** | Z run after clean `npm ci`: `tests 317 / suites 41 / pass 317 / fail 0`. 306→317 = +11, 39→41 = +2 suites. |
| H-03 | frontend build | **PASS** | `npm run build` exit 0 (Z re-run). |
| H-04 | forbidden dirs | **PASS** | `git diff --name-status dde7743..53898af`: `question-bank-service`, root `content/`, `scripts/` = **0 files**. |
| H-05 | fence 38/38 | **PASS** | Exactly 38 files, all within §7 fence: session-service 17 (HistoryService/Controller/ValidationException, 9 DTOs + HistoryEvent, 2 repo additions, V14, 2 test classes), frontend 15 (4 history components + HistoryView + PracticeLauncherCard, calendarGrid/titles libs + tests, sessionUrl, api.ts, App/SetupScreen/DashboardView wiring), gateway yaml (Route 1.7 only), compose (APP_DEFAULT_TZ + doctrine comment), README, backup script, 2 lane docs. |
| H-06 | tz doctrine | **PASS** | Prod code uses the mandated pattern verbatim: `ZonedDateTime.ofInstant(instant, zone).toLocalDate()` (`bucketDayKey`); day windows via `date.plusDays(1).atStartOfDay(zone).toInstant()` (DST-safe half-open). Tests implement the exact IST/UTC/DST triple: 2026-10-14T20:30Z→2026-10-15 @ Asia/Kolkata, →2026-10-14 @ UTC, 2026-03-08 DST day @ America/New_York. `java.time` only; zero `SimpleDateFormat`/`Calendar`/epoch-day math. |
| H-07 | API validation | **PASS** | `INVALID_DAY` (regex + `LocalDate.parse`), `INVALID_TZ` (`ZoneId.of`), `INVALID_RANGE` (from>to), plus bonus `RANGE_TOO_LARGE` (>730d window). Controller maps `HistoryValidationException` → 400 + `{message, code}`; both layers tested (service real-logic + WebMvc handler). |
| H-08 | streak determinism | **PASS** | Cases (a)–(e) all present and passing: today-only / yesterday-grace / day-before-reset / 5-day-run-with-gap / empty-ledger. Algorithm: pure day→distinct-solved map, anchor = today-or-yesterday grace, backward current-run + forward longest-run, future events excluded (`!d.isAfter(today)`). Plus same-question-dedup and ordering-tiebreak tests. |
| H-09 | zero dep changes | **PASS** | `frontend/package.json` + lockfile diff = 0 lines; no pom.xml touched. Heatmap is pure CSS-grid/flex (no chart lib). |
| H-10 | bounded diff | **PASS** | All 38 files in §4.1/§5.2 regions; `App.tsx`/`SetupScreen.tsx`/`DashboardView.tsx` edits are additive mounts (verified: `HistoryView` L544, `PracticeLauncherCard` L519, `StreakStrip` L231 in DashboardView). |
| H-11 | persistence doctrine | **PASS** | Compose `# DATA PERSISTENCE` block (down = safe / `down -v` = destructive) above `volumes:`; README §"Data Persistence" incl. L296 destructive warning + backup usage L308; `docker/postgres/backup-history.sh` = posix `set -eu` pg_dump wrapper with timestamped output. |
| H-12 | migration numbering | **PASS** | `V14__add_history_query_indexes.sql` — next-free after V13 (SPEC-016) ✓; content = two additive `CREATE INDEX IF NOT EXISTS` (practice_attempts(user_id, created_at); session_questions(session_id)). |

## 2. Rider Compliance R-1..R-6

| Rider | Verdict | Evidence |
|---|---|---|
| R-1 (no in-interview surfaces) | **PASS** | Zero ArenaRoom/Room files in the 38-file diff; `/history` standalone route. |
| R-2 (SPEC-016 first) | **PASS** | Branch base `dde7743` already contains the SPEC-016 merge commit; Flyway V13→V14 sequencing intact. |
| R-3 (append-only truth) | **PASS** | Both repository additions are read-only finders; no UPDATE/DELETE introduced; failed attempts included in history. |
| R-4 (derived-only streak) | **PASS** | No streak/cache table, no scheduled job, no new write path; all 3 endpoints `@Transactional(readOnly = true)`; streak = query-time pure function — restart-proof by construction. |
| R-5 (no title coupling) | **PASS** | `HistoryService` has zero question-bank-client references; titles resolved client-side via existing slugs endpoint. |
| R-6 (time doctrine) | **PASS** | Backend verified (H-06); frontend date math confined to `calendarGrid.ts` (UTC-noon anchor pattern per spec, unit-tested). |

## 3. Topology & Merge Instruction

- Single commit `53898af` directly on `dde7743` → merge is trivial (ff possible); **authorize fast-forward or merge commit at Gemini's discretion** — both clean since master has not moved.
- **Authorized merge procedure**: merge `feat/spec-017-streak-calendar-history` → `master`; flip SPEC-017 status in SPEC.md to `COMPLETED & MERGED` + honest summary links; single push. Do NOT delete the branch (operator standing order).
- Post-merge operator acceptance: run the §9 acceptance script verbatim (7-step compose cycle incl. the `down`/`up` persistence check).

## 4. Non-Blocking Observation

- **O-1 (fetch scope)**: `HistoryService.fetchAllEvents` pulls the candidate's full attempt history from `Instant.EPOCH` on every calendar/day/streak call and buckets in memory. Correct and harmless at personal scale (hundreds of rows), and `RANGE_TOO_LARGE` bounds response size — but if the ledger ever grows orders of magnitude, push the window bounds into the SQL (`fromIncl` param is already available on the practice finder; the session-question query accepts `fromIncl` and is currently called with `Instant.EPOCH`). Register as future tuning, no action required now.

## 5. Lane Continuity

- SPEC-016 → **CLOSED** (merged @ `07b9c2c`, verified §0).
- SPEC-017 → **CLOSED PENDING MERGE** (this doc is the merge authorization).
- No further specs pending on Z lane. Next Z action = post-merge tip verification (one ls-remote + gate receipt check) whenever operator relays Gemini's merge push.
