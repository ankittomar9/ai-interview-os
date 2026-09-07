---
slug: hld-web-crawler
title: Distributed Scalable Web Crawler
track: SYSTEM_DESIGN
difficulty: SENIOR
tags:
- distributed-systems
- web-crawler
- url-frontier
- politeness
- dns-cache
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Manage the URL Frontier with separate priority queues (crawl importance) and politeness queues (per-host rate limiting).
- Prevent infinite loops and duplicate processing using Bloom filters and cryptographic document checksums.
- Implement a dedicated asynchronous DNS caching resolver to avoid DNS resolution becoming the primary I/O bottleneck.
coaching:
  presentationTips:
  - 'Draw the complete crawler data pipeline: URL Frontier -> DNS Resolver -> HTML Downloader -> Content Parser -> Duplicate
    Filter -> URL Extractor.'
  - Detail how Robots.txt exclusion protocols and domain crawl delays are enforced.
  - Discuss horizontal scaling across hundreds of worker nodes with distributed queues (Kafka / SQS).
editorial: '### Architectural Walkthrough & System Analysis: Distributed Scalable Web Crawler


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a scalable distributed web crawler capable of traversing and indexing 1 billion web pages
  per month with politeness policies, distributed deduplication, and high fault tolerance.

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
### Problem Scope: Distributed Scalable Web Crawler

Design a scalable distributed web crawler capable of traversing and indexing 1 billion web pages per month with politeness policies, distributed deduplication, and high fault tolerance.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Distributed Scalable Web Crawler.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
