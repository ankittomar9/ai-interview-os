---
slug: sql-nth-highest-regional-transaction
title: "Third Highest Transaction by Sales Territory"
track: SQL
difficulty: MEDIUM
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'dense-rank', 'partition-by', 'aggregation']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE sales_deals (\n  deal_id INT PRIMARY KEY,\n  territory VARCHAR(20) NOT NULL,\n  amount NUMERIC(10,2) NOT NULL\n);\nINSERT INTO sales_deals (deal_id, territory, amount) VALUES\n  (1, 'North', 95000.00),\n  (2, 'North', 95000.00),\n  (3, 'North', 82000.00),\n  (4, 'North', 71000.00),\n  (5, 'North', 65000.00),\n  (6, 'South', 120000.00),\n  (7, 'South', 110000.00),\n  (8, 'South', 85000.00),\n  (9, 'South', 50000.00);\n"
expectedCsv: "deal_id,territory,amount\n4,North,71000.00\n8,South,85000.00\n"
solutionSql: "WITH ranked_deals AS (\n  SELECT\n    deal_id,\n    territory,\n    amount,\n    DENSE_RANK() OVER (PARTITION BY territory ORDER BY amount DESC) AS rnk\n  FROM sales_deals\n)\nSELECT deal_id, territory, amount\nFROM ranked_deals\nWHERE rnk = 3\nORDER BY territory ASC, deal_id ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-nth-highest-regional-transaction
    label: "Canonical — Third Highest Transaction by Sales Territory"
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
    sql: "WITH ranked_deals AS (\n  SELECT\n    deal_id,\n    territory,\n    amount,\n    DENSE_RANK() OVER (PARTITION BY territory ORDER BY amount DESC) AS rnk\n  FROM sales_deals\n)\nSELECT deal_id, territory, amount\nFROM ranked_deals\nWHERE rnk = 3\nORDER BY territory ASC, deal_id ASC;\n"
---

### Third Highest Transaction by Sales Territory

Find the deals with the 3rd highest distinct transaction amount for each sales territory using dense ranking. Return `deal_id`, `territory`, and `amount`, ordered by `territory` ascending, then `deal_id` ascending.
