---
slug: hld-key-value-store
title: Distributed Key-Value Store (Dynamo-Style)
track: SYSTEM_DESIGN
difficulty: HARD
topics: [system-design]
est_minutes: 45
tags:
- distributed-storage
- cap-theorem
- quorum-consensus
- sstable
- lsm-tree
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- 'Balance CAP theorem tradeoffs: prioritize high availability and partition tolerance over strict consistency (AP model).'
- Use Quorum consensus (W + R > N) for tunable consistency across replicated nodes.
- Implement LSM-Tree (Log-Structured Merge-Tree) with in-memory MemTable and disk SSTables for high-throughput writes.
coaching:
  presentationTips:
  - 'Walk through the write path: write-ahead log (WAL) -> MemTable (in-memory) -> flush to SSTable -> background compaction.'
  - Explain read repair and anti-entropy with Merkle trees for reconciling divergent replicas.
  - Discuss vector clocks for resolving concurrent write conflicts in decentralized systems.
editorial: '### Architectural Walkthrough & System Analysis: Distributed Key-Value Store (Dynamo-Style)


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a highly available, horizontally scalable distributed key-value store supporting high write
  throughput, tunable consistency, decentralized failure detection (Gossip), and automatic partition rebalancing.

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
### Problem Scope: Distributed Key-Value Store (Dynamo-Style)

Design a highly available, horizontally scalable distributed key-value store supporting high write throughput, tunable consistency, decentralized failure detection (Gossip), and automatic partition rebalancing.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Distributed Key-Value Store (Dynamo-Style).
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
