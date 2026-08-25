---
slug: sql-duplicate-email-detection
title: Identify and Deduplicate Duplicate User Emails
track: SQL
difficulty: JUNIOR
tags: [postgresql, group-by, having, aggregation]
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/duplicate-emails
status: PUBLISHED
dbEngine: postgres-13
setupSql: |
  CREATE TABLE person (
    id INT PRIMARY KEY,
    email VARCHAR(100) NOT NULL
  );
  INSERT INTO person (id, email) VALUES
    (1, 'a@b.com'),
    (2, 'c@d.com'),
    (3, 'a@b.com');
expectedCsv: |
  email
  a@b.com
ordered: true
solutionSql: |
  SELECT email
  FROM person
  GROUP BY email
  HAVING COUNT(email) > 1
  ORDER BY email ASC;
---
### Identify and Deduplicate Duplicate User Emails
Write a SQL query to report all the duplicate emails in the `person` table.
