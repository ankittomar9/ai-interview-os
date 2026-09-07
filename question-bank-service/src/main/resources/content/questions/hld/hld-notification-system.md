---
slug: hld-notification-system
title: Scalable Multi-Channel Notification Engine
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics: [system-design]
est_minutes: 45
tags:
- notification-system
- message-queue
- rate-limiting
- pub-sub
- apns
- fcm
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Decouple client request ingestion from delivery providers (APNs, FCM, Twilio, SendGrid) via partitioned message queues.
- Implement per-user frequency capping and user opt-out preference verification before dispatching alerts.
- Track delivery receipt receipts, notification open analytics, and retry transient third-party carrier failures with exponential
  backoff.
coaching:
  presentationTips:
  - Show how message queues isolate external provider latency spikes and network outages from upstream microservices.
  - Discuss deduplication keys to guarantee at-most-once delivery for promotional alerts and exactly-once semantics for OTPs.
  - Highlight regional compliance (e.g. quiet hours, GDPR/CAN-SPAM consent).
editorial: '### Architectural Walkthrough & System Analysis: Scalable Multi-Channel Notification Engine


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a resilient multi-channel notification platform handling millions of daily push notifications,
  SMS messages, and emails with user preference filtering, rate limiting, and delivery tracking.

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
### Problem Scope: Scalable Multi-Channel Notification Engine

Design a resilient multi-channel notification platform handling millions of daily push notifications, SMS messages, and emails with user preference filtering, rate limiting, and delivery tracking.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Scalable Multi-Channel Notification Engine.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
