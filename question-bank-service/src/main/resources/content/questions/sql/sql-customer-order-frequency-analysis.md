---
slug: sql-customer-order-frequency-analysis
title: "Frequent Ordering Customers in Current Year"
track: SQL
difficulty: EASY
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'group-by', 'having', 'date-filter']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE customers (\n  id INT PRIMARY KEY,\n  name VARCHAR(50) NOT NULL\n);\nCREATE TABLE orders (\n  id INT PRIMARY KEY,\n  customer_id INT NOT NULL,\n  order_date DATE NOT NULL,\n  amount NUMERIC(10,2) NOT NULL\n);\nINSERT INTO customers (id, name) VALUES\n  (1, 'Alice Corp'), (2, 'Bob LLC'), (3, 'Charlie Inc'), (4, 'Delta Co');\nINSERT INTO orders (id, customer_id, order_date, amount) VALUES\n  (101, 1, '2024-01-15', 150.00),\n  (102, 1, '2024-03-20', 200.00),\n  (103, 1, '2024-06-10', 350.00),\n  (104, 2, '2024-02-14', 50.00),\n  (105, 2, '2024-04-18', 75.00),\n  (106, 3, '2023-11-05', 500.00),\n  (107, 3, '2024-01-10', 400.00),\n  (108, 3, '2024-05-12', 300.00),\n  (109, 3, '2024-08-22', 250.00);\n"
expectedCsv: "customer_id,name,order_count\n1,Alice Corp,3\n3,Charlie Inc,3\n"
solutionSql: "SELECT c.id AS customer_id, c.name, COUNT(o.id) AS order_count\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nWHERE o.order_date >= '2024-01-01' AND o.order_date <= '2024-12-31'\nGROUP BY c.id, c.name\nHAVING COUNT(o.id) >= 3\nORDER BY c.id ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-customer-order-frequency-analysis
    label: "Canonical — Frequent Ordering Customers in Current Year"
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
    sql: "SELECT c.id AS customer_id, c.name, COUNT(o.id) AS order_count\nFROM customers c\nJOIN orders o ON c.id = o.customer_id\nWHERE o.order_date >= '2024-01-01' AND o.order_date <= '2024-12-31'\nGROUP BY c.id, c.name\nHAVING COUNT(o.id) >= 3\nORDER BY c.id ASC;\n"
---

### Frequent Ordering Customers in Current Year

Write a SQL query to find all customers who placed at least 3 orders in the year 2024. Return `customer_id`, `name`, and `order_count`, ordered by `customer_id` ascending.
