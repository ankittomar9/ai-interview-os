---
slug: hld-global-leaderboard-redis
title: Real-Time Gaming Leaderboard with Redis Sorted Sets
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics:
- system-design
est_minutes: 45
tags:
- redis
- sorted-sets
- gaming
- real-time
- leaderboard
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-hld/global-leaderboard
status: PUBLISHED
hints:
- Redis ZSET provides O(log N) score insertion/update and O(log N + M) range retrieval.
editorial: '### Global Gaming Leaderboard

  Partition score shards by game mode or tier; utilize `ZADD` and `ZREVRANGE` for real-time top-100 player retrieval.

  '
referenceSolutions:
- approachId: primary-global-leaderboard-redis
  label: Primary — Redis Sorted Sets (ZSET) with Sharded Score Partitions
  approachClass: PRIMARY
  kind: WRITEUP
  summary: Production-grade distributed system architecture for Global Leaderboard Redis designed for high availability, fault tolerance, and horizontal scalability under enterprise workloads.
  keyIdea: Deconstruct Global Leaderboard Redis into specialized microservices, utilizing partitioned distributed storage, caching tiers, and asynchronous event streams.
  tradeoffs:
  - Optimized for high throughput, sub-50ms latency, and high availability
  - Requires robust cluster management, distributed telemetry, and operational observability
  whenToUse: Industry standard architecture for high-scale implementations of Global Leaderboard Redis.
  diagramNotes: Clients -> CDN / Global DNS -> API Gateway -> Microservices Tier (Global Leaderboard Redis Service) -> Cache (Redis) & Primary Database Cluster -> Async Event Queue (Kafka) -> Background Workers.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Core user workflows for Global Leaderboard Redis including creation, retrieval, updates, and real-time state synchronization.

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
- approachId: alternate-global-leaderboard-redis
  label: Alternate — Real-Time Stream Aggregation & Periodic Batch Re-ranking
  approachClass: ALTERNATE
  kind: WRITEUP
  summary: Alternative architectural paradigm for Global Leaderboard Redis tailored for specific operational constraints such as strict consistency, decentralized topologies, or specialized stream processing.
  keyIdea: Decouple state management and computation for Global Leaderboard Redis using specialized domain patterns and targeted persistence engines.
  tradeoffs:
  - Excels in specific domain guarantees such as zero-data-loss linearizability or lower infrastructure costs
  - May require specialized operational tooling and domain expertise compared to standard stacks
  whenToUse: Specialized deployments of Global Leaderboard Redis prioritizing tailored consistency, cost, or latency constraints.
  diagramNotes: Clients -> Edge Load Balancer -> Specialized Services -> Event Log / Consensus Mesh -> Specialized Datastore.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Specialized requirements for Global Leaderboard Redis under targeted latency, consistency, or cost constraints.

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

### Real-Time Gaming Leaderboard with Redis Sorted Sets
Design a real-time gaming leaderboard system displaying top 100 player ranks and personal rank queries for 10M concurrent players.
