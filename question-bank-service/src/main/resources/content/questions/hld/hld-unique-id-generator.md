---
slug: hld-unique-id-generator
title: Distributed Unique ID Generator (Snowflake)
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics: [system-design]
est_minutes: 45
tags:
- distributed-systems
- id-generation
- snowflake
- timestamp
- high-throughput
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Centralized database auto-increment fails under horizontal scaling and high QPS requirements.
- 'Structure 64-bit integer IDs: 1 sign bit + 41 timestamp bits + 10 machine/datacenter bits + 12 sequence bits.'
- Handle NTP clock drift and backwards clock skew gracefully by rejecting or waiting out clock adjustments.
coaching:
  presentationTips:
  - 'Break down the 64-bit layout bit-by-bit: demonstrate 69 years of millisecond timestamps and 4096 IDs/ms per node.'
  - Explain multi-datacenter deployment without inter-node coordination during ID generation.
  - Discuss how sequence rollover is handled within the same millisecond.
editorial: '### Architectural Walkthrough & System Analysis: Distributed Unique ID Generator (Snowflake)


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a high-throughput, low-latency distributed unique 64-bit ID generator (Twitter Snowflake-style)
  capable of generating roughly 10,000+ globally sortable IDs per second per machine.

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
### Problem Scope: Distributed Unique ID Generator (Snowflake)

Design a high-throughput, low-latency distributed unique 64-bit ID generator (Twitter Snowflake-style) capable of generating roughly 10,000+ globally sortable IDs per second per machine.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Distributed Unique ID Generator (Snowflake).
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
