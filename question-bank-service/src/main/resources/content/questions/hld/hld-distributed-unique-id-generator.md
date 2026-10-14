---
slug: hld-distributed-unique-id-generator
title: "Design a 64-bit Globally Unique Distributed ID Generator"
track: SYSTEM_DESIGN
difficulty: EASY
topics:
  - system-design
est_minutes: 45
tags: ['snowflake', 'id-generator', 'clock-skew', 'distributed-systems']
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
  ### Architectural Walkthrough & System Analysis: Design a 64-bit Globally Unique Distributed ID Generator

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a distributed service capable of generating roughly sortable 64-bit integer IDs at a scale of 50,000 IDs per second per node, without central database coordination.
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
  - approachId: canonical-hld-distributed-unique-id-generator
    label: "Primary — Snowflake-style Distributed ID Architecture (Timestamp + Worker ID + Sequence Counter)"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Each 64-bit ID comprises: 1 sign bit (unused), 41 bits timestamp in milliseconds (~69 years), 10 bits worker/datacenter ID (1,024 nodes), and 12 bits sequence number (4,096 IDs per millisecond per node)."
    keyIdea: "Embed millisecond epoch timestamps directly into the high bits of a 64-bit integer to guarantee time-sortability and eliminate inter-node network roundtrips."
    tradeoffs:
      - "System clock backwards drift: if NTP rolls backward, the node must reject requests or wait until current time catches up."
      - "64-bit integers fit natively in standard database BIGINT and indexing structures without string memory overhead."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "Client App -> Stateless ID Service -> NTP Daemon (Clock Drift Guard) -> ZooKeeper Worker Node Leases."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a distributed service capable of generating roughly sortable 64-bit integer IDs at a scale of 50,000 IDs per second per node, without central database coordination.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: Client App -> Stateless ID Service -> NTP Daemon (Clock Drift Guard) -> ZooKeeper Worker Node Leases.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a 64-bit Globally Unique Distributed ID Generator

Design a distributed service capable of generating roughly sortable 64-bit integer IDs at a scale of 50,000 IDs per second per node, without central database coordination.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a 64-bit Globally Unique Distributed ID Generator.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
