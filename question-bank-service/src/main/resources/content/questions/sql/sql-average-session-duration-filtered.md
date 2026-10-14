---
slug: sql-average-session-duration-filtered
title: "Average Session Duration for Engaged Users"
track: SQL
difficulty: EASY
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'date-arithmetic', 'aggregate', 'filtering']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE web_sessions (\n  id INT PRIMARY KEY,\n  user_id INT NOT NULL,\n  start_time TIMESTAMP NOT NULL,\n  end_time TIMESTAMP NOT NULL\n);\nINSERT INTO web_sessions (id, user_id, start_time, end_time) VALUES\n  (1, 101, '2024-01-01 10:00:00', '2024-01-01 10:25:00'),\n  (2, 101, '2024-01-02 14:00:00', '2024-01-02 14:35:00'),\n  (3, 102, '2024-01-01 09:00:00', '2024-01-01 09:00:30'),\n  (4, 102, '2024-01-03 11:00:00', '2024-01-03 11:45:00'),\n  (5, 103, '2024-01-01 08:00:00', '2024-01-01 08:00:15');\n"
expectedCsv: "user_id,avg_minutes\n101,30.00\n102,45.00\n"
solutionSql: "SELECT\n  user_id,\n  ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60)::NUMERIC, 2) AS avg_minutes\nFROM web_sessions\nWHERE EXTRACT(EPOCH FROM (end_time - start_time)) >= 60\nGROUP BY user_id\nORDER BY user_id ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-average-session-duration-filtered
    label: "Canonical — Average Session Duration for Engaged Users"
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
    sql: "SELECT\n  user_id,\n  ROUND(AVG(EXTRACT(EPOCH FROM (end_time - start_time)) / 60)::NUMERIC, 2) AS avg_minutes\nFROM web_sessions\nWHERE EXTRACT(EPOCH FROM (end_time - start_time)) >= 60\nGROUP BY user_id\nORDER BY user_id ASC;\n"
---

### Average Session Duration for Engaged Users

Calculate the average session duration in minutes (rounded to 2 decimal places) for each user. Only consider engaged sessions that lasted at least 60 seconds (1 minute). Return `user_id` and `avg_minutes`, ordered by `user_id` ascending.
