---
slug: sql-dense-rank-department-salaries
title: Department Top 3 Earners via DENSE_RANK
track: SQL
difficulty: HARD
topics:
- sql
est_minutes: 20
tags:
- postgresql
- window-functions
- dense-rank
- joins
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/dense-rank-salaries
status: PUBLISHED
dbEngine: postgres-13
setupSql: "CREATE TABLE department (\n  id INT PRIMARY KEY,\n  name VARCHAR(50) NOT NULL\n);\nCREATE TABLE employee (\n  id INT PRIMARY KEY,\n  name VARCHAR(50) NOT NULL,\n  salary INT NOT NULL,\n  department_id INT NOT NULL REFERENCES department(id)\n);\nINSERT INTO department (id, name) VALUES (1, 'IT'), (2, 'Sales');\nINSERT INTO employee (id, name, salary, department_id) VALUES\n  (1, 'Alice', 90000, 1),\n  (2, 'Bob', 85000, 1),\n  (3, 'Charlie', 85000, 1),\n  (4, 'David', 70000, 1),\n  (5, 'Eve', 60000, 1),\n  (6, 'Frank', 80000, 2),\n  (7, 'Grace', 80000, 2),\n  (8, 'Heidi', 75000, 2);\n"
expectedCsv: 'department,employee,salary

  IT,Alice,90000

  IT,Bob,85000

  IT,Charlie,85000

  Sales,Frank,80000

  Sales,Grace,80000

  Sales,Heidi,75000

  '
ordered: true
solutionSql: "WITH ranked AS (\n  SELECT\n    d.name AS department,\n    e.name AS employee,\n    e.salary,\n    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) as rank_val\n  FROM employee e\n  JOIN department d ON e.department_id = d.id\n)\nSELECT department, employee, salary\nFROM ranked\nWHERE rank_val <= 3\nORDER BY department ASC, salary DESC, employee ASC;\n"
referenceSolutions:
- approachId: canonical-dense-rank-department-salaries
  label: Canonical — Department Top 3 Earners via DENSE_RANK
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
  sql: "WITH ranked AS (\n  SELECT\n    d.name AS department,\n    e.name AS employee,\n    e.salary,\n    DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) as rank_val\n  FROM employee e\n  JOIN department d ON e.department_id = d.id\n)\nSELECT department, employee, salary\nFROM ranked\nWHERE rank_val <= 3\nORDER BY department ASC, salary DESC, employee ASC;\n"
- approachId: correlated-subquery-top-three
  label: Alternate — Correlated Subquery Counting Higher Salaries
  approachClass: ALTERNATE
  kind: SQL
  summary: A classic ANSI SQL solution compatible with older database engines without window function support. Correlates each employee against their department peers, selecting rows where fewer than 3 distinct salaries exceed their own.
  keyIdea: Find high earners by counting how many distinct salaries in the same department exceed the employee's salary.
  timeComplexity: O(N^2)
  spaceComplexity: O(1)
  tradeoffs:
  - Universal ANSI-92 compatibility across legacy SQL engines
  - Quadratic execution cost compared to O(N log N) single-pass DENSE_RANK()
  whenToUse: When querying databases without window function support or demonstrating fundamental relational subquery mechanics.
  sql: "SELECT\n  d.name AS department,\n  e1.name AS employee,\n  e1.salary\nFROM employee e1\nJOIN department d ON e1.department_id = d.id\nWHERE (\n  SELECT COUNT(DISTINCT e2.salary)\n  FROM employee e2\n  WHERE e2.department_id = e1.department_id\n    AND e2.salary > e1.salary\n) < 3\nORDER BY department ASC, salary DESC, employee ASC;"
---

### Department Top 3 Earners via DENSE_RANK
Write a PostgreSQL SQL query to find employees who earn top 3 unique salaries in each department. If there are ties in compensation, include all tied employees.
