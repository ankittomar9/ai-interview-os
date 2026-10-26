---
slug: incident-deadlock-distributed-locks
title: "Incident: Distributed Deadlock in Checkout Pipeline"
track: SYSTEM_TROUBLESHOOTING
difficulty: HARD
topics:
  - incident-response
est_minutes: 45
tags: ['incident', 'distributed-locks', 'deadlock', 'redis-redlock', 'concurrency']
buildProfile: judge0
source: enterprise-incidents:v1
status: PUBLISHED
hints:
  - "Inspect the order in which locks are acquired across multiple services."
  - "Check whether Service A locks Resource 1 then Resource 2, while Service B locks Resource 2 then Resource 1."
  - "Explore lock ordering conventions and lease timeouts."
coaching:
  presentationTips:
    - "Diagram the Coffman conditions: Mutual Exclusion, Hold and Wait, No Preemption, Circular Wait."
    - "Explain why breaking Circular Wait via lexicographical resource sorting guarantees deadlock freedom."
editorial: |
  ### Production Incident Walkthrough: Resolving Distributed Deadlocks

  #### 1. Deadlock Mechanics
  Two microservices participating in a checkout workflow:
  - **Thread 1 (Order Service)**: Acquires Lock `user:401`, attempts to acquire Lock `inventory:item:88`.
  - **Thread 2 (Fulfillment Service)**: Acquires Lock `inventory:item:88`, attempts to acquire Lock `user:401`.
  Both threads block indefinitely until distributed lock lease expiration, causing widespread transaction rollbacks and thread starvation.

  #### 2. Resolution Strategy
  - **Global Resource Ordering**: Order all required resource keys deterministically (e.g. lexicographical string sort) before acquiring locks:
    `keys.sort()` -> Acquire in strict sorted sequence.
  - **Timeout & Jittered Retry**: If a lock cannot be acquired within 500ms, release all held locks and retry after randomized exponential backoff.
referenceSolutions:
  - approachId: canonical-deadlock-fix
    label: "Primary — Strict Lexicographical Lock Ordering with Immediate Rollback"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "Enforces deterministic alphabetical lock key sorting across all services, eliminating the circular wait condition that produces distributed deadlocks."
    keyIdea: "If all distributed workers acquire shared locks in the exact same deterministic sequence, circular wait is mathematically impossible."
    tradeoffs:
      - "Requires callers to know all resource keys upfront before entering critical sections."
    writeUp: |
      ### 1. Analysis of Coffman Conditions
      A distributed deadlock requires four simultaneous conditions:
      1. Mutual Exclusion: Resources are held in exclusive mode.
      2. Hold and Wait: A process holds one lock while requesting another.
      3. No Preemption: Locks cannot be forcibly taken away before release or TTL expiry.
      4. Circular Wait: Process A waits for Process B's resource, while B waits for A's resource.

      ### 2. Elimination of Circular Wait
      - **Global Lexicographical Resource Ordering**:
        Sort all required lock keys alphabetically (e.g. `["inventory:item:88", "user:401"]`) prior to acquisition. Because all competing workers acquire keys in the identical monotonic order, cycles in the resource allocation graph are mathematically impossible.
      - **Fail-Fast with Jittered Backoff**:
        If any individual lock acquisition fails or exceeds a 250ms threshold, release all previously acquired locks immediately, sleep for `random(50ms, 150ms)`, and retry.
---

# Incident: Distributed Deadlock in Checkout Pipeline

### Incident Overview
A flash-sale checkout pipeline is experiencing intermittent thread lockups:
* Order placement latency spikes to the Redlock lease timeout (10,000ms).
* Thread dumps reveal dozens of worker threads stuck in `BLOCKED` / `WAITING` state attempting to acquire Redis distributed locks.

### Your Objectives
1. Analyze the four Coffman conditions necessary for a deadlock to occur.
2. Identify why asymmetric lock acquisition order between Order Service and Fulfillment Service caused this distributed lockup.
3. Design and implement the lock acquisition algorithm that guarantees deadlock-free execution across all participating services.
