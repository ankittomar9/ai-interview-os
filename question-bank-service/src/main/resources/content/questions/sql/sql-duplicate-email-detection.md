---
slug: sql-duplicate-email-detection
title: Identify and Deduplicate Duplicate User Emails
track: SQL
difficulty: EASY
topics:
- sql
est_minutes: 20
tags:
- postgresql
- group-by
- having
- aggregation
buildProfile: sql-postgres
source: inspired-by:kingsgambitlab/academy-sql/duplicate-emails
status: PUBLISHED
dbEngine: postgres-13
setupSql: "CREATE TABLE person (\n  id INT PRIMARY KEY,\n  email VARCHAR(100) NOT NULL\n);\nINSERT INTO person (id, email) VALUES\n  (1, 'a@b.com'),\n  (2, 'c@d.com'),\n  (3, 'a@b.com');\n"
expectedCsv: 'email

  a@b.com

  '
ordered: true
solutionSql: 'SELECT email

  FROM person

  GROUP BY email

  HAVING COUNT(email) > 1

  ORDER BY email ASC;

  '
referenceSolutions:
- approachId: canonical-duplicate-email-detection
  label: Canonical — Identify and Deduplicate Duplicate User Emails
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
  sql: 'SELECT email

    FROM person

    GROUP BY email

    HAVING COUNT(email) > 1

    ORDER BY email ASC;

    '
- approachId: self-join-inequality-dedup
  label: Alternate — Self-Join with Inequality Filter
  approachClass: ALTERNATE
  kind: SQL
  summary: A self-join formulation linking rows sharing the same email address but possessing distinct IDs. Demonstrates relational join logic without aggregate GROUP BY grouping.
  keyIdea: Identify duplicate emails by joining the table to itself on matching email addresses with non-matching primary keys.
  timeComplexity: O(N log N)
  spaceComplexity: O(N)
  tradeoffs:
  - Demonstrates inner join mechanics without aggregation overhead
  - Requires DISTINCT to eliminate duplicate pairs produced by Cartesian product
  whenToUse: Useful when interviewers ask to solve duplicates without using aggregate functions or GROUP BY.
  sql: 'SELECT DISTINCT p1.email

    FROM person p1

    JOIN person p2 ON p1.email = p2.email AND p1.id <> p2.id

    ORDER BY p1.email ASC;'
---

### Identify and Deduplicate Duplicate User Emails
Write a SQL query to report all the duplicate emails in the `person` table.
