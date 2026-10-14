# SPEC-017 NOTE: Persistent Streak, Activity Calendar & Question History

| Metadata | Value |
|---|---|
| **Spec** | SPEC-017 (Persistent Streak, Activity Calendar & Question History) |
| **Author / Lane** | Gemini (Execution Lane, compressed single-push per QB-35 protocol) |
| **Architect & Auditor** | Z (Audit Lane — QB-42 Audit) |
| **Base Commit** | `dde7743` |
| **Branch** | `feat/spec-017-streak-calendar-history` |
| **Date** | 2026-10-14 |
| **Status** | Implementation Complete — Ready for QB-42 Audit |

---

## 1. Architecture Overview

### 1.1 Problem Statement & Solution Topology
1. **The Core Need**: The platform previously recorded attempts in `practice_attempts` and interview questions in `session_questions`, but lacked aggregate date views, historical calendar navigation, day-level drill down, and streak tracking.
2. **Derived-Only Pure Functions (No Mutable Streak State)**:
   - Streaks, total solved questions, and daily solved counts are pure mathematical projections calculated at query time directly from the persisted `practice_attempts` and `session_questions` tables.
   - Because both tables reside in PostgreSQL on the `postgres_data` named Docker volume, all streaks and history survive routine `docker compose down && docker compose up` by construction.
3. **Time & Timezone Doctrine (§2)**:
   - Strictly enforces `java.time` (`Instant`, `ZoneId`, `ZonedDateTime`, `LocalDate`) on backend and `Intl` on frontend. Zero use of legacy `java.util.Date`, `Calendar`, or zoneless arithmetic.
   - Day bucketing: `ZonedDateTime.ofInstant(instant, zone).toLocalDate()`.
   - Client sends its browser IANA timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`), which is validated by the server via `ZoneId.of(tz)` with fallback to `APP_DEFAULT_TZ=Asia/Kolkata`.

### 1.2 Endpoints Implemented (P0)
- `GET /api/v1/history/calendar` — Returns sparse days array with solved/attempt breakdown, distinct question deduplication per day, and streak summary.
- `GET /api/v1/history/day` — Returns 200-item capped daily ledger with question titles, timestamps, verdicts, and actionable links.
- `GET /api/v1/history/streak` — Returns current streak, longest run, active today flag, and total solved counts.
- **Migration `V14`**: Added covering read indexes `idx_practice_attempts_user_created_at` and `idx_session_questions_session_id`.
- **Gateway Route 1.7**: Exposes `/api/v1/history/**` pointing to `interview-session-service:8081`.

### 1.3 UI Surfaces (P1 / P2)
- `/history` View:
  - `ActivityHeatmap`: 7xN CSS grid contribution calendar (ISO Monday-start) with Tailwind emerald level 0–4 tokens, month labels, and today highlight.
  - `DayDetail`: Drill-down list for the selected day, rendering question titles (resolved via chunked batch catalog calls), status badges, and working links.
  - Links: Practice items route to `/?q=<slug>`, interview items route to `/?report=<sessionId>`.
- `PracticeLauncherCard`: Displays question title, difficulty, track, and an explicit `[Start practice]` button on `SETUP` view upon deep link.
- `StreakStrip`: Compact, self-contained card mounted on `DashboardView` displaying current streak, longest run, and total solved.

### 1.4 Verification Summary
- **Backend**: 312 tests passing (+25 new tests), 0 failures, 1 skipped.
- **Frontend**: 317 tests passing (+11 new tests, +2 suites), 0 failures.
- **Build**: Vite production build succeeded in 1.30s with 0 errors.
