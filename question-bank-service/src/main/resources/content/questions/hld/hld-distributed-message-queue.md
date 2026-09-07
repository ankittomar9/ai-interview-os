---
slug: hld-distributed-message-queue
title: Distributed Message Queue (Kafka-Style)
track: SYSTEM_DESIGN
difficulty: HARD
topics: [system-design]
est_minutes: 45
tags:
- message-queue
- log-structured
- partitions
- consumer-groups
- replication
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Model topics as partitioned, append-only commit logs stored sequentially on disk to maximize sequential I/O throughput.
- Use zero-copy network transfer (`sendfile` system call) and page cache utilization to serve consumers without kernel-user
  memory copies.
- Support Consumer Groups where partitions are divided among group members for scalable, parallel stream processing.
coaching:
  presentationTips:
  - Explain how partition-based sharding enables horizontal write scalability and ordered message guarantees within a partition.
  - Detail leader-follower replica synchronization (In-Sync Replicas / ISR) and how election occurs upon broker failure.
  - 'Discuss offset commit semantics: at-least-once, at-most-once, and transactional exactly-once processing.'
editorial: '### Architectural Walkthrough & System Analysis: Distributed Message Queue (Kafka-Style)


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design an append-only, high-throughput distributed commit log message broker (e.g. Apache Kafka)
  supporting ordered partitions, consumer groups, persistent disk retention, and leader-follower replication.

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
### Problem Scope: Distributed Message Queue (Kafka-Style)

Design an append-only, high-throughput distributed commit log message broker (e.g. Apache Kafka) supporting ordered partitions, consumer groups, persistent disk retention, and leader-follower replication.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Distributed Message Queue (Kafka-Style).
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
