---
slug: hld-realtime-chat-websocket
title: Global Multi-Region WebSocket Real-Time Chat System
track: SYSTEM_DESIGN
difficulty: SENIOR
tags: [websockets, real-time, pubsub, redis, cassandra]
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-hld/realtime-chat
status: PUBLISHED
hints:
  - "Maintain stateful WebSocket connections on edge gateway pods; broadcast via Redis Pub/Sub."
editorial: |
  ### Real-Time Messaging Architecture
  - Connection Gateway: Sticky TCP/WebSocket termination.
  - Session Store: Redis cluster mapping `userId -> gatewayPodId`.
---
### Global Multi-Region WebSocket Real-Time Chat System
Design a real-time messaging system supporting 50M daily active users, 1-on-1 chats, group channels, online presence, and offline push notifications.
