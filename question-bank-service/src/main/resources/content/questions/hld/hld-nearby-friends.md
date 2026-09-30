---
slug: hld-nearby-friends
title: Real-Time Nearby Friends Tracking
track: SYSTEM_DESIGN
difficulty: HARD
topics:
- system-design
est_minutes: 45
tags:
- geospatial
- pub-sub
- websockets
- redis-pubsub
- location-history
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Maintain persistent WebSocket connections between mobile clients and stateful location connection servers.
- Use Redis Pub/Sub channels (one channel per active user) so friends subscribe to each other's live location broadcasts.
- 'Throttle location emissions: only publish updates when a user moves beyond a threshold distance (e.g. > 100 meters).'
coaching:
  presentationTips:
  - Highlight why HTTP polling is completely unviable for millions of concurrent users broadcasting coordinates every few seconds.
  - 'Explain how Redis Pub/Sub scales: cluster partitioning of channels, WebSocket session registries, and connection drain policies.'
  - 'Discuss privacy settings: invisible mode, geofencing, and historical location retention.'
editorial: '### Architectural Walkthrough & System Analysis: Real-Time Nearby Friends Tracking


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a real-time location-based social feature (e.g. Nearby Friends) that continuously updates and displays friends within a 5-mile radius with high concurrency, low battery drain, and real-time push.

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
referenceSolutions:
- approachId: primary-nearby-friends
  label: Primary — Geohash Spatial Clustering with Redis Pub/Sub WebSockets
  approachClass: PRIMARY
  kind: WRITEUP
  summary: Production-grade distributed system architecture for Nearby Friends designed for high availability, fault tolerance, and horizontal scalability under enterprise workloads.
  keyIdea: Deconstruct Nearby Friends into specialized microservices, utilizing partitioned distributed storage, caching tiers, and asynchronous event streams.
  tradeoffs:
  - Optimized for high throughput, sub-50ms latency, and high availability
  - Requires robust cluster management, distributed telemetry, and operational observability
  whenToUse: Industry standard architecture for high-scale implementations of Nearby Friends.
  diagramNotes: Clients -> CDN / Global DNS -> API Gateway -> Microservices Tier (Nearby Friends Service) -> Cache (Redis) & Primary Database Cluster -> Async Event Queue (Kafka) -> Background Workers.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Core user workflows for Nearby Friends including creation, retrieval, updates, and real-time state synchronization.

    - **Scale**: Multi-million daily active users, high availability (99.99%), horizontal partitionability, sub-100ms P99 latency.


    ### 2. Component Breakdown

    - **API Gateway & Rate Limiter**: Central reverse proxy managing TLS termination, authentication, and token-bucket throttling.

    - **Core Domain Service**: Stateless horizontally-scaled service cluster executing business logic and coordinating transactions.

    - **Cache Tier**: Distributed Redis cluster caching frequently queried records with TTL expiration.

    - **Persistent Storage**: Primary-replica partitioned relational or NoSQL database with automated failover.

    - **Event Bus & Async Workers**: Kafka event backbone handling heavy background processing, notifications, and analytics pipelines.


    ### 3. Data Flow

    1. Client issues request to the global API gateway.

    2. Gateway verifies auth token, checks rate limits, and routes request to healthy domain service instances.

    3. Service checks Redis cache; on cache hit, returns immediately. On cache miss, queries database and warms cache.

    4. Mutating operations write to primary database, emit domain events to Kafka, and return acknowledgement.

    5. Asynchronous workers consume Kafka events to update downstream search indices and trigger external integrations.


    ### 4. Capacity & Consistency Notes

    - **Throughput & Capacity**: Sized to handle peak traffic with 3x headroom; read-heavy queries served from cache replicas.

    - **Consistency Model**: Read-your-own-writes consistency for mutating sessions; eventual consistency for global replicas and analytics.'
- approachId: alternate-nearby-friends
  label: Alternate — Hexagonal H3 Spatial Grid with Ephemeral Location Beacons
  approachClass: ALTERNATE
  kind: WRITEUP
  summary: Alternative architectural paradigm for Nearby Friends tailored for specific operational constraints such as strict consistency, decentralized topologies, or specialized stream processing.
  keyIdea: Decouple state management and computation for Nearby Friends using specialized domain patterns and targeted persistence engines.
  tradeoffs:
  - Excels in specific domain guarantees such as zero-data-loss linearizability or lower infrastructure costs
  - May require specialized operational tooling and domain expertise compared to standard stacks
  whenToUse: Specialized deployments of Nearby Friends prioritizing tailored consistency, cost, or latency constraints.
  diagramNotes: Clients -> Edge Load Balancer -> Specialized Services -> Event Log / Consensus Mesh -> Specialized Datastore.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Specialized requirements for Nearby Friends under targeted latency, consistency, or cost constraints.

    - **Scale**: Tailored for high density or localized execution with predictable performance boundaries.


    ### 2. Component Breakdown

    - **Edge Routing Layer**: Direct regional ingress routing requests based on data locality.

    - **Decoupled Worker Nodes**: Autonomous workers communicating via lightweight messaging.

    - **Specialized Datastore**: Tailored database engine (e.g. TimescaleDB, Graph DB, or LSM engine) suited for the specific query patterns.


    ### 3. Data Flow

    1. Client connects via regional edge router.

    2. Router forwards directly to designated domain partition worker.

    3. Worker applies state mutations deterministically.

    4. State is synced across consensus replicas.


    ### 4. Capacity & Consistency Notes

    - **Consistency**: Strong consistency or deterministic consensus across participating nodes.

    - **Failure Recovery**: Fast crash-recovery through append-only log replay.'
---

### Problem Scope: Real-Time Nearby Friends Tracking

Design a real-time location-based social feature (e.g. Nearby Friends) that continuously updates and displays friends within a 5-mile radius with high concurrency, low battery drain, and real-time push.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Real-Time Nearby Friends Tracking.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
