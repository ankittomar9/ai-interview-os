---
slug: sql-user-cohort-retention
title: Monthly Customer Signup Cohort Retention Matrix
track: SQL
difficulty: HARD
topics:
- sql
est_minutes: 20
tags:
- postgresql
- cohort-analysis
- date-trunc
- self-join
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/cohort-retention
status: PUBLISHED
dbEngine: postgres-13
constraints:
- user_events contains valid chronological login event logs.
- All user_id references are positive integers.
setupSql: "CREATE TABLE user_events (\n  id SERIAL PRIMARY KEY,\n  user_id INT NOT NULL,\n  event_date DATE NOT NULL\n);\nINSERT INTO user_events (user_id, event_date) VALUES\n  (1, '2026-01-05'), (1, '2026-02-10'), (1, '2026-03-12'),\n  (2, '2026-01-15'), (2, '2026-02-18'),\n  (3, '2026-02-01'), (3, '2026-03-05'),\n  (4, '2026-03-01');\n"
expectedCsv: 'cohort_month,cohort_size,month_1_retained

  2026-01,2,2

  2026-02,1,1

  2026-03,1,0

  '
ordered: true
solutionSql: "WITH first_events AS (\n  SELECT user_id, TO_CHAR(MIN(event_date), 'YYYY-MM') AS cohort_month\n  FROM user_events\n  GROUP BY user_id\n),\ncohort_sizes AS (\n  SELECT cohort_month, COUNT(DISTINCT user_id) AS cohort_size\n  FROM first_events\n  GROUP BY cohort_month\n),\nm1_activity AS (\n  SELECT\n    f.cohort_month,\n    COUNT(DISTINCT u.user_id) AS month_1_retained\n  FROM first_events f\n  LEFT JOIN user_events u ON f.user_id = u.user_id\n    AND TO_CHAR(u.event_date, 'YYYY-MM') = TO_CHAR(TO_DATE(f.cohort_month, 'YYYY-MM') + INTERVAL '1 month', 'YYYY-MM')\n  GROUP BY f.cohort_month\n)\nSELECT\n  c.cohort_month,\n  c.cohort_size,\n  COALESCE(m.month_1_retained, 0) AS month_1_retained\nFROM cohort_sizes c\nJOIN m1_activity m ON c.cohort_month = m.cohort_month\nORDER BY c.cohort_month ASC;\n"
referenceSolutions:
- approachId: canonical-user-cohort-retention
  label: Canonical — Monthly Customer Signup Cohort Retention Matrix
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
  sql: "WITH first_events AS (\n  SELECT user_id, TO_CHAR(MIN(event_date), 'YYYY-MM') AS cohort_month\n  FROM user_events\n  GROUP BY user_id\n),\ncohort_sizes AS (\n  SELECT cohort_month, COUNT(DISTINCT user_id) AS cohort_size\n  FROM first_events\n  GROUP BY cohort_month\n),\nm1_activity AS (\n  SELECT\n    f.cohort_month,\n    COUNT(DISTINCT u.user_id) AS month_1_retained\n  FROM first_events f\n  LEFT JOIN user_events u ON f.user_id = u.user_id\n    AND TO_CHAR(u.event_date, 'YYYY-MM') = TO_CHAR(TO_DATE(f.cohort_month, 'YYYY-MM') + INTERVAL '1 month', 'YYYY-MM')\n  GROUP BY f.cohort_month\n)\nSELECT\n  c.cohort_month,\n  c.cohort_size,\n  COALESCE(m.month_1_retained, 0) AS month_1_retained\nFROM cohort_sizes c\nJOIN m1_activity m ON c.cohort_month = m.cohort_month\nORDER BY c.cohort_month ASC;\n"
- approachId: self-join-cohort-matrix
  label: Alternate — Two-Pass Self-Join Cohort Matrix
  approachClass: ALTERNATE
  kind: SQL
  summary: A two-pass relational cohort pattern joining the user's initial acquisition month to subsequent engagement months. Aggregates active user counts across relative month offsets (Month 0, Month 1, Month 2) with percentage conversion.
  keyIdea: Join user acquisition event records directly to subsequent monthly activity events using explicit month difference calculations.
  timeComplexity: O(U * E)
  spaceComplexity: O(C)
  tradeoffs:
  - Explicit relational mapping between acquisition and retention touchpoints
  - Requires careful handling of inactive cohort intervals
  whenToUse: Standard product analytics queries measuring subscriber retention curves.
  sql: "WITH user_first_month AS (\n  SELECT\n    user_id,\n    DATE_TRUNC('month', MIN(event_date)) AS cohort_month\n  FROM user_events\n  GROUP BY user_id\n),\ncohort_sizes AS (\n  SELECT\n    TO_CHAR(cohort_month, 'YYYY-MM') AS cohort_str,\n    cohort_month,\n    COUNT(DISTINCT user_id) AS total_users\n  FROM user_first_month\n  GROUP BY cohort_month\n),\nretention_activity AS (\n  SELECT\n    cs.cohort_str,\n    cs.total_users,\n    (EXTRACT(YEAR FROM e.event_date) - EXTRACT(YEAR FROM cs.cohort_month)) * 12 +\n    (EXTRACT(MONTH FROM e.event_date) - EXTRACT(MONTH FROM cs.cohort_month)) AS month_number,\n    COUNT(DISTINCT e.user_id) AS retained_users\n  FROM cohort_sizes cs\n  JOIN user_first_month ufm ON ufm.cohort_month = cs.cohort_month\n  JOIN user_events e ON e.user_id = ufm.user_id\n  GROUP BY cs.cohort_str, cs.total_users, cs.cohort_month, month_number\n)\nSELECT\n  cohort_str AS cohort_month,\n  total_users AS cohort_size,\n  month_number,\n  retained_users,\n  ROUND((retained_users::numeric\
    \ / total_users) * 100.0, 2) AS retention_rate_pct\nFROM retention_activity\nORDER BY cohort_month ASC, month_number ASC;"
---

### Monthly Customer Signup Cohort Retention Matrix
Write a PostgreSQL query to compute the cohort signup size and number of users who remained active in Month 1 for each cohort month.
