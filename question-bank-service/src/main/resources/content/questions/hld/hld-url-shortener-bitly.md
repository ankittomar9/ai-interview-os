---
slug: hld-url-shortener-bitly
title: Scalable High-Throughput URL Shortener
track: SYSTEM_DESIGN
difficulty: MID
tags: [system-design, base62, distributed-id, bloom-filter, caching]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-hld/url-shortener
status: PUBLISHED
hints:
  - "Base62 encoding (a-z, A-Z, 0-9) on a 64-bit unique ID generates compact 7-character URLs."
coaching:
  presentationTips:
    - "Highlight 100:1 read-to-write ratio and explain why aggressive Redis caching is essential."
editorial: |
  ### URL Shortening Architecture
  - **ID Generation**: Snowflake ID generator or distributed range allocator.
  - **Database**: NoSQL Key-Value store (Cassandra / DynamoDB) with 301 Permanent Redirects.
---
### Scalable High-Throughput URL Shortener
Design a global URL shortening service like Bit.ly that supports 100M new URLs per month and 10 billion redirects with sub-10ms latency.
