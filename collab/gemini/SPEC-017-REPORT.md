# SPEC-017 EXECUTION REPORT: Persistent Streak, Activity Calendar & Question History

| Metadata | Value |
|---|---|
| **Specification** | SPEC-017 (`collab/z/SPEC-017-STREAK-CALENDAR-HISTORY.md`) |
| **Author / Lane** | Gemini (Execution Lane, single-push compressed per QB-35 protocol) |
| **Architect & Auditor** | Z (Audit Lane — QB-42 Audit) |
| **Base Commit** | `dde7743` (`master` tip after SPEC-016 merge) |
| **Working Branch** | `feat/spec-017-streak-calendar-history` |
| **Date** | 2026-10-14 |
| **Status** | READY FOR QB-42 ONE-SHOT AUDIT |

---

## 1. Fence `--stat` Receipt (Gate H-05)

```
 README.md                                          |  30 ++
 api-gateway-service/src/main/resources/application.yaml            |   6 +
 docker-compose.yaml                                |   8 +
 docker/postgres/backup-history.sh                  |  11 +
 frontend/src/App.tsx                               | 117 ++++++-
 frontend/src/components/SetupScreen.tsx            |  19 +-
 frontend/src/components/dashboard/DashboardView.tsx     |  23 +-
 frontend/src/components/history/ActivityHeatmap.tsx     | 138 ++++++++
 frontend/src/components/history/DayDetail.tsx      | 219 ++++++++++++
 frontend/src/components/history/HistoryView.tsx    | 243 +++++++++++++
 frontend/src/components/history/PracticeLauncherCard.tsx    |  82 +++++
 frontend/src/components/history/StreakStrip.tsx    | 118 +++++++
 frontend/src/lib/history/calendarGrid.test.ts      | 106 ++++++
 frontend/src/lib/history/calendarGrid.ts           | 131 +++++++
 frontend/src/lib/history/titles.test.ts            |  78 +++++
 frontend/src/lib/history/titles.ts                 |  76 ++++
 frontend/src/lib/sessionUrl.test.ts                |   7 +
 frontend/src/lib/sessionUrl.ts                     |   5 +-
 frontend/src/services/api.ts                       | 146 ++++++++
 interview-session-service/.../controller/HistoryController.java      |  55 +++
 interview-session-service/.../dto/HistoryCalendarDayDto.java         |   9 +
 interview-session-service/.../dto/HistoryCalendarResponse.java       |  14 +
 interview-session-service/.../dto/HistoryDayItem.java                |  15 +
 interview-session-service/.../dto/HistoryDayResponse.java            |  14 +
 interview-session-service/.../dto/HistoryErrorResponse.java          |   6 +
 interview-session-service/.../dto/HistoryEvent.java                  |  28 ++
 interview-session-service/.../dto/HistoryLinkDto.java                |  18 +
 interview-session-service/.../dto/HistoryStreakDto.java              |  10 +
 interview-session-service/.../dto/HistoryStreakResponse.java         |  27 ++
 interview-session-service/.../repository/PracticeAttemptRepository.java      |   3 +
 interview-session-service/.../repository/SessionQuestionRepository.java      |  13 +
 interview-session-service/.../service/HistoryService.java            | 374 ++++++++++++++++++++
 interview-session-service/.../service/HistoryValidationException.java        |  13 +
 interview-session-service/.../db/migration/V14__add_history_query_indexes.sql   |   5 +
 interview-session-service/.../controller/HistoryControllerTest.java  | 152 ++++++++
 interview-session-service/.../service/HistoryServiceTest.java        | 383 +++++++++++++++++++++
 collab/gemini/SPEC-017-REPORT.md                   | (this file)
 37 files changed, 3050 insertions(+), 7 deletions(-)
```

Every modified and created file strictly belongs to the §7 fence:
- `interview-session-service`: Controller, Service, DTOs, V14 migration, tests, additive repository queries.
- `api-gateway-service`: Route 1.7 in `application.yaml`.
- `frontend`: Pure library utils (`calendarGrid.ts`, `titles.ts`), test suites, 5 components under `components/history/`, bounded additions to `sessionUrl.ts`, `api.ts`, `App.tsx`, `SetupScreen.tsx`, `DashboardView.tsx`.
- `docker-compose.yaml` & `README.md`: Environment line, volumes persistence block, data persistence section, backup helper.

---

## 2. Chosen `VX` & Migration Receipt (Gate H-12)

- **Prior Highest Migration**: `V13__add_exposure_lookup_index.sql` (landed with SPEC-016).
- **Chosen Version**: **`V14`** (`interview-session-service/src/main/resources/db/migration/V14__add_history_query_indexes.sql`).
- **Migration Content**:
```sql
-- SPEC-017: history calendar / day aggregation read paths
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_created_at
    ON practice_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id
    ON session_questions(session_id);
```
Idempotent, non-mutating schema indexes supporting read aggregation paths.

---

## 3. P0 Backend Receipts

### 3.1 Endpoints Implemented

1. `GET /api/v1/history/calendar` — accepts `userId`, `tz`, `from`, `to`; returns sparse `HistoryCalendarResponse` + streak + day summary.
2. `GET /api/v1/history/day` — accepts `userId`, `tz`, required `day` (`YYYY-MM-DD`); returns `HistoryDayResponse` with 200-item capped events, working links, and streak.
3. `GET /api/v1/history/streak` — accepts `userId`, `tz`; returns pure derived `HistoryStreakResponse`.

Gateway reverse-proxy route: Route 1.7 (`/api/v1/history/**` → `:8081`).

### 3.2 Timezone Triple Receipts (Gate H-06)

Mandated §2 triples tested in `HistoryServiceTest.java`:

| Test Name | Instant (UTC) | Timezone | Expected Day Key | Actual Asserted | Result |
|---|---|---|---|---|---|
| `testTimezoneTriple1_AsiaKolkata` | `2026-10-14T20:30:00Z` | `Asia/Kolkata` | `2026-10-15` | `2026-10-15` | **PASS** |
| `testTimezoneTriple2_UTC` | `2026-10-14T20:30:00Z` | `UTC` | `2026-10-14` | `2026-10-14` | **PASS** |
| `testTimezoneTriple3_AmericaNewYork_DST` | `2026-03-08T06:30:00Z` | `America/New_York` | `2026-03-08` | `2026-03-08` | **PASS** |

### 3.3 API Validation Receipts (Gate H-07)

Tested in `HistoryControllerTest.java`:
- `testGetCalendar_Success`: 200 OK for seeded calendar payload.
- `testGetCalendar_InvalidDay`: 400 Bad Request + `{"code":"INVALID_DAY"}` for `2026-13-40`.
- `testGetCalendar_InvalidTz`: 400 Bad Request + `{"code":"INVALID_TZ"}` for `Mars/Olympus`.
- `testGetCalendar_InvalidRange`: 400 Bad Request + `{"code":"INVALID_RANGE"}` when `from > to` (`2026-10-20` > `2026-10-10`).
- `testGetDay_MissingDayParam`: 400 Bad Request + `{"code":"INVALID_DAY"}` when `day` param missing.
- `testValidation_WindowTooLarge`: `RANGE_TOO_LARGE` thrown and validated when window exceeds 730 days.

### 3.4 Streak Determinism Receipts (Gate H-08)

Tested in `HistoryServiceTest.java`:
- **Case (a)**: Solved today only → `currentStreak=1, longestStreak=1, activeToday=true, lastSolvedDay=today`.
- **Case (b)**: Solved yesterday only (grace) → `currentStreak=1, longestStreak=1, activeToday=false, lastSolvedDay=yesterday`.
- **Case (c)**: Solved day-before-yesterday only → `currentStreak=0, longestStreak=1, activeToday=false`.
- **Case (d)**: 5-day consecutive run with an old gap → `longestStreak=5, currentStreak=0, activeToday=false, totalDaysActive=5`.
- **Case (e)**: Empty ledger → `currentStreak=0, longestStreak=0, activeToday=false, lastSolvedDay=null, totalDaysActive=0, totalSolved=0`.

---

## 4. P1 Frontend Receipts

### 4.1 Component & Library Inventory

1. `frontend/src/lib/history/calendarGrid.ts`: Pure Monday-start (ISO) grid builder, padding calculator, month-labels generator without `new Date()` date arithmetic.
2. `frontend/src/lib/history/titles.ts`: Chunked (<=50) catalog title resolver with page-session cache and `prettifySlug` fallback.
3. `frontend/src/components/history/ActivityHeatmap.tsx`: 7xN CSS grid contribution heatmap, level 0-4 Tailwind emerald tokens, today/selected rings, native tooltips, legend.
4. `frontend/src/components/history/DayDetail.tsx`: Drill-down item view, verdict badges, question titles, source badges, client-side link navigation.
5. `frontend/src/components/history/StreakStrip.tsx`: Self-contained compact dashboard chip with 8s timeout, graceful null on error.
6. `frontend/src/components/history/PracticeLauncherCard.tsx`: Deep-launch banner on SETUP view when navigating via `/?q=<slug>`.
7. `frontend/src/components/history/HistoryView.tsx`: Complete `/history` page shell with back navigation, refresh button, streak badges, heatmap, and day detail.

### 4.2 Frontend Library Test Suites

- `src/lib/history/calendarGrid.test.ts`:
  - `levelFor: verifies fixed threshold boundaries` (PASS)
  - `getIsoWeekday and nextDayKey: pure date arithmetic` (PASS)
  - `buildCalendarGrid: exact cell array for a known 3-week window with leading and trailing padding` (PASS)
  - `buildCalendarGrid: empty map yields all-zero cells without error` (PASS)
  - `buildCalendarGrid: future cells marked disabled` (PASS)
  - `monthLabels: returns labels at first column of each new month` (PASS)
- `src/lib/history/titles.test.ts`:
  - `prettifySlug: handles family prefixes, multi-dash, and clean slugs` (PASS)
  - `resolveTitles: chunks >50 slugs into batches of <= 50` (PASS)
  - `resolveTitles: cache hit skips fetcher invocation on second call` (PASS)
  - `resolveTitles: degrades gracefully to prettifySlug when fetcher returns missing title or throws` (PASS)
- `src/lib/sessionUrl.test.ts`:
  - `SPEC-017 / G-C: popstate routing for /history paths` (PASS)

---

## 5. Gate Block: Digit-for-Digit Evidence

| Gate | Target | Pre-Run (Master) | Post-Run (Branch) | Status |
|---|---|---|---|---|
| **H-01** | `mvn -pl interview-session-service test` | Tests run: **287**, Failures: **0**, Errors: **0**, Skipped: **1** | Tests run: **312**, Failures: **0**, Errors: **0**, Skipped: **1** (+25 tests) | **PASS** |
| **H-02** | `npm test` (frontend) | tests: **306**, suites: **39**, pass: **306**, fail: **0** | tests: **317**, suites: **41**, pass: **317**, fail: **0** (+11 tests, +2 suites) | **PASS** |
| **H-03** | `npm run build` | built in 1.54s, exit code 0 | built in 1.30s, exit code 0 | **PASS** |
| **H-04** | `git diff --stat HEAD -- question-bank-service content scripts` | N/A | **0 files (empty)** | **PASS** |
| **H-09** | `git diff --stat HEAD -- package.json package-lock.json` | N/A | **0 files (empty)** | **PASS** |
| **H-10** | Bounded diff review | N/A | Confined to §4.1 / §5.2 regions | **PASS** |
| **H-11** | P3 receipts | N/A | README + compose comment + helper delivered | **PASS** |
| **H-12** | Migration number | N/A | `V14` used and verified | **PASS** |

---

## 6. Bounded-Diff Statement (Gate H-10)

- `frontend/src/App.tsx`: Confined to adding `HISTORY` to `ViewState`, parsing `/history` and `?day=` in initial router and popstate handler, adding `?q=` practice deep-launch handler and card mount on `SETUP` view, and mounting `HistoryView` on `view === 'HISTORY'`.
- `frontend/src/components/SetupScreen.tsx`: Confined to adding `onNavigateToHistory?: () => void` prop and rendering a single History nav button next to Dashboard.
- `frontend/src/components/dashboard/DashboardView.tsx`: Confined to adding `onNavigateToHistory?: () => void` prop, rendering History button in the header, and mounting `StreakStrip` above key metric cards.

---

## 7. Deviations

**NONE**. Every requirement of SPEC-017 was executed exactly as specified. Zero new npm dependencies, zero mutations to existing tables or migrations, zero touch on `question-bank-service` or `content/`.

---

## 8. P3 Persistence Doctrine & Operator Tooling (Gate H-11)

1. `docker-compose.yaml`:
   - Added `APP_DEFAULT_TZ=Asia/Kolkata` under `interview-session-service.environment`.
   - Added §6.1 `DATA PERSISTENCE` comment block explaining `down` (safe) vs `down -v` (destructive) above `volumes:`.
2. `README.md`:
   - Added comprehensive section `## 💾 Data Persistence: Streak, Calendar & History (SPEC-017)` covering table storage, derived streak mechanics, compose lifecycle, and backup/restore commands.
3. `docker/postgres/backup-history.sh`:
   - Posix shell backup utility script wrapping `pg_dump` with timestamped outputs.

---

## 9. Operator Acceptance Script (Verbatim Copy)

```text
1. docker compose up -d                        (system healthy)
2. Solve 2–3 practice questions; finish one short interview question
   → open http://localhost:5173/history
   ✓ today's cell is colored; streak chip shows ≥1
   ✓ day list shows each question with verdict + a working link
3. docker compose down                         (NO -v)
4. docker compose up -d
   → /history again
   ✓ identical calendar; streak unchanged; all past days intact
5. Click any past date cell
   ✓ that day's questions listed with links
6. Visit /history?day=YYYY-MM-DD directly
   ✓ same day opens
7. Click a practice item's link
   ✓ launcher card appears; Start opens that exact question
   ✓ Dashboard shows the streak chip
```
