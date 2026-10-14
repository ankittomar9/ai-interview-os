---
slug: hld-social-media-news-feed
title: "Design a Scalable Social Media News Feed"
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics:
  - system-design
est_minutes: 45
tags: ['fanout-on-write', 'feed', 'redis', 'social-graph']
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
  ### Architectural Walkthrough & System Analysis: Design a Scalable Social Media News Feed

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a personalized social feed system supporting 100M daily active users, fast post publishing, and sub-100ms timeline rendering for standard and celebrity accounts.
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
  - approachId: canonical-hld-social-media-news-feed
    label: "Primary — Hybrid Fanout Architecture (Fanout-on-Write for Standard Users, Fanout-on-Read for Celebrities)"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Regular user posts are fanned out eagerly into followers' Redis timeline lists upon write. Celebrities (>50,000 followers) bypass write fanout; their posts are fetched dynamically and merged on-demand when followers refresh their feed."
    keyIdea: "Prevent write amplification storms by handling high-follower celebrity accounts differently from standard social graph nodes."
    tradeoffs:
      - "Pure push models cause catastrophic write amplification for celebrity accounts with millions of followers."
      - "Hybrid push-pull keeps 99% of user timeline reads sub-50ms while capping write fanout to bounded follower counts."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "Post Service -> Social Graph DB (Neo4j/Postgres) -> Fanout Worker Pool -> Timeline Cache (Redis Sorted Sets) -> NewsFeed Aggregator."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a personalized social feed system supporting 100M daily active users, fast post publishing, and sub-100ms timeline rendering for standard and celebrity accounts.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: Post Service -> Social Graph DB (Neo4j/Postgres) -> Fanout Worker Pool -> Timeline Cache (Redis Sorted Sets) -> NewsFeed Aggregator.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a Scalable Social Media News Feed

Design a personalized social feed system supporting 100M daily active users, fast post publishing, and sub-100ms timeline rendering for standard and celebrity accounts.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a Scalable Social Media News Feed.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
