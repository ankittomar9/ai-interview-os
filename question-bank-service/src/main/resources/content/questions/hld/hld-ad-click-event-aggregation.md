---
slug: hld-ad-click-event-aggregation
title: Real-Time Ad Click Event Aggregation Pipeline
track: SYSTEM_DESIGN
difficulty: SENIOR
tags:
- stream-processing
- ad-tech
- flink
- kafka
- exactly-once
- sliding-window
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Ingest click events through distributed messaging queues (Kafka) partitioned by `ad_id`.
- Use stateful stream processing engines (Apache Flink) with tumbling and sliding windows to aggregate metrics in real time.
- Handle out-of-order and late-arriving events using event-time watermarks.
coaching:
  presentationTips:
  - 'Walk through exactly-once processing: distributed snapshots (Chandy-Lamport algorithm) + idempotent two-phase commit
    sinks.'
  - 'Explain reconciliation: compare real-time streaming aggregates against offline batch ETL reconciliation jobs for billing
    accuracy.'
  - Discuss ad-fraud detection filters (duplicate clicks, bot IP filtering) prior to metric aggregation.
editorial: '### Architectural Walkthrough & System Analysis: Real-Time Ad Click Event Aggregation Pipeline


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a high-throughput real-time ad click event aggregation platform supporting billions of daily
  clicks, sub-minute aggregation reporting, exactly-once processing semantics, and billing integrity.

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
### Problem Scope: Real-Time Ad Click Event Aggregation Pipeline

Design a high-throughput real-time ad click event aggregation platform supporting billions of daily clicks, sub-minute aggregation reporting, exactly-once processing semantics, and billing integrity.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Real-Time Ad Click Event Aggregation Pipeline.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
