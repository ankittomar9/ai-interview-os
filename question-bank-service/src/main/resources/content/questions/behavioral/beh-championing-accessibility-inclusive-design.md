---
slug: beh-championing-accessibility-inclusive-design
title: "Championing Web Accessibility Standards Under Schedule Pressure"
track: BEHAVIORAL_STAR
difficulty: EASY
topics:
  - behavioral
est_minutes: 20
tags: ['accessibility', 'inclusion', 'front-end', 'quality']
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
    summary: "During a rapid web redesign of our checkout flow, screen reader support and keyboard navigation were deprioritized. I audited the flow using accessibility tooling, demonstrated the legal and ethical business case, and integrated automated axe-core linting into our frontend pipeline."
    keyIdea: "Accessibility is a non-negotiable core quality requirement, not an optional post-launch feature."
    tradeoffs:
      - "Replaced custom non-semantic div dropdowns with accessible ARIA combobox primitives."
      - "Added 2 days of screen-reader testing to our QA regression cycle."
    whenToUse: "Ideal response for technical leadership, collaboration, and high-pressure engineering interviews."
    writeUp: |
      ### Situation
      Our e-commerce design team unveiled a visually stunning checkout redesign. However, an initial accessibility audit revealed that modal dialogs lacked focus trapping, custom selects were unreachable via keyboard tab navigation, and color contrast ratios failed WCAG AA standards.

      ### Task
      The product team wanted to launch immediately and fix accessibility 'later'. I had to convince them that accessibility was a mandatory launch blocker and implement the required remediations.

      ### Action
      I invited our product manager and design lead to a 15-minute live demonstration where I attempted to complete a purchase using only a screen reader and keyboard navigation, highlighting how visually impaired customers were completely blocked from spending money. I presented data showing that 15% of our audience relied on accessible UI elements. I then offered to lead the refactoring, replacing brittle div-based custom widgets with accessible Headless UI primitives and adding automated axe-core test gates to our pull request pipeline.

      ### Result
      The team rallied around the effort and shipped the accessible checkout 4 days later. Our platform achieved full WCAG 2.1 AA certification, and checkout completion among accessibility tool users increased by 31%.
---

### Championing Web Accessibility Standards Under Schedule Pressure

Tell me about a time you advocated for accessibility, internationalization, or inclusive design when the broader team was focused solely on shipping fast.
