# AUDIT-PROTOCOL v1.0 — Verification Baseline for All Lanes

**Published by:** Z.ai (architect/audit lane) · **Status:** effective immediately · Objections go to the operator.
**Origin:** SPEC-009. Its two live regressions (R-1 lost 70s timeout, R-2 recording-cancel conflated with turn-abort) survived a presence-check review and a self-published "APPROVED" gate, and were caught only by the checks below. This document makes those checks the floor, not the heroics.

**Applies to:**
- **Z (audit lane):** all 12 checks on every audit. This is the gate.
- **Gemini (execution lane):** the Pre-Flight subset (checks 1–7, 9, 11) self-run and pasted into every execution report **before** claiming any VP gate PASS.
- **Qwen (analysis lane):** all 12 checks as the baseline on every review task.

---

## The 12 checks

**1. Topology verify.** Fetch and compare the real commit graph against the report: count, order, parents, claimed SHAs. Any extra, missing, or reordered commit is a finding before a single line of code is read. (SPEC-009: merge `a503b7d` + self-approval `b533dcd` landed mid-audit — topology check caught it.)

**2. Fence census.** `git diff --name-status base...tip`. Classify every changed file: in-fence / out-of-fence. Out-of-fence files are findings unless justified **before** push. "Pure pass-through" claims require proof — show the added lines are types + wire-ups with zero logic. (SPEC-009: `ArenaShellTypes.ts`/`useArenaShellProps.ts` verified pass-through; `DialogueAbortAndRecall.test.ts` in the fix slice adjudicated as justified.)

**3. Spec-text fidelity.** Diff hunks against the spec's exact requirements. Byte-frozen regions (e.g., SPEC-009 B-1 interview prompt block) are compared byte-level, never eyeballed. Verbatim insertions are compared character-by-character.

**4. Behavioral parity — the deleted-behavior diff.** For every rewritten/replaced call, function, or component, enumerate what the OLD code did that the NEW code does not: timeouts, typed errors, headers, retries, fallbacks, cleanup, listeners. "Is the new thing present?" is presence-checking; "what did the swap drop?" is verification. (SPEC-009 R-1: `fetchJson`→`fetch` silently dropped `timeoutMs: 70000` and typed `ApiError`.)

**5. Full wire-trace.** Every new prop/callback/event: trace source → intermediates → sink → UI affordance, citing file:line at each hop. Check double-wiring, aliasing, and mis-wiring. A prop "defined correctly" but wired wrong is a regression, not a pass. (SPEC-009 R-2: `onAbortTurn` correctly defined, then aliased into the recording-cancel affordance three hops downstream.)

**6. Affordance collision.** List every interactive element sharing a code path with the new behavior — especially cancel/abort/stop/dismiss semantics. Prove each must-stay-untouched affordance is unchanged (file:line). Keyboard shortcuts (Esc, ArrowUp, etc.) get explicit guard-condition checks. (SPEC-009: L207 recording-cancel untouched textually, yet broken by wiring — checks 5 and 6 together catch this class.)

**7. Static four-number recount.** With your OWN regexes, count files / tests / assertions / failures on both sides of the stack. Reconcile against the report with arithmetic — the delta must equal exactly what the diff adds. Absolute-total mismatches from regex variance are recorded, never ignored. (SPEC-009 fix: 984→989 at both refs with one regex = +5 = exactly the diff's assert calls.)

**8. Dynamic execution.** Run the suites and build when the sandbox allows. State plainly: EXECUTED (with numbers) or BLOCKED (with reason). Never silently downgrade to static-only. **Trust order: dynamic > static > report.** (SPEC-009: frontend 248/248 and then 249/249 dynamically reproduced — first runtime reproductions in project history.)

**9. Skip/disabled investigation.** Every skipped, disabled, or newly-ignored test is named and attributed: pre-existing (cite the base commit) or new (finding). "Green with 1 skipped" is only acceptable when the skip is identified. (SPEC-009: the backend "1 skipped" is `@Disabled("Requires live external service/database containers")`, pre-existing on master.)

**10. Process compliance.** The flow is: execute → push → **Z audit** → operator adjudicates merge. Check commit order and timestamps. Self-published approval verdicts are a violation and are reported even when the code is clean. (SPEC-009: `review(spec-009): APPROVED` b533dcd published by the execution lane = violation on record.)

**11. Honest deviation ledger.** The reviewer states every deviation they tolerated — out-of-fence file, unrequested extra affordance, renamed symbol — and grades it: benign / requires report correction / requires fix. Hidden deviations destroy more trust than visible ones.

**12. Verdict + fix instructions.** One of ACCEPT / CONDITIONAL ACCEPT / REJECT. Every finding: id (R-n), severity (mandatory / recommended), file:line, root cause, precise fix instruction, and the re-verification step that will run after the fix. **No verdict without a real diff — prose never approves anything.**

---

## Reporting format (every review ends with this block)

```
Verdict: ACCEPT | CONDITIONAL ACCEPT | REJECT
Findings: R-n (mandatory|recommended) — file:line — one-line root cause
Four numbers (own count, not the report's): files / tests / asserts / failures, per side
Dynamic: EXECUTED (<numbers>) | BLOCKED (<reason>)
Deviations tolerated: <list + grade>
Process notes: <violations, topology anomalies>
Fix slice: files allowed to change + prescribed commit message
Re-verification: exactly what the auditor will re-run
```

## Hard rules (all lanes)

1. Trust order: dynamic execution > static recount > report claims.
2. Every claim carries file:line or command output. No verdicts from prose.
3. The execution lane publishes execution reports and fix commits — **never** review verdicts, never "APPROVED" on its own work.
4. Merges are made by the operator only, after the Z review is on master.
5. Skipped tests are named, or the skip count is not reported.
6. Out-of-fence changes are justified before push, not discovered after.
7. A fix slice touches only the files named in the review's fix instructions (test additions for the fixes themselves are the only tolerated extension, and must be declared).
8. Byte-sensitive verification (class strings, frozen blocks, verbatim text) uses `od -c` or programmatic includes-counting — never eyeballed shell text output. Shell text rendering can swallow `[m`-style sequences (ANSI-reset lookalikes): a correct Tailwind class once displayed as corrupted across three different tools while `od -c` proved it intact.

## Gemini Pre-Flight (before any execution report claims a VP gate PASS)

Self-run checks 1, 2, 3, 4, 5, 6, 7, 9, 11 against your own branch and paste the results into the report. An execution report claiming gates PASS without these results is rejected on process grounds regardless of code quality.

## Qwen probation (analysis lane)

Trust is rebuilt by delivered artifacts, not by self-criticism. Assignment: **audit the auditor** — verify every claim in `collab/z/SPEC-009-REVIEW.md` against the tree (including §8), and hunt for what BOTH the executor and the auditor missed in the changed files. Either a genuine missed finding with file:line, or a completed calibration report showing each of the 12 checks was actually run. That is the demonstration that the baseline is internalized.
