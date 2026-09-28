# COLLAB-PROTOCOL — Multi-Agent Repo Collaboration (Z.ai / Gemini / Qwen / Operator)

**Status:** accepted by operator & codified in Rule G8 (`AGENTS-addendum.md`)
**Motivation:** eliminate operator copy-paste between agents; single source of truth in the repo.

---

## 1 — Layout: one folder per agent

```text
collab/
  README.md                 ← this protocol (committed to repo)
  gemini/                   ← execution reports, proposals, receipts   (writable by Gemini)
  z/                        ← SPECs, audits, adjudications             (writable by Z.ai)
  qwen/                     ← independent reviews (2nd pair of eyes)   (writable by Qwen)
  operator/                 ← directives, decisions, validation notes  (writable by operator)
```

## 2 — Rules (become G8 in AGENTS-addendum.md)

```text
G8 — MULTI-AGENT COLLAB FOLDERS (protocol)
1. Each agent writes ONLY inside its own folder. No cross-folder edits, ever.
2. One file per task, named <TASK-ID>-<TYPE>.md
   Examples: collab/gemini/V6-09r-REPORT.md, collab/z/V206-R2-AUDIT.md,
             collab/qwen/V206-SECURITY-REVIEW.md
3. Cross-references are by repo path (collab/z/...), never by chat quote.
4. Review cycle: executor posts report -> reviewers post findings -> operator
   posts adjudication -> executor commits remediation. All via git only.
5. The global cross-agent worklog remains OUT of git (G7 unchanged). collab/
   files are the durable, shareable record.
6. G5 secret scan applies to collab/ before every push: no tokens, no keys,
   no internal endpoints with credentials, no raw env dumps.
7. File headers must state: Task ID, author agent, base commit (short hash),
   and verdict/status line — so agents can parse each other's folders.
```

## 3 — Access setup (how each agent reaches the private repo)

| Agent | Transport | Credential | Scope |
|---|---|---|---|
| Gemini (local, user's machine) | HTTPS/SSH as today | user's own git auth (already works — pushed f5f25b5) | read/write |
| Z.ai (this sandbox) | HTTPS only (**no ssh binary in sandbox — deploy keys impossible**) | **fine-grained PAT** | Contents: Read+Write on this one repo |
| Qwen (web studio) | HTTPS | **fine-grained PAT** | Contents: Read+Write on this one repo |

**PAT creation (GitHub → Settings → Developer settings → Fine-grained tokens):**
1. Repository access → *Only select repositories* → `ankittomar9/ai-interview-os`
2. Permissions → **Contents: Read and write** (for Z.ai and Qwen). No metadata/admin/secret scopes.
3. Expiry: short (7 days) and regenerate as needed; revoke at project end regardless.
4. Token storage: store in a sandbox-local credential store (`git credential approve`, file perms 600) — never in the remote URL, never in any committed file, never quoted in worklog or collab content (G5).

**Cutover sequence (zero-downtime):** create PAT → wire credentials in sandbox → verify fetch → done. Gemini's pushes are unaffected (its own auth already works).

## 4 — Privacy & end-of-project cleanup

- The raw worklog **is already excluded from git by G7** — nothing to remove later; it lives only in each agent's sandbox.
- Repo privacy until "tested well" is endorsed: audit trail stays private until the operator declares V-2.0.6 (and later rounds) closed.
- End-of-project cleanup = **forward merge** moving superseded SPECs/reports to `docs/archive/` (or keeping `collab/` as the audit trail). **History rewrite stays forbidden** — audits cite commit hashes (`b934e78`, `f5f25b5`, …) that must remain reachable.
- Revoke all PATs when the project closes.

## 5 — Immediate next steps

1. Operator: create the fine-grained PAT (Contents: Read+Write) and paste it in chat → Z.ai wires + tests.
2. Z.ai pushes `collab/README.md` (this protocol) + G8 amendment via branch `collab/protocol-setup`, `--no-ff` merged.
3. Gemini: adopts `collab/gemini/` for the V6-09r report (first artifact under the new protocol).
4. Qwen: onboard with a separate read-only token (or operator-paste mode).
