---
slug: sql-top-selling-product-per-category
title: "Highest Volume Product Per Merchandise Category"
track: SQL
difficulty: MEDIUM
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'window-functions', 'rank', 'partition-by']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE categories (\n  id INT PRIMARY KEY,\n  name VARCHAR(50) NOT NULL\n);\nCREATE TABLE products (\n  id INT PRIMARY KEY,\n  category_id INT NOT NULL,\n  name VARCHAR(50) NOT NULL\n);\nCREATE TABLE order_items (\n  id INT PRIMARY KEY,\n  product_id INT NOT NULL,\n  quantity INT NOT NULL\n);\nINSERT INTO categories (id, name) VALUES (1, 'Electronics'), (2, 'Books');\nINSERT INTO products (id, category_id, name) VALUES\n  (10, 1, 'Noise-Cancelling Headphones'),\n  (11, 1, 'Mechanical Keyboard'),\n  (20, 2, 'Distributed Systems Guide'),\n  (21, 2, 'Database Internals');\nINSERT INTO order_items (id, product_id, quantity) VALUES\n  (1, 10, 120), (2, 10, 30),\n  (3, 11, 200),\n  (4, 20, 450),\n  (5, 21, 300), (6, 21, 100);\n"
expectedCsv: "category_name,product_name,total_sold\nBooks,Distributed Systems Guide,450\nElectronics,Mechanical Keyboard,200\n"
solutionSql: "WITH ranked_products AS (\n  SELECT\n    c.name AS category_name,\n    p.name AS product_name,\n    SUM(oi.quantity) AS total_sold,\n    DENSE_RANK() OVER (PARTITION BY c.id ORDER BY SUM(oi.quantity) DESC) AS rnk\n  FROM categories c\n  JOIN products p ON c.id = p.category_id\n  JOIN order_items oi ON p.id = oi.product_id\n  GROUP BY c.id, c.name, p.id, p.name\n)\nSELECT category_name, product_name, total_sold\nFROM ranked_products\nWHERE rnk = 1\nORDER BY category_name ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-top-selling-product-per-category
    label: "Canonical — Highest Volume Product Per Merchandise Category"
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
    sql: "WITH ranked_products AS (\n  SELECT\n    c.name AS category_name,\n    p.name AS product_name,\n    SUM(oi.quantity) AS total_sold,\n    DENSE_RANK() OVER (PARTITION BY c.id ORDER BY SUM(oi.quantity) DESC) AS rnk\n  FROM categories c\n  JOIN products p ON c.id = p.category_id\n  JOIN order_items oi ON p.id = oi.product_id\n  GROUP BY c.id, c.name, p.id, p.name\n)\nSELECT category_name, product_name, total_sold\nFROM ranked_products\nWHERE rnk = 1\nORDER BY category_name ASC;\n"
---

### Highest Volume Product Per Merchandise Category

For each category, determine the top-selling product by total units sold. In case of ties, include all tied products. Return `category_name`, `product_name`, and `total_sold`, ordered by `category_name` ascending.
