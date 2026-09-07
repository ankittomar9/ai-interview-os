---
slug: hld-nearby-friends
title: Real-Time Nearby Friends Tracking
track: SYSTEM_DESIGN
difficulty: HARD
topics: [system-design]
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
  - Highlight why HTTP polling is completely unviable for millions of concurrent users broadcasting coordinates every few
    seconds.
  - 'Explain how Redis Pub/Sub scales: cluster partitioning of channels, WebSocket session registries, and connection drain
    policies.'
  - 'Discuss privacy settings: invisible mode, geofencing, and historical location retention.'
editorial: '### Architectural Walkthrough & System Analysis: Real-Time Nearby Friends Tracking


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a real-time location-based social feature (e.g. Nearby Friends) that continuously updates
  and displays friends within a 5-mile radius with high concurrency, low battery drain, and real-time push.

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
