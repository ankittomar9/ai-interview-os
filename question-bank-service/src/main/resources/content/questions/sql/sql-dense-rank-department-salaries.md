---
slug: sql-dense-rank-department-salaries
title: Department Top 3 Earners via DENSE_RANK
track: SQL
difficulty: SENIOR
tags: [postgresql, window-functions, dense-rank, joins]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/dense-rank-salaries
status: PUBLISHED
dbEngine: postgres-13
setupSql: |
  CREATE TABLE department (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
  );
  CREATE TABLE employee (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    salary INT NOT NULL,
    department_id INT NOT NULL REFERENCES department(id)
  );
  INSERT INTO department (id, name) VALUES (1, 'IT'), (2, 'Sales');
  INSERT INTO employee (id, name, salary, department_id) VALUES
    (1, 'Alice', 90000, 1),
    (2, 'Bob', 85000, 1),
    (3, 'Charlie', 85000, 1),
    (4, 'David', 70000, 1),
    (5, 'Eve', 60000, 1),
    (6, 'Frank', 80000, 2),
    (7, 'Grace', 80000, 2),
    (8, 'Heidi', 75000, 2);
expectedCsv: |
  department,employee,salary
  IT,Alice,90000
  IT,Bob,85000
  IT,Charlie,85000
  Sales,Frank,80000
  Sales,Grace,80000
  Sales,Heidi,75000
ordered: true
solutionSql: |
  WITH ranked AS (
    SELECT
      d.name AS department,
      e.name AS employee,
      e.salary,
      DENSE_RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) as rank_val
    FROM employee e
    JOIN department d ON e.department_id = d.id
  )
  SELECT department, employee, salary
  FROM ranked
  WHERE rank_val <= 3
  ORDER BY department ASC, salary DESC, employee ASC;
---
### Department Top 3 Earners via DENSE_RANK
Write a PostgreSQL SQL query to find employees who earn top 3 unique salaries in each department. If there are ties in compensation, include all tied employees.
