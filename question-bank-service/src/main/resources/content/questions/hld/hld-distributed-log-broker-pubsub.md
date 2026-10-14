---
slug: hld-distributed-log-broker-pubsub
title: "Design a Partitioned Distributed Commit Log Broker"
track: SYSTEM_DESIGN
difficulty: HARD
topics:
  - system-design
est_minutes: 45
tags: ['kafka', 'commit-log', 'zero-copy', 'page-cache', 'consensus']
buildProfile: judge0
source: ai-generated:v1
status: PUBLISHED
hints:
  - "Clarify functional requirements, read/write ratios, and availability SLA targets early."
  - "Identify the primary bottleneck: is it disk I/O, network bandwidth, distributed consensus, or lock contention?"
  - "Walk through the end-to-end data flow for both normal operations and edge-case failure modes."
coaching:
  presentationTips:
    - "Structure your presentation: Requirements (5m), Back-of-the-envelope scale (5m), High-Level Architecture (15m), Deep Dives & Bottlenecks (15m), Failure Recovery (5m)."
    - "Quantify your numbers: derive queries per second, network bandwidth, and storage capacity explicitly."
editorial: |
  ### Architectural Walkthrough & System Analysis: Design a Partitioned Distributed Commit Log Broker

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a distributed publish-subscribe message broker supporting millions of messages per second, strict FIFO ordering per partition, zero-copy network reads, and persistent offset tracking.
  - **Scale & Availability**: Target 99.99% availability with horizontal scalability across distributed nodes.

  #### 2. High-Level Architecture & Component Responsibilities
  The platform utilizes a decoupled, resilient architecture:
  - **Edge Tier**: Terminating client sessions, enforcing rate limits, and routing requests.
  - **Service Tier**: Stateless microservices handling core domain workflows and state coordination.
  - **Storage & Caching Tier**: Tiered persistence optimizing for write throughput and fast analytical/read access.

  #### 3. Key Bottlenecks, Tradeoffs & Deep Dive
  - **Consistency vs Availability**: Balanced in accordance with CAP theorem principles.
  - **Partitioning & Sharding**: Data partitioned across nodes to eliminate single-point-of-failure bottlenecks.
  - **Resilience**: Asynchronous queues, circuit breakers, and read replicas ensure graceful degradation during partial outages.

  #### 4. Operational Monitoring & Failure Recovery
  - Track p95/p99 latency, error rates, throughput, and replication lag across all tiers.
  - Automated health probes and fast failover ensure rapid recovery without data loss.
referenceSolutions:
  - approachId: canonical-hld-distributed-log-broker-pubsub
    label: "Primary — Segmented Append-Only Commit Log with OS Page Cache and Zero-Copy Sendfile"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Topics are divided into ordered, immutable partition logs on disk. Messages append sequentially. Consumers read via offset pointers. Broker nodes use Linux `sendfile()` zero-copy system calls to transfer data directly from OS page cache to network sockets."
    keyIdea: "Rely on sequential disk I/O and OS page cache zero-copy primitives to achieve hardware-line-rate network throughput."
    tradeoffs:
      - "Zero-copy eliminates user-space context switches and memory copies, saturating 10Gbps network cards."
      - "Partition-level ordering requires consumers to handle cross-partition re-ordering if global order is necessary."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "Producer SDK -> Partition Broker (Commit Log Segments) -> OS Page Cache -> Zero-Copy Sendfile -> Consumer Group Coordinators -> Raft Controller."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a distributed publish-subscribe message broker supporting millions of messages per second, strict FIFO ordering per partition, zero-copy network reads, and persistent offset tracking.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: Producer SDK -> Partition Broker (Commit Log Segments) -> OS Page Cache -> Zero-Copy Sendfile -> Consumer Group Coordinators -> Raft Controller.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a Partitioned Distributed Commit Log Broker

Design a distributed publish-subscribe message broker supporting millions of messages per second, strict FIFO ordering per partition, zero-copy network reads, and persistent offset tracking.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a Partitioned Distributed Commit Log Broker.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
