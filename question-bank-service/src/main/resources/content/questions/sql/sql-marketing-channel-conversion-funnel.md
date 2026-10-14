---
slug: sql-marketing-channel-conversion-funnel
title: "Seven-Day New User Acquisition Conversion"
track: SQL
difficulty: EASY
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'group-by', 'date-intervals', 'conversion']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE signups (\n  user_id INT PRIMARY KEY,\n  channel VARCHAR(30) NOT NULL,\n  signup_date DATE NOT NULL\n);\nCREATE TABLE initial_orders (\n  order_id INT PRIMARY KEY,\n  user_id INT NOT NULL,\n  order_date DATE NOT NULL\n);\nINSERT INTO signups (user_id, channel, signup_date) VALUES\n  (1, 'Organic Search', '2024-01-01'),\n  (2, 'Organic Search', '2024-01-02'),\n  (3, 'Organic Search', '2024-01-03'),\n  (4, 'Paid Social', '2024-01-01'),\n  (5, 'Paid Social', '2024-01-02');\nINSERT INTO initial_orders (order_id, user_id, order_date) VALUES\n  (101, 1, '2024-01-04'),\n  (102, 2, '2024-01-15'),\n  (103, 4, '2024-01-03'),\n  (104, 5, '2024-01-06');\n"
expectedCsv: "channel,total_signups,converted_users\nOrganic Search,3,1\nPaid Social,2,2\n"
solutionSql: "SELECT\n  s.channel,\n  COUNT(DISTINCT s.user_id) AS total_signups,\n  COUNT(DISTINCT CASE WHEN o.order_date <= s.signup_date + INTERVAL '7 days' THEN s.user_id END) AS converted_users\nFROM signups s\nLEFT JOIN initial_orders o ON s.user_id = o.user_id\nGROUP BY s.channel\nORDER BY s.channel ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-marketing-channel-conversion-funnel
    label: "Canonical — Seven-Day New User Acquisition Conversion"
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
    sql: "SELECT\n  s.channel,\n  COUNT(DISTINCT s.user_id) AS total_signups,\n  COUNT(DISTINCT CASE WHEN o.order_date <= s.signup_date + INTERVAL '7 days' THEN s.user_id END) AS converted_users\nFROM signups s\nLEFT JOIN initial_orders o ON s.user_id = o.user_id\nGROUP BY s.channel\nORDER BY s.channel ASC;\n"
---

### Seven-Day New User Acquisition Conversion

For each marketing acquisition channel, determine total signups and how many users completed their first purchase within 7 days of signing up (`order_date <= signup_date + INTERVAL '7 days'`). Return `channel`, `total_signups`, and `converted_users`, ordered by `channel` ascending.
