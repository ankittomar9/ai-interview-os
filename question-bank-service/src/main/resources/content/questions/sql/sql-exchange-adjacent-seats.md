---
slug: sql-exchange-adjacent-seats
title: Auditorium Adjacent Seat Number Swap
track: SQL
difficulty: MID
tags: [postgresql, case-when, modulo, window-functions]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/seat-exchange
status: PUBLISHED
dbEngine: postgres-13
setupSql: |
  CREATE TABLE seat (
    id INT PRIMARY KEY,
    student VARCHAR(50) NOT NULL
  );
  INSERT INTO seat (id, student) VALUES
    (1, 'Abbot'),
    (2, 'Doris'),
    (3, 'Emerson'),
    (4, 'Green'),
    (5, 'Jeames');
expectedCsv: |
  id,student
  1,Doris
  2,Abbot
  3,Green
  4,Emerson
  5,Jeames
ordered: true
solutionSql: |
  SELECT
    id,
    CASE
      WHEN id % 2 = 1 AND id = (SELECT COUNT(*) FROM seat) THEN student
      WHEN id % 2 = 1 THEN LEAD(student, 1) OVER (ORDER BY id)
      ELSE LAG(student, 1) OVER (ORDER BY id)
    END AS student
  FROM seat
  ORDER BY id ASC;
---
### Auditorium Adjacent Seat Number Swap
Write a query to swap the seat ID of every two consecutive students. If the total number of students is odd, the last student remains in their seat.
