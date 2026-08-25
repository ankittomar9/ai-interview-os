---
slug: hld-distributed-rate-limiter
title: Multi-Tier Distributed Token Bucket Rate Limiter
track: SYSTEM_DESIGN
difficulty: SENIOR
tags: [distributed-systems, rate-limiting, redis, concurrency, lua]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-hld/distributed-rate-limiter
status: PUBLISHED
hints:
  - "Compare Token Bucket, Leaky Bucket, and Sliding Window Log in distributed architectures."
  - "Use atomic Redis Lua scripts to prevent race conditions across concurrent application pods."
coaching:
  presentationTips:
    - "Differentiate between client-tier, API gateway tier, and service-mesh level rate limiting."
    - "Discuss fallback strategies when Redis encounters latency spikes or network partitions."
editorial: |
  ### Distributed Token Bucket Design
  1. **API Gateway Integration**: Intercept requests before routing to downstream microservices.
  2. **Storage**: Redis cluster with Redis Lua script evaluating capacity, refill rate, and timestamp.
  3. **Headers**: Return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.
---
### Multi-Tier Distributed Token Bucket Rate Limiter
Design a high-throughput, low-latency distributed rate limiter capable of enforcing 100,000 req/sec across thousands of client API keys. Address multi-region synchronization, atomic token replenishment, and graceful degradation during cache outages.
