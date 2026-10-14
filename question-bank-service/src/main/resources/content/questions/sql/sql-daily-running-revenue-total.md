---
slug: sql-daily-running-revenue-total
title: "Daily Cumulative Revenue Running Total"
track: SQL
difficulty: MEDIUM
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'window-functions', 'running-total', 'finance']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE store_orders (\n  id INT PRIMARY KEY,\n  order_date DATE NOT NULL,\n  total_amount NUMERIC(10,2) NOT NULL\n);\nINSERT INTO store_orders (id, order_date, total_amount) VALUES\n  (1, '2024-03-01', 500.00),\n  (2, '2024-03-01', 250.00),\n  (3, '2024-03-02', 400.00),\n  (4, '2024-03-03', 150.00),\n  (5, '2024-03-04', 800.00);\n"
expectedCsv: "order_date,daily_revenue,cumulative_revenue\n2024-03-01,750.00,750.00\n2024-03-02,400.00,1150.00\n2024-03-03,150.00,1300.00\n2024-03-04,800.00,2100.00\n"
solutionSql: "WITH daily_totals AS (\n  SELECT order_date, SUM(total_amount) AS daily_revenue\n  FROM store_orders\n  GROUP BY order_date\n)\nSELECT\n  order_date,\n  daily_revenue,\n  SUM(daily_revenue) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue\nFROM daily_totals\nORDER BY order_date ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-daily-running-revenue-total
    label: "Canonical — Daily Cumulative Revenue Running Total"
    approachClass: PRIMARY
    kind: SQL
    summary: "Standard relational SQL query satisfying interview specifications."
    keyIdea: "Efficient schema join and aggregation matching relational constraints."
    timeComplexity: "O(N log N)"
    spaceComplexity: "O(N)"
    tradeoffs:
      - "Utilizes standard PostgreSQL indexing and relational constructs"
      - "Deterministic output ordering guaranteed via ORDER BY"
    whenToUse: "Standard solution for technical SQL interview evaluation."
    sql: "WITH daily_totals AS (\n  SELECT order_date, SUM(total_amount) AS daily_revenue\n  FROM store_orders\n  GROUP BY order_date\n)\nSELECT\n  order_date,\n  daily_revenue,\n  SUM(daily_revenue) OVER (ORDER BY order_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_revenue\nFROM daily_totals\nORDER BY order_date ASC;\n"
---

### Daily Cumulative Revenue Running Total

Calculate the daily revenue and running cumulative revenue across all recorded dates. Return `order_date`, `daily_revenue`, and `cumulative_revenue`, ordered chronologically by `order_date` ascending.
