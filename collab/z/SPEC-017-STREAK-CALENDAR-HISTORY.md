# SPEC-017 — Persistent Streak, Activity Calendar & Question History

> **Author:** Z (audit lane → spec author, per operator directive)
> **Date:** 2026-10-14
> **Executor:** Gemini (single-push compressed lane per QB-35 protocol)
> **Audit:** one-shot Z audit on report (QB-42)
> **Base:** master @ `ddbe91a` (includes SPEC-016 spec doc; code unmerged — see §9 coexistence rules)
> **Status:** APPROVED FOR EXECUTION — no Pre-Flight Q&A round; this spec is self-contained. Deviations are forbidden; impossibilities must be documented in the report, never silently skipped.

---

## 0. Problem Statement (operator verbatim → engineering truth)

> "…streak maintainer … since we are doing docker compose up and down it should be matched to the system's clock … some library … not util date … a calendar … if I solved five to eight questions … history should be preserved … right now I have to go to every question and … see the submission … the data should never be wiped out … I should be able to go to a certain date … today 10 questions, these are the 10 questions … if links are there it will be a better feature … I can navigate to that one."

**Engineering truth (verified on master `ddbe91a`, file:line receipts):**

1. **No streak feature exists.** `grep -ri streak` over the tree returns only question-bank *content* (e.g. `sql-consecutive-login-streaks.md`) and design mockups in `docs/`. There is zero streak computation, storage, or UI on master. This spec introduces it.
2. **The solved-event ledger already persists.** Every practice arena run writes an immutable row to `practice_attempts` (migration `V8__add_practice_attempts_and_progress.sql`; writer: `CodeExecutionService.recordPracticeAttempt` → `PracticeTrackingService.recordAttempt`, entity `PracticeAttempt.java`: `question_id`, `track`, `verdict`, `tests_passed/total`, `runtime_ms`, `memory_kb`, `attempt_seq`, `created_at TIMESTAMPTZ` via `Instant.now()`). Every planned interview writes `session_questions` (`V9__add_session_questions.sql`; `SessionQuestion.java`: `session_id`, `question_slug`, `verdict PASSED|FAILED|UNATTEMPTED`, `attempted_at`). Both live in `interview_session_db` on the **`postgres_data` named volume** (`docker-compose.yaml` L16-18, L383-386) — `docker compose down && docker compose up` (without `-v`) already preserves them.
3. **Nothing aggregates it.** `DashboardService.getDashboardStats` merges both sources into a flat "Recent Activity Ledger", but there is **no date navigation, no calendar, no per-day drill-down, no streak**. Answering "what did I solve last Tuesday" today requires opening questions one by one and reading their attempt lists (`GET /api/v1/practice/attempts/{slug}` per question). This spec is the missing aggregate view.
4. **The timezone trap is real.** Containers stamp **UTC instants** (correct and immutable). But day bucketing done naively — `new Date(x).toDateString()` in JS or `LocalDate.now()` in Java — buckets by *container/server zone*, not by the operator's wall clock (Asia/Kolkata, UTC+5:30). A run at `2026-10-14T20:30:00Z` is already **Oct 15, 02:00 IST**. Wrong bucketing would silently corrupt streaks and calendar cells. §2 pins the doctrine; §3.8 mandates test triples that fail loudly on regression.
5. **Operator's "not util date" ask maps to:** use `java.time` (`Instant`, `ZoneId`, `ZonedDateTime`, `LocalDate`) on the server and `Intl` on the client — never `java.util.Date`/`Calendar`/`SimpleDateFormat`, never zoneless day math. (The stack is Java 17 + TypeScript; `java.time` is the modern library the operator is asking for — it is already a JDK builtin, no new dependency.)

---

## 1. Goals / Non-Goals

**Goals**
- **G-A (Calendar):** A GitHub-contribution-style activity calendar (default: last 365 days, `from`/`to` overridable, cap 730) on a `/history` route. Each day cell shows solved-count intensity; **clicking a day opens that day's question list** with verdict, time, track, source badge, and a working link per item. Applies to **all tracks**, practice **and** interview sources.
- **G-B (Streak):** Current streak (with today-or-yesterday grace) + longest streak + totals, **derived as a pure function of the persisted ledger** — zero new mutable state, therefore **survives `docker compose down/up` by construction**. Surfaced on the history page header and as a Dashboard chip.
- **G-C (History page):** `/history` and `/history?day=YYYY-MM-DD` are URL-addressable (bookmarkable/shareable). Day detail lists every event that day (attempts *and* interview questions), capped at 200 with a `truncated` flag.
- **G-D (Clock truth):** Day bucketing uses the **operator's real timezone** (browser-reported IANA zone sent per request, server-validated). No container-UTC day math. Doctrine in §2 is a hard gate.
- **G-E (Persistence doctrine):** README + compose comments document `down` (safe) vs `down -v` (destructive), plus one-line backup/restore for `interview_session_db`. Operator tooling script (§6).
- **G-F (Blast radius):** Zero changes to `question-bank-service`, zero new npm dependencies, zero regression in any existing gate.

**Non-Goals**
- No new tables for streak/aggregate state (derived-only, §3.4). No cache invalidation problems.
- No reminder/notification cron, no spaced repetition, no goal setting ("solve 5/day") — future spec.
- No multi-user hardening: `userId` query param stays, default `local` (consistent with every existing endpoint).
- No edits to `DashboardService`/`DashboardController` existing aggregates or DTOs (new parallel `HistoryService`; a small amount of deliberate duplication is accepted and documented).
- No manual history editing ("mark solved yesterday") — the ledger is append-only truth (§9 rider R-3).
- No mockup fidelity work: the calendar follows the repo's existing design tokens; it does not clone any external pixel design.

---

## 2. Time & Timezone Doctrine (HARD GATE — violations = audit reject)

**The single source of truth for "when"** is the server-side `Instant.now()` stamped at write time (already implemented in `PracticeAttempt.prePersist` / `SessionQuestionService`). It is a UTC instant, immune to container restarts, container clocks, and `docker compose` cycles. Nothing in this spec changes storage.

**Server (interview-session-service), the ONLY allowed day-bucketing method:**

```java
ZoneId zone = ZoneId.of(tz);                       // tz = request param or APP_DEFAULT_TZ
LocalDate day = ZonedDateTime.ofInstant(instant, zone).toLocalDate();
String dayKey = day.toString();                    // "YYYY-MM-DD"
```

- **FORBIDDEN everywhere in new code:** `java.util.Date`, `java.util.Calendar`, `SimpleDateFormat`, `DateTimeFormatter` with zone-less `LocalDateTime.now()`, zone-less `LocalDate.now()`, and any hand-rolled epoch-millis-day arithmetic (`millis / 86400000` etc.).
- **ALLOWED:** `LocalDate.plusDays/minusDays` arithmetic **on day keys after bucketing** (pure calendar math, zone already applied — used by streak walking, §3.4). `YearMonth.lengthOfMonth()` for grid padding.
- **`tz` parameter handling:** validate with `ZoneId.of(tz)`; invalid → HTTP 400 `{"error":"unknown timezone","code":"INVALID_TZ"}`. Absent → fall back to `@Value("${app.default-tz:Asia/Kolkata}")` (code default only; **no yaml change**). docker-compose sets `APP_DEFAULT_TZ=Asia/Kolkata` on `interview-session-service` for explicitness (§6).
- Container clock alignment (`TZ` env, NTP) is out of scope — instants are already correct regardless.

**Client (frontend):**
- The client's only time job is (a) reporting its zone once per request: `Intl.DateTimeFormat().resolvedOptions().timeZone`, and (b) *display* formatting (`Intl.DateTimeFormat` for `HH:mm`, dates). 
- **FORBIDDEN:** computing day keys client-side (`toISOString().slice(0,10)`, `toLocaleDateString`, `getDay()`-based bucketing). Day keys arrive from the server; the calendar grid builder (§4.2) consumes keys, never `Date` math.

**Mandated test triples (must appear as named tests, §3.8 / Gate H-06):**

| instant (UTC) | tz | expected day key |
|---|---|---|
| `2026-10-14T20:30:00Z` | `Asia/Kolkata` | `2026-10-15` |
| `2026-10-14T20:30:00Z` | `UTC` | `2026-10-14` |
| `2026-03-08T06:30:00Z` | `America/New_York` | `2026-03-08` (01:30 EST, DST transition day — proves `ZoneId` rules, not offsets) |

---

## 3. P0 — History Aggregation Backend (interview-session-service + gateway)

### 3.1 Data sources & solved semantics (verified, do not re-derive)

| | source A: practice | source B: interview |
|---|---|---|
| table | `practice_attempts` (V8) | `session_questions` (V9) JOIN `interview_sessions` on `sq.session_id = s.id` |
| user filter | `user_id = :userId` | `s.candidate_id = :userId` |
| question id | `question_id` (= catalog slug, e.g. `dsa-two-sum-target` — writer passes `problem.getProblemSlug()`, `CodeExecutionService` L195/L217) | `question_slug` (same slug namespace) |
| **solved** | `verdict = 'PASSED'` | `verdict = 'PASSED'` |
| **attempted** | every row (verdicts observed: `PASSED, PARTIAL, FAILED, COMPILE_ERROR, TIMEOUT, MEMORY_EXCEEDED` — `ExecutionResultResponse.java` L9) | `verdict IN ('PASSED','FAILED')` |
| event timestamp | `created_at` | `COALESCE(attempted_at, updated_at)`, **only for attempted rows** (`UNATTEMPTED` rows have no meaningful time and are excluded entirely) |
| track | `track` column (defaults `ALGORITHMS_DATA_STRUCTURES` in `PracticeTrackingService` L44-45) | literal `INTERVIEW` (matches `DashboardService` recent-activity behavior) |

`UNATTEMPTED` rows and rows with null `attempted_at`/null `updated_at` are excluded from both calendar and day views. Verdict string comparison is case-insensitive (mirrors `DashboardService` usage of `equalsIgnoreCase`).

### 3.2 Endpoints (new `HistoryController`, base `/api/v1/history`)

| endpoint | params | returns |
|---|---|---|
| `GET /api/v1/history/calendar` | `userId` (def `local`), `tz` (def `APP_DEFAULT_TZ`), `from`/`to` (ISO `YYYY-MM-DD`, optional) | `HistoryCalendarResponse` |
| `GET /api/v1/history/day` | `userId`, `tz`, `day` (**required**) | `HistoryDayResponse` |
| `GET /api/v1/history/streak` | `userId`, `tz` | `HistoryStreakResponse` |

Validation (all → 400 with `{"error":…,"code":…}`):
- `tz`: `ZoneId.of` parse failure → `INVALID_TZ`.
- `day`/`from`/`to`: strict `^\d{4}-\d{2}-\d{2}$` **and** `LocalDate.parse` → `INVALID_DAY`.
- `from > to` → `INVALID_RANGE`. `(to − from) > 730 days` → `RANGE_TOO_LARGE`.
- Default window (calendar, when `from`/`to` absent): `[today(tz) − 364, today(tz)]`.

Gateway: add **Route 1.7** in `api-gateway-service/src/main/resources/application.yaml` (after Route 1.6 learn):
```yaml
        # Route 1.7: History / Calendar / Streak (:8081)
        - id: history-route
          uri: ${SESSION_SERVICE_URL:http://interview-session-service:8081}
          predicates:
            - Path=/api/v1/history/**
```

### 3.3 Response contracts (JSON, exact field names)

`HistoryCalendarResponse`:
```json
{
  "userId": "local",
  "tz": "Asia/Kolkata",
  "fromDay": "2025-10-15",
  "toDay": "2026-10-14",
  "days": [
    { "day": "2026-10-13", "solvedCount": 6, "attemptCount": 9,
      "practiceSolved": 4, "interviewSolved": 2 }
  ],
  "streak": { "currentStreak": 5, "longestStreak": 21, "activeToday": true,
              "lastSolvedDay": "2026-10-14", "totalDaysActive": 87, "totalSolved": 143 },
  "generatedAt": "2026-10-14T09:30:00Z"
}
```
- `days` is **sparse**: only days with ≥1 attempted event, sorted ascending by `day`. The frontend fills zero cells (§4.2).
- `solvedCount` = **distinct question ids with ≥1 PASSED event that day** (union of both sources; the same question passed twice in one day counts once; the same question passed on two different days counts on each day). `attemptCount` = all attempted events that day (no dedup).
- `practiceSolved` / `interviewSolved` = distinct-question solved counts per source (a question passed in both sources the same day counts in both — the sum may exceed `solvedCount`; this is intended and documented).

`HistoryDayResponse`:
```json
{
  "userId": "local", "tz": "Asia/Kolkata", "day": "2026-10-14",
  "solvedCount": 8, "attemptCount": 11, "truncated": false,
  "items": [
    { "id": "PRACTICE-42", "source": "PRACTICE",
      "questionId": "dsa-two-sum-target", "title": null,
      "track": "ALGORITHMS_DATA_STRUCTURES", "verdict": "PASSED",
      "detail": "8/8 tests passed (12ms)",
      "at": "2026-10-14T05:12:33Z",
      "link": { "kind": "PRACTICE", "slug": "dsa-two-sum-target" } },
    { "id": "INTERVIEW-7", "source": "INTERVIEW",
      "questionId": "hld-url-shortener-bitly", "title": null,
      "track": "INTERVIEW", "verdict": "PASSED",
      "detail": "Session #7 (order: 2)",
      "at": "2026-10-14T11:40:01Z",
      "link": { "kind": "REPORT", "sessionId": 7 } }
  ],
  "streak": { "…same object as calendar…" }
}
```
- `title` stays `null` from the backend **by design**: titles live in question-bank-service (Mongo) and cross-service fan-out from the session service is forbidden by fence. The frontend resolves titles via the existing catalog endpoint (§4.4). Fallback display is a prettified slug — never a blank row.
- `detail`: practice = `"%d/%d tests passed (%sms)"` (runtime may be `n/a`) — same format as `DashboardService` recent activity; interview = `"Session #%d (order: %d)"`.
- `link`: PRACTICE → `{kind:"PRACTICE", slug}`; INTERVIEW → `{kind:"REPORT", sessionId}`. No other kinds in this spec.
- `items` sorted by `at` **descending**, tie-break `(source, id)` ascending for determinism. Cap 200 (`truncated: true` when clipped).

`HistoryStreakResponse` = the `streak` object alone (+ `tz`, `generatedAt`).

### 3.4 Streak algorithm (exact — implement as a pure function, unit-tested independently)

```
S = sorted distinct set of dayKeys having solvedCount ≥ 1   (from calendar bucketing, ALL history — not just the requested window)
today = LocalDate.now(zone)                                  // zone from §2; the only LocalDate.now() allowed, zone-qualified
activeToday   = S.contains(today)
anchor        = activeToday ? today
              : S.contains(today.minusDays(1)) ? today.minusDays(1)   // grace: yesterday's work keeps the streak alive until today ends
              : null
currentStreak = anchor == null ? 0
              : count of consecutive days ending at anchor walking backwards while S.contains(d)
longestStreak = maximum run of consecutive days in S (0 if S empty)
lastSolvedDay = max(S), null if empty
totalDaysActive = |S|
totalSolved   = Σ over calendar days of solvedCount   // "questions I solved, counted once per day I solved them"
```
- Day arithmetic uses `LocalDate.plusDays/minusDays` on keys (§2 ALLOWED list).
- Future-dated rows (clock skew) are included in `days` if within `[from,to]` but excluded from streak walking (streak never walks forward from `today`).
- Empty ledger → all-zero streak object, HTTP 200 (never 500).

### 3.5 `HistoryService` shape

- New `com.interviewos.session.service.HistoryService`, `@Transactional(readOnly = true)` reads.
- New repository methods (**additive only, zero existing methods modified**):
  - `PracticeAttemptRepository`: `List<PracticeAttempt> findByUserIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(String userId, Instant fromIncl, Instant toExcl);`
  - `SessionQuestionRepository`: `@Query(nativeQuery=true)` joining `interview_sessions` on `candidate_id`, `verdict IN ('PASSED','FAILED')`, window predicate on `COALESCE(attempted_at, updated_at)`; returns `List<SessionQuestion>`; ordered by the window column ascending.
- Bucketing in Java (§2 method) — expected volumes are single-user (hundreds–thousands of rows/year); SQL-side tz grouping is deliberately avoided for determinism and testability.
- Assembles unified event list → buckets → streak. Pure internal functions (`buildDays`, `buildStreak`, `buildDayDetail`) package-visible for direct unit tests.

### 3.6 Migration & indexes

One new Flyway migration, `VX__add_history_query_indexes.sql` where **`VX` = the next free version number at execution time** (V13 is reserved by SPEC-016; on a tree with SPEC-016 merged, use V14 — check `db/migration/` before writing; report the chosen number):

```sql
-- SPEC-017: history calendar / day aggregation read paths
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_created_at
    ON practice_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id
    ON session_questions(session_id);
```
No table adds, no column adds, no data migrations. `IF NOT EXISTS` makes re-runs idempotent.

### 3.7 Compose wiring (minimal)

`docker-compose.yaml` → `interview-session-service.environment` gains exactly one line:
```yaml
      - APP_DEFAULT_TZ=Asia/Kolkata
```
(plus the §6 comment block near `volumes:`; both are the only compose edits in this spec).

### 3.8 P0 tests (session-service, JUnit 5 — all new files)

1. **Tz triples** (§2 table, all three, asserted on `buildDays` output) — Gate H-06 receipts.
2. Distinct-question semantics: same question PASSED twice same day → `solvedCount=1, attemptCount=2`; same question across two days → counts on both.
3. Source union: practice PASSED + interview PASSED on the same question, same day → `solvedCount=1`, `practiceSolved=1`, `interviewSolved=1`.
4. `UNATTEMPTED` exclusion; interview row with `verdict='FAILED'` counts in `attemptCount` but not `solvedCount`.
5. Streak: (a) solved today only → current=1; (b) yesterday only → current=1 (grace); (c) day-before-yesterday only → current=0; (d) 5-day run with a gap → longest=5, current=0; (e) empty ledger → all zeros, 200.
6. Validation: bad day (`2026-13-40`), bad tz (`Mars/Olympus`), `from>to`, window >730d → all 400 with the specified codes.
7. Day cap: 201 items → 200 returned, `truncated=true`.
8. Ordering determinism: stable sort receipt.

**Baseline receipt:** session-service was **278 tests / 0 failures / 1 skip** at QB-38 (`814ff2d`). Run the suite once before your changes on your tree, report both runs' exact digits; 0 failures required, skip count must not increase.

---

## 4. P1 — History Page (frontend)

### 4.1 Routing & navigation wiring (additive edits only)

- `App.tsx`: `ViewState` union gains `'HISTORY'`; init effect: pathname `/history` → `HISTORY` (parse `?day=YYYY-MM-DD` if present → preselected day); `handleNavigateToHistory` mirrors `handleNavigateToDashboard` (App.tsx L107 pattern: `pushState` + `setView`).
- `src/lib/sessionUrl.ts`: `resolvePopStateView` return union gains `'HISTORY'`, one new branch for `/history`. **Additive** — existing branches and their tests (`src/lib/sessionUrl.test.ts`) must not be modified; append new cases.
- `src/components/SetupScreen.tsx`: new optional prop `onNavigateToHistory?: () => void`; one nav button styled identically to the existing Dashboard/Learn buttons (hidden when the prop is undefined). This is the ONLY SetupScreen edit.
- `src/components/dashboard/DashboardView.tsx`: header gains a History nav button (calls a new optional prop `onNavigateToHistory`) + the P2 `StreakStrip` mount (§5). Nothing else in DashboardView may change.
- `src/services/api.ts`: three additive typed fetchers following the existing `fetchJson` + `GATEWAY_BASE` convention: `getHistoryCalendar(params)`, `getHistoryDay(params)`, `getHistoryStreak(params)`, plus exported `HistoryCalendarResponse` / `HistoryDayResponse` / `HistoryStreakResponse` / `HistoryDayItem` types matching §3.3 exactly.

### 4.2 Calendar component — `src/components/history/ActivityHeatmap.tsx`

**Zero new npm dependencies.** Rationale with receipts: GitHub-contribution-graph semantics are a well-known MIT-free pattern; the obvious library (`react-calendar-heatmap`) declares React ≤18 peer ranges while this repo runs `react@^19.2.8` (`package.json`) — adding it invites peer-resolution churn for zero gain. Pure in-house component with a lib-testable core.

- Core logic lives in **`src/lib/history/calendarGrid.ts`** (pure, `node:test`-covered):
  - `buildCalendarGrid(solvedByDay: Record<string, number>, fromDay: string, toDay: string): CalendarCell[]` — consumes server day keys, never `Date` objects. Pads the first week to **Monday-start (ISO)** with `null` cells, pads the trailing week, one cell per (week × weekday) → 7 rows × N columns; weekend rows/cols rendered like any other day.
  - `monthLabels(cells)` → `{ label, colIndex }[]` at the first column of each new month.
  - `levelFor(count: number): 0|1|2|3|4` — fixed thresholds: `0 → 0`, `1–2 → 1`, `3–5 → 2`, `6–9 → 3`, `≥10 → 4` (deterministic, unit-asserted).
- Rendering: CSS grid of small rounded cells; Tailwind default-palette greens (`bg-emerald-500/…` scale, `0 → bg-elevated`-style empty state consistent with existing tokens); today gets a ring; future cells (> `toDay`) render disabled and ignore clicks; each cell `title="{n} solved — {day}"` (native tooltip, no dependency) + `aria-label`.
- Legend: `Less ▢▢▢▢▢ More` + month labels row + weekday hint column (Mon/Wed/Fri only, muted).
- Click a day cell → `onSelectDay(dayKey)` → day detail (§4.3) + URL sync (§4.5). Clicking an empty (0) day is allowed — shows the empty-state detail for that date.

### 4.3 Day detail — `src/components/history/DayDetail.tsx`

- Header: human date (e.g. "Tue, 14 Oct 2026"), chips `N solved · M attempts`.
- Item rows (all sources mixed, sorted as delivered): time `HH:mm` (Intl, display-only), **question title** (§4.4) with slug fallback, track chip, source badge (`PRACTICE` / `INTERVIEW`), verdict badge (PASSED green, FAILED red, PARTIAL amber, COMPILE_ERROR/TIMEOUT/MEMORY_EXCEEDED gray), `detail` line.
- **Links (operator's explicit ask — "if links are there it will be a better feature"):**
  - `INTERVIEW` items → anchor to `/?report={sessionId}` — the existing REPORT view loads it, including its own error surface when a report isn't generated yet. Always linked when `sessionId` present.
  - `PRACTICE` items → anchor to `/?q={slug}` — handled by the practice deep-launch (§4.6).
  - Links use client-side navigation (`history.pushState` + view resolution), not full reloads, matching existing nav patterns.
- Empty state: "No activity recorded on this day." (never blank).

### 4.4 Title resolution — `src/lib/history/titles.ts`

- `resolveTitles(slugs: string[], fetcher): Promise<Record<string, string>>`:
  - Dedupes, chunks into batches of **≤50 slugs**, calls the **existing** `listQuestions({ slugs })` (gateway Route 5, `/api/v1/questions?…&slugs=…` — already supported, `api.ts` L725-760), maps `slug → title`.
  - Module-level `Map` cache (per page session); repeated day selections don't refetch.
  - Unknown/missing slugs (deleted/legacy ids) → `prettifySlug(slug)`: strip known family prefixes (`dsa-`, `hld-`, `lld-`, `sql-`, `beh-`), replace `-` with space, Title Case. **A row is never blank.**
  - If the backend were to ignore the `slugs` param, degrade to per-slug `getQuestionBySlug` fan-out (existing endpoint) with a report note — the fallback choice must be documented in the report, not silent.

### 4.5 `HistoryView.tsx` shell (new, mounted at `/history`)

- Header row: Back (mirrors DashboardView's back affordance), title "History & Streak", refresh button (re-fetches calendar + current day), streak chips (§3.3 `streak` — arrives free with the calendar payload, no extra request).
- Body: `ActivityHeatmap` (from calendar `days` + `streak.lastSolvedDay`/`toDay` for the window) above `DayDetail` for `selectedDay` (default: `today` per server `tz`, else `?day=`).
- Fetch discipline mirrors `dashboardAntiFreeze`: `AbortController` + sequence guard + 8s timeout, non-blocking failure states (skeleton/empty, never a frozen page). Reuse the existing pattern; do not modify `dashboardAntiFreeze.ts`.
- URL sync: selecting a day → `history.pushState('/history?day=YYYY-MM-DD')`; popstate handled via the extended `resolvePopStateView` + App init parse.

### 4.6 Practice deep-launch (`/?q=<slug>`)

- `App.tsx` init effect: `?q=` present → fetch `getQuestionBySlug(slug)` (existing) → on `SETUP` view render a small `PracticeLauncherCard` (new component under `src/components/history/`): question title, track, difficulty, `[Start practice]` → existing `handleLaunchPlaylist([question])` (PLAYGROUND arena, exactly as QuestionCatalog's `onSelectQuestions` path does today, App.tsx L422-426), `[Dismiss]` → `history.replaceState` strips the param.
- Unknown slug → card shows prettified slug + "Question not found in catalog", Start disabled.
- The launcher must never auto-start a session on page load — one explicit click required.

### 4.7 P1 tests (lib-level only — the repo's runner is `tsx --test "src/**/*.test.ts"`, so all new tests are pure `.ts` under `src/lib/history/`)

1. `calendarGrid`: exact cell array for a known 3-week window (leading Monday-padding, trailing pad, month-label indices at correct columns, `levelFor` threshold boundaries 0/1/2/3/5/6/9/10, empty map → all-zero cells, future cells disabled flag).
2. `titles`: `prettifySlug` cases (family prefixes, multi-dash, already-clean); chunking >50 slugs via injected fetcher spy (2 batches for 75); cache hit (second call → fetcher invoked once).
3. `sessionUrl.test.ts`: additive cases for `/history` (with and without `?day=`).

---

## 5. P2 — Streak Surfaces

### 5.1 HistoryView streak chips (already covered by P1 — listed for completeness)

Chips render from the calendar payload's `streak` object: `Current: N days` (icon: lucide `Flame`), `Longest: M` (icon: `Trophy`), `Total solved: K`, plus an `activeToday` accent when true. No emoji glyphs in code — use the existing lucide icon set (already-imported patterns like `Zap`).

### 5.2 DashboardView `StreakStrip`

- New `src/components/history/StreakStrip.tsx`: self-contained card fetching `GET /api/v1/history/streak` with `tz` from `Intl` (§2). Renders `currentStreak` / `longestStreak` / `totalSolved` compactly.
- Fetch discipline: own `AbortController`, 8s timeout, **failure renders nothing** (zero dashboard regression — a history-service hiccup must never degrade the dashboard).
- `DashboardView.tsx` mount + the §4.1 nav button are the ONLY DashboardView edits permitted.

---

## 6. P3 — Persistence Doctrine & Operator Tooling (non-gated; omission must be reported as INFO, never silent)

### 6.1 Compose comment block

Immediately above the `volumes:` block (`docker-compose.yaml` L383):
```yaml
# ─── DATA PERSISTENCE (SPEC-017) ─────────────────────────────────────────────
# postgres_data / mongodb_data / judge0_db_data are NAMED volumes.
#   docker compose down && docker compose up   → ALL history, streaks, sessions,
#     reports and question data SURVIVE (safe, routine).
#   docker compose down -v                     → DESTROYS the volumes: calendar,
#     streak, practice attempts, session_questions, resume data — everything.
# Never use -v unless you intend a full reset. See README → "Data persistence".
```

### 6.2 README section "Data persistence: streak, calendar & history"

Content (≥1 screen): where solved-events live (`practice_attempts`, `session_questions` in `interview_session_db`), that streak/history are **derived** from those tables (no separate state to lose), the `down` vs `down -v` contract, and backup/restore one-liners:
```bash
# backup
docker exec -t postgres pg_dump -U postgres interview_session_db > history-backup.sql
# restore
cat history-backup.sql | docker exec -i postgres psql -U postgres -d interview_session_db
```

### 6.3 Backup helper script (optional)

`docker/postgres/backup-history.sh` — wraps the pg_dump one-liner with a timestamped filename. If delivered, `shellcheck`-clean or not delivered at all.

---

## 7. Fence (files that may be touched — the report's `--stat` must be a subset)

**interview-session-service**
- NEW: `HistoryController.java`, `HistoryService.java`, `dto/History*.java` (≥3 DTOs), migration `VX__add_history_query_indexes.sql`, test files
- MODIFIED (additive only): `PracticeAttemptRepository.java` (+1 query method), `SessionQuestionRepository.java` (+1 query method)
- No other session-service file may change (notably NOT: `InterviewSessionService`, `SessionPlanService`, `QuestionExposureService`, `DashboardService/Controller`, `application.yaml`)

**api-gateway-service**
- MODIFIED: `src/main/resources/application.yaml` (Route 1.7 block only)

**frontend**
- NEW: `src/lib/history/calendarGrid.ts`, `src/lib/history/titles.ts`, `src/lib/history/calendarGrid.test.ts`, `src/lib/history/titles.test.ts`, `src/components/history/HistoryView.tsx`, `ActivityHeatmap.tsx`, `DayDetail.tsx`, `StreakStrip.tsx`, `PracticeLauncherCard.tsx`
- MODIFIED (bounded, additive): `src/App.tsx` (ViewState + init parses + handlers + launcher mount), `src/lib/sessionUrl.ts` (union + 1 branch), `src/lib/sessionUrl.test.ts` (append cases), `src/components/SetupScreen.tsx` (1 prop + 1 button), `src/components/dashboard/DashboardView.tsx` (nav button + strip mount + 1 prop), `src/services/api.ts` (3 fetchers + types)

**root**
- `docker-compose.yaml` (one env line + §6.1 comment block), `README.md` (§6.2 section), `docker/postgres/backup-history.sh` (optional)
- `collab/gemini/SPEC-017-REPORT.md`

**FORBIDDEN:** `question-bank-service/**`, `content/**`, `scripts/` (repo-root guard scripts), all guard tests, `judge0-patches/**`, `proctor-sentinel-service/**`, `evaluation-report-service/**`, `ai-orchestrator-service/**`, existing Flyway migrations, `package.json` / any lockfile (no dependency changes), `docs/design/**`, SPEC-016 files (`collab/**` except the report), workflow files.

---

## 8. Gates for the Report (all digit-receipted)

| Gate | Command / evidence | Pass criterion |
|---|---|---|
| **H-01** | `mvn -pl interview-session-service test` (or repo-standard invocation), run **before and after** changes | 0 failures both runs; post-run tests ≥ pre-run + (number of new tests); skip count ≤ pre-run skip count; exact digits of both runs in report |
| **H-02** | frontend `npm test`, before and after | 0 failures both runs; all new lib tests listed by name and green; existing suite counts must not decrease |
| **H-03** | frontend `npm run build` (`tsc -b && vite build`) | 0 errors (QB-38 baseline: build clean) |
| **H-04** | `git diff --stat <base>..<head> -- question-bank-service content scripts` | **empty output** |
| **H-05** | full `git diff --stat` receipt | every path ∈ §7 fence; any path outside → report as deviation (spec violation otherwise) |
| **H-06** | tz triple test receipts | the three named tests of §2 printed with asserted day keys `2026-10-15` / `2026-10-14` / `2026-03-08` |
| **H-07** | API validation receipts (controller tests) | 200 for a seeded calendar; 400 + `INVALID_DAY` for `2026-13-40`; 400 + `INVALID_TZ` for `Mars/Olympus`; 400 + `INVALID_RANGE` |
| **H-08** | streak determinism receipts | fixture → exact `currentStreak`/`longestStreak` asserted for the five §3.8-5 cases |
| **H-09** | `git diff <base>..<head> -- package.json package-lock.json` (or pnpm/yarn lock) | **empty output** |
| **H-10** | `App.tsx` / `DashboardView.tsx` bounded-diff review | diff hunks confined to the regions enumerated in §4.1/§5.2 |
| **H-11** | P3 receipts (README diff, compose comment diff) | present, or reported as INFO deviations |
| **H-12** | migration number receipt | chosen `VX` stated; `V13` not used unless SPEC-016 is confirmed unmerged **and** no V13 exists on tree |

**Existing-baseline note:** QB-38 verified master at `814ff2d` with session 278/0F/1skip, qb 41/0F, guard 397, frontend 306/0F/39 suites, build 0. If SPEC-016 has since merged, its numbers supersede — this spec touches none of those modules; run-before/run-after on your own tree is the binding comparison.

---

## 9. Standing Riders (violations = audit reject)

- **R-1 (A3 carry-over, pressure realism):** no streak/history/rotation information may be surfaced inside `ArenaRoom` or any in-interview surface. `/history` is a standalone route; no ArenaRoom file is in the fence; keep it that way.
- **R-2 (SPEC-016 coexistence):** SPEC-016 (rotation engine) may merge before, after, or not at all relative to this spec. Shared-surface analysis: session-service files are disjoint (SPEC-016: `InterviewSessionService`/`SessionPlanService`/`QuestionExposureService`/guard; SPEC-017: new `History*` + two repositories) except Flyway numbering — governed by H-12. If both are pending on your tree, **execute SPEC-016 first**, then rebase this work.
- **R-3 (Append-only truth):** no `UPDATE`/`DELETE` on `practice_attempts` or `session_questions` may be introduced; history is a faithful mirror of what happened, including failures.
- **R-4 (Derived-only streak):** no streak/cache table, no scheduled job, no write path outside the existing `PracticeTrackingService`/`SessionQuestionService`. Streak is a query-time pure function — this is what makes it compose-restart-proof by construction.
- **R-5 (No cross-service title coupling):** session-service must not call question-bank-service for titles (§3.3 rationale).
- **R-6 (Time doctrine):** §2 forbidden list applies to ALL new code in this spec, frontend and backend.

---

## 10. Execution Order

1. P0 backend (controller + service + repos + migration + gateway route + compose env) → P0 tests green.
2. P1 frontend (libs → components → wiring → deep-launch) → P1 tests green + build clean.
3. P2 streak surfaces.
4. P3 docs/tooling.
5. Report `collab/gemini/SPEC-017-REPORT.md` → single push → one-shot Z audit (QB-42). No round trips; deviations documented, never silently skipped.

---

## 11. Report Template (`collab/gemini/SPEC-017-REPORT.md`)

① fence `--stat` receipt (H-05) ② chosen `VX` + migration receipt (H-12) ③ P0: endpoint list + tz-triple test receipts (H-06) + validation receipts (H-07) + streak receipts (H-08) ④ P1: component/file list + lib test names ⑤ gate block: H-01/H-02/H-03 before-and-after digits ⑥ H-04 + H-09 emptiness receipts ⑦ H-10 bounded-diff statement ⑧ deviations section (empty = "NONE") ⑨ P3 receipts or INFO ⑩ operator acceptance script (§12) copied verbatim for the operator.

---

## 12. Operator Acceptance Script (manual, post-merge — copied into the report)

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

