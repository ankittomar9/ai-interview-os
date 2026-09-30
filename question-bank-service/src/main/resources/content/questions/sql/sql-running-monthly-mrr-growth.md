---
slug: sql-running-monthly-mrr-growth
title: Cumulative Monthly Subscription Revenue & MoM Growth
track: SQL
difficulty: HARD
topics:
- sql
est_minutes: 20
tags:
- postgresql
- window-functions
- running-total
- lag
- ctes
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/mrr-growth
status: PUBLISHED
dbEngine: postgres-13
setupSql: "CREATE TABLE subscriptions (\n  id SERIAL PRIMARY KEY,\n  amount INT NOT NULL,\n  payment_date DATE NOT NULL\n);\nINSERT INTO subscriptions (amount, payment_date) VALUES\n  (1000, '2026-01-10'), (1500, '2026-01-20'),\n  (2000, '2026-02-05'), (1000, '2026-02-18'),\n  (3500, '2026-03-01');\n"
expectedCsv: 'month_str,monthly_revenue,running_total

  2026-01,2500,2500

  2026-02,3000,5500

  2026-03,3500,9000

  '
ordered: true
solutionSql: "WITH monthly AS (\n  SELECT\n    TO_CHAR(payment_date, 'YYYY-MM') AS month_str,\n    SUM(amount) AS monthly_revenue\n  FROM subscriptions\n  GROUP BY TO_CHAR(payment_date, 'YYYY-MM')\n)\nSELECT\n  month_str,\n  monthly_revenue,\n  SUM(monthly_revenue) OVER (ORDER BY month_str) AS running_total\nFROM monthly\nORDER BY month_str ASC;\n"
referenceSolutions:
- approachId: canonical-running-monthly-mrr-growth
  label: Canonical — Cumulative Monthly Subscription Revenue & MoM Growth
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
  sql: "WITH monthly AS (\n  SELECT\n    TO_CHAR(payment_date, 'YYYY-MM') AS month_str,\n    SUM(amount) AS monthly_revenue\n  FROM subscriptions\n  GROUP BY TO_CHAR(payment_date, 'YYYY-MM')\n)\nSELECT\n  month_str,\n  monthly_revenue,\n  SUM(monthly_revenue) OVER (ORDER BY month_str) AS running_total\nFROM monthly\nORDER BY month_str ASC;\n"
- approachId: self-join-cumulative-mrr
  label: Alternate — Self-Join Triangular Cumulative Aggregation
  approachClass: ALTERNATE
  kind: SQL
  summary: A classical self-join approach computing cumulative totals by joining each monthly record to all historically preceding monthly records. Computes MoM growth using a left join against the immediate preceding month.
  keyIdea: Compute running MRR via a triangular self-join on all months less than or equal to current month.
  timeComplexity: O(M^2)
  spaceComplexity: O(M)
  tradeoffs:
  - Demonstrates relational self-join cumulative mechanics without analytic window functions
  - Quadratic scaling on large time series compared to O(M log M) window sums
  whenToUse: In environments without window function capability or when explaining cumulative aggregation mathematically.
  sql: "WITH monthly AS (\n  SELECT\n    TO_CHAR(payment_date, 'YYYY-MM') AS month_str,\n    DATE_TRUNC('month', payment_date) AS month_date,\n    SUM(amount) AS monthly_mrr\n  FROM subscription_payments\n  GROUP BY TO_CHAR(payment_date, 'YYYY-MM'), DATE_TRUNC('month', payment_date)\n)\nSELECT\n  m1.month_str,\n  m1.monthly_mrr,\n  SUM(m2.monthly_mrr) AS cumulative_mrr,\n  ROUND(\n    COALESCE(\n      (m1.monthly_mrr - prior.monthly_mrr)::numeric / NULLIF(prior.monthly_mrr, 0) * 100.0,\n      0.0\n    ),\n    2\n  ) AS mom_growth_pct\nFROM monthly m1\nJOIN monthly m2 ON m2.month_date <= m1.month_date\nLEFT JOIN monthly prior ON prior.month_date = m1.month_date - INTERVAL '1 month'\nGROUP BY m1.month_str, m1.month_date, m1.monthly_mrr, prior.monthly_mrr\nORDER BY m1.month_str ASC;"
---

### Cumulative Monthly Subscription Revenue & MoM Growth
Write a PostgreSQL query calculating each month's total revenue alongside the cumulative running revenue total.
