---
slug: sql-managers-with-five-direct-reports
title: Engineering Managers with >= 5 Direct Reports
track: SQL
difficulty: MEDIUM
topics:
- sql
est_minutes: 20
tags:
- postgresql
- joins
- self-join
- group-by
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/managers-reports
status: PUBLISHED
dbEngine: postgres-13
setupSql: "CREATE TABLE employee (\n  id INT PRIMARY KEY,\n  name VARCHAR(50) NOT NULL,\n  department VARCHAR(50) NOT NULL,\n  manager_id INT\n);\nINSERT INTO employee (id, name, department, manager_id) VALUES\n  (101, 'John', 'A', NULL),\n  (102, 'Dan', 'A', 101),\n  (103, 'James', 'A', 101),\n  (104, 'Amy', 'A', 101),\n  (105, 'Anne', 'A', 101),\n  (106, 'Ron', 'A', 101),\n  (107, 'Sarah', 'B', NULL);\n"
expectedCsv: 'name

  John

  '
ordered: true
solutionSql: 'SELECT m.name

  FROM employee e

  JOIN employee m ON e.manager_id = m.id

  GROUP BY m.id, m.name

  HAVING COUNT(e.id) >= 5

  ORDER BY m.name ASC;

  '
referenceSolutions:
- approachId: canonical-managers-with-five-direct-reports
  label: Canonical — Engineering Managers with >= 5 Direct Reports
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
  sql: 'SELECT m.name

    FROM employee e

    JOIN employee m ON e.manager_id = m.id

    GROUP BY m.id, m.name

    HAVING COUNT(e.id) >= 5

    ORDER BY m.name ASC;

    '
- approachId: in-subquery-group-by
  label: Alternate — IN-Subquery with Aggregated Manager Counts
  approachClass: ALTERNATE
  kind: SQL
  summary: A clean subquery pattern that isolates the report-counting aggregation in a separate subquery. The outer query simply filters manager records whose ID exists in the qualified manager list.
  keyIdea: Filter managers using an IN condition backed by a subquery aggregating reports by manager_id.
  timeComplexity: O(N)
  spaceComplexity: O(M)
  tradeoffs:
  - Clean separation between aggregation logic and employee metadata retrieval
  - Optimizer handles uncorrelated IN subquery as a semi-join hash lookup
  whenToUse: When keeping the report-counting pipeline strictly decoupled from manager attribute projection.
  sql: "SELECT name\nFROM employee\nWHERE id IN (\n  SELECT manager_id\n  FROM employee\n  WHERE manager_id IS NOT NULL\n  GROUP BY manager_id\n  HAVING COUNT(id) >= 5\n)\nORDER BY name ASC;"
---

### Engineering Managers with >= 5 Direct Reports
Write a query to report managers who supervise at least `5` direct reports.
