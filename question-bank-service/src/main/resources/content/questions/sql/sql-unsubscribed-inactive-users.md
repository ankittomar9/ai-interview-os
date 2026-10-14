---
slug: sql-unsubscribed-inactive-users
title: "Recently Registered Users with Zero Purchases"
track: SQL
difficulty: EASY
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'left-join', 'null-check', 'filtering']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE users (\n  id INT PRIMARY KEY,\n  username VARCHAR(50) NOT NULL,\n  registered_at DATE NOT NULL\n);\nCREATE TABLE purchases (\n  id INT PRIMARY KEY,\n  user_id INT NOT NULL,\n  amount NUMERIC(10,2) NOT NULL\n);\nINSERT INTO users (id, username, registered_at) VALUES\n  (1, 'alext', '2024-01-10'),\n  (2, 'brenda', '2024-02-01'),\n  (3, 'connor', '2024-02-15'),\n  (4, 'diana', '2023-12-01');\nINSERT INTO purchases (id, user_id, amount) VALUES\n  (10, 1, 99.00),\n  (11, 4, 150.00);\n"
expectedCsv: "id,username\n2,brenda\n3,connor\n"
solutionSql: "SELECT u.id, u.username\nFROM users u\nLEFT JOIN purchases p ON u.id = p.user_id\nWHERE p.id IS NULL AND u.registered_at >= '2024-01-01'\nORDER BY u.id ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-unsubscribed-inactive-users
    label: "Canonical — Recently Registered Users with Zero Purchases"
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
    sql: "SELECT u.id, u.username\nFROM users u\nLEFT JOIN purchases p ON u.id = p.user_id\nWHERE p.id IS NULL AND u.registered_at >= '2024-01-01'\nORDER BY u.id ASC;\n"
---

### Recently Registered Users with Zero Purchases

Find all users registered on or after '2024-01-01' who have never made any purchases. Return `id` and `username`, ordered by `id` ascending.
