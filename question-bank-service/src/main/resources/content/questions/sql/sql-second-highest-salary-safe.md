---
slug: sql-second-highest-salary-safe
title: Null-Safe Second Highest Compensation
track: SQL
difficulty: EASY
topics:
- sql
est_minutes: 20
tags:
- postgresql
- subqueries
- limit-offset
- null-handling
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/second-highest-salary
status: PUBLISHED
dbEngine: postgres-13
setupSql: "CREATE TABLE employee (\n  id INT PRIMARY KEY,\n  salary INT NOT NULL\n);\nINSERT INTO employee (id, salary) VALUES\n  (1, 100),\n  (2, 200),\n  (3, 300);\n"
expectedCsv: 'second_highest_salary

  200

  '
ordered: false
solutionSql: "SELECT (\n  SELECT DISTINCT salary\n  FROM employee\n  ORDER BY salary DESC\n  LIMIT 1 OFFSET 1\n) AS second_highest_salary;\n"
referenceSolutions:
- approachId: canonical-second-highest-salary-safe
  label: Canonical — Null-Safe Second Highest Compensation
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
  sql: "SELECT (\n  SELECT DISTINCT salary\n  FROM employee\n  ORDER BY salary DESC\n  LIMIT 1 OFFSET 1\n) AS second_highest_salary;\n"
- approachId: max-subquery-second-highest
  label: Alternate — MAX() Scalar Subquery Below Maximum
  approachClass: ALTERNATE
  kind: SQL
  summary: A portable aggregate solution using nested MAX() calls. Automatically evaluates to NULL if no second distinct salary exists, without requiring LIMIT/OFFSET database-specific dialect tricks.
  keyIdea: Extract the maximum salary that is strictly less than the overall maximum salary.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Naturally returns NULL when only one distinct salary exists
  - Does not generalize directly to the Nth highest salary without multiple nestings
  whenToUse: Universal ANSI SQL solution for second highest salary that avoids engine-specific LIMIT/OFFSET syntax.
  sql: "SELECT MAX(salary) AS SecondHighestSalary\nFROM employee\nWHERE salary < (\n  SELECT MAX(salary)\n  FROM employee\n);"
---

### Null-Safe Second Highest Compensation
Write a query to find the second highest distinct salary from the `employee` table. If no second highest salary exists, return `NULL`.
