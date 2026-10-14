---
slug: hld-realtime-chat-messaging-platform
title: "Design a Real-Time One-on-One and Group Chat Platform"
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics:
  - system-design
est_minutes: 45
tags: ['websockets', 'presence', 'chat', 'message-ordering']
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
  ### Architectural Walkthrough & System Analysis: Design a Real-Time One-on-One and Group Chat Platform

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a scalable messaging service supporting 50 million concurrent connected users, persistent message history, delivery/read receipts, and online presence indicators.
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
  - approachId: canonical-hld-realtime-chat-messaging-platform
    label: "Primary — Stateful WebSocket Gateways with Distributed Session Registry and Partitioned Message Store"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Persistent WebSocket connections terminate at connection gateways. User-to-gateway mapping is stored in Redis. Messages are persisted to Cassandra/ScyllaDB with monotonically increasing channel sequence IDs and pushed to recipients via internal pub/sub."
    keyIdea: "Decouple connection-handling gateway servers from stateful message persistence, routing messages through a central session registry."
    tradeoffs:
      - "Cassandra wide-column storage ordered by message_id provides high write throughput and fast chronological pagination."
      - "Presence heartbeat updates are throttled to 30-second intervals to prevent broadcast storms."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "Mobile Clients -> WebSocket Connection Managers -> Session Registry (Redis) -> Message Router -> Cassandra Partitioned Store -> Push Notifications Fallback."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a scalable messaging service supporting 50 million concurrent connected users, persistent message history, delivery/read receipts, and online presence indicators.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: Mobile Clients -> WebSocket Connection Managers -> Session Registry (Redis) -> Message Router -> Cassandra Partitioned Store -> Push Notifications Fallback.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a Real-Time One-on-One and Group Chat Platform

Design a scalable messaging service supporting 50 million concurrent connected users, persistent message history, delivery/read receipts, and online presence indicators.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a Real-Time One-on-One and Group Chat Platform.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
