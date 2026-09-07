---
slug: hld-payment-system
title: Fault-Tolerant Payment System
track: SYSTEM_DESIGN
difficulty: HARD
topics: [system-design]
est_minutes: 45
tags:
- fintech
- payment-gateway
- idempotency
- reconciliation
- ledger-double-entry
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Enforce strict idempotency on all payment API requests using client-provided idempotency keys cached in distributed stores.
- 'Use double-entry bookkeeping for all ledger recordings: total debits must always equal total credits across accounts.'
- Build an automated asynchronous reconciliation pipeline to match internal ledger records against external bank settlement
  files.
coaching:
  presentationTips:
  - 'Walk through payment lifecycle states: INITIATED -> AUTHORIZED -> CAPTURED -> SETTLED (or FAILED).'
  - 'Explain handling network timeouts during payment processing: never assume failure; query PSP status before retrying.'
  - 'Discuss high availability vs strict ACID consistency: why the payment ledger must use serializable/strong consistency
    databases.'
editorial: '### Architectural Walkthrough & System Analysis: Fault-Tolerant Payment System


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a mission-critical, fault-tolerant payment processing system ensuring strict idempotency,
  audit-compliant double-entry ledgering, and daily bank reconciliation.

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
---
### Problem Scope: Fault-Tolerant Payment System

Design a mission-critical, fault-tolerant payment processing system ensuring strict idempotency, audit-compliant double-entry ledgering, and daily bank reconciliation.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Fault-Tolerant Payment System.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
