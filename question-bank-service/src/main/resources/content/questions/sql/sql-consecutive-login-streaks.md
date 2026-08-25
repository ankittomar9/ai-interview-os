---
slug: sql-consecutive-login-streaks
title: Active User 3-Day Consecutive Login Streaks
track: SQL
difficulty: SENIOR
tags: [postgresql, window-functions, gaps-and-islands, lead-lag]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/consecutive-streaks
status: PUBLISHED
dbEngine: postgres-13
setupSql: |
  CREATE TABLE user_activity (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    login_date DATE NOT NULL
  );
  INSERT INTO user_activity (user_id, login_date) VALUES
    (101, '2026-01-01'), (101, '2026-01-02'), (101, '2026-01-03'), (101, '2026-01-07'),
    (102, '2026-01-01'), (102, '2026-01-03'), (102, '2026-01-05'),
    (103, '2026-01-04'), (103, '2026-01-05'), (103, '2026-01-06'), (103, '2026-01-07');
expectedCsv: |
  user_id
  101
  103
ordered: true
solutionSql: |
  WITH distinct_logins AS (
    SELECT DISTINCT user_id, login_date
    FROM user_activity
  ),
  stepped AS (
    SELECT
      user_id,
      login_date,
      LEAD(login_date, 1) OVER (PARTITION BY user_id ORDER BY login_date) AS next_1,
      LEAD(login_date, 2) OVER (PARTITION BY user_id ORDER BY login_date) AS next_2
    FROM distinct_logins
  )
  SELECT DISTINCT user_id
  FROM stepped
  WHERE next_1 = login_date + INTERVAL '1 day'
    AND next_2 = login_date + INTERVAL '2 day'
  ORDER BY user_id ASC;
---
### Active User 3-Day Consecutive Login Streaks
Write a query to find all `user_id`s who logged in on at least three consecutive calendar days.
