---
slug: sql-daily-cancellation-rate-unbanned
title: "Ride Cancellation Rate by Unbanned Users"
track: SQL
difficulty: HARD
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'case-when', 'joins', 'rate-calculation']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE platform_users (\n  id INT PRIMARY KEY,\n  banned BOOLEAN NOT NULL,\n  role VARCHAR(10) NOT NULL\n);\nCREATE TABLE trip_records (\n  id INT PRIMARY KEY,\n  client_id INT NOT NULL,\n  driver_id INT NOT NULL,\n  status VARCHAR(30) NOT NULL,\n  request_at DATE NOT NULL\n);\nINSERT INTO platform_users (id, banned, role) VALUES\n  (1, FALSE, 'client'), (2, TRUE, 'client'), (3, FALSE, 'client'),\n  (10, FALSE, 'driver'), (11, FALSE, 'driver'), (12, TRUE, 'driver');\nINSERT INTO trip_records (id, client_id, driver_id, status, request_at) VALUES\n  (1, 1, 10, 'completed', '2024-04-01'),\n  (2, 2, 11, 'cancelled_by_driver', '2024-04-01'),\n  (3, 3, 10, 'cancelled_by_client', '2024-04-01'),\n  (4, 1, 11, 'completed', '2024-04-02'),\n  (5, 3, 10, 'completed', '2024-04-02');\n"
expectedCsv: "request_at,cancellation_rate\n2024-04-01,0.50\n2024-04-02,0.00\n"
solutionSql: "SELECT\n  t.request_at,\n  ROUND(\n    (COUNT(CASE WHEN t.status IN ('cancelled_by_driver', 'cancelled_by_client') THEN 1 END)::NUMERIC\n     / COUNT(*)), 2\n  ) AS cancellation_rate\nFROM trip_records t\nJOIN platform_users c ON t.client_id = c.id AND c.banned = FALSE\nJOIN platform_users d ON t.driver_id = d.id AND d.banned = FALSE\nGROUP BY t.request_at\nORDER BY t.request_at ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-daily-cancellation-rate-unbanned
    label: "Canonical — Ride Cancellation Rate by Unbanned Users"
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
    sql: "SELECT\n  t.request_at,\n  ROUND(\n    (COUNT(CASE WHEN t.status IN ('cancelled_by_driver', 'cancelled_by_client') THEN 1 END)::NUMERIC\n     / COUNT(*)), 2\n  ) AS cancellation_rate\nFROM trip_records t\nJOIN platform_users c ON t.client_id = c.id AND c.banned = FALSE\nJOIN platform_users d ON t.driver_id = d.id AND d.banned = FALSE\nGROUP BY t.request_at\nORDER BY t.request_at ASC;\n"
---

### Ride Cancellation Rate by Unbanned Users

Calculate the cancellation rate of requests with unbanned users (both client and driver must not be banned) for each day. The cancellation rate is computed by dividing the number of cancelled requests (by client or driver) by the total number of requests with unbanned users on that day, rounded to 2 decimal places. Return `request_at` and `cancellation_rate`, ordered by `request_at` ascending.
