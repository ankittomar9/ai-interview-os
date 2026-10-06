# LLD Catalog Sources & Licensing Declarations

This document logs all external repositories and references consulted during the authoring of the LLD (Low-Level Design) question catalog for InterviewOS per SPEC-011 §0.

## Consulted Public Sources

| Repository / Source | License | Consultation Scope | Disposition / Compliance |
|---|---|---|---|
| `ashishps1/awesome-low-level-design` | **GPL-3.0** | Topic taxonomy reference only | **Reference-only.** Zero code, test, or statement text copied to prevent license contamination. |
| `arpit20adlakha/Data-Structure-Algorithms-LLD-HLD` | **MIT** | Domain concepts and structure | Reference & structural inspiration. All problem statements authored fresh in original wording. |
| `kousiknath/LowLevelDesign` | **MIT** | Classic OOP interview patterns | Architectural reference. |
| `kumaransg/LLD` | **None** | Excluded | Strict non-consultation due to missing license. |
| takeUforward Prep-Hub | **Proprietary** | Unprotectable topic titles (facts) | Factual topic titles only. Paywalled and proprietary statement text excluded. |

## Authored Question Systems (SPEC-011 REV 2)

1. `lld-logging-framework`: Extensible Logging Framework (`com.interviewos.logging`, MEDIUM, 35m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/logging-framework`
   - Original problem statement, class hierarchies, and JUnit Jupiter test suites.

2. `lld-traffic-signal`: Traffic Signal Control System (`com.interviewos.traffic`, MEDIUM, 35m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/traffic-signal`
   - Original state machine, emergency preemption logic, and JUnit Jupiter test suites.

3. `lld-task-management`: Task Management System (`com.interviewos.tasks`, MEDIUM, 35m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/task-management`
   - Original state transitions, audit trail models, and observer dispatch engine.

4. `lld-pubsub`: Publish-Subscribe Message Broker (`com.interviewos.pubsub`, HARD, 45m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/pubsub`
   - Original in-memory broker, fanout delivery policy, and concurrency isolation.

5. `lld-hotel-management`: Hotel Management System (`com.interviewos.hotel`, HARD, 45m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/hotel-management`
   - Original inventory lifecycle, dynamic pricing strategies, and reservation state machine.

6. `lld-digital-wallet`: Digital Wallet (`com.interviewos.wallet`, HARD, 45m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/digital-wallet`
   - Original atomic ledger audit trail, overdraft protection, and transaction fee policies.

7. `lld-ride-booking`: Ride Booking Application (`com.interviewos.ride`, HARD, 45m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/ride-booking`
   - Original spatial matching strategy, fleet availability coordinator, and trip progression.

8. `lld-music-streaming`: Music Streaming Platform (`com.interviewos.music`, HARD, 45m)
   - Source reference: `inspired-by:takeuforward-prep-hub/lld/music-streaming`
   - Original state machine playback controls, playlist sequencing, and queue navigation.
