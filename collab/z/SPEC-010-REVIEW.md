# SPEC-010 Execution Review — Z.ai Audit Ledger

**Branch:** `fix/spec-010-arena-panel` (4 commits: `fc3995b` → `487e5f8`, cut from master `f6c5aca` ✓)
**Verdict:** **ACCEPT — merge approved for operator adjudication. VP-7 manual script (2 viewports) remains before SPEC-010 closes.**
Process note: clean topology — execute → push → stop, no self-approval, no merge leapfrog. The Pre-Flight subset was pasted into the execution report per AUDIT-PROTOCOL v1.0. This is the flow working as designed.

---

## §1 What passed (verified, not trusted)

| Area | Evidence |
|---|---|
| Topology | 4 commits, merge-base = SPEC-010 tip `f6c5aca`, messages verbatim per spec §5. Zero extra commits. |
| Fence | **11 files = 10 code + 1 report** — every file in the §4 allowed list, zero out-of-fence, forbidden files (`AutoGrowingChatInput.tsx`, `api.ts`, `FloatingAiOrb.tsx`, `package.json`) untouched. No new dependencies. |
| F-1 R-a | ArenaShell L224: `stackAbove={!isPlayground && cameraActive ? "webcam" : "none"}` — exact spec text; `cameraActive` confirmed in the L40 destructure. |
| F-1 R-b | New pure `panelPositionClass`: wide → `fixed bottom-5 right-5` ignoring stackAbove (asserted both directions in VP-1); fullscreen → `""`; normal keeps webcam/none split. |
| F-1 R-c | `panelSizeClass('normal','webcam')` → `max-h-[min(70vh,calc(100dvh-14rem))]` — **byte-verified via `od -c`** (see §3, tooling hazard); container no longer carries an inline max-h, so sizing is fully delegated and the clamp is load-bearing. |
| F-1 R-d | Fullscreen classes untouched (`fixed inset-4 sm:inset-6 z-50`). |
| F-1 R-e | Invariant holds algebraically for all state × stackAbove combos at H ≥ 600 (wide: bottom-5 + 85vh needs only H ≥ 187; normal+webcam: clamp caps at H−224); VP-1 table test encodes the constants. |
| F-2 R-f/g | `getCandidateMessageLines`: >5 lines → 4-line preview + gradient + `Show more (N lines)`/`Show less`; ≤5 lines raw. `abortTurn` marks the last candidate message `metadata.stopped = 'true'` **under** the R-3 guard (order asserted in VP-3); string `'true'` is the type-correct realization for the `Record<string,string>` metadata bag (matches `offlineFallback === "true"` convention). |
| F-2 R-h | Abort silence preserved: no transcript append, no toast; SPEC-009 semantics byte-identical except the additive metadata write. |
| F-2 render | Both sites route through the new components: live messages by `role`, loaded history by `senderRole === "CANDIDATE"`; Stopped chip styled like sibling badges; ROUND_BOUNDARY early-return untouched. |
| F-3a R-j/k/l | `parseInlineFormat` is pure (no React/DOM import), fences-first with language capture, `$$…$$`/`$…$`/backtick tokens, unmatched + empty delimiters literal; whitespace guard means `$5 and $10` stays literal while `$N$`/`$O(N)$` chip. **No `dangerouslySetInnerHTML`/`innerHTML` anywhere in the new code (grepped).** Only assistant content goes through the renderer; candidate stays raw. Unclosed-fence degradation (falls back to inline parsing) noted as acceptable. |
| F-3b R-m/n/o | Playground: 3-line FORMATTING RULE verbatim (byte-compared against the spec file programmatically), ordered after the FOLLOW-UP RELEVANCE RULE. Interview: **exactly +1 line** (single hunk `@@ -318,6 +322,7 @@`), verbatim, exactly 1 occurrence in the file — the SPEC-009 B-1 freeze amendment holds at precisely the granted scope. Backend VP-5 uses runtime captors for both requests plus source-integrity assertions. |
| Four numbers (frontend) | **DYNAMICALLY REPRODUCED BY Z**: `npm test` = **260/260 pass, 0 fail, 0 skipped, 29 suites** (9.4s); `npm run build` exit 0. Baseline 249 → +11, exactly the diff's additions. |
| Four numbers (backend) | Z's own walk, identical regex on both refs: @Test 101→103 (+2), assert 355→366 (+11), andExpect 30→30, verify 27→29 (+2), total 412→425 (+13) — **matches the report exactly**. Maven unavailable in Z's sandbox (established); backend numbers remain executor-run + exact static match. |
| Assert recount note | Frontend asserts by Z's 8-method regex: 989 → 1046 (+57). Report claims 1048 (+56) by its broader `assert\.[a-zA-Z]+` pattern — regex variance at 0.2% magnitude, deltas internally consistent, same documented phenomenon as SPEC-009. Non-blocking. |

## §2 Report corrections required next cycle (non-blocking)

1. **Census miscount, second cycle running.** Report Check 2 says "Exactly 10 files (9 code + 1 report)" — the actual census is **11 files (10 code + 1 report)**. The fence itself is clean; but Check 2's whole point is the count. Count your own `git diff --name-status` output mechanically next time — this is the second consecutive report with a census arithmetic error (SPEC-009: "16 (1+1+5+2+1+6+1)" summing to 17).
2. Frontend assert absolute (1048) reconciles only under the report's own baseline (992 by their regex); state the baseline next to the absolute to make deltas self-evident.

## §3 Auditor environment hazard (recorded for the protocol)

Z initially read the R-c class string as malformed (`max-h-in(...`) from three independent tool outputs (diff, `cat -A`, node JSON print) — all three displayed the same corruption. `od -c` byte dump showed the file is correct: `max-h-[min(70vh,calc(100dvh-14rem))]`. Root cause: the shell-output pipeline swallows `[m`-style sequences (ANSI-reset-looking). **Protocol implication: byte-sensitive verification must use `od -c`/counting methods, never eyeballed text output.** Added to AUDIT-PROTOCOL v1.0. The empirical chain (committed test run + raw bytes) is what prevented a phantom REJECT.

## §4 Gate

1. **Operator:** merge `fix/spec-010-arena-panel` → master (`--no-ff`, 4 commits land).
2. **Operator:** run the SPEC-010 §3 VP-7 manual script at **1366×768 and 1920×1080**: (1) playground expand → wide header visible, cycle wide→fullscreen→normal; (2) interview with webcam: normal clears the PiP, wide reachable/closable; (3) 25-line paste → send → Stop → `Stopped` chip + Show more works; (4) coach reply shows no raw `$…$` or stray backticks; (5) voice readback has no "dollar" artifacts.
3. Any VP-7 failure reopens this review. Otherwise SPEC-010 closes; deferred items (double-click cycling, full markdown, math-symbol substitution, assistant-message collapse) stay in §6 of the spec.

**Post-merge:** rotate the GitHub PAT (plaintext exposure ×2 in chat).
