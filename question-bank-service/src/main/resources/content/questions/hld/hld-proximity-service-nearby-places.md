---
slug: hld-proximity-service-nearby-places
title: "Design a Spatial Proximity Service for Local Places"
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics:
  - system-design
est_minutes: 45
tags: ['spatial', 'quadtree', 'geohash', 'read-heavy']
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
  ### Architectural Walkthrough & System Analysis: Design a Spatial Proximity Service for Local Places

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a location-based search service (e.g. nearby restaurants or gas stations) handling 100,000 queries per second with search radius filtering within sub-50ms latency.
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
  - approachId: canonical-hld-proximity-service-nearby-places
    label: "Primary — Static QuadTree / Geohash Spatial Index with Multi-Level Caching"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Because business locations change infrequently, places are indexed in an in-memory QuadTree or Geohash prefix table. Incoming user coordinates are mapped to surrounding grid cells, and search results are filtered by Euclidean/Haversine distance."
    keyIdea: "Pre-compute hierarchical spatial bounding boxes into an in-memory QuadTree to resolve 2D radius queries in logarithmic time."
    tradeoffs:
      - "In-memory QuadTree nodes can be replicated across 20 stateless search servers to serve 100,000 QPS with zero database load."
      - "Infrequent location updates are propagated via daily background rebuilds and cache invalidation."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "Client App -> API Gateway -> Spatial Search Service (QuadTree in RAM) -> Redis Spatial Cache -> PostGIS Master Database."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a location-based search service (e.g. nearby restaurants or gas stations) handling 100,000 queries per second with search radius filtering within sub-50ms latency.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: Client App -> API Gateway -> Spatial Search Service (QuadTree in RAM) -> Redis Spatial Cache -> PostGIS Master Database.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a Spatial Proximity Service for Local Places

Design a location-based search service (e.g. nearby restaurants or gas stations) handling 100,000 queries per second with search radius filtering within sub-50ms latency.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a Spatial Proximity Service for Local Places.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
