---
slug: incident-db-connection-pool-exhaustion
title: "Incident: Database Connection Pool Exhaustion Under Load"
track: SYSTEM_TROUBLESHOOTING
difficulty: MEDIUM
topics:
  - incident-response
  - performance-tuning
est_minutes: 40
tags: ['incident', 'database', 'connection-pool', 'hikaricp', 'latency-spike', 'debugging']
buildProfile: judge0
source: enterprise-incidents:v1
status: PUBLISHED
hints:
  - "Observe the correlation between incoming request concurrency and active vs idle pool connections."
  - "Inspect transaction boundaries: are long-running external HTTP calls executed inside `@Transactional` blocks?"
  - "Check whether connections are returned to the pool in `finally` blocks when exceptions occur."
coaching:
  presentationTips:
    - "Demonstrate disciplined incident triage: Mitigate first (shed load / restart if necessary), then Isolate, then Permanently Fix."
    - "Explain why holding a DB connection open while awaiting a slow 3rd-party API response starves the entire pool."
editorial: |
  ### Production Incident Walkthrough: Diagnosing Connection Pool Starvation

  #### 1. Incident Timeline & Telemetry Analysis
  - **Symptom**: Service p99 latency spikes from 35ms to 30,000ms. Error logs fill with:
    `HikariPool-1 - Connection is not available, request timed out after 30000ms`
  - **Database Metric**: PostgreSQL reports connection count at max (100/100), yet CPU utilization on the database node is under 8%.
  - **Conclusion**: The database is idle; the application is failing to return connections to the pool.

  #### 2. Root Cause Isolation
  Code analysis in `PaymentProcessingService`:
  ```java
  @Transactional
  public PaymentReceipt processPayment(PaymentRequest req) {
      PaymentRecord record = paymentRepo.save(req.toEntity());
      // BUG: Holding DB transaction open during external HTTP call to Stripe!
      PaymentGatewayResponse res = stripeClient.charge(req.getCardToken(), req.getAmount());
      record.setStatus(res.isSuccess() ? SUCCESS : FAILED);
      return paymentRepo.save(record).toReceipt();
  }
  ```
  When Stripe's API latencies rose to 1.8 seconds, all 100 Hikari connections were blocked waiting on external network I/O, starving all other customer transactions.

  #### 3. Permanent Remediation
  - Move external network I/O outside the database transaction.
  - Implement circuit breakers and strict HTTP timeouts on the payment client.
  - Configure pool leak detection (`leakDetectionThreshold = 5000ms`).
referenceSolutions:
  - approachId: canonical-incident-connection-pool
    label: "Primary — Decouple External I/O from Transaction Scope and Enable Leak Detection"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Refactors payment processing to release the database connection before initiating external gateway calls, and configures HikariCP leak detection to identify unclosed connections."
    keyIdea: "Never hold a database connection open while waiting for external network I/O."
    tradeoffs:
      - "Requires explicit multi-phase record persistence (PENDING -> external call -> COMPLETED/FAILED) instead of single-method transactional rollback."
    writeUp: |
      ### 1. Incident Triage & Immediate Mitigation
      - **Symptom Recognition**: Hikari pool timeout exceptions with low DB CPU indicate connection starvation rather than slow database execution.
      - **Immediate Mitigation**: If the third-party provider is degraded, temporarily engage a circuit breaker to reject or queue incoming payment requests early, relieving pool starvation for the rest of the application.

      ### 2. Root Cause Remediation
      - **Decouple External Calls from Transactions**:
        1. In a short read-write transaction, insert the `PaymentRecord` with status `PENDING` and commit immediately.
        2. Execute the remote HTTP call to Stripe outside any `@Transactional` scope.
        3. In a second short transaction, update the record status to `SUCCESS` or `FAILED` based on the response.
      - **Pool Configuration**:
        - Configure `leakDetectionThreshold = 5000ms` in HikariCP.
        - Ensure `connectionTimeout = 5000ms` and set explicit socket timeouts (`connectTimeout = 2000ms`, `readTimeout = 3000ms`) on the HTTP payment client.
---

# Incident: Database Connection Pool Exhaustion Under Load

### Incident Overview
At 14:15 UTC, the Order Processing Service triggered a P1 alert: **p99 latency escalated to 30s, and API success rate dropped below 20%**.

### Telemetry & Logs
```
2026-10-27T14:16:02.104Z WARN  [HikariPool-1] - Connection is not available, request timed out after 30000ms.
2026-10-27T14:16:02.105Z ERROR [OrderController] - Failed to process order: ConnectionTimeoutException
Active Connections: 100/100 (100% saturation)
PostgreSQL DB CPU: 7% (Database is largely idle)
External Fraud API p95: 2,400ms (Degraded upstream)
```

### Your Tasks as Incident Commander
1. **Analyze the telemetry**: What explains the discrepancy between 100% pool saturation and near-idle database CPU?
2. **Identify the root cause**: What code pattern causes connections to be held hostage during upstream API slowdowns?
3. **Formulate immediate mitigation vs permanent architectural fix**: How do you restore service immediately, and how do you prevent recurrence?
