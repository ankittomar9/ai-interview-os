---
slug: hld-distributed-email-service
title: Distributed Email Service (Gmail-Scale)
track: SYSTEM_DESIGN
difficulty: HARD
topics:
- system-design
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
- Separate email metadata (headers, read status, labels) from raw email bodies and attachments (stored in distributed blob storage).
- Build an asynchronous full-text search index (Elasticsearch / Lucene) partitioned by user ID for instant mailbox search.
coaching:
  presentationTips:
  - 'Draw the complete mail flow: sender client -> SMTP gateway -> virus/spam filter -> message store -> recipient notification queue.'
  - 'Discuss storage tiering: warm storage for recent emails (last 30 days) and cold compressed storage for older archives.'
  - 'Explain deliverability protocols: SPF, DKIM, and DMARC verification to prevent email spoofing.'
editorial: '### Architectural Walkthrough & System Analysis: Distributed Email Service (Gmail-Scale)


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design an enterprise-scale distributed email platform (e.g. Gmail) capable of storing petabytes of user mailboxes, supporting sub-second full-text email search, and managing reliable global SMTP transit.

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
- approachId: smtp-gateway-object-store-elasticsearch
  label: Primary — SMTP Ingestion Cluster with S3 Object Storage & Elasticsearch Index
  approachClass: PRIMARY
  kind: WRITEUP
  summary: Scalable email platform separating high-volume raw MIME message body storage in S3 from structured thread/header metadata in Cassandra and full-text search indexing in Elasticsearch.
  keyIdea: Ingest mail via clustered Postfix/Haraka SMTP gateways, persist raw email MIME payloads to object storage, write message metadata to Cassandra, and index search terms in Elasticsearch.
  tradeoffs:
  - Cheap scalable storage for multi-megabyte attachments and bodies in S3
  - Two-phase writes between metadata database and search index require asynchronous reconciliation
  whenToUse: Gmail / Outlook style multi-tenant email platforms handling millions of inbound/outbound messages daily.
  diagramNotes: Inbound SMTP -> Clustered SMTP Gateways -> Spam/Virus Filter -> Raw S3 Storage + Cassandra (Metadata/Threads) + Elasticsearch (Full-Text Search) -> IMAP/Webmail API.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Send and receive emails, manage conversation threads, handle spam filtering, support attachments, and provide fast full-text inbox search.

    - **Scale**: 100M active users, 5B emails/day, 99.999% durability for delivered mail.


    ### 2. Component Breakdown

    - **SMTP Gateway Cluster**: Load-balanced SMTP servers running TLS connection pooling and DNS SPF/DKIM/DMARC verification.

    - **Spam & Security Scanner**: ML classification pipeline (Rspamd / custom model) flagging phishing and malware before acceptance.

    - **MIME Body Store**: S3 object storage storing raw email RFC 822 MIME payloads and attachment blobs.

    - **User Mailbox Store**: ScyllaDB/Cassandra partitioned by `user_id` and clustered by `received_at DESC` for sub-10ms inbox rendering.

    - **Search Engine**: Elasticsearch cluster indexing subject, sender, recipient, and body text.


    ### 3. Data Flow

    1. Sending server connects to MX record via SMTP port 25.

    2. Inbound gateway verifies sender reputation, accepts message body, and writes raw MIME to S3 with key `raw_emails/{uuid}.eml`.

    3. Worker parses email into structured headers, saves message metadata to Cassandra table `user_messages`, and sends indexing event to Kafka.

    4. Elasticsearch consumer ingests event and indexes email content for search.

    5. Recipient web client receives WebSocket push notification `NewEmailEvent`.


    ### 4. Capacity & Consistency Notes

    - **Storage**: 5B emails/day * 50 KB average = 250 TB/day; tiered to S3 Infrequent Access after 30 days.

    - **Consistency**: High durability via S3 11-nines; eventual consistency on search index (< 2 seconds).'
- approachId: event-driven-mailbox-microservices
  label: Alternate — Event-Driven Mailbox Actors with Distributed Log
  approachClass: ALTERNATE
  kind: WRITEUP
  summary: Actor-model mailbox architecture (e.g. Akka / Orleans) where each user's inbox is an active in-memory actor persisted via event sourcing to Kafka and distributed key-value stores.
  keyIdea: Route emails directly to the active user's MailboxActor, handling read/unread states, folder moves, and thread grouping as discrete domain events.
  tradeoffs:
  - Instant P99 read/write performance with in-memory mailbox actor caches
  - High cluster coordination complexity during actor re-balancing across cluster nodes
  whenToUse: Modern collaborative email and messaging suites requiring real-time presence, typing indicators, and immediate live synchronization across multiple user devices.
  diagramNotes: Inbound Mail -> Kafka Topic -> Mailbox Actor Cluster (User Actor A, B, C) -> RocksDB Local Cache + Central Blob Storage.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Real-time collaborative inbox synchronization across mobile, desktop, and web clients.

    - **Scale**: Millions of concurrently connected users receiving instant thread updates.


    ### 2. Component Breakdown

    - **Mailbox Actor Mesh**: Stateful actor cluster where each active user has a dedicated actor maintaining unread badges and open threads.

    - **Kafka Event Backbone**: Partitions email delivery events by `recipient_user_id`.


    ### 3. Data Flow

    1. Delivery event published to Kafka.

    2. Partition worker routes event to `UserMailboxActor`.

    3. Actor applies event, updates internal state, persists delta to journal, and broadcasts push to connected user clients.


    ### 4. Capacity & Consistency Notes

    - **Consistency**: Strong consistency per mailbox actor; zero race conditions when archiving or tagging emails from multiple devices simultaneously.'
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
