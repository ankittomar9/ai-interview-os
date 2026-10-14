---
slug: sql-median-employee-compensation-by-dept
title: "Median Compensation Across Active Departments"
track: SQL
difficulty: HARD
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'window-functions', 'median', 'percentile']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE staff_records (\n  id INT PRIMARY KEY,\n  department VARCHAR(30) NOT NULL,\n  salary INT NOT NULL,\n  active BOOLEAN NOT NULL\n);\nINSERT INTO staff_records (id, department, salary, active) VALUES\n  (1, 'Engineering', 90000, TRUE),\n  (2, 'Engineering', 110000, TRUE),\n  (3, 'Engineering', 130000, TRUE),\n  (4, 'Marketing', 60000, TRUE),\n  (5, 'Marketing', 80000, TRUE),\n  (6, 'Marketing', 100000, TRUE),\n  (7, 'Marketing', 120000, TRUE),\n  (8, 'Engineering', 250000, FALSE);\n"
expectedCsv: "department,median_salary\nEngineering,110000.00\nMarketing,90000.00\n"
solutionSql: "SELECT\n  department,\n  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)::NUMERIC, 2) AS median_salary\nFROM staff_records\nWHERE active = TRUE\nGROUP BY department\nORDER BY department ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-median-employee-compensation-by-dept
    label: "Canonical — Median Compensation Across Active Departments"
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
    sql: "SELECT\n  department,\n  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary)::NUMERIC, 2) AS median_salary\nFROM staff_records\nWHERE active = TRUE\nGROUP BY department\nORDER BY department ASC;\n"
---

### Median Compensation Across Active Departments

Calculate the median salary for active employees within each department using PostgreSQL continuous percentile aggregation (`PERCENTILE_CONT(0.5)`). Return `department` and `median_salary` (rounded to 2 decimal places), ordered by `department` ascending.
