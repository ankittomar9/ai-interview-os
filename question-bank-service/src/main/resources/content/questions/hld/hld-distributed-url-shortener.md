---
slug: hld-distributed-url-shortener
title: "Design a Scalable URL Shortener Service"
track: SYSTEM_DESIGN
difficulty: EASY
topics:
  - system-design
est_minutes: 45
tags: ['url-shortener', 'base62', 'caching', 'nosql']
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
  ### Architectural Walkthrough & System Analysis: Design a Scalable URL Shortener Service

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a high-throughput, low-latency URL shortener service that generates compact 7-character aliases for long URLs and redirects user requests with sub-10ms latency.
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
  - approachId: canonical-hld-distributed-url-shortener
    label: "Primary — Base62 Encoding with Pre-generated Range Offsets & Distributed Cache"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Stateless API nodes encode auto-incrementing 64-bit ID ranges into Base62 strings. Hot redirects are served directly from distributed Redis clusters, falling back to a partitioned NoSQL key-value store (Cassandra or DynamoDB)."
    keyIdea: "Decouple ID generation from web servers using a coordinated ticket server / range allocator, and cache 20% of hot URLs to absorb 80% of redirect traffic."
    tradeoffs:
      - "302 Temporary vs 301 Permanent redirect: 302 enables precise click analytics tracking at the cost of additional server requests."
      - "Base62 7-char keyspace provides 3.5 trillion unique URLs, sufficient for 100 years at 1,000 writes/sec."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "API Gateway -> Stateless App Servers -> Redis Cache -> Cassandra Key-Value Store. ID generation orchestrated via centralized range leases in ZooKeeper."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a high-throughput, low-latency URL shortener service that generates compact 7-character aliases for long URLs and redirects user requests with sub-10ms latency.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: API Gateway -> Stateless App Servers -> Redis Cache -> Cassandra Key-Value Store. ID generation orchestrated via centralized range leases in ZooKeeper.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a Scalable URL Shortener Service

Design a high-throughput, low-latency URL shortener service that generates compact 7-character aliases for long URLs and redirects user requests with sub-10ms latency.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a Scalable URL Shortener Service.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
