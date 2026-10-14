---
slug: beh-resolving-interpersonal-team-friction
title: "Mediating Interpersonal Code Review Friction Between Engineers"
track: BEHAVIORAL_STAR
difficulty: EASY
topics:
  - behavioral
est_minutes: 20
tags: ['collaboration', 'empathy', 'code-review', 'conflict-resolution']
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
    summary: "Two senior engineers engaged in contentious, nitpicky code review arguments over stylistic formatting and architectural purity, delaying PR merges by days. I intervened by establishing clear team review standards, automating stylistic linter checks in CI, and fostering constructive feedback norms."
    keyIdea: "Eliminate subjective friction by delegating style debates to automated formatters and aligning the team on objective functional review criteria."
    tradeoffs:
      - "Invested team sprint time in establishing and voting on a standardized spotless/eslint configuration."
      - "Required reviewers to classify comments into 'blocking defect' vs 'non-blocking suggestion'."
    whenToUse: "Ideal response for technical leadership, collaboration, and high-pressure engineering interviews."
    writeUp: |
      ### Situation
      Our core services squad experienced increasing tension as PR review threads ballooned to 40+ comments between two senior engineers debating variable naming conventions and interface granularity, slowing sprint velocity by nearly 35%.

      ### Task
      As team lead, I needed to de-escalate personal defensiveness, separate subjective taste from engineering correctness, and rebuild a respectful, high-velocity code review culture.

      ### Action
      I held private 1-on-1s with both engineers to understand their viewpoints and validate their commitment to quality. During our team retrospective, I facilitated a workshop on code review etiquette. We agreed on two systemic changes: first, we adopted automated linters and code formatters (Spotless/Prettier) in CI to make style enforcement impersonal; second, we instituted conventional comments prefix tags (`[blocker]`, `[question]`, `[nit]`) where non-blocking comments cannot delay a merge.

      ### Result
      PR review turnaround time dropped from 3.2 days to under 6 hours. Team sentiment surveys showed a 40% improvement in peer collaboration satisfaction.
---

### Mediating Interpersonal Code Review Friction Between Engineers

Can you share an experience where communication breakdown or interpersonal friction during code reviews was hurting team velocity or morale? How did you intervene to restore healthy collaboration?
