# Playground UI Redesign — Mockups for Operator Review

**Status:** REVIEW IN PROGRESS — no spec written yet, no production code touched.
**Author:** Z.ai (architecture/audit lane) · **Branch:** `design/playground-mockups` · **Date:** 2026-10-02

## What this is

Five pixel-accurate HTML mockups (plus rendered PNGs) exploring redesign directions for the
Playground / Learn mode, built with the product's **real data** (322 DSA problems, 1/322 solved,
retry queue with real failure states, session #155) — not concept art.

Each HTML file opens directly in a browser and is click-navigable for review purposes.
The PNGs are full-page renders (1600px @2x) of the same files.

## Directions

| File | Direction | Key idea |
|------|-----------|----------|
| `a_mission_control.html` / `.png` | **A — Mission Control** | Dark, card-first dashboard: Continue hero + retry queue card + topic tiles + activity rail |
| `b_curriculum.html` / `.png` | **B — Curriculum** | Light Scaler-style: top nav, module rail, unit grouping, pagination |
| `c_power_desk.html` / `.png` | **C — Power Desk** | Dark, keeps current IA but with full-colour difficulty/status semantics and filters |
| `d1_prep_hub_v2.html` / `.png` | **D1 — Prep Hub v2 (merged, recommended)** | A + B merged: single-CTA Continue hero, retry chips, honest topic tiles, filter table |
| `d2_module_view.html` / `.png` | **D2 — Module view (companion to D1)** | Module rail + **two-track table**: Practice x/5 pips + Interview x/1 per problem |

## Non-negotiables baked into every direction

1. **Two-track model** — every problem carries `Practice x/5` AND `Interview x/1`; never flattened
   into a single attempts column.
2. **Failure-state semantics** — `COMPILE_ERROR / RUNTIME_ERROR / FAILED / PARTIAL` are the signal
   that feeds the retry queue; never reduced to ✓/✗.
3. **Honest counts only** — every number in these mockups maps to real product state; no invented
   streaks, percentages, or totals (a known failure mode found in the external Lovable drafts).

## Review notes vs. the external Lovable drafts

Issues found in the Lovable-generated drafts that Direction D corrects:
inconsistent totals (316 vs 322), fabricated metrics (12/56, 21%, 4-day streak), rail/table state
contradictions, "Esay" typo, and nav entries for features that do not exist (Flashcards, Analytics,
Notes, Discussion, Mock Interviews, Due-today, Day 1–6 curriculum).

## Next step

Operator picks a direction (or a blend) → Z.ai writes the UI SPEC → executor lane implements.
Nothing here is wired into the frontend build; it is pure static HTML.
