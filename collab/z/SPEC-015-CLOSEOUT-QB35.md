# SPEC-015 Close-Out + "Merge Everything" Scoping Ruling — QB-35

> **Auditor:** Z · **Date:** 2026-10-14 · **Scope:** (a) close-out of SPEC-015 post-merge state at `493101d`; (b) operator directive "merge everything to master in one go" — feasibility ruling.

---

## Part A — SPEC-015 Close-Out: ✅ CLOSED

| Check | Evidence at `493101d` | Verdict |
|---|---|---|
| Merge topology | `c5cf86a` (Z audit) → `c83bbb6` (`--no-ff` merge of `ef7ce42`) → `493101d` (SPEC.md flip + EOF NIT fix) | ✔ clean lineage |
| EOF NIT resolved | `PushToTalk.test.ts` ends `});\n` — trailing newline restored in `493101d` | ✔ |
| SPEC.md flip | SPEC-015 row `COMPLETED & MERGED` with links to QB-33/QB-34/REPORT | ✔ |
| **Dynamic G3 (Z-run)** | **306 pass / 0 fail / 0 cancelled / 0 skipped · 39 suites · 49 files · 1,161 static asserts · build exit 0** | ✔ digit-for-digit |

F-0 cycle complete end-to-end (NOTE → Pre-Flight → Execution → Audit → Merge → Close-out). Rider absorbed into standard practice.

## Part B — "Merge everything in one go": **DENIED as literal instruction; APPROVED as compressed two-lane sequence**

Z triaged **every** unmerged branch (`git branch -r --no-merged origin/master`). All three conflict with master; none can be merged blind.

| Branch | State vs master `493101d` | Ruling |
|---|---|---|
| `fix/voice-and-track-nav` (`248006a`, 87+/32−, 11 arena files) | Conflicts in `ArenaRoom.tsx` + 8 more. Its two fixes (record-button unmount abort loop, hamburger track nav) were delivered in **reviewed, tested form** by SPEC-009/010 (abort), SPEC-014 (track nav), and SPEC-015 (PTT guards) after this branch was cut | **CLOSE AS SUPERSEDED — do not merge.** Merging would regress audited code. Delete branch after operator confirmation |
| `feat/seed-gaurav-blog-questions` (SPEC-013, 2 commits, 3,870+) | Base `56899ba` (stale). Conflicts: `PushToTalk.test.ts`, `AutoGrowingChatInput.tsx` (its voice-fix commit `173cf63` predates and now clashes with SPEC-015's merged guards), `DsaCatalogGuardTest.java` (count pin moved to 372 on master) | **RE-SLICE onto master:** keep `61a0912` question content + guard bump (expect **372 → 397**, re-derive from actual file count); drop or re-justify `173cf63` voice fixes against SPEC-015's merged state — anything SPEC-015 didn't cover gets declared explicitly |
| `feat/v208-workspace-scaffolds` (V-2.0.8, 798+, backend-heavy) | Base `3c1f46a` (stale). Conflicts: `LldMavenRunner`, `ProblemDocument`, `WorkspaceProvisionerService`, `ContentValidator`(+Test), etc. Branch carries its own spec amendment + implementation report | **OWN F-0 MINI-LANE after SPEC-013.** Pre-Flight NOTE must declare the conflict-resolution plan per file; V8-01 serialization lock + V8-02 validator hard-gate semantics must survive the re-slice |

### Compliant "one go" recipe (what the operator actually wants: speed)

Gemini may run **both remaining lanes in a single working session**, with F-0 gates compressed but never skipped:

1. **Round 1 commit:** SPEC-013 NOTE + Pre-Flight request (declare re-slice plan, voice-fix disposition, exact guard number) + execution + report — **one push**.
2. **Z fast-track audit** (same-session turnaround) → merge authorization.
3. **Round 2 commit:** V-2.0.8 NOTE + Pre-Flight (conflict-resolution table) + execution + report → Z audit → merge authorization.
4. Branch deletions (`fix/voice-and-track-nav` + merged branches) as the final bookkeeping commit.

Each lane still gets: fence census, G3 dynamic reproduction by Z, behavior-contract verification. What's compressed is the *turnaround*, not the *gates*.

## Part C — Standing notes

- **PAT rotation**: still owed; keep current token alive through the two-lane sequence, rotate immediately after both merges land (Z uses it transiently only; never persisted).
- Post-everything expected catalog: **397 PUBLISHED** (372 + 25 seed) — `DsaCatalogGuardTest` must assert exactly that after the re-slice.
- Environment note: Z's sandbox wiped `node_modules` mid-verification (third anomaly today); G3 numbers above were captured after a clean reinstall, so they are trustworthy.
