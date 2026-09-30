---
slug: hld-digital-wallet
title: High-Throughput Digital Wallet (Ledger)
track: SYSTEM_DESIGN
difficulty: HARD
topics:
- system-design
est_minutes: 45
tags:
- fintech
- double-entry-bookkeeping
- distributed-ledger
- rockdb
- raft-consensus
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Avoid classic distributed 2-phase commit transactions for high throughput wallet balance updates due to lock contention.
- Use distributed append-only transactional ledgers with partitioned state machines replicated via Raft consensus.
- Maintain separate in-memory balance caches with periodic snapshotting to enable sub-10ms balance lookups.
coaching:
  presentationTips:
  - 'Demonstrate double-entry bookkeeping equations: Assets = Liabilities + Equity for all wallet balance movements.'
  - Detail how hot-wallet accounts (e.g. marketplace merchant receiving thousands of payments/second) are sharded across sub-accounts.
  - 'Discuss zero data loss guarantees: Write-Ahead Logs (WAL) flushed synchronously to non-volatile storage before ACK.'
editorial: '### Architectural Walkthrough & System Analysis: High-Throughput Digital Wallet (Ledger)


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a high-throughput digital wallet platform capable of executing 100,000+ transactional money transfers per second with strict ACID guarantees, zero money loss, and immutable audit trails.

  - **Scale Requirements**: Built for planet-scale traffic with horizontal elasticity and fault tolerance.


  #### 2. High-Level Architecture & Component Responsibilities

  The system decomposes into decoupled tiers:

  - **Edge / API Gateway Tier**: Terminating client sessions, rate limiting, and authenticating requests.

  - **Service Tier**: Stateless microservices handling domain business logic.

  - **Data & Storage Tier**: Polyglot persistence optimizing storage for read patterns, write patterns, and data volume.


  #### 3. Key Bottlenecks, Tradeoffs & Deep Dive

  - **Consistency vs Availability**: Balanced per CAP theorem principles to ensure responsive client experiences.

  - **Partitioning & Sharding**: Distributed across nodes to eliminate single-point-of-failure bottlenecks.

  - **Resilience**: Asynchronous queues, read-replicas, and circuit breakers ensure graceful degradation during partial outages.


  #### 4. Operational Monitoring & Failure Recovery

  - Comprehensive telemetry tracking latency (P95/P99), error rates, throughput, and queue lag.

  - Automated failover and health checks ensure rapid recovery with zero data loss.'
referenceSolutions:
- approachId: double-entry-event-sourcing
  label: Primary — Event-Sourced Double-Entry Ledger with CQRS
  approachClass: PRIMARY
  kind: WRITEUP
  summary: Financial-grade digital wallet architecture using immutable double-entry bookkeeping ledger journals, CQRS read models, and distributed balance snapshots.
  keyIdea: Every money transfer creates immutable balanced debit and credit ledger postings; account balance is the aggregate sum of journal entries with periodic snapshots.
  tradeoffs:
  - Mathematical auditability and zero money creation/loss bug risks
  - Read balance queries require snapshot aggregation or asynchronous CQRS read projections
  whenToUse: Banking apps, PayPal/Venmo style peer-to-peer wallets, and enterprise financial systems requiring strict accounting compliance.
  diagramNotes: Client -> API Gateway -> Idempotency Filter -> Wallet Command Service -> PostgreSQL / CockroachDB (Append-Only Journal Entries) -> CDC Debezium -> Kafka -> Wallet Query Service (Redis Cache).
  writeUp: "### 1. Requirements Recap\n- **Functional**: User wallet deposit, withdrawal, peer-to-peer transfer, balance check, and historical audit statement.\n- **Scale**: 50 million active users, 10,000 transfers/sec peak, zero data loss, zero fractional penny rounding errors.\n\n### 2. Component Breakdown\n- **Idempotency Service**: Redis + PostgreSQL uniqueness table checking `idempotency_key` to avoid double debits.\n- **Double-Entry Journal Database**: Relational ACID storage (PostgreSQL/CockroachDB) enforcing `SUM(debit) == SUM(credit)` constraint per transaction.\n- **Balance Snapshot Engine**: Nightly or per-1000-events snapshot worker creating aggregate balance checkpoints.\n- **CQRS Read Projection**: Kafka event consumer updating materialized wallet balance views in Redis for instant mobile UI queries.\n\n### 3. Data Flow\n1. User A transfers $50 to User B with idempotency key.\n2. Command service verifies A's balance >= $50.\n3. In a single ACID database transaction:\n   -\
    \ Insert transaction record `TX101`.\n   - Insert Journal Posting 1: Debit User A Account ($50).\n   - Insert Journal Posting 2: Credit User B Account ($50).\n4. Transaction commits. Change Data Capture (CDC) publishes `TransactionCommitted` to Kafka.\n5. Projection worker updates cached balances in Redis for User A (-$50) and User B (+$50).\n\n### 4. Capacity & Consistency Notes\n- **Storage**: Monotonic auto-incrementing 64-bit ledger IDs; all currency amounts stored as signed 64-bit integers in cents/pennies.\n- **Consistency**: Strict serializable consistency on ledger writes; eventual consistency (sub-second) on balance display."
- approachId: two-phase-commit-distributed-transactions
  label: Alternate — Distributed 2PC Saga with Outbox Pattern
  approachClass: ALTERNATE
  kind: WRITEUP
  summary: Microservice wallet architecture using a distributed Orchestrated Saga with Transactional Outbox pattern across decoupled Account, Ledger, and Fraud microservices.
  keyIdea: Coordinate multi-service fund transfers using a Saga Orchestrator that issues local service transactions with compensating rollback transactions on failure.
  tradeoffs:
  - Decouples individual service databases across organizational team boundaries
  - Requires complex compensating transaction logic when middle stages fail
  whenToUse: Large enterprise platforms where Account Management, Risk/Fraud, and Payment Gateway are autonomous microservices.
  diagramNotes: 'Client -> Saga Orchestrator -> [Step 1: Reserve Funds] -> [Step 2: Fraud Check] -> [Step 3: Credit Target] -> [Step 4: Finalize]. Failure triggers compensating rollbacks.'
  writeUp: '### 1. Requirements Recap

    - **Functional**: Distributed multi-system wallet operations across separate microservice domains.

    - **Scale**: Independent microservice deployments with zero distributed deadlock.


    ### 2. Component Breakdown

    - **Saga Orchestrator**: Temporal / Camunda state machine directing saga execution steps.

    - **Account Service**: Manages reserved and available balance pools.

    - **Transactional Outbox Table**: Ensures reliable event publishing to Kafka without distributed 2PC locking.


    ### 3. Data Flow

    1. Orchestrator triggers `ReserveFundsCommand` in Account Service.

    2. Funds moved from `AVAILABLE` to `RESERVED`. Outbox event emitted.

    3. Orchestrator triggers `FraudEvaluationCommand`. If approved, triggers `CreditTargetCommand`.

    4. If target credit fails, compensating transaction `ReleaseReservedFunds` executes.


    ### 4. Capacity & Consistency Notes

    - **Consistency**: Eventual consistency between services; local ACID consistency within each microservice boundary.'
---

### Problem Scope: High-Throughput Digital Wallet (Ledger)

Design a high-throughput digital wallet platform capable of executing 100,000+ transactional money transfers per second with strict ACID guarantees, zero money loss, and immutable audit trails.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of High-Throughput Digital Wallet (Ledger).
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
