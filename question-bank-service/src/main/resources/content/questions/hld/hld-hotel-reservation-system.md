---
slug: hld-hotel-reservation-system
title: Hotel Reservation & Booking Platform
track: SYSTEM_DESIGN
difficulty: SENIOR
tags:
- concurrency
- booking-system
- 2pc
- saga-pattern
- distributed-transactions
- redis
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Represent room availability per room type per day rather than booking static physical room numbers upfront.
- 'Implement a two-phase reservation flow: temporary hold with TTL (e.g. 15 minutes) during checkout, confirmed upon payment.'
- Prevent overselling using database row-level pessimistic locking (`SELECT FOR UPDATE`) or Redis distributed locks.
coaching:
  presentationTips:
  - 'Explain inventory schema: table indexed by `(hotel_id, room_type_id, date)` with an `available_count` column.'
  - Detail how the Saga Pattern orchestrates distributed booking across Inventory, Payment, and Notification services.
  - Discuss overbooking policies (e.g., allow 105% capacity) and how cancellations buffer against empty rooms.
editorial: '### Architectural Walkthrough & System Analysis: Hotel Reservation & Booking Platform


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a highly consistent, high-concurrency hotel reservation and room booking system (e.g. Booking.com)
  preventing double-booking, managing reservation holds, and scaling during seasonal flash sales.

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
### Problem Scope: Hotel Reservation & Booking Platform

Design a highly consistent, high-concurrency hotel reservation and room booking system (e.g. Booking.com) preventing double-booking, managing reservation holds, and scaling during seasonal flash sales.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Hotel Reservation & Booking Platform.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
