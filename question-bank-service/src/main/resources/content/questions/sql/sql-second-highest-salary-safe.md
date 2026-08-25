---
slug: sql-second-highest-salary-safe
title: Null-Safe Second Highest Compensation
track: SQL
difficulty: JUNIOR
tags: [postgresql, subqueries, limit-offset, null-handling]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/second-highest-salary
status: PUBLISHED
dbEngine: postgres-13
setupSql: |
  CREATE TABLE employee (
    id INT PRIMARY KEY,
    salary INT NOT NULL
  );
  INSERT INTO employee (id, salary) VALUES
    (1, 100),
    (2, 200),
    (3, 300);
expectedCsv: |
  second_highest_salary
  200
ordered: false
solutionSql: |
  SELECT (
    SELECT DISTINCT salary
    FROM employee
    ORDER BY salary DESC
    LIMIT 1 OFFSET 1
  ) AS second_highest_salary;
---
### Null-Safe Second Highest Compensation
Write a query to find the second highest distinct salary from the `employee` table. If no second highest salary exists, return `NULL`.
