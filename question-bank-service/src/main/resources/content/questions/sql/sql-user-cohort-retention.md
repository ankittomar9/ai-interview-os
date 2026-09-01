---
slug: sql-user-cohort-retention
title: Monthly Customer Signup Cohort Retention Matrix
track: SQL
difficulty: SENIOR
tags: [postgresql, cohort-analysis, date-trunc, self-join]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/cohort-retention
status: PUBLISHED
dbEngine: postgres-13
constraints:
  - "user_events contains valid chronological login event logs."
  - "All user_id references are positive integers."
setupSql: |
  CREATE TABLE user_events (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    event_date DATE NOT NULL
  );
  INSERT INTO user_events (user_id, event_date) VALUES
    (1, '2026-01-05'), (1, '2026-02-10'), (1, '2026-03-12'),
    (2, '2026-01-15'), (2, '2026-02-18'),
    (3, '2026-02-01'), (3, '2026-03-05'),
    (4, '2026-03-01');
expectedCsv: |
  cohort_month,cohort_size,month_1_retained
  2026-01,2,2
  2026-02,1,1
  2026-03,1,0
ordered: true
solutionSql: |
  WITH first_events AS (
    SELECT user_id, TO_CHAR(MIN(event_date), 'YYYY-MM') AS cohort_month
    FROM user_events
    GROUP BY user_id
  ),
  cohort_sizes AS (
    SELECT cohort_month, COUNT(DISTINCT user_id) AS cohort_size
    FROM first_events
    GROUP BY cohort_month
  ),
  m1_activity AS (
    SELECT
      f.cohort_month,
      COUNT(DISTINCT u.user_id) AS month_1_retained
    FROM first_events f
    LEFT JOIN user_events u ON f.user_id = u.user_id
      AND TO_CHAR(u.event_date, 'YYYY-MM') = TO_CHAR(TO_DATE(f.cohort_month, 'YYYY-MM') + INTERVAL '1 month', 'YYYY-MM')
    GROUP BY f.cohort_month
  )
  SELECT
    c.cohort_month,
    c.cohort_size,
    COALESCE(m.month_1_retained, 0) AS month_1_retained
  FROM cohort_sizes c
  JOIN m1_activity m ON c.cohort_month = m.cohort_month
  ORDER BY c.cohort_month ASC;
---
### Monthly Customer Signup Cohort Retention Matrix
Write a PostgreSQL query to compute the cohort signup size and number of users who remained active in Month 1 for each cohort month.
