---
slug: beh-architecting-disaster-recovery-live-drill
title: "Executing an Unannounced Multi-Region Disaster Recovery Drill"
track: BEHAVIORAL_STAR
difficulty: HARD
topics:
  - behavioral
est_minutes: 20
tags: ['disaster-recovery', 'chaos-engineering', 'reliability', 'leadership']
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
    summary: "I led our organization's first live multi-region failover simulation, cutting traffic from US-East to US-West during a scheduled window. We discovered hidden DNS caching bottlenecks and database replication delays, patched them, and reduced recovery time objective (RTO) from 4 hours to 3 minutes."
    keyIdea: "Disaster recovery readiness is purely theoretical until tested with live traffic; uncover hidden coupling during controlled drills."
    tradeoffs:
      - "Conducted the drill during an off-peak maintenance window at 2 AM to minimize blast radius."
      - "Accepted temporary elevated multi-region data replication egress costs."
    whenToUse: "Ideal response for technical leadership, collaboration, and high-pressure engineering interviews."
    writeUp: |
      ### Situation
      Our enterprise customer agreements stipulated an RTO (Recovery Time Objective) of under 15 minutes and RPO (Recovery Point Objective) under 1 minute. However, our disaster recovery playbook had never been executed with live production traffic.

      ### Task
      As technical lead for reliability, I proposed and executed an unannounced simulated regional datacenter failure to validate our automated failover capabilities.

      ### Action
      I designed a comprehensive game day protocol with automated rollback abort criteria. At 2:00 AM, we initiated traffic rerouting from our primary US-East region to our standby US-West region. While stateless services shifted seamlessly, two critical bottlenecks emerged: internal DNS TTLs were improperly cached for 60 minutes by an edge proxy, and our Aurora PostgreSQL read replica in US-West experienced a 45-second replication lag spike under sudden write load. I coordinated manual DNS flushes, verified data consistency, and safely restored normal operations.

      ### Result
      We overhauled our DNS caching configuration, reduced TTLs to 30 seconds, and configured automated database promotion triggers. In our follow-up drill 6 weeks later, full regional failover completed autonomously in 2 minutes and 48 seconds.
---

### Executing an Unannounced Multi-Region Disaster Recovery Drill

Tell me about a time you planned or executed a disaster recovery drill, multi-region failover, or chaos experiment under production conditions. What unexpected failures emerged, and how did you resolve them?
