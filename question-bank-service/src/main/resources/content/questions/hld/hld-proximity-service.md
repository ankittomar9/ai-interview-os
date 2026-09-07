---
slug: hld-proximity-service
title: Proximity Service (Yelp / Nearby Search)
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics: [system-design]
est_minutes: 45
tags:
- geospatial
- geohash
- quadtree
- redis
- spatial-index
- proximity
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Relational databases with 2D latitude/longitude indexes cannot scale to heavy read traffic for radius searches.
- Use Geohashing to encode 2D lat/long coordinates into hierarchical 1D strings where common prefixes denote spatial proximity.
- Alternatively, utilize an in-memory Quadtree where each node splits into 4 sub-quadrants when point capacity is reached.
coaching:
  presentationTips:
  - Compare Geohash vs Quadtree vs Google S2 geometry for write frequency, memory footprint, and query boundary handling.
  - Explain how radius queries query the target Geohash box plus all 8 surrounding neighbor boxes to handle boundary edge
    cases.
  - Discuss caching read-heavy proximity results in Redis sorted sets indexed by geohash prefix.
editorial: '### Architectural Walkthrough & System Analysis: Proximity Service (Yelp / Nearby Search)


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a geospatial proximity service (e.g. Yelp or Google Places) to discover businesses and points
  of interest within a given search radius (e.g. 5 km) with sub-50ms query response times.

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
### Problem Scope: Proximity Service (Yelp / Nearby Search)

Design a geospatial proximity service (e.g. Yelp or Google Places) to discover businesses and points of interest within a given search radius (e.g. 5 km) with sub-50ms query response times.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Proximity Service (Yelp / Nearby Search).
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
