---
slug: beh-prioritizing-conflicting-urgent-tasks
title: "Triaging and Prioritizing High-Severity Competing Demands"
track: BEHAVIORAL_STAR
difficulty: EASY
topics:
  - behavioral
est_minutes: 20
tags: ['time-management', 'triage', 'prioritization', 'focus']
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
    summary: "While preparing for a major sprint demo, a Sev-2 customer escalation occurred simultaneously with an executive data request for an investor board meeting. I evaluated business impact, delegated the escalation investigation, and delivered on all fronts with clear communication."
    keyIdea: "Categorize competing pressures by existential business impact and irreversible consequences; delegate and over-communicate status continuously."
    tradeoffs:
      - "Delegated customer escalation root-cause analysis to a capable mid-level engineer while I tackled the board-level SQL audit."
      - "Trimmed secondary polish slides from the sprint demo to focus purely on working software."
    whenToUse: "Ideal response for technical leadership, collaboration, and high-pressure engineering interviews."
    writeUp: |
      ### Situation
      On a Thursday morning, our customer support team flagged an urgent Sev-2 bug affecting checkout currency conversions in Europe. Simultaneously, our CTO requested a complex multi-region database usage report for an afternoon board meeting, and our sprint demo was scheduled for 3 PM.

      ### Task
      I had 5 hours to resolve all three demands without dropping the ball or causing panic within the team.

      ### Action
      I took 10 minutes to triage using the Eisenhower Matrix. The checkout bug had direct financial impact: I assigned our experienced backend engineer to trace the currency API rate limit, giving them clear scope and shielding them from distractions. For the CTO's request, I wrote the required analytical SQL aggregation and scheduled automated exports. For the sprint demo, I simplified the presentation agenda to focus exclusively on live user workflow demonstrations.

      ### Result
      The currency bug was patched and deployed in 90 minutes; the CTO received the audited board report 2 hours before the meeting; and our sprint demo was praised by product leadership for its clarity.
---

### Triaging and Prioritizing High-Severity Competing Demands

Tell me about a day or week where multiple urgent, high-priority issues landed on your plate at once—such as a production bug, an executive request, and an overdue sprint milestone. How did you triage, delegate, and execute?
