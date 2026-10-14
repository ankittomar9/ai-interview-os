---
slug: sql-critical-inventory-restock-alerts
title: "Critical Stock Items Without Pending Reorders"
track: SQL
difficulty: EASY
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'subquery', 'not-in', 'inventory']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE warehouse_stock (\n  sku VARCHAR(20) PRIMARY KEY,\n  item_name VARCHAR(50) NOT NULL,\n  current_qty INT NOT NULL,\n  reorder_level INT NOT NULL\n);\nCREATE TABLE purchase_orders (\n  po_id INT PRIMARY KEY,\n  sku VARCHAR(20) NOT NULL,\n  status VARCHAR(20) NOT NULL\n);\nINSERT INTO warehouse_stock (sku, item_name, current_qty, reorder_level) VALUES\n  ('SKU-100', 'Thermal Printer Paper', 15, 50),\n  ('SKU-200', 'Barcode Scanner Cable', 80, 40),\n  ('SKU-300', 'Lithium Battery Pack', 5, 20),\n  ('SKU-400', 'Shipping Label Roll', 10, 30);\nINSERT INTO purchase_orders (po_id, sku, status) VALUES\n  (1001, 'SKU-100', 'PENDING'),\n  (1002, 'SKU-200', 'DELIVERED');\n"
expectedCsv: "sku,item_name,current_qty,deficit\nSKU-300,Lithium Battery Pack,5,15\nSKU-400,Shipping Label Roll,10,20\n"
solutionSql: "SELECT\n  sku,\n  item_name,\n  current_qty,\n  (reorder_level - current_qty) AS deficit\nFROM warehouse_stock\nWHERE current_qty < reorder_level\n  AND sku NOT IN (SELECT sku FROM purchase_orders WHERE status = 'PENDING')\nORDER BY deficit ASC, sku ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-critical-inventory-restock-alerts
    label: "Canonical — Critical Stock Items Without Pending Reorders"
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
    sql: "SELECT\n  sku,\n  item_name,\n  current_qty,\n  (reorder_level - current_qty) AS deficit\nFROM warehouse_stock\nWHERE current_qty < reorder_level\n  AND sku NOT IN (SELECT sku FROM purchase_orders WHERE status = 'PENDING')\nORDER BY deficit ASC, sku ASC;\n"
---

### Critical Stock Items Without Pending Reorders

Identify all inventory items whose `current_qty` has fallen strictly below their `reorder_level` and for which NO pending purchase order exists. Compute `deficit = reorder_level - current_qty`. Return `sku`, `item_name`, `current_qty`, and `deficit`, ordered by `deficit` ascending, then `sku` ascending.
