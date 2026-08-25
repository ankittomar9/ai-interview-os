---
slug: sql-managers-with-five-direct-reports
title: Engineering Managers with >= 5 Direct Reports
track: SQL
difficulty: MID
tags: [postgresql, joins, self-join, group-by]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/managers-reports
status: PUBLISHED
dbEngine: postgres-13
setupSql: |
  CREATE TABLE employee (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    manager_id INT
  );
  INSERT INTO employee (id, name, department, manager_id) VALUES
    (101, 'John', 'A', NULL),
    (102, 'Dan', 'A', 101),
    (103, 'James', 'A', 101),
    (104, 'Amy', 'A', 101),
    (105, 'Anne', 'A', 101),
    (106, 'Ron', 'A', 101),
    (107, 'Sarah', 'B', NULL);
expectedCsv: |
  name
  John
ordered: true
solutionSql: |
  SELECT m.name
  FROM employee e
  JOIN employee m ON e.manager_id = m.id
  GROUP BY m.id, m.name
  HAVING COUNT(e.id) >= 5
  ORDER BY m.name ASC;
---
### Engineering Managers with >= 5 Direct Reports
Write a query to report managers who supervise at least `5` direct reports.
