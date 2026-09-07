---
slug: hld-news-feed-system
title: Social Media News Feed System
track: SYSTEM_DESIGN
difficulty: SENIOR
tags:
- news-feed
- fanout-on-write
- fanout-on-read
- redis-cache
- ranking
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Evaluate Fanout-on-Write (push model) vs Fanout-on-Read (pull model) for feed publishing.
- 'Use a hybrid model: push feed updates for normal users, but pull updates on-demand for celebrity accounts with millions
  of followers.'
- Cache precomputed user feed timelines in in-memory caches (Redis Sorted Sets) ordered by post timestamp or rank score.
coaching:
  presentationTips:
  - Walk through both feed publishing flow and feed generation/reading flow with distinct architecture diagrams.
  - Explain how the celebrity 'hotkey' problem destroys pure push architectures and how hybrid routing solves it.
  - Discuss feed ranking, pagination using cursor-based offsets instead of slow SQL `OFFSET/LIMIT`.
editorial: '### Architectural Walkthrough & System Analysis: Social Media News Feed System


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a large-scale social media news feed system (e.g. Twitter/Facebook) supporting real-time feed
  publishing, timeline generation, hybrid fanout, and sub-100ms feed retrieval.

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
### Problem Scope: Social Media News Feed System

Design a large-scale social media news feed system (e.g. Twitter/Facebook) supporting real-time feed publishing, timeline generation, hybrid fanout, and sub-100ms feed retrieval.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Social Media News Feed System.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
