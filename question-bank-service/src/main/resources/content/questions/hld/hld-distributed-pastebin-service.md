---
slug: hld-distributed-pastebin-service
title: "Design a Distributed Ephemeral Pastebin Service"
track: SYSTEM_DESIGN
difficulty: EASY
topics:
  - system-design
est_minutes: 45
tags: ['object-storage', 'nosql', 'expiration', 'ttl']
buildProfile: judge0
source: ai-generated:v1
status: PUBLISHED
hints:
  - "Clarify functional requirements, read/write ratios, and availability SLA targets early."
  - "Identify the primary bottleneck: is it disk I/O, network bandwidth, distributed consensus, or lock contention?"
  - "Walk through the end-to-end data flow for both normal operations and edge-case failure modes."
coaching:
  presentationTips:
    - "Structure your presentation: Requirements (5m), Back-of-the-envelope scale (5m), High-Level Architecture (15m), Deep Dives & Bottlenecks (15m), Failure Recovery (5m)."
    - "Quantify your numbers: derive queries per second, network bandwidth, and storage capacity explicitly."
editorial: |
  ### Architectural Walkthrough & System Analysis: Design a Distributed Ephemeral Pastebin Service

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a text storage service where users can upload code or text snippets up to 10MB, generate shareable links, and set automatic time-to-live (TTL) expiration.
  - **Scale & Availability**: Target 99.99% availability with horizontal scalability across distributed nodes.

  #### 2. High-Level Architecture & Component Responsibilities
  The platform utilizes a decoupled, resilient architecture:
  - **Edge Tier**: Terminating client sessions, enforcing rate limits, and routing requests.
  - **Service Tier**: Stateless microservices handling core domain workflows and state coordination.
  - **Storage & Caching Tier**: Tiered persistence optimizing for write throughput and fast analytical/read access.

  #### 3. Key Bottlenecks, Tradeoffs & Deep Dive
  - **Consistency vs Availability**: Balanced in accordance with CAP theorem principles.
  - **Partitioning & Sharding**: Data partitioned across nodes to eliminate single-point-of-failure bottlenecks.
  - **Resilience**: Asynchronous queues, circuit breakers, and read replicas ensure graceful degradation during partial outages.

  #### 4. Operational Monitoring & Failure Recovery
  - Track p95/p99 latency, error rates, throughput, and replication lag across all tiers.
  - Automated health probes and fast failover ensure rapid recovery without data loss.
referenceSolutions:
  - approachId: canonical-hld-distributed-pastebin-service
    label: "Primary — Object Storage Backed by NoSQL Metadata Index and S3 Lifecycle Expiration"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Large raw text payloads are stored directly in distributed object storage (S3/MinIO), while metadata (author, size, hash, TTL) is indexed in DynamoDB with automated TTL eviction."
    keyIdea: "Separate variable-sized text blobs from relational or key-value metadata indexes, using native object storage lifecycle policies for zero-toil cleanup."
    tradeoffs:
      - "Storing payloads > 64KB in S3 saves database storage costs but introduces a second roundtrip during read path."
      - "DynamoDB TTL removes expired records within 48 hours without consuming write capacity."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "Web Gateway -> Snippet Ingestion Service -> S3 Blob Storage -> DynamoDB Metadata Table -> Async Sweeper / S3 Lifecycle Manager."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a text storage service where users can upload code or text snippets up to 10MB, generate shareable links, and set automatic time-to-live (TTL) expiration.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: Web Gateway -> Snippet Ingestion Service -> S3 Blob Storage -> DynamoDB Metadata Table -> Async Sweeper / S3 Lifecycle Manager.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a Distributed Ephemeral Pastebin Service

Design a text storage service where users can upload code or text snippets up to 10MB, generate shareable links, and set automatic time-to-live (TTL) expiration.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a Distributed Ephemeral Pastebin Service.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
