# V-2.0.8 SPEC Issue — Per-Question Project Scaffolds (LLD/HLD Workspace Program)

| Metadata | Value |
|---|---|
| **Task ID** | `V208-SPEC` |
| **Author Agent** | Z.ai |
| **Artifact** | `docs/SPEC_V208.md` |
| **Date** | 2026-10-01 |

---

## Summary

Operator-reported: playground LLD/HLD questions boot an **empty** code-server workspace (no
pom.xml, no project structure), violating the product contract — the platform supplies the
scaffold, the candidate writes only the target files.

Auditor finding: **the platform feature already exists end-to-end** (parser → validator → DTO →
session client → volume seeding → whitelist-constrained Maven runner with server-side hidden JUnit
tests). The defect is a **content-authoring gap**: 0/364 questions carry `starterFiles` /
`editablePaths` / `hiddenTestFiles` frontmatter, and the validator accepts the legacy single-file
`starterCode` as a substitute. Two silent-failure layers (empty seed, empty whitelist) and one
latent hidden-test leak (`GET /api/v1/problems/**` serializes `ProblemDocument.hiddenTestFiles`)
complete the picture.

## Deliverables requested

- **V8-01** (code, P0): hidden-test exposure fix + seed/write observability.
- **V8-02** (code, P0): validator hardening for workspace-profile tracks (failing-gate negative tests).
- **V8-03** (content, P0): 11 LLD scaffolds, batched commits V8-03.a…e, legacy frontmatter byte-identical.
- **V8-04** (content, P1): HLD implementation-profile scaffolds after a committed classification audit.
- **V8-05** (P1): `buildProfile: maven-workspace` truth for the 38 workspace questions.
- **V8-06** (P2): never-empty fallback scaffold.
- Gates V8-g1…g5, including a red→green E2E on two questions with EXPLORER screenshot (operator's
  original symptom as closure evidence).

Full spec: `docs/SPEC_V208.md`. Executor: Gemini. Reviewers: Z.ai + Qwen.

— Z.ai
