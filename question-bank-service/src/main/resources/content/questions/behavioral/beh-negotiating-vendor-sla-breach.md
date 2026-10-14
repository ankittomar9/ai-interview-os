---
slug: beh-negotiating-vendor-sla-breach
title: "Remediating Upstream Third-Party Vendor Latency Outages"
track: BEHAVIORAL_STAR
difficulty: MEDIUM
topics:
  - behavioral
est_minutes: 20
tags: ['vendor-management', 'sla', 'resilience', 'architecture']
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
    summary: "Our KYC verification provider began experiencing 12-second latency spikes, degrading user onboarding conversion by 25%. I implemented a fallback circuit breaker with secondary vendor routing and negotiated service credit restitution under our enterprise SLA."
    keyIdea: "Treat third-party dependencies as untrusted failure domains; engineer automated multi-vendor failover and enforce contractual accountability."
    tradeoffs:
      - "Introduced an abstraction layer to normalize differing JSON schemas between the primary and secondary KYC vendors."
      - "Incurred minimal monthly holding costs for the warm standby secondary vendor."
    whenToUse: "Ideal response for technical leadership, collaboration, and high-pressure engineering interviews."
    writeUp: |
      ### Situation
      Our fintech onboarding funnel relied on a third-party biometric verification SaaS provider. Over a two-week period, their API latency degraded from 800ms to 14,000ms during peak morning hours, causing 25% of prospective customers to abandon account creation.

      ### Task
      I had to protect our onboarding funnel immediately from third-party unreliability and hold the vendor accountable to contractual uptime guarantees.

      ### Action
      Technically, I deployed an asynchronous circuit breaker using Resilience4j: if the vendor's p95 latency exceeded 3 seconds over a 60-second window, traffic automatically failed over to our secondary pre-integrated KYC provider. Commercially, I compiled automated CloudWatch latency metrics and webhook failure logs, presenting undeniable proof of SLA breaches to their VP of Customer Success.

      ### Result
      The automated failover restored customer onboarding completion rates to 99.4%. The vendor conceded the SLA failure, refunded $45,000 in monthly platform fees, and dedicated an engineering team to resolve their infrastructure bottlenecks.
---

### Remediating Upstream Third-Party Vendor Latency Outages

Can you share an experience where a critical third-party vendor or cloud service degraded your system's SLA? How did you isolate the dependency technically and resolve the commercial relationship?
