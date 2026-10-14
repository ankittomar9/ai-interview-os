---
slug: sql-monthly-user-churn-rate
title: "Month-Over-Month User Retention and Churn Rate"
track: SQL
difficulty: HARD
topics:
  - sql
est_minutes: 20
tags: ['postgresql', 'subquery', 'window-functions', 'churn']
buildProfile: sql-postgres
source: ai-generated:v1
status: PUBLISHED
dbEngine: postgres-13
ordered: true
setupSql: "CREATE TABLE user_logins (\n  user_id INT NOT NULL,\n  login_month DATE NOT NULL\n);\nINSERT INTO user_logins (user_id, login_month) VALUES\n  (1, '2024-01-01'), (2, '2024-01-01'), (3, '2024-01-01'), (4, '2024-01-01'),\n  (1, '2024-02-01'), (2, '2024-02-01'), (5, '2024-02-01'),\n  (1, '2024-03-01'), (5, '2024-03-01');\n"
expectedCsv: "prior_month,active_users,churned_users,churn_rate\n2024-01-01,4,2,0.50\n2024-02-01,3,1,0.33\n"
solutionSql: "WITH distinct_activity AS (\n  SELECT DISTINCT user_id, login_month FROM user_logins\n),\ntransitions AS (\n  SELECT\n    a.login_month AS prior_month,\n    COUNT(a.user_id) AS active_users,\n    COUNT(CASE WHEN b.user_id IS NULL THEN 1 END) AS churned_users\n  FROM distinct_activity a\n  LEFT JOIN distinct_activity b\n    ON a.user_id = b.user_id\n   AND b.login_month = a.login_month + INTERVAL '1 month'\n  WHERE a.login_month < '2024-03-01'\n  GROUP BY a.login_month\n)\nSELECT\n  prior_month,\n  active_users,\n  churned_users,\n  ROUND((churned_users::NUMERIC / active_users), 2) AS churn_rate\nFROM transitions\nORDER BY prior_month ASC;\n"
referenceSolutions:
  - approachId: canonical-sql-monthly-user-churn-rate
    label: "Canonical — Month-Over-Month User Retention and Churn Rate"
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
    sql: "WITH distinct_activity AS (\n  SELECT DISTINCT user_id, login_month FROM user_logins\n),\ntransitions AS (\n  SELECT\n    a.login_month AS prior_month,\n    COUNT(a.user_id) AS active_users,\n    COUNT(CASE WHEN b.user_id IS NULL THEN 1 END) AS churned_users\n  FROM distinct_activity a\n  LEFT JOIN distinct_activity b\n    ON a.user_id = b.user_id\n   AND b.login_month = a.login_month + INTERVAL '1 month'\n  WHERE a.login_month < '2024-03-01'\n  GROUP BY a.login_month\n)\nSELECT\n  prior_month,\n  active_users,\n  churned_users,\n  ROUND((churned_users::NUMERIC / active_users), 2) AS churn_rate\nFROM transitions\nORDER BY prior_month ASC;\n"
---

### Month-Over-Month User Retention and Churn Rate

Calculate monthly churn rate for cohorts active in prior months where next-month activity data is available. Churn rate is defined as users active in month M who did not log in during month M+1, divided by total active users in month M. Return `prior_month`, `active_users`, `churned_users`, and `churn_rate` (rounded to 2 decimal places), ordered by `prior_month` ascending.
