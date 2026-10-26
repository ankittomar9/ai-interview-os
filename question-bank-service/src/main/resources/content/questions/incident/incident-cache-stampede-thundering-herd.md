---
slug: incident-cache-stampede-thundering-herd
title: "Incident: Cache Stampede and Database Saturation on Flash Sale Key Expiry"
track: SYSTEM_TROUBLESHOOTING
difficulty: HARD
topics:
  - incident-response
  - performance-tuning
est_minutes: 45
tags: ['incident', 'caching', 'redis', 'cache-stampede', 'thundering-herd', 'high-concurrency']
buildProfile: judge0
source: enterprise-incidents:v1
status: PUBLISHED
hints:
  - "Notice what occurs when a single hot cache key expires while thousands of concurrent threads read it simultaneously."
  - "Check how the application coordinates cache recomputation when a cache miss occurs."
  - "Explore probabilistic early expiration (XFetch algorithm) or distributed mutex locking."
coaching:
  presentationTips:
    - "Diagram the race condition: Time T0 (Key expires) -> 5,000 threads experience cache miss -> 5,000 queries hit the primary DB."
    - "Compare Mutex Locking (guarantees 1 query, but adds lock contention) vs XFetch (zero locks, background refresh)."
editorial: |
  ### Production Incident Walkthrough: Eliminating Cache Stampedes

  #### 1. Symptom & Root Cause
  During a major product drop, a hot product cache key (`product:item:9981`) expired at 00:00:00.
  - Within 200ms, 4,500 concurrent requests experienced a cache miss.
  - Every application instance immediately dispatched `SELECT * FROM products JOIN inventory ...` to PostgreSQL.
  - PostgreSQL CPU spiked to 100%, query queue backed up, and connection pool saturated, causing cascading 504 Gateway Timeouts across the entire application.

  #### 2. Architectural Solution
  - **Probabilistic Early Expiry (XFetch)**:
    Recompute the value probabilistically in the background before the key expires:
    $$\Delta - \beta \cdot \ln(\text{rand}()) > \text{TTL}$$
  - **Singleflight / Distributed Lock**:
    Ensure only one thread queries the database for a missing key, while other concurrent requests wait or receive stale data temporarily.
referenceSolutions:
  - approachId: canonical-cache-stampede-fix
    label: "Primary — Singleflight Distributed Mutex with Stale-While-Revalidate Fallback"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Implements Redis distributed mutex locking on cache misses, accompanied by stale-while-revalidate serving, ensuring exactly one background query hits the database while active clients receive sub-millisecond cached responses."
    keyIdea: "Prevent concurrent duplicate recomputations by electing a single worker to refresh the cache while serving stale data to all others."
    tradeoffs:
      - "Clients may observe slightly stale data (e.g. 1-2 seconds old) during the background refresh window."
    writeUp: |
      ### 1. Incident Breakdown: The Thundering Herd
      When a cache key expires under heavy concurrent load (e.g. 5,000 req/sec), all concurrent requests experience a cache miss simultaneously. Each thread independently queries the primary SQL database to recompute the value, overwhelming connection pools and driving DB CPU to 100%.

      ### 2. Dual-Layer Remediation Pattern
      1. **Singleflight Mutex (Distributed Lock)**:
         - When a cache miss occurs, the worker attempts to acquire an ephemeral Redis lock (`SET lock:product:9981 uuid NX EX 5`).
         - The worker that acquires the lock queries the DB and updates Redis.
         - All other threads poll briefly with exponential backoff (e.g. 50ms) or read stale data.
      2. **Stale-While-Revalidate (Probabilistic Early Expiration)**:
         - Store a soft TTL inside the cached object alongside the hard Redis TTL.
         - When `currentTime > softTTL`, the serving thread triggers an asynchronous background refresh while immediately returning the current (slightly stale) data to the caller.
---

# Incident: Cache Stampede and Database Saturation on Flash Sale Key Expiry

### Incident Overview
At 00:00 UTC, the e-commerce product catalog crashed under high traffic immediately after the midnight product launch.

### Telemetry Observations
* **Redis Hit Rate**: Dropped from 99.8% to 41.2% in under 5 seconds.
* **PostgreSQL CPU**: Spiked to 100% with thousands of identical queries: `SELECT * FROM products WHERE id = 9981`.
* **Application Errors**: 504 Gateway Timeout on checkout and catalog browse.

### Incident Objectives
1. Explain the mechanics of a **Cache Stampede (Thundering Herd)** problem.
2. Evaluate two distinct mitigation approaches:
   - **Distributed Mutex Locking** on cache miss.
   - **Probabilistic Early Recomputation (XFetch / Stale-While-Revalidate)**.
3. Provide the architecture and code structure that ensures the primary database never receives duplicate queries for the same expired key.
