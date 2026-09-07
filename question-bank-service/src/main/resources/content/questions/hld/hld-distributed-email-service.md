---
slug: hld-distributed-email-service
title: Distributed Email Service (Gmail-Scale)
track: SYSTEM_DESIGN
difficulty: HARD
topics: [system-design]
est_minutes: 45
tags:
- email-system
- smtp
- imap
- storage-tiering
- search-index
- distributed-systems
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- 'Support standard mail protocols: SMTP for outgoing/incoming transit, and IMAP/POP3 or RESTful APIs for client sync.'
- Separate email metadata (headers, read status, labels) from raw email bodies and attachments (stored in distributed blob
  storage).
- Build an asynchronous full-text search index (Elasticsearch / Lucene) partitioned by user ID for instant mailbox search.
coaching:
  presentationTips:
  - 'Draw the complete mail flow: sender client -> SMTP gateway -> virus/spam filter -> message store -> recipient notification
    queue.'
  - 'Discuss storage tiering: warm storage for recent emails (last 30 days) and cold compressed storage for older archives.'
  - 'Explain deliverability protocols: SPF, DKIM, and DMARC verification to prevent email spoofing.'
editorial: '### Architectural Walkthrough & System Analysis: Distributed Email Service (Gmail-Scale)


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design an enterprise-scale distributed email platform (e.g. Gmail) capable of storing petabytes of
  user mailboxes, supporting sub-second full-text email search, and managing reliable global SMTP transit.

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
### Problem Scope: Distributed Email Service (Gmail-Scale)

Design an enterprise-scale distributed email platform (e.g. Gmail) capable of storing petabytes of user mailboxes, supporting sub-second full-text email search, and managing reliable global SMTP transit.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Distributed Email Service (Gmail-Scale).
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
