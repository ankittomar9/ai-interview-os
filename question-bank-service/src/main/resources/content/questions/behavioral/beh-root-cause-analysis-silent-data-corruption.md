---
slug: beh-root-cause-analysis-silent-data-corruption
title: "Investigating and Remediating a Multi-Month Silent Data Drift"
track: BEHAVIORAL_STAR
difficulty: HARD
topics:
  - behavioral
est_minutes: 20
tags: ['debugging', 'data-integrity', 'post-mortem', 'investigation']
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
    summary: "A subtle floating-point precision rounding error in our rewards ledger caused a 0.01% currency drift over three months. I designed an idempotency audit job to detect discrepancies, migrated the financial ledger to arbitrary-precision BigDecimals, and reconciled all ledger records."
    keyIdea: "Never use floating-point types for monetary calculations; implement continuous automated invariant reconcilers to catch silent drift."
    tradeoffs:
      - "Migrating legacy database columns from FLOAT to NUMERIC(18,4) required an online table rewrite strategy."
      - "Ran nocturnal background reconciliation jobs that consumed 10% read replica capacity."
    whenToUse: "Ideal response for technical leadership, collaboration, and high-pressure engineering interviews."
    writeUp: |
      ### Situation
      Our accounting finance team noticed an unexplained $8,400 variance between our reward points liability ledger and actual cash reserves accumulating over 90 days. Because transactions appeared successful in real-time, no alerts fired.

      ### Task
      I was assigned to investigate the discrepancy, locate the elusive point of corruption, and safely reconcile historical customer balances without interrupting transactions.

      ### Action
      I formulated hypotheses and wrote a diagnostic script querying 500,000 historical ledger entries. I discovered that a currency conversion helper class written 6 months earlier utilized IEEE 754 double precision arithmetic rather than `BigDecimal`, causing micro-cent truncations during multi-currency conversions. I implemented an immediate fix replacing all floating-point math with `BigDecimal` and `RoundingMode.HALF_EVEN`. I then authored an audited offline reconciliation script that replayed transaction logs, corrected all affected accounts, and credited customers with the minute rounding differences.

      ### Result
      The financial variance was completely resolved to zero cents. I introduced a mandatory CI linting check forbidding primitive float and double types in our financial service modules.
---

### Investigating and Remediating a Multi-Month Silent Data Drift

Describe a scenario involving a subtle, insidious bug—such as silent data corruption or memory leaks—that escaped detection for weeks. How did you isolate the root cause and repair the damage?
