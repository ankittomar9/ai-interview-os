---
slug: hld-youtube-video-platform
title: YouTube Video Streaming Platform
track: SYSTEM_DESIGN
difficulty: HARD
topics: [system-design]
est_minutes: 45
tags:
- video-streaming
- transcoding
- cdn
- blob-storage
- adaptive-bitrate
- hls
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Separate video metadata management from raw media ingestion and global CDN distribution.
- Transcode uploaded raw video into multiple resolutions (1080p, 720p, 480p) and adaptive streaming formats (HLS, DASH).
- Use chunked multipart resumable uploads for video creators to handle unreliable network connections.
coaching:
  presentationTips:
  - 'Diagram the video processing DAG pipeline: splitting -> parallel video transcoding -> audio encoding -> thumbnail generation
    -> manifest creation.'
  - Explain Adaptive Bitrate Streaming (ABR) and how video players dynamically adjust resolution based on real-time client
    bandwidth.
  - Discuss CDN edge caching tiers and popular vs long-tail video storage cost optimization.
editorial: '### Architectural Walkthrough & System Analysis: YouTube Video Streaming Platform


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a global video sharing and streaming platform capable of ingesting thousands of hours of video
  per minute, transcoding to adaptive bitrates, and streaming smoothly to hundreds of millions of daily active viewers.

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
### Problem Scope: YouTube Video Streaming Platform

Design a global video sharing and streaming platform capable of ingesting thousands of hours of video per minute, transcoding to adaptive bitrates, and streaming smoothly to hundreds of millions of daily active viewers.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of YouTube Video Streaming Platform.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
