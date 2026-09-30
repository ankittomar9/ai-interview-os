# V-2.0.8 HLD Question Catalog Audit & Classification Report

| Metadata | Value |
|---|---|
| **Audit Date** | 2026-10-01 |
| **Auditor** | Gemini (Implementation Lead) |
| **Spec Reference** | SPEC V-2.0.8 Item V8-04 |
| **Catalog Scope** | All 27 questions in `question-bank-service/src/main/resources/content/questions/hld/` |

---

## 1. Executive Summary

As mandated by **SPEC V-2.0.8 Item V8-04**, an exhaustive structural audit was performed across all 27 High-Level Design (HLD) questions.

Each question was audited against:
1. `track`: Target track taxonomy.
2. `starterCode` / `starterFiles`: Presence of code assets.
3. `referenceSolutions`: Approach classes and payloads (`kind: WRITEUP` vs `kind: CODE`).
4. System Presentation Profile: Whiteboard / Architectural Canvas (`HldWhiteboardCanvas`) vs Code-server workspace.

### Key Finding:
**27 out of 27 HLD questions** are **WRITEUP-ONLY** architectural system design questions.
- Every HLD question specifies exclusively `kind: WRITEUP` reference solutions (architecture diagrams, capacity planning, data flows, trade-off matrices).
- None of the 27 questions contain coding problems or single-file code requirements.
- On the platform, `SYSTEM_DESIGN` track routes directly to `HldScreen` (`HldWhiteboardCanvas`), an interactive architectural diagramming canvas rather than a Maven code-server workspace.

Therefore, per the specification rule (*"a writeup-only question gets no scaffold; the classification list is committed as the audit artifact"*), **no code scaffolds are required or appropriate for these 27 questions**.

---

## 2. Classification Inventory (27 Questions)

| # | Slug | Track | BuildProfile | Ref Solution Kind | Classification |
|---|---|---|---|---|---|
| 1 | `hld-ad-click-event-aggregation` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 2 | `hld-consistent-hashing` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 3 | `hld-digital-wallet` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 4 | `hld-distributed-cache-lfu` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 5 | `hld-distributed-email-service` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 6 | `hld-distributed-message-queue` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 7 | `hld-distributed-rate-limiter` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 8 | `hld-global-leaderboard-redis` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 9 | `hld-google-drive-cloud-storage` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 10 | `hld-google-maps` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 11 | `hld-hotel-reservation-system` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 12 | `hld-kafka-event-streaming-pipeline` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 13 | `hld-key-value-store` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 14 | `hld-metrics-monitoring-alerting` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 15 | `hld-nearby-friends` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 16 | `hld-news-feed-system` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 17 | `hld-notification-system` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 18 | `hld-payment-system` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 19 | `hld-proximity-service` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 20 | `hld-realtime-chat-websocket` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 21 | `hld-s3-object-storage` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 22 | `hld-search-autocomplete` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 23 | `hld-stock-exchange` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 24 | `hld-unique-id-generator` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 25 | `hld-url-shortener-bitly` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 26 | `hld-web-crawler` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |
| 27 | `hld-youtube-video-platform` | `SYSTEM_DESIGN` | `judge0` | `WRITEUP` | **Writeup-Only** |

---

## 3. Conclusion & Recommendation

All 27 HLD questions are categorized as **writeup-only**.
Code project scaffolds are strictly dedicated to workspace-profile execution questions (`SPRING_LLD`), which have all been fully authored in V8-03.a...e.
