---
slug: hld-consistent-hashing
title: Design Consistent Hashing
track: SYSTEM_DESIGN
difficulty: MID
tags:
- distributed-systems
- hashing
- virtual-nodes
- data-partitioning
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Traditional modulo hashing causes severe remapping storms during server additions or departures.
- Map servers and keys onto a circular 2^32-1 hash ring and route keys clockwise to the nearest server.
- Deploy virtual nodes (e.g. 100-256 tokens per physical server) to eliminate hot-spots and achieve uniform load distribution.
coaching:
  presentationTips:
  - Contrast hash(key) % N against consistent hashing with clear mathematical intuition.
  - Illustrate virtual node token allocation and how key redistribution is localized upon node failure.
  - Discuss production implementations in Amazon DynamoDB and Apache Cassandra.
editorial: '### Architectural Walkthrough & System Analysis: Design Consistent Hashing


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a distributed consistent hashing mechanism to route request keys across a dynamic cluster
  of cache/storage nodes with minimal key movement during topology changes.

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
### Problem Scope: Design Consistent Hashing

Design a distributed consistent hashing mechanism to route request keys across a dynamic cluster of cache/storage nodes with minimal key movement during topology changes.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design Consistent Hashing.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
