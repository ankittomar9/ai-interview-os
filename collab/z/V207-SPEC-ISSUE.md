# V-2.0.7 SPEC Issued — Reference-Solution Bank & Arena Decomposition

| Metadata | Value |
|---|---|
| **Task ID** | `V-2.0.7` (items `V7-01`…`V7-11`) |
| **Author** | Z.ai (Chief Architect), 2026-09-30 |
| **SPEC** | [`docs/SPEC_V207.md`](../../docs/SPEC_V207.md) — the single audited source of scope |
| **Baseline** | `origin/master` = `5ae0531` (V206-R3 merge) |
| **Executor** | Gemini |
| **Reviewers** | Z.ai + Qwen, independent, after each executor push |

---

## 1. What this version is

Two epics, issued as one version at the operator's direction:

1. **Reference-Solution Bank (the operator's product request).** Today 364 questions carry at most ONE
   canonical solution (and the 27 HLD + 2 behavioral questions carry none at all). V-2.0.7 upgrades the
   model to a `referenceSolutions[]` array with **2–3 interview-accepted approaches per question** —
   one `PRIMARY` (the existing canonical solution, promoted verbatim — nothing is lost) plus 1–2
   `ALTERNATE` accepted approaches — across all five categories (LLD first: it is the operator's stated
   pain point), with mode-based masking preserved and a hard no-leak contract test, plus a frontend
   "Reference Approaches" reveal UI that only ever shows after submission / in practice-learn surfaces.
2. **Arena decomposition + deferred tests/docs items** from the V-2.0.6 queue: line-budget epic
   (ArenaShell 352 / ArenaRoom 536 / useCoachVoice 383 → ≤ 250 each, re-verified on baseline), SelfTimer
   jsdom render test (F2 follow-up), and the two cosmetic docs fixes (R3 §3).

## 2. Execution order (priorities)

| Priority | Items |
|---|---|
| P0 | V7-01 schema+ingestion → V7-02 masking/no-leak → V7-03 LLD batch |
| P1 | V7-04 SQL batch, V7-05 HLD batch, V7-06 reveal UI, V7-07 SelfTimer render test, V7-08 arena decomposition |
| P2 | V7-09 DSA batch (8 sub-batches), V7-10 behavioral batch, V7-11 docs cosmetics |

Closure bar and branch/merge conventions are pinned in `docs/SPEC_V207.md` §3.

## 3. Notes for the executor

- The operator indicated Gemini holds a design recommendation for the reference-solution feature that did
  **not** reach the architect before issue time. Do not silently deviate: bring it to the table as a
  declared delta per `docs/SPEC_V207.md` §5, and it will be adjudicated in the normal ACCEPT/REBUT cycle.
- The `V7-01` schema is intentionally conservative (extends the existing single-solution model; legacy
  content is never rewritten). Deltas against it are cheap to adjudicate — propose early, before content
  batches start.
- Gates must be capable of failing (G4). Four-number vocabulary everywhere. Content in English; no emojis
  in source or content files.
- After each push: publish `docs/SPEC_V207_VERIFICATION.md` + `collab/gemini/V207-REPORT.md`; Z.ai and
  Qwen will verify independently.

— Z.ai, Chief Architect.
