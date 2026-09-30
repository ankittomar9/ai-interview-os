---
slug: hld-distributed-cache-lfu
title: Consistent Hashed LFU Distributed Caching Layer
track: SYSTEM_DESIGN
difficulty: HARD
topics:
- system-design
est_minutes: 45
tags:
- caching
- consistent-hashing
- lfu
- eviction
- replication
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-hld/distributed-cache
status: PUBLISHED
hints:
- Consistent hashing ring with virtual nodes prevents hotspots during cache server scale up/down.
editorial: '### LFU Distributed Cache Architecture

  Doubly linked lists combined with frequency buckets for O(1) eviction; virtual nodes on hashing ring.

  '
referenceSolutions:
- approachId: o1-doubly-linked-frequency-buckets
  label: Primary — O(1) Doubly-Linked Frequency Buckets with Distributed Hash Partitioning
  approachClass: PRIMARY
  kind: WRITEUP
  summary: In-memory distributed cache implementing an O(1) LFU eviction algorithm using frequency linked lists and key-to-node hash maps, partitioned across nodes via consistent hashing.
  keyIdea: Maintain a doubly-linked list of frequency buckets, where each bucket holds a doubly-linked list of cache nodes with identical access counts, giving O(1) get, put, and eviction.
  tradeoffs:
  - Strict O(1) time complexity for eviction, lookup, and frequency increment
  - High pointer overhead per node; frequency counters can grow indefinitely without periodic aging/decay
  whenToUse: Latency-critical distributed memory caching where long-tail access patterns favor retaining frequently accessed items over recently accessed items.
  diagramNotes: 'Consistent Hash Ring -> Cache Shard -> [Map: Key -> Node] -> [Frequency List: Freq 1 <-> Freq 2 <-> Freq 3] -> [Nodes per Freq].'
  writeUp: "### 1. Requirements Recap\n- **Functional**: High-throughput distributed cache supporting `get(key)` and `put(key, value)` with Least Frequently Used (LFU) eviction when capacity is reached.\n- **Scale**: Sub-millisecond P99 latency, 100,000 ops/sec per shard, multi-gigabyte heap management.\n\n### 2. Component Breakdown\n- **Node Hash Ring**: Consistent hashing layer directing keys to specific cache partition instances.\n- **Core LFU Engine (per shard)**:\n  - `keyTable`: `HashMap<String, CacheNode>`\n  - `freqTable`: `HashMap<Integer, DoublyLinkedList<CacheNode>>`\n  - `minFreq`: integer pointer to the lowest non-empty frequency bucket.\n- **Decay Worker**: Background thread that halving frequency counters every $T$ minutes to prevent stale historical items from starving new items.\n\n### 3. Data Flow\n1. `get(key)`:\n   - Lookup node in `keyTable`. If not present, return null.\n   - Remove node from its current frequency list $f$.\n   - Append node to frequency list $f + 1$.\n\
    \   - If list $f$ is now empty and `minFreq == f`, increment `minFreq = f + 1`. Return value.\n2. `put(key, value)`:\n   - If key exists, update value and increment frequency as in `get`.\n   - If capacity is full, remove node from `freqTable.get(minFreq).head()`, remove from `keyTable`.\n   - Insert new node with frequency 1; set `minFreq = 1`.\n\n### 4. Capacity & Consistency Notes\n- **Memory**: ~128 bytes of pointer overhead per cache entry.\n- **Eviction Invariant**: Evicts the oldest item among the lowest frequency bucket in deterministic $O(1)$ time."
- approachId: probabilistic-decaying-lfu-redis-style
  label: Alternate — Probabilistic Logarithmic Counter with Decaying LFU (Redis Style)
  approachClass: ALTERNATE
  kind: WRITEUP
  summary: Memory-efficient probabilistic LFU using an 8-bit logarithmic counter and 16-bit time decay field per key (Morris counter), sampling random keys for eviction instead of maintaining global lists.
  keyIdea: Compress frequency and last-access timestamp into a 24-bit field per entry; increment counter probabilistically and evict the lowest score among a small sample of $K$ random keys.
  tradeoffs:
  - Drastically lower memory overhead (only 3 bytes metadata per key vs 32+ bytes for pointers)
  - Eviction is approximate rather than mathematically exact, but empirically achieves >98% accuracy
  whenToUse: Large-scale caching systems (like Redis) storing hundreds of millions of keys where pointer memory overhead would degrade overall cache density.
  diagramNotes: 'Client -> Redis Shard -> Key Metadata: [16-bit Last Access Time | 8-bit Log Counter] -> Sample K=5 Keys -> Evict Minimum Score.'
  writeUp: '### 1. Requirements Recap

    - **Functional**: Extreme memory efficiency with high-accuracy LFU behavior under memory saturation.

    - **Scale**: Hundreds of millions of keys per node with minimal RAM overhead.


    ### 2. Component Breakdown

    - **Entry Metadata**: Each key-value entry stores a 24-bit LFU field: 16 bits for last decay time (in minutes) and 8 bits for logarithmic counter ($0-255$).

    - **Sampler Evaluator**: On memory pressure, samples $K = 5$ random keys, calculates their decayed counter, and frees the lowest.


    ### 3. Data Flow

    1. On access, the algorithm compares current minute against stored timestamp; decays counter if elapsed time exceeds threshold.

    2. Calculates increment probability: $P = 1 / (counter * factor + 1)$. Generates random float; increments counter if random < $P$.

    3. On eviction, sample $K$ candidates; pick minimum decayed counter.


    ### 4. Capacity & Consistency Notes

    - **Memory Saving**: 3 bytes per entry vs 32 bytes for doubly linked list nodes.'
---

### Consistent Hashed LFU Distributed Caching Layer
Design a multi-node in-memory key-value cache layer with Least Frequently Used (LFU) eviction, consistent hashing ring distribution, and asynchronous write-behind replication.
