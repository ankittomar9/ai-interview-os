---
slug: hld-global-leaderboard-redis
title: Real-Time Gaming Leaderboard with Redis Sorted Sets
track: SYSTEM_DESIGN
difficulty: MID
tags: [redis, sorted-sets, gaming, real-time, leaderboard]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-hld/global-leaderboard
status: PUBLISHED
hints:
  - "Redis ZSET provides O(log N) score insertion/update and O(log N + M) range retrieval."
editorial: |
  ### Global Gaming Leaderboard
  Partition score shards by game mode or tier; utilize `ZADD` and `ZREVRANGE` for real-time top-100 player retrieval.
---
### Real-Time Gaming Leaderboard with Redis Sorted Sets
Design a real-time gaming leaderboard system displaying top 100 player ranks and personal rank queries for 10M concurrent players.
