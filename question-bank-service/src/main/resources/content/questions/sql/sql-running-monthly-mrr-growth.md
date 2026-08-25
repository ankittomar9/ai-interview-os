---
slug: sql-running-monthly-mrr-growth
title: Cumulative Monthly Subscription Revenue & MoM Growth
track: SQL
difficulty: SENIOR
tags: [postgresql, window-functions, running-total, lag, ctes]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/mrr-growth
status: PUBLISHED
dbEngine: postgres-13
setupSql: |
  CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    amount INT NOT NULL,
    payment_date DATE NOT NULL
  );
  INSERT INTO subscriptions (amount, payment_date) VALUES
    (1000, '2026-01-10'), (1500, '2026-01-20'),
    (2000, '2026-02-05'), (1000, '2026-02-18'),
    (3500, '2026-03-01');
expectedCsv: |
  month_str,monthly_revenue,running_total
  2026-01,2500,2500
  2026-02,3000,5500
  2026-03,3500,9000
ordered: true
solutionSql: |
  WITH monthly AS (
    SELECT
      TO_CHAR(payment_date, 'YYYY-MM') AS month_str,
      SUM(amount) AS monthly_revenue
    FROM subscriptions
    GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
  )
  SELECT
    month_str,
    monthly_revenue,
    SUM(monthly_revenue) OVER (ORDER BY month_str) AS running_total
  FROM monthly
  ORDER BY month_str ASC;
---
### Cumulative Monthly Subscription Revenue & MoM Growth
Write a PostgreSQL query calculating each month's total revenue alongside the cumulative running revenue total.
