---
slug: sql-exchange-adjacent-seats
title: Auditorium Adjacent Seat Number Swap
track: SQL
difficulty: MEDIUM
topics:
- sql
est_minutes: 20
tags:
- postgresql
- case-when
- modulo
- window-functions
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/seat-exchange
status: PUBLISHED
dbEngine: postgres-13
setupSql: "CREATE TABLE seat (\n  id INT PRIMARY KEY,\n  student VARCHAR(50) NOT NULL\n);\nINSERT INTO seat (id, student) VALUES\n  (1, 'Abbot'),\n  (2, 'Doris'),\n  (3, 'Emerson'),\n  (4, 'Green'),\n  (5, 'Jeames');\n"
expectedCsv: 'id,student

  1,Doris

  2,Abbot

  3,Green

  4,Emerson

  5,Jeames

  '
ordered: true
solutionSql: "SELECT\n  id,\n  CASE\n    WHEN id % 2 = 1 AND id = (SELECT COUNT(*) FROM seat) THEN student\n    WHEN id % 2 = 1 THEN LEAD(student, 1) OVER (ORDER BY id)\n    ELSE LAG(student, 1) OVER (ORDER BY id)\n  END AS student\nFROM seat\nORDER BY id ASC;\n"
referenceSolutions:
- approachId: canonical-exchange-adjacent-seats
  label: Canonical — Auditorium Adjacent Seat Number Swap
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
  sql: "SELECT\n  id,\n  CASE\n    WHEN id % 2 = 1 AND id = (SELECT COUNT(*) FROM seat) THEN student\n    WHEN id % 2 = 1 THEN LEAD(student, 1) OVER (ORDER BY id)\n    ELSE LAG(student, 1) OVER (ORDER BY id)\n  END AS student\nFROM seat\nORDER BY id ASC;\n"
- approachId: window-lag-lead-seat-swap
  label: Alternate — Window Functions LAG / LEAD Projection
  approachClass: ALTERNATE
  kind: SQL
  summary: A modern window-function solution that swaps student assignments rather than mutating IDs. Odd rows take the subsequent student via LEAD, even rows take the previous student via LAG, and an odd trailing row retains its original student via COALESCE.
  keyIdea: Use LEAD to fetch the next student for odd seats and LAG to fetch the prior student for even seats.
  timeComplexity: O(N log N)
  spaceComplexity: O(N)
  tradeoffs:
  - Keeps seat IDs strictly sequential without arithmetic manipulation
  - Window function evaluation requires full table scan
  whenToUse: When seat IDs are immutable foreign keys and only assigned student payloads should be exchanged.
  sql: "SELECT\n  id,\n  CASE\n    WHEN id % 2 = 1 THEN COALESCE(LEAD(student, 1) OVER (ORDER BY id), student)\n    ELSE LAG(student, 1) OVER (ORDER BY id)\n  END AS student\nFROM seat\nORDER BY id ASC;"
---

### Auditorium Adjacent Seat Number Swap
Write a query to swap the seat ID of every two consecutive students. If the total number of students is odd, the last student remains in their seat.
