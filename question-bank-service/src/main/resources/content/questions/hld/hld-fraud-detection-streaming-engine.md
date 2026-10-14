---
slug: hld-fraud-detection-streaming-engine
title: "Design a Low-Latency Real-Time Fraud Detection Engine"
track: SYSTEM_DESIGN
difficulty: HARD
topics:
  - system-design
est_minutes: 45
tags: ['fraud-detection', 'stream-processing', 'sliding-window', 'cep']
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
  ### Architectural Walkthrough & System Analysis: Design a Low-Latency Real-Time Fraud Detection Engine

  #### 1. System Requirements & Scope
  - **Core Objectives**: Design a financial transaction evaluation engine that scores transactions against complex rules (e.g. 5 card swipes across 3 cities in 10 minutes) with sub-25ms p99 latency decisions before payment authorization.
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
  - approachId: canonical-hld-fraud-detection-streaming-engine
    label: "Primary — In-Memory Complex Event Processing (CEP) with Sliding State RocksDB and Machine Learning Scoring"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Payment authorization requests pass through an evaluation engine backed by embedded RocksDB state stores. Sliding window aggregations compute velocity features in sub-5ms, feeding an ONNX-runtime ML model that outputs a fraud probability score."
    keyIdea: "Keep customer behavioral velocity features in local embedded memory stores (RocksDB/SSD) right on the processing node to avoid distributed network hops during synchronous payment evaluation."
    tradeoffs:
      - "Sub-25ms synchronous SLA restricts feature lookup to local in-memory or embedded SSD stores."
      - "Asynchronous graph analysis runs in the background to detect multi-party fraud rings and update risk blacklists."
    whenToUse: "Standard production architecture for high-scale enterprise deployments."
    diagramNotes: "Payment Ingress Gateway -> Synchronous Scoring Worker -> Embedded RocksDB Feature Store -> ML Inference Runtime -> Decision Policy Engine."
    writeUp: |
      ### 1. Requirements & Back-of-Envelope Scale
      - **Functional Scope**: Design a financial transaction evaluation engine that scores transactions against complex rules (e.g. 5 card swipes across 3 cities in 10 minutes) with sub-25ms p99 latency decisions before payment authorization.
      - **Scale Metrics**: High concurrency with horizontal scale-out and fault-tolerant replication.

      ### 2. Component Architecture
      - **Architecture Flow**: Payment Ingress Gateway -> Synchronous Scoring Worker -> Embedded RocksDB Feature Store -> ML Inference Runtime -> Decision Policy Engine.

      ### 3. Data Flow & Operation
      - Client requests arrive at edge gateways and route to stateless processing services.
      - In-memory caching layers absorb high-frequency read and query volume.
      - Persistent data tiers guarantee durability with asynchronous replica synchronization.

      ### 4. Bottlenecks & Resilience
      - Hotspot mitigation via consistent hashing and dynamic request batching.
      - Graceful degradation through circuit breakers and fallback responses during downstream outages.
---

### Problem Scope: Design a Low-Latency Real-Time Fraud Detection Engine

Design a financial transaction evaluation engine that scores transactions against complex rules (e.g. 5 card swipes across 3 cities in 10 minutes) with sub-25ms p99 latency decisions before payment authorization.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design a Low-Latency Real-Time Fraud Detection Engine.
2. **Data Reliability & Consistency**: Ensure high durability, idempotency, and data integrity across all distributed nodes.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or sub-millisecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support high-throughput concurrent workloads.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
