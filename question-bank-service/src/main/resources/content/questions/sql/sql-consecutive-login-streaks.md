---
slug: sql-consecutive-login-streaks
title: Active User 3-Day Consecutive Login Streaks
track: SQL
difficulty: HARD
topics:
- sql
est_minutes: 20
tags:
- postgresql
- window-functions
- gaps-and-islands
- lead-lag
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/consecutive-streaks
status: PUBLISHED
dbEngine: postgres-13
setupSql: "CREATE TABLE user_activity (\n  id SERIAL PRIMARY KEY,\n  user_id INT NOT NULL,\n  login_date DATE NOT NULL\n);\nINSERT INTO user_activity (user_id, login_date) VALUES\n  (101, '2026-01-01'), (101, '2026-01-02'), (101, '2026-01-03'), (101, '2026-01-07'),\n  (102, '2026-01-01'), (102, '2026-01-03'), (102, '2026-01-05'),\n  (103, '2026-01-04'), (103, '2026-01-05'), (103, '2026-01-06'), (103, '2026-01-07');\n"
expectedCsv: 'user_id

  101

  103

  '
ordered: true
solutionSql: "WITH distinct_logins AS (\n  SELECT DISTINCT user_id, login_date\n  FROM user_activity\n),\nstepped AS (\n  SELECT\n    user_id,\n    login_date,\n    LEAD(login_date, 1) OVER (PARTITION BY user_id ORDER BY login_date) AS next_1,\n    LEAD(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) AS next_2\n  FROM distinct_logins\n)\nSELECT DISTINCT user_id\nFROM stepped\nWHERE next_1 = login_date + INTERVAL '1 day'\n  AND next_2 = login_date + INTERVAL '2 day'\nORDER BY user_id ASC;\n"
referenceSolutions:
- approachId: canonical-consecutive-login-streaks
  label: Canonical — Active User 3-Day Consecutive Login Streaks
  approachClass: PRIMARY
  kind: SQL
  summary: Standard canonical relational query accepted in technical interviews.
  keyIdea: Optimal relational expression satisfying all schema requirements and output constraints.
  timeComplexity: O(N log N)
  spaceComplexity: O(N)
  tradeoffs:
  - Optimal execution plan using standard relational indexing
  - High portability and readability in technical review
  whenToUse: Default expected interview-grade solution for this problem prompt.
  sql: "WITH distinct_logins AS (\n  SELECT DISTINCT user_id, login_date\n  FROM user_activity\n),\nstepped AS (\n  SELECT\n    user_id,\n    login_date,\n    LEAD(login_date, 1) OVER (PARTITION BY user_id ORDER BY login_date) AS next_1,\n    LEAD(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) AS next_2\n  FROM distinct_logins\n)\nSELECT DISTINCT user_id\nFROM stepped\nWHERE next_1 = login_date + INTERVAL '1 day'\n  AND next_2 = login_date + INTERVAL '2 day'\nORDER BY user_id ASC;\n"
- approachId: lead-window-three-day
  label: Alternate — Multi-Day LEAD Window Function Lookahead
  approachClass: ALTERNATE
  kind: SQL
  summary: A direct lookahead strategy utilizing SQL window functions LEAD(1) and LEAD(2). Checks whether adjacent sorted login events differ by exactly 1 and 2 days, providing an intuitive, readable alternative to date-arithmetic islands.
  keyIdea: Identify 3 consecutive days by projecting LEAD(login_date, 1) and LEAD(login_date, 2) over partitioned user activity.
  timeComplexity: O(N log N)
  spaceComplexity: O(N)
  tradeoffs:
  - Highly readable and immediately recognizable in interviews
  - Requires fixed N-day lookahead; less generalized for variable N-length streaks
  whenToUse: Ideal for fixed 3-day streak queries where clarity is prioritized over dynamic interval parametrization.
  sql: "WITH ordered_logins AS (\n  SELECT DISTINCT\n    user_id,\n    login_date,\n    LEAD(login_date, 1) OVER (PARTITION BY user_id ORDER BY login_date) AS next_login,\n    LEAD(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) AS next_next_login\n  FROM user_activity\n)\nSELECT DISTINCT user_id\nFROM ordered_logins\nWHERE next_login = login_date + INTERVAL '1 day'\n  AND next_next_login = login_date + INTERVAL '2 day'\nORDER BY user_id ASC;"
---

### Active User 3-Day Consecutive Login Streaks
Write a query to find all `user_id`s who logged in on at least three consecutive calendar days.
