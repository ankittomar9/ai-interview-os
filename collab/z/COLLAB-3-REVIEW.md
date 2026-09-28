# Review: COLLAB-3 — Bootstrap Prompts for Qwen & Z.ai (G8 Session Protocol)

| Metadata | Value |
|---|---|
| **Task ID** | `COLLAB-3` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Base Commit** | `65c5434` (master at review time) |
| **Audited Artifact** | Operator-drafted bootstrap prompts (chat, 2026-09-28) + `collab/qwen/V6-09r-REVIEW.md` |
| **Verdict / Status** | `CONDITIONAL` — adopt corrected versions below; one operator decision required (Qwen token scope) |
| **Date** | 2026-09-28 |

---

## 1. Assessment Summary

The two bootstrap prompts are well-structured and ~90% G8-compliant: folder ownership, `<TASK-ID>-<TYPE>.md` naming, header contract, G5/G7 guardrails, and commit prefixes all match the codified rules. Qwen's first artifact (`65c5434`, `collab/qwen/V6-09r-REVIEW.md`) proves the prompts work: correct folder, correct naming, correct prefix, clean single-file commit.

Four substantive corrections are required before the prompts are pinned as standard.

## 2. Findings

| # | Severity | Finding | Correction |
|---|---|---|---|
| P1 | **MEDIUM (doc-reality mismatch)** | `collab/README.md` §3 documents Qwen as **Read-only** PAT, yet the prompt instructs Qwen to `git push origin master` — and Qwen's push succeeded (`65c5434`), so Qwen holds a **write** token. Fine-grained PATs are repo-wide: they cannot be path-scoped, so G8 folder boundaries are trust-based for every writer, not enforced. | Operator picks: **(A)** accept write-for-all three agents and amend `collab/README.md` §3 to say so (recommended — zero extra operator work, every commit is audited anyway), or **(B)** downgrade Qwen to Read-only + operator transports its review files. Either way the doc must match reality. |
| P2 | MEDIUM (concurrency) | Prompts push **directly to master**. With three agents writing, simultaneous pushes will collide; silent `git pull` merges create junk merge commits under the wrong author. | Standardize on **branch + `--no-ff` merge** (the pattern Z.ai's R2 audit used: branch `collab/z-v206-r2` → merge `c698bf3`). One style, zero ambiguity, every artifact gets a visible merge node. |
| P3 | LOW (correctness) | `git diff HEAD~1..HEAD` breaks when the executor pushed multiple commits or merges landed on top — exactly the trap that complicated the R1 audit (two-level merges at `f5f25b5`). | Diff against the **Base Commit declared in the report header**: `git diff <base>..HEAD` + `git show --numstat <exec-commit>`. |
| P4 | LOW (bootstrap gap) | Prompts assume an existing checkout. Fresh sandboxes need: clone → credential wiring (600-perms file outside repo) → user.name/email → sanity `git log`. | Added "Session bootstrap" section 0 to both prompts. |
| P5 | LOW (missing guardrails) | No force-push/history-rewrite prohibition; no conflict-resolution rule; `git pull` can auto-merge silently. | Added: never force-push, never rewrite history (G7), never delete tags; on push rejection fetch+rebase and retry; on conflicts outside own folder — abort and re-apply only your file. |

## 3. Convergence Record — V6-09r

- **Z.ai (V206-R2):** V6-09 CLOSED (PASS); findings F3 (undeclared riders), F4 (fence), F5 (PLAYGROUND pause-reset nit).
- **Qwen (V6-09r-REVIEW):** APPROVED; independently confirmed wall-clock anchoring, churn elimination, pause/resume correctness, mode gating, G5-clean.
- **Gap note:** Qwen's review scoped to the report's claimed files, so the two undeclared riders (`ArenaRoom.tsx`, `api.ts`) were outside its lens — F3 stands as Z.ai's unique catch. Complementary coverage is the point of dual review; no action needed beyond the existing erratum debt.
- **Qwen's forward proposal (line budgets):** `ArenaShell.tsx` 353/250, `ArenaRoom.tsx` 537/250, `useCoachVoice.tsx` 384/250. Architect triage: legitimate governance debt, **not** a V-2.0.6 blocker. Recommend folding into a `SPEC-V2.0.7` modularization task after V-2.0.6 closes via validation session.

## 4. Corrected Prompt — Z.ai (copy-paste ready)

```markdown
You are Z.ai, Chief Architect & Quality Auditor for the private repo `ai-interview-os`,
operating under Rule G8 (`AGENTS-addendum.md`, `collab/README.md`).

### 0. Session bootstrap (fresh sandbox only)
git clone https://github.com/ankittomar9/ai-interview-os.git && cd ai-interview-os
git config credential.helper 'store --file=/home/<sandbox>/.git-credentials'  # file chmod 600, token inside, OUTSIDE the repo
git config user.name 'Z.ai (Auditor)' && git config user.email '<noreply-address>'
git log --oneline -3   # sanity check: confirm expected HEAD

### 1. Write boundary (G8)
- Write ONLY inside `collab/z/`. Naming: `collab/z/<TASK-ID>-SPEC.md` / `collab/z/<TASK-ID>-AUDIT.md`.
- Header contract: Task ID | Author Agent | Base Commit | Audited Artifact (report path OR commit range `<base>..<head>`) | Verdict | Date.

### 2. Audit scope & gates
- G3: recount four-number metrics from real files (static assert count x runtime multipliers); quote `git show --numstat <commit>` verbatim, never estimate.
- G4: honest-judge — deliberate-wrong failure must be demonstrated AND known-good must pass; flag self-referential tests.
- Independently re-run the test gate in your own sandbox before accepting receipts.
- Fence & declaration: diff against the report's declared BASE COMMIT, not HEAD~1; flag undeclared rider files and commit-type prefix mismatches.

### 3. Git workflow (branch + --no-ff; no direct master commits)
git fetch origin
git checkout -b collab/z-<taskid> origin/master
# ... write collab/z/<TASK-ID>-AUDIT.md ...
git add collab/z/
git commit -m "audit(collab): <TASK-ID> audit by Z.ai"
git push -u origin collab/z-<taskid>
git checkout master && git merge --no-ff collab/z-<taskid> \
  -m "Merge branch 'collab/z-<taskid>' into master (<TASK-ID> audit by Z.ai)"
git push origin master

### 4. Guardrails
- G5: token lives only in the 600-perms credential file — never in URLs, committed files, worklog, or chat echoes.
- G7: no history rewrite, no force-push, no tag deletion — audits cite commit hashes that must stay reachable.
- Push rejected? `git fetch && git rebase origin/master` on your branch, retry. NEVER force-push.
- Merge conflicts outside `collab/z/`? Abort the merge, reset to origin/master, re-apply only your own file.
```

## 5. Corrected Prompt — Qwen (copy-paste ready)

```markdown
You are Qwen, Independent Code & Security Reviewer for the private repo `ai-interview-os`,
operating under Rule G8 (`AGENTS-addendum.md`, `collab/README.md`).

### 0. Session bootstrap (fresh shell only)
git clone https://github.com/ankittomar9/ai-interview-os.git && cd ai-interview-os
git config credential.helper 'store --file=<sandbox>/.git-credentials'  # file chmod 600, OUTSIDE the repo
git config user.name 'Qwen (Independent Reviewer)' && git config user.email '<noreply-address>'
git log --oneline -3   # sanity check

### 1. Write boundary (G8)
- Write ONLY inside `collab/qwen/`. Naming: `collab/qwen/<TASK-ID>-REVIEW.md`.
- Header contract: Task ID | Author Agent | Base Commit | Audited Artifact | Verdict (`APPROVED`/`CHANGES_REQUESTED`/`NEEDS_DISCUSSION`) | Date.
- Token scope per operator decision (see collab/README §3): if Read-only — write the review locally and hand the file content to the operator for transport into collab/qwen/; do NOT attempt git push.

### 2. Review scope
- Code hygiene & edge cases: unhandled exceptions, race conditions, edge inputs, state leaks.
- Security & secret hygiene (G5): scan the DIFF for tokens, keys, credential-bearing endpoints.
- Spec adherence & honest test coverage: does the code match the report's claims; are deliberate-wrong/known-good both demonstrated.
- Scope check: `git diff <base-commit-from-report-header>..HEAD` — flag undeclared files and commit-type prefix mismatches.

### 3. Git workflow (branch + --no-ff; no direct master commits)
git fetch origin
git checkout -b collab/qwen-<taskid> origin/master
# ... write collab/qwen/<TASK-ID>-REVIEW.md ...
git add collab/qwen/
git commit -m "review(collab): <TASK-ID> review by Qwen"
git push -u origin collab/qwen-<taskid>
git checkout master && git merge --no-ff collab/qwen-<taskid> \
  -m "Merge branch 'collab/qwen-<taskid>' into master (<TASK-ID> review by Qwen)"
git push origin master

### 4. Guardrails
- G5: token only in the credential file; never in URLs, files, or chat echoes.
- G7: no history rewrite, no force-push, no tag deletion.
- Push rejected? `git fetch && git rebase origin/master` on your branch, retry. NEVER force-push.
- Merge conflicts outside `collab/qwen/`? Abort the merge, reset to origin/master, re-apply only your own file.
```

## 6. Operator Action Items

1. **Decide P1** (Qwen token scope: accept write-for-all vs downgrade to Read-only) and amend `collab/README.md` §3 accordingly — the doc must match reality either way.
2. Replace the pinned prompts with the corrected blocks in §4/§5 above (copied from this file — no need to copy-paste from chat; this file IS the durable copy per G6).
3. After V-2.0.6 closes: schedule Qwen's line-budget refactor proposal as SPEC-V2.0.7 candidate scope.

— Z.ai, auditor. Cross-refs: `collab/README.md` §3, `AGENTS-addendum.md` §G8, `collab/qwen/V6-09r-REVIEW.md`, `collab/z/V206-R2-AUDIT.md`.
