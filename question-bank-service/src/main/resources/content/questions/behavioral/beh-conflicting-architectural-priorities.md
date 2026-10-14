---
slug: beh-conflicting-architectural-priorities
title: "Resolving Architectural Disagreements in Service Decomposition"
track: BEHAVIORAL_STAR
difficulty: MEDIUM
topics:
  - behavioral
est_minutes: 20
tags: ['architecture', 'conflict-resolution', 'star', 'tradeoffs']
buildProfile: judge0
source: ai-generated:v1
status: PUBLISHED
hints:
  - "Structure your narrative using explicit Situation, Task, Action, and Result (STAR) stages."
  - "Quantify your impact with business or engineering metrics (e.g. latency, error rate, team velocity, delivery timeline)."
coaching:
  presentationTips:
    - "Set the context quickly: specify team size, scale, and exact constraints within the first 60 seconds."
    - "Spend 60% of your time on the Action phase, highlighting your personal contribution and leadership."
editorial: |
  ### Evaluator Rubric & STAR Expectations
  Strong candidates demonstrate clear individual agency, empathy, systematic problem-solving, and measurable business impact. Look for structured communication, transparent discussion of tradeoffs, and constructive learning from setbacks.
referenceSolutions:
  - approachId: canonical-star-narrative
    label: "Primary — Exemplary STAR Engineering Narrative"
    approachClass: PRIMARY
    kind: WRITEUP
    summary: "During a checkout modernization project, a staff engineer advocated for a granular 8-microservice decomposition, while I proposed a modular monolith with domain event boundaries to limit distributed transaction complexity. Through objective RFC benchmarks and latency modeling, we aligned on a hybrid two-service approach that cut delivery time by 30%."
    keyIdea: "Resolve technical disagreements using objective data, prototype benchmarks, and shared operational invariants rather than subjective authority."
    tradeoffs:
      - "Conceding on complete domain isolation allowed us to avoid distributed two-phase commits across relational databases."
      - "Investing 3 days in a load-spike benchmark delayed initial RFC sign-off but established team-wide consensus."
    whenToUse: "Ideal response for technical leadership, collaboration, and high-pressure engineering interviews."
    writeUp: |
      ### Situation
      Our payment platform was undergoing a replatforming to handle projected 4x transaction surges. A principal architect insisted on splitting our checkout process into 8 microservices communicating via gRPC, whereas our team was concerned about debugging latency, distributed tracing overhead, and operational maintenance for a 5-person squad.

      ### Task
      As the tech lead responsible for delivery, I needed to resolve the deadlock constructively without alienating senior stakeholders, while safeguarding our SLA and 4-month release schedule.

      ### Action
      I authored a data-driven RFC comparing network hops, serial p99 latency risks, and failure blast radiuses. Rather than debating theoretically, I built a lightweight benchmark simulating 10,000 req/sec across both topologies. The data revealed that 8 network hops inflated tail latency by 140ms under database lock contention. I proposed a hybrid compromise: two loosely coupled domain services (Billing Gateway and Inventory Reservation) backed by transactional outbox messaging.

      ### Result
      The principal architect endorsed the hybrid model. We delivered the system 3 weeks ahead of schedule, sustained zero Sev-1 issues during holiday peak, and reduced p99 checkout latency by 42ms.
---

### Resolving Architectural Disagreements in Service Decomposition

Tell me about a time when you and a senior colleague had fundamentally conflicting perspectives on a core architectural decision. How did you evaluate the competing paths, reach alignment, and execute the delivery without lingering friction?
