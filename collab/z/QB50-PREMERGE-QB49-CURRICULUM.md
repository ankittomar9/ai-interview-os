# QB-50 — Pre-Merge Audit of `feat/qb49-agentic-curriculum-lms` (Executor: Gemini lane)

- **Agent:** Super Z (audit lane)
- **Date:** 2026-10-27 (Asia/Calcutta)
- **Branch audited:** `feat/qb49-agentic-curriculum-lms` @ `9e704b6` (single commit, parent `045e126` = Z's QB-49 spec commit on master)
- **Method:** full-feature audit (not hotfix lane): topology, scope, content-vs-spec diff, anti-fabrication extraction, machine-run `count-tests.sh --markdown`, independent suite re-runs (Maven QBS+ISS on Temurin 21; FE `tsx --test` + `npm run build`).
- **Claimed receipt:** 116/676/2573/2 — **machine-matched digit-exact by Z.**

---

## 1. Topology & scope — PASS

- Single commit `9e704b6` on linear parent `045e126`; no force-push, no rebase of master history.
- **Exactly 10 files, +667/−33, zero non-spec creep** (no pom/docker/config/other-service changes):
  - `LearnTreeService.java` (M), `RetryQueueService.java` (M) — P0-1/P0-2
  - `LearnTreeServiceTest.java` (M), `RetryQueueServiceTest.java` (M) — required tests
  - `_taxonomy.yaml` (M) — P1-3
  - `AgenticGuideDrawer.tsx` (A), `AgenticGuideDrawer.test.ts` (A), `HubView.tsx` (M), `LearnView.tsx` (M), `ModulesView.tsx` (M) — P2-4

## 2. Content vs QB-49 §3 spec — PASS (with 2 benign, spec-aligned extras)

**P0-1 LearnTreeService:** `LEARN_SLUG_PREFIXES` = exactly the 7 prefixes; both whitelist sites (catalog filter ~L149, `isValidSlug` fallback ~L190) now call `isLearnSlug()`. Extra A: `isBlank()` guard added — strictly safer. Extra B (bonus, correct): a **fifth** prefix duplication — LearnTreeService's own private `stripPrefix()` (old L440–458 region, the 5-prefix list Gemini's original analysis had circled) — is unified into shared `stripLearnPrefix()`; RetryQueueService's private `stripPrefix()` delegates to it. Behavior-preserving (returns `null` exactly as before for non-prefixed slugs). Single source of truth achieved; no drift possible.

**P0-2 RetryQueueService:** `agentic-` → `"agentic-engineering"`, `incident-` → `"incident-response"` inserted before the `"arrays"` fallthrough; bucket strings == taxonomy topic **ids** (verified in `_taxonomy.yaml`). Title-strip path now shares the constant.

**P1-3 taxonomy:** resource blocks landed **only** on the 3 agentic topics (3/2/2 links); `incident-response` and `performance-tuning` remain resource-less per spec §2.4. Programmatic URL-set diff against the QB-49 verified manifest: **empty on both sides** — taxonomy now holds exactly 10 resource URLs (3 pre-existing + 7 verified V1–V7), zero extras, zero bot-walled.

**P2-4 drawer + wiring:** drawer URLs = exactly the 7 verified manifest URLs (machine-extracted, subset check passed); the 6 practice questions reference **only real slugs and titles, machine-matched to front-matter** (diff empty; 4 extra `title:` strings in-file are archetype section headers matching QB-49 §4 verbatim; `agentic-guide-title` is an ARIA DOM id, `production-incident-ops` an archetype card key — no fabricated question references). Guide opens **only** inside the agentic module (`isAgenticModule` gate on button + banner). Hub/Learn views add `AGENTIC_ENGINEERING` + `SYSTEM_TROUBLESHOOTING` track chips — consistent with QB-48's SetupScreen cards (cross-surface coherence).

## 3. Receipt & suites — PASS (all re-run by Z, not trusted from claim)

| Check | Result |
|---|---|
| `count-tests.sh --markdown` @ 9e704b6 | **116 / 676 / 2573 / 2 — digit-exact vs claim** |
| Delta vs QB-48 baseline (115/669/2531/2) | +1 file (`AgenticGuideDrawer.test.ts`), +7 cases (ISS +2, FE +5), +42 asserts (ISS +15, FE +27), 0 skipped delta — **all reconcile** |
| Surefire ISS (executed) | 314 / 0F / 0E / **1S (skipped preserved)** — +2 vs QB-46b-era 312 = exactly the 2 new `@Test` methods |
| Surefire QBS (executed) | 41 / 0F / 0E (unchanged; catalog + `DsaCatalogGuard` exercised the new YAML) |
| FE `tsx --test` (canonical runner) | 325 pass / 42 suites / 0F / 0S |
| `npm run build` (`tsc -b && vite build`) | exit 0, no TS errors |

**Toolchain note (for future rounds):** system OpenJDK 21 JRE fails `release version 21` compile — the surviving Temurin toolchain (`/tmp/my-project/jdk-21.0.12.1+1` + Maven 3.9.9) is required. Sandbox rotated mid-audit; clone recovered from `/tmp/my-project/audit48/repo`.

## 4. Verdict — **MERGE AUTHORIZED**

Executor lane executes:

```
git checkout master && git pull && git merge --no-ff feat/qb49-agentic-curriculum-lms
```

Merge message template:

```
merge: wire agentic curriculum into Practice Center and taxonomy (QB-49)

feat/qb49-agentic-curriculum-lms @ 9e704b6 -> master (--no-ff)
Pre-merge audit: collab/z/QB50-PREMERGE-QB49-CURRICULUM.md (MERGE AUTHORIZED)
Receipt: 116/676/2573/2 (baseline moves from 115/669/2531/2)
```

Post-merge (Z lane, next round): content-free merge check (diff vs `9e704b6` = empty) + `count-tests.sh --markdown` re-run (expect 116/676/2573/2 unchanged at the merge commit).

## 5. Process notes

- Worklog split-brain from sandbox rotation reconciled: QB-49/QB-49-push entries restored onto the durable `/tmp/my-project/worklog.md`; this entry appended to both volumes.
- PAT hygiene: inline-token pattern, no persistence (config/credential files/env swept clean post-push).
- Carried: orchestrator image rebuild (QB-44 §4) unconfirmed; SPEC-019.1 backlog unchanged; operator visual check of the new drawer at the Practice Center recommended post-merge (Ctrl+F5).
