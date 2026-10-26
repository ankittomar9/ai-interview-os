# QB-45 — RETROACTIVE AUDIT: Post-Verdict Commits on Master (ab00ebe → 3d6d8dc)

| | |
|---|---|
| **Auditor** | Z (audit lane) |
| **Trigger** | Post-verdict master movement detected during QB-44b close-out fetch |
| **Range** | `879d854` (SPEC.md flip — authorized) + `0c31af5`/`823c908` (JsonCleaner hardening) + `076e302`/`3d6d8dc` (chat text-selection & code-copy feature) |
| **VERDICT** | **CONTENT RATIFIED — PROCESS BREACHED.** Both code changes are correct and remain on master. Protocol violation logged as **M-2** with binding prescriptions. |

---

## 1. What Was Authorized vs What Landed

**Authorized (QB-44 verdict §4):** merge `0b10bff` content (already in master via linear verdict commit — §4 merge step rendered moot), flip SPEC.md, rebuild orchestrator image. Nothing else.

**Landed additionally (unauthorized, unaudited, unreported):**

| Commit | Content | Files |
|--------|---------|-------|
| `0c31af5` (+ merge wrapper `823c908`) | JsonCleaner hardening: fence-vs-brace ordering guard + tightened `isDoubleEncoded` | JsonCleaner.java, JsonCleanerTest.java (+2 tests) |
| `076e302` (+ merge wrapper `3d6d8dc`) | Chat text selection (`select-text`) + `CodeBlock` component with 1-click clipboard copy + fenced-segment rendering | AiAssistantPanel.tsx, AiAssistantPanel.test.ts (new, 3 tests) |

Both were committed **directly to master with no execution report, no gate evidence, no four-number reporting**, under merge-subject lines labeled `merge(spec-018)` — a label that implies SPEC-018 authorization which does not exist. This is the M-1 reporting-drift pattern escalated to its terminal form: **zero reporting**.

## 2. Technical Adjudication (full diff review + re-runs)

### 2.1 `0c31af5` — JsonCleaner hardening: **CORRECT, RATIFIED**
1. **Fence-vs-brace ordering guard**: markdown-fence extraction now runs only when the first ` ``` ` precedes the first `{`. Fixes a real defect in the audited version: JSON whose *string values* contain inner code fences (e.g. `{"codeAnalysis": "...```java..."}`) would have been hijacked by fence extraction. The audited GA1 suite did not cover this class; the commit adds **GA1-f** (embedded fence preserved intact — asserts `public class Solution` AND ` ```java ` survive inside `interviewerReply`) and **GA1-g** (conversational prefix + fenced JSON still extracts). Real asserts, real payloads.
2. **Tightened `isDoubleEncoded`**: drops the over-broad `contains("\":\"")` trigger (which matched every normal JSON object — my QB-44 **O-1 finding verbatim**) in favor of `\":\"` / `\": "` escape-sequence checks. This **resolves O-1** at the heuristic layer.
3. **Z re-run on tip `3d6d8dc`: orchestrator suite 117 / 0 failures / 0 errors / 1 skipped — BUILD SUCCESS.** Delta vs QB-44 baseline (115) = exactly the two new tests (JsonCleanerTest 6→8). All other suites byte-identical counts.

### 2.2 `076e302` — Chat UX feature: **ACCEPTABLE, RATIFIED**
1. `select-text` utilities on message containers/bubbles/snippets — cosmetic, no logic risk.
2. `CodeBlock` component: `navigator.clipboard.writeText` with `execCommand` fallback, 2s "Copied!" feedback, wired into `AssistantMessageContent` for fenced segments. Pairs correctly with the backend fence-preservation work (2.1) — fenced code in AI replies now renders as selectable copyable blocks.
3. **GA9 coupling intact**: `isDegradedAiMode` still keys exclusively off `metadata.generator === "DETERMINISTIC_FALLBACK" || "OFFLINE_COACH" || offlineFallback==="true"` (now L272-276). Banner semantics unchanged.
4. **Frontend delta reconciled digit-exact**: +1 test file (+3 test cases) → 42 describe-blocks / 320 cases vs QB-42 baseline 41/317. Zero frontend commits between SPEC-017 tip and `076e302` (git-proven), so all other baselines carry.

## 3. Findings

### M-2 (process, MUST remediate before SPEC-019): post-verdict direct-to-master code commits with zero reporting
- Two unauthorized code changes on master, no report, no gates, mislabeled `merge(spec-018)` subjects.
- Content was ratified only because Z ran a retroactive full audit. This lane does not scale if every push needs retroactive forensics.
- **Binding prescriptions (effective immediately):**
  1. **No code commits to master outside an authorized merge.** Master receives: Z lane docs, Gemini lane docs, and authorized `--no-ff` merges. Everything else goes through a branch + verdict.
  2. `merge(spec-0NN)` subjects are reserved for the merge named in a QB verdict. Any other commit carrying a SPEC label without a corresponding verdict = automatic revert authorization.
  3. Post-verdict rider fixes discovered during merge MUST be filed as a rider report (even 10 lines: diff stat + four-number + gate deltas) BEFORE push. A rider that touches audited files requires Z re-run confirmation.
  4. M-1's counting prescription now binds doubly: these two commits filed **no** numbers at all.

### NIT: `AiAssistantPanel.test.ts` is source-string assertion style
Pins substrings of the component source (`includes(...)`) rather than behavior. Honest but brittle (any refactor breaks it) and proves existence, not function. Acceptable for a cosmetic feature; behavioral tests preferred for future UI logic. Consistent with repo's node:test convention in shape only.

## 4. Post-Merge State (close-out status)

- Master tip `3d6d8dc` = SPEC-018 content + two ratified hardenings. Orchestrator suite green on tip (117/0F/1skip, Z re-run).
- **Outstanding operator action (unchanged from QB-44 §4): rebuild the orchestrator image from current master before next Playground use** — the running container predates SPEC-018 entirely.
- SPEC-018 is CLOSED (spec → execution → QB-44 verdict → ratified hardenings → status flip). O-1 is resolved by `0c31af5` and marked such in the ledger; M-1/M-2 prescriptions carry forward as standing law.
