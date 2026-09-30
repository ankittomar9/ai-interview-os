---
slug: hld-consistent-hashing
title: Design Consistent Hashing
track: SYSTEM_DESIGN
difficulty: MEDIUM
topics:
- system-design
est_minutes: 45
tags:
- distributed-systems
- hashing
- virtual-nodes
- data-partitioning
buildProfile: judge0
source: inspired-by:bytebytego/system-design-interview
status: PUBLISHED
hints:
- Traditional modulo hashing causes severe remapping storms during server additions or departures.
- Map servers and keys onto a circular 2^32-1 hash ring and route keys clockwise to the nearest server.
- Deploy virtual nodes (e.g. 100-256 tokens per physical server) to eliminate hot-spots and achieve uniform load distribution.
coaching:
  presentationTips:
  - Contrast hash(key) % N against consistent hashing with clear mathematical intuition.
  - Illustrate virtual node token allocation and how key redistribution is localized upon node failure.
  - Discuss production implementations in Amazon DynamoDB and Apache Cassandra.
editorial: '### Architectural Walkthrough & System Analysis: Design Consistent Hashing


  #### 1. System Requirements & Scope

  - **Core Objectives**: Design a distributed consistent hashing mechanism to route request keys across a dynamic cluster of cache/storage nodes with minimal key movement during topology changes.

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
- approachId: virtual-node-hash-ring
  label: Primary — Consistent Hash Ring with Virtual Nodes (MD5/Murmur3)
  approachClass: PRIMARY
  kind: WRITEUP
  summary: Distributed hash ring with virtual nodes (tokens) per physical server, minimizing data re-distribution during node joins/leaves to 1/N and preventing hotspot clustering.
  keyIdea: Map both server tokens and data keys onto a circular 2^64 integer space using Murmur3, assigning keys to the first clockwise node.
  tradeoffs:
  - Uniform load balancing across heterogeneous physical hardware via weighted virtual node counts
  - Ring routing table must be synchronized across clients or coordinators via Gossip protocol
  whenToUse: Standard architecture for distributed storage clusters, caches, and load balancers (Cassandra, DynamoDB, Memcached routers).
  diagramNotes: Clients -> Hash Ring Router (Binary Search / TreeMap) -> Virtual Nodes on Circular Ring (Node A-1, B-1, C-1, A-2, B-2...) -> Target Physical Storage Nodes.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Distribute keys across N dynamic storage nodes with minimal key movement on node scale-up or failure.

    - **Scale**: Millions of keys, hundreds of nodes, sub-millisecond route resolution.


    ### 2. Component Breakdown

    - **Ring Coordinator / Client Router**: Maintains an in-memory sorted map (`TreeMap` in Java, red-black tree) of 64-bit hash positions.

    - **Virtual Node Mapping**: Each physical node is hashed $V$ times (typically $V = 100$ to $256$) using seeds like `node-ip:port#vnode_index`.

    - **Membership Consensus**: Gossip protocol (SWIM or Scuttlebutt) to detect node join/leave events and synchronize token assignments.


    ### 3. Data Flow

    1. Client requests key `user_102938`.

    2. Router computes `h = MurmurHash3(key)`.

    3. Router looks up `tailMap(h).firstKey()`; if empty, wraps around to `ring.firstKey()`.

    4. Selected virtual node points to physical server `Node-3`. Request forwarded to `Node-3`.


    ### 4. Capacity & Consistency Notes

    - **Rebalance Overhead**: When adding a node to an $N$-node cluster, only $1/(N+1)$ fraction of keys migrate.

    - **Memory Footprint**: 1,000 physical nodes * 200 virtual tokens = 200,000 entries in memory (~5 MB per client).'
- approachId: rendezvous-highest-random-weight
  label: Alternate — Highest Random Weight (Rendezvous Hashing)
  approachClass: ALTERNATE
  kind: WRITEUP
  summary: Stateless Rendezvous Hashing (HRW) where every key computes a hash score against all active nodes and selects the node with the highest score, eliminating ring maintenance entirely.
  keyIdea: Compute hash(key, node_id) for every active node and route to the node yielding the maximum value.
  tradeoffs:
  - Zero ring data structures required; entirely stateless calculation
  - Routing cost is O(N) where N is active nodes, making it ideal for small-to-medium clusters (N <= 100)
  whenToUse: Proxy caches, distributed microservice request routing, and environments where maintaining a synchronized hash ring table is difficult.
  diagramNotes: Key K -> Hash Function [hash(K, Node1), hash(K, Node2)...] -> ArgMax Evaluator -> Target Node.
  writeUp: '### 1. Requirements Recap

    - **Functional**: Stateless key routing without shared global coordinate ring metadata.

    - **Scale**: Dozens to hundreds of routing nodes with independent failure domains.


    ### 2. Component Breakdown

    - **Stateless Router**: Evaluates hash function $weight = H(key + node_id)$ across the node list.

    - **Node Registry**: Service discovery registry (Consul / Eureka) publishing healthy node lists.


    ### 3. Data Flow

    1. Key $K$ arrives at client.

    2. Client iterates over list of healthy nodes, computing $w_i = H(K, Node_i)$.

    3. The node with $\max(w_i)$ receives the request.


    ### 4. Capacity & Consistency Notes

    - **Complexity**: $O(N)$ calculation per request, optimizable to $O(\log N)$ using skeletal tree structures.

    - **Distribution**: Equivalent mathematical key uniformity to consistent hashing.'
---

### Problem Scope: Design Consistent Hashing

Design a distributed consistent hashing mechanism to route request keys across a dynamic cluster of cache/storage nodes with minimal key movement during topology changes.

#### Functional Requirements:
1. **Core Workflows**: Implement the primary capabilities of Design Consistent Hashing.
2. **Data Consistency**: Ensure data reliability and integrity across all operations.
3. **API & Interface Design**: Define clean, RESTful or streaming communication interfaces.
4. **Resilience & Fault Tolerance**: Recover gracefully from network partitions, node failures, and traffic spikes.

#### Non-Functional Requirements:
1. **High Availability**: Target 99.99% system availability.
2. **Low Latency**: Sub-second (or microsecond, where applicable) response times for core paths.
3. **Scalability**: Horizontal scalability to support millions of concurrent users.
4. **Data Durability**: Zero data loss for stateful and transactional operations.
