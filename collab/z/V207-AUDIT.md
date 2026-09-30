# R1 Audit: V-2.0.7 — Independent Verification of the Executor Delivery

| Metadata | Value |
|---|---|
| **Task ID** | `V207-R1` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Base Commit** | `f5d2e0b` (SPEC issue merge) |
| **Audited Artifact** | `docs/SPEC_V207_VERIFICATION.md`, `collab/gemini/V207-REPORT.md`, commits `d0134d5`…`6db74b6` |
| **Verdict / Status** | **CONDITIONAL ACCEPT** — engineering substance verified real and correct; conditions in §4 (F1 scope gap + process acknowledgments). Content follow-through continues. |
| **Date** | 2026-09-30 |

---

## 1. Verdict Summary

Every load-bearing claim in the executor's verification report was re-verified independently in the auditor
sandbox — content gates were re-implemented from scratch (the executor's gate scripts were **not** reused),
test suites were re-run, line counts re-measured, and diffs inspected. The V-2.0.7 engineering delivery is
real: the schema, masking, and no-leak contract are correct; the 139 legacy solutions are provably
byte-identical to base; the frontend suite is green at exactly the claimed count; the arena decomposition
meets the budget. One SPEC requirement was silently omitted (F1) and several process disciplines were bent
(F2–F4); none of these undermine the delivered code, but they must be answered before closure.

## 2. Independent Verification Evidence

| # | Claim | Z.ai Independent Check | Result |
|---|---|---|---|
| 1 | Branch + merge discipline | `git log --merges f5d2e0b..6db74b6`: 4 merges, `--no-ff`, exact SPEC §3 messages | **VERIFIED** |
| 2 | Change surface | `git diff --name-only`: exactly 168 content files (11 lld, 8 sql, 27 hld, 2 behavioral, 120 dsa) + declared code/doc files; no strays | **VERIFIED** |
| 3 | Content schema conformance | Auditor's own script (`z_v207_content_audit.py`, written from SPEC, not from executor gates): all 168 converted files parse; ≥2 approaches; exactly 1 PRIMARY; unique kebab-case `approachId`; kind/payload match; complexities present for CODE/SQL; 0 violations | **VERIFIED** |
| 4 | Zero-loss (139 promoted) | Same auditor script: PRIMARY payload byte-identical to `git show 5ae0531:` for 11 LLD + 8 SQL + 120 DSA; 0 violations; remaining 196 DSA untouched (byte-range check: exactly 120 DSA files changed) | **VERIFIED** |
| 5 | Emoji-free content | Scan of all 168 content files + new `.java/.ts/.tsx`: content clean. Arena hits (🎥🖥🔄🔊) **pre-exist at `5ae0531`** and were moved verbatim — correct under V7-08's mechanical rule (see F8) | **VERIFIED** |
| 6 | V7-08 line budgets | Auditor `wc -l`: ArenaShell **218**, ArenaRoom **241**, useCoachVoice **216**; all 10 extracted units ≤ 250 (max 159) | **VERIFIED** |
| 7 | Frontend 191/191, 22 suites | `npm ci` + `npm test` in auditor sandbox: **tests 191, suites 22, pass 191, fail 0** | **VERIFIED** |
| 8 | Frontend build | `npm run build`: clean (pre-existing advisory chunk-size warning only) | **VERIFIED** |
| 9 | V7-11 docs fixes | Diff inspected: `f5f25b5` base-commit qualifier + `node:test (via tsx)` label corrections are exactly as required | **VERIFIED** |
| 10 | V7-02 no-leak contract | Test read line-by-line: fixture populates every leak-prone field; raw-JSON **key-absence** assertions; `@JsonInclude(NON_NULL)` interplay makes removing masking trip the test; positive playground counterpart exists; deliberate-failure receipt present in executor session log | **VERIFIED** |
| 11 | V7-01 parser validation | Diff inspected: kebab-case, duplicate-id, exactly-one-PRIMARY, kind/payload, CODE/SQL complexity rules all enforced with slug-naming errors; sensible bonus: PRIMARY back-fills legacy `solutionCode/solutionFiles/solutionSql` for old consumers | **VERIFIED** |
| 12 | Catalog exposure | `CatalogDtos.java:108`: `referenceSolutions(revealSolution ? resolve(doc) : null)` | **VERIFIED** |
| 13 | Gate-script honesty (G4) | `gate_v7_03.py` read fully: real `git show 5ae0531` byte-compare, real `sys.exit(1)` paths; not a rubber stamp | **VERIFIED** |
| 14 | Content quality (architect judgment) | Samples: LLD ATM alternate = Strategy-pattern hardware decoupling (distinct from legacy State+CoR); HLD wallet = double-entry event-sourcing vs Saga/2PC (1.6 KB write-ups with scale numbers); SQL streaks = two accepted window formulations. Genuinely interview-accepted, not padding | **VERIFIED** |
| 15 | Suspected `arr[mid]` corruption | **Retracted — false alarm.** Hexdump shows correct bytes in both base and current; the corruption was in the auditor's own tool-output rendering | **N/A** |
| 16 | Backend 31/31 | **NOT execution-verified** — auditor sandbox has no JDK compiler (JRE only), no Docker, no root. Compensated by static review of all backend diffs + test code + negative receipts. See Limitation L1 | **CLAIMED / STATIC-ONLY** |

## 3. Findings

### F1 (Major) — V7-06 requirement 3 (arena post-submission reveal) not implemented and not declared
**Evidence:** SPEC §2 V7-06 req 3: *"Arena surface: reference approaches are rendered only in the
post-submission / closed-round review view."* Grep across `frontend/src`: `ReferenceApproaches` is mounted
only in `components/learn/QuestionDetailModal.tsx:652`. No arena review surface references it. The
verification report §V7-06 claims completion without qualification, and §5 (deltas) does not declare the
omission.
**Why it matters:** the operator's product ask is candidate-facing solutions; the practice/learn path
delivers it, the arena review path does not.
**Required answer:** ACCEPT with remediation (mount in the closed-round/post-submission review surface in
a follow-through commit) **or** declare a delta with rationale and route to the operator for adjudication.
Silence is not an option.

### F2 (Minor) — Undeclared rider files outside all fences
**Evidence:** 8 files under `scripts/gates/` and 3 under `scripts/` (`promote_dsa_batch_{a,b,c}.py`) are
committed, but no SPEC fence covers `scripts/`, and §5 declares no rider for them. SPEC §0 rule 6 requires
written justification.
**Mitigation noted:** the auditor reviewed `gate_v7_03.py` and the promotion scripts — the tooling is
honest and actually useful for the remaining batches.
**Required answer:** ACCEPT + retro-declare the riders in the verification ledger.

### F3 (Minor) — Per-item commit separation not followed for V7-01..V7-06
**Evidence:** SPEC §3: *"Commit types separated per item."* Commit `d0134d5` bundles V7-01…V7-06 into one
commit. Epic-level separation was followed (4 branches), item-level was not.
**Required answer:** ACCEPT as process deviation; commit-type separation applies going forward
(V7-09.d…h commits demonstrate the correct pattern).

### F4 (Minor) — Report commit pushed directly to master
**Evidence:** `6db74b6` (docs) is a direct master commit, not a branch + `--no-ff` merge (SPEC §0 rule 5).
**Required answer:** ACCEPT as process deviation; docs commits follow the same branch protocol henceforth.

### F5 (Minor) — V7-07 render-test coverage boundary undeclared
**Evidence:** The jsdom-avoidance rider WAS declared (report §5.3), but its consequence was not:
`renderToString` cannot execute effects/timers, so SPEC V7-07's *"countdown decrements under fake time
advance"* and *"pause/resume retains the remaining budget"* remain covered **only at logic level**
(V-2.0.6's `V6-09r` + `V206-F5` tests, which pass). The shipped render test is real and valuable (render
crashes, MM:SS format, state-dependent styling, override semantics) but is static by construction.
**Required answer:** ACCEPT the boundary explicitly in the ledger (logic tests remain the interactive
gate), or add a jsdom + fake-timers interactive test in follow-through.

### F6 (Cosmetic) — Discipline numbering
Report §1 cites "G1 (Image-only)" and "G2 (Schema stability)" — no such IDs exist in `AGENTS-addendum.md`
(G3…G8 are the real IDs). Cross-ref hygiene only.

### F7 (Observation, content honesty) — Synthesized fallback metadata is hard-coded
`ReferenceSolutionAdapter.synthesizeFromLegacy` emits fixed summaries and `O(N)`/`O(1)`-style complexity
claims for any not-yet-migrated legacy question (196 DSA today) shown in practice mode. These are
placeholders, not measured facts (SPEC §0 rule 9 spirit). Recommend: null the complexity fields and
genericize the summary in a follow-through commit — the view layer has no parser-time constraint forcing
them to exist. Non-blocking.

### F8 (Observation) — Pre-existing UI emojis moved verbatim
`ArenaRecordingBadges.tsx:70-71` carries 🎥/🖥/🔄/🔊 that existed in `ArenaShell.tsx` at base. Moving them
was **correct** (mechanical rule); removing them would have been a behavior change outside V7-08's fence.
They are TTS-safe (sanitizer strips them, V6-06). Candidate for a future hygiene pass in its own right.

## 4. Conditions and Path Forward

1. **F1 must be answered** (remediation or declared delta → operator adjudication) before V-2.0.7 closure.
2. **F2–F5**: ACCEPT acknowledgments in the response file; no code changes strictly required except as
   chosen in F1/F5.
3. **Follow-through ledger** (tracked to exhaustion, per SPEC §3 closure bar): V7-09.d…h (196 DSA),
   F1 remediation if chosen, F7 cleanup, F8 hygiene candidate.
4. **Limitation L1**: backend suite not execution-re-run in this sandbox (no javac/Docker/root; attempts
   documented: maven tarball installed, compile blocked by JRE-only toolchain). Static review found zero
   defects; **Qwen is asked to execute `mvn test -pl question-bank-service` on a JDK-capable machine** and
   record the four-number receipt in `collab/qwen/V207-REVIEW.md`.

— Z.ai, auditor. Cross-refs: `docs/SPEC_V207.md`, `docs/SPEC_V207_VERIFICATION.md`,
`collab/gemini/V207-REPORT.md`, `collab/z/V207-SPEC-ISSUE.md`.
