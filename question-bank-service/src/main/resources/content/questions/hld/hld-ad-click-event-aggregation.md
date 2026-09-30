---
slug: hld-ad-click-event-aggregation
title: Real-Time Ad Click Event Aggregation Pipeline
track: SYSTEM_DESIGN
difficulty: HARD
topics:
- system-design
est_minutes: 45
tags:
- stream-processing
- ad-tech
- flink
- kafka
- exactly-once
- sliding-window
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Ingest click events through distributed messaging queues (Kafka) partitioned by `ad_id`.
- Use stateful stream processing engines (Apache Flink) with tumbling and sliding windows to aggregate metrics in real time.
- Handle out-of-order and late-arriving events using event-time watermarks.
coaching:
  presentationTips:
  - 'Walk through exactly-once processing: distributed snapshots (Chandy-Lamport algorithm) + idempotent two-phase commit sinks.'
  - 'Explain reconciliation: compare real-time streaming aggregates against offline batch ETL reconciliation jobs for billing accuracy.'
  - Discuss ad-fraud detection filters (duplicate clicks, bot IP filtering) prior to metric aggregation.
editorial: '### Architectural Walkthrough & System Analysis: Real-Time Ad Click Event Aggregation Pipeline


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a high-throughput real-time ad click event aggregation platform supporting billions of daily clicks, sub-minute aggregation reporting, exactly-once processing semantics, and billing integrity.

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
- approachId: stream-processing-flink-kafka
  label: Primary — Real-Time Stream Aggregation with Apache Flink & Kafka
  approachClass: PRIMARY
  kind: WRITEUP
  summary: High-throughput streaming architecture utilizing Kafka ingestion partitions and Apache Flink tumbling/sliding windows with RocksDB state storage for sub-minute advertiser analytics.
  keyIdea: Ingest click events into Kafka, aggregate metrics in stateful Flink windows with exactly-once processing, and persist aggregated counters into ClickHouse / Cassandra.
  tradeoffs:
  - Sub-second latency and accurate deduplication via watermarks
  - Requires managing distributed streaming cluster and state checkpointing storage
  whenToUse: Standard industry choice for real-time ad bidding feedback, click fraud detection, and live budget tracking.
  diagramNotes: 'Clients/Browsers -> Edge API Gateway -> Kafka (topic: ad-clicks) -> Flink Stream Processing (Tumbling 1-min & 5-min windows) -> OLAP Storage (ClickHouse) -> Advertiser Analytics Dashboard.'
  writeUp: '### 1. Requirements Recap

    - **Functional**: Collect click events from global display ads, deduplicate duplicate/fraud clicks, aggregate clicks per ad campaign per minute/hour, and serve low-latency queries to advertisers.

    - **Scale**: 100,000 clicks/sec peak, 99.99% availability, strict exactly-once accounting for billing.


    ### 2. Component Breakdown

    - **Edge Ingestion Gateway**: Lightweight Go/Netty service that validates incoming click tokens, writes tracking cookies, and publishes to Kafka.

    - **Kafka Event Buffer**: Partitioned by `ad_id` to guarantee ordering and parallel consumption across streaming workers.

    - **Apache Flink Processing Engine**: Runs tumbling 1-minute and sliding 1-hour window aggregations. Maintains RocksDB state backend with periodic checkpoints to S3.

    - **Deduplication Store**: Redis Bloom filters backed by Cassandra/Redis cluster keyed by `(user_id, ad_id, minute_window)` to drop fraud clicks.

    - **Serving OLAP Store**: ClickHouse cluster partitioned by date and indexed by `(advertiser_id, ad_id, timestamp)`.


    ### 3. Data Flow

    1. User clicks an ad; browser sends beacon request to `api.adnetwork.com/click`.

    2. Edge gateway checks signature, appends timestamp, and pushes raw event to Kafka topic `ad_clicks_raw`.

    3. Flink consumers read from Kafka, apply Bloom filter deduplication, and compute rolling aggregates per `ad_id`.

    4. Aggregated counts are batch-written to ClickHouse every 10 seconds.

    5. Advertisers query the REST/GraphQL dashboard API, served directly from ClickHouse read replicas.


    ### 4. Capacity & Consistency Notes

    - **Throughput**: 100k events/sec * 500 bytes = 50 MB/sec ingestion.

    - **Storage**: ~4.3 TB uncompressed raw events/day; downsampled aggregated data is < 50 GB/day in ClickHouse.

    - **Consistency**: Watermark delays handle out-of-order events up to 5 minutes; exactly-once semantics enforced via Kafka transaction producer and Flink 2PC checkpoints.'
- approachId: lambda-architecture-batch-microbatch
  label: Alternate — Lambda Architecture with Spark Streaming & Parquet Lakehouse
  approachClass: ALTERNATE
  kind: WRITEUP
  summary: Dual-path Lambda architecture combining a fast micro-batch layer (Spark Streaming) for approximate live telemetry and a batch reconciliation layer (Daily EMR Spark) for audit-grade billing accuracy.
  keyIdea: Decouple real-time dashboard approximations from authoritative billing reconciliation via parallel speed and batch pipelines over an S3 data lake.
  tradeoffs:
  - Extreme resilience against data corruption; batch layer can re-process historical raw logs
  - Code duplication between speed layer and batch layer reconciliation logic
  whenToUse: When legal financial billing audits require immutable raw log replayability alongside soft real-time dashboard previews.
  diagramNotes: 'API Gateway -> Event Bus -> [Speed: Spark Streaming -> Redis Cache] & [Batch: S3 Raw Parquet -> Daily Spark Batch -> Snowflake / Postgres Billing DB] -> Merged Query Layer.'
  writeUp: '### 1. Requirements Recap

    - **Functional**: Provide immediate real-time click volume estimates to dashboard users while producing 100% reconciled audit logs for end-of-month financial billing.

    - **Scale**: Multi-petabyte historical queryability with guaranteed re-run capability.


    ### 2. Component Breakdown

    - **Ingestion Log Collector**: Fluentbit/Vector collectors flushing micro-batches of click events to S3 in compressed Parquet format.

    - **Speed Layer**: Spark Streaming evaluating approximate counts into Redis for the last 60 minutes.

    - **Batch Layer**: Nightly Spark/EMR job running deterministic MapReduce aggregation with full session graph validation.

    - **Authoritative Storage**: Snowflake or PostgreSQL for final financial invoice generation.


    ### 3. Data Flow

    1. Raw click events stream to both a fast-cache topic and raw S3 object storage.

    2. Speed layer updates rolling counters in Redis for live UI previews.

    3. Batch layer runs at midnight UTC, re-reading all raw S3 logs, pruning bots and invalid traffic.

    4. Final reconciled ledger overwrites interim estimates and produces final billing invoice statements.


    ### 4. Capacity & Consistency Notes

    - **Storage**: S3 Glacier tiering for raw logs after 90 days.

    - **Consistency**: Eventual consistency on dashboard; strict linearizable consistency on monthly billing records.'
---

### Problem Scope: Real-Time Ad Click Event Aggregation Pipeline

Design a high-throughput real-time ad click event aggregation platform supporting billions of daily clicks, sub-minute aggregation reporting, exactly-once processing semantics, and billing integrity.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Real-Time Ad Click Event Aggregation Pipeline.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
