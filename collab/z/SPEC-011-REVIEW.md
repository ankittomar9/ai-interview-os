# SPEC-011 REVIEW — LLD Catalog Seed, 8 Maven-Workspace Problems (Z, 12 checks, AUDIT-PROTOCOL v1.1)

**By:** Z.ai (architect/audit lane) · **Date:** 2026-10-06 · **Branch:** `origin/feat/spec-011-lld-catalog` (tip `105573f`) · **Base:** `e2ae086` · **Executor report:** `collab/gemini/SPEC-011-LLD-SEED-REPORT.md`

## Verdict

- **CONDITIONAL ACCEPT.** The seed is faithful to SPEC-011 REV 2, the ingestion contract, and the live `lld-parking-lot.md` template. One finding (R-1, tag-count overflow on 5 files) must be trimmed in a 5-line fix slice — or explicitly waived by the operator — before merge. Merge is otherwise conflict-free against master `4fae36f` (zero drift on all touched paths).
- **First dynamic reproduction of a content seed in the Z sandbox.** `mvn` is unavailable here, so Z compiled with ECJ 3.36 + JUnit console launcher 1.11.4 (Java 21): compile sweep 8/8 clean, and both VP-3(a) baseline failure and VP-3(b) satisfiability were **independently reproduced** — VP-3(b) using the executor's own solved files attached in the report.

## Check results

| # | Check | Result |
|---|---|---|
| 1 | Topology | ✔ Exactly 2 linear commits on `e2ae086`: `c213907` (seed) → `105573f` (report). Merge-base = `e2ae086`. Commit messages match §5 verbatim. |
| 2 | Fence census | ✔/⚠ 13 files = 8 new question `.md` + `SOURCES.md` + `LldCatalogSeedTest.java` + `DsaCatalogGuardTest.java` (4/4 lines) + `QuestionMarkdownParserTest.java` (2/2 lines, deviation D-1) + report. No scratch/, no runner logs, no artifacts, no forbidden file touched (parser/validator/seeder/initializer, 11 live LLD files, `_taxonomy.yaml`, SPEC.md, docker/, poms, frontend: all untouched — verified by `--name-status`). |
| 3 | Spec-text fidelity | ✔/⚠ Frontmatter: all 17 §2-required keys present with correct values (track, buildProfile, difficulty, topics, est_minutes, source format, status, hints 3, coaching both sub-keys, tags except R-1); poms byte-identical to template except `artifactId` (verified by normalized diff); `solutionCode`/`starterCode` present (parser test asserts non-null). `editorial`/`referenceSolutions` absent — spec-consistent (§2 list omits them; §8 defers solutions). R-1 below is the only fidelity breach. |
| 4 | Behavioral parity | ✔ Zero production code touched; nothing deleted; all 364 pre-existing questions unchanged (branch tree census: 372 = 316 dsa + 27 hld + 19 lld + 8 sql + 2 behavioral). |
| 5 | Wire-trace | ✔ Ingestion path verified in code: seeder scans `classpath*:content/questions/**/*.md` → parser (frontmatter L35 throw, `solutionCode` L53, `referenceSolutions` null-safe L273) → `ContentValidator` → upsert. `LldCatalogSeedTest` binds the 8 slugs to tree + validator + PUBLISHED (19 asserts; includes strengtheners beyond §3: hiddenTestFiles==3, starterFiles≥8). |
| 6 | Affordance collision | ✔ Slug uniqueness across catalog (no near-duplicates; §0 R2-3 respected). Guard + parser-test count locks all consistent at tip (no residual stale literals anywhere in the test tree). |
| 7 | Four numbers (own regex) | ✔ base `7/40/192/0` → tip `8/41/211/0`; delta = exactly `LldCatalogSeedTest` (+1 file, +1 test, +19 asserts); guard test adds no test methods (literal-only), as §4 VP-4 requires visible. Matches the report's table digit-for-digit. |
| 8 | Dynamic execution | ✔✔ **EXECUTED (Z sandbox, ECJ + JUnit console, no Maven):** compile sweep 8/8 systems — skeletons + hidden tests compile clean; visible test copies byte-identical to hidden (anti-tamper intact). VP-3(a): 6 tests found / 6 failed / 0 passed, all `UnsupportedOperationException: TODO: Implement ...`, RC=1 — **reproduced**. VP-3(b): executor's solved `Logger.java`/`LogManager.java` overlaid on editable paths → 6/6 pass, RC=0 — **reproduced**. Executor's VP-3 evidence is honest. |
| 9 | Skip/disabled | ✔ 0 `@Disabled`/`@Ignore` in question-bank test tree at tip. |
| 10 | Process compliance | ✔ execute → push → halt → Z audit. No self-published verdicts. Commits under operator git identity (`tomar`) — known lane convention. ⚠ P-1 nit below. |
| 11 | Honest deviation ledger | ✔ Both deviations declared in the report before Z audit; graded below (D-1 benign-ratified, D-2 benign-justified). Z adds one the ledger missed: R-1 (tags). |
| 12 | Verdict + fix instructions | This document. |

## Findings

- **R-1 (recommended — merge gate):** `tags` cap breach. §2: "tags (3–7)". 5 files carry **8** tags: `lld-task-management`, `lld-pubsub`, `lld-digital-wallet`, `lld-ride-booking`, `lld-music-streaming`. Zero mechanical impact (ContentValidator does not enforce tag count; VP-2 PUBLISHED ×8 proves it), but it is the single written-contract breach in the seed. Fix: drop one design-pattern tag per file down to 7 (keep the template convention incl. the slug tag). Operator may instead waive explicitly.
- **A-1 (auditor errata — spec text, no executor action):** (a) §4 VP-3a "totalTests == 3" is imprecise: 3 test **classes** = 6 test **methods**; the runner reports 6 — executor evidence was correct. (b) §6 census "exactly 11 paths" undercounts: 12 expected + 1 declared deviation = 13 actual. (c) §2 "mirror field-for-field" vs the §2 required-key list conflict is resolved as: required list governs; template-only keys (`editorial`, `referenceSolutions`) may be omitted per §8 deferral.
- **P-1 (process nit):** D-1's justification was written after the code edit but before push. Hard rule 6's letter ("justified before push") is satisfied; for future spec cycles, park mid-execution deviations in the ledger file **before** the code commit lands, so the justification is never younger than the code.

## Deviations tolerated

- **D-1 — `QuestionMarkdownParserTest.java` 2-literal bump (11→19 LLD, 38→46 HLD+LLD):** out-of-fence (§3 authorized exactly one existing-file edit) but mechanically forced — this test hard-locks LLD/HLD+LLD counts (L412/L448), so the seed breaks the build without it; introduced `d65a241`, same character as the authorized guard carve-out. Minimal (2 lines), pre-declared. **Fence amended** to include exactly this 2-literal bump (QB-16 L1 precedent). Benign.
- **D-2 — `SOURCES.md` at repo-root `content/questions/lld/`:** justified by code: parser throws on frontmatter-less `.md` (`QuestionMarkdownParser` L35) and the seeder/guard would count 373 or abort boot if it sat on the classpath; root placement satisfies §0 C5 literally while keeping the classpath clean. Content verified: all 5 sources with licenses + dispositions. Benign.

## Originality (VP-5, Z's own sweep)

8-gram verbatim scan of all 8 statement bodies (prose only, code fences excluded) against fetched source material: `ashishps1/awesome-low-level-design` (GPL-3.0, 51 candidate files), `kousiknath/LowLevelDesign` (MIT, 28), `arpit20adlakha/Data-Structure-Algorithms-LLD-HLD` (MIT, 1 md): **zero overlaps** (6-gram triage also clean). takeUforward remains paywalled/proprietary — titles-only per §0 C1 (accepted limitation; C2/C4 authoring discipline binding). Similarity 0.0000 in VP-2 logs is the expected inspired-by short-circuit, correctly not claimed as a similarity pass.

## Merge-path adjudication (operator)

```bash
git fetch origin
git checkout master && git pull
# after R-1 trim lands on the branch (or explicit waiver):
git merge --no-ff origin/feat/spec-011-lld-catalog   # zero drift vs 4fae36f — conflict-free
git push origin master
```

- **Guard-literal interaction (carry-over from `collab/z/HOTFIX-MICPTT-AUDIT.md`):** the unaudited Gaurav-blog seed `61a0912` (on the hotfix branch) bumps the same `DsaCatalogGuardTest` literals 364→389. SPEC-011 merges first ⇒ Gaurav seed rebases to 397 (364+8+25) and its own audit governs. Do **not** let it ride along here.
- **Post-merge housekeeping:** flip the `SPEC.md` SPEC-011 row to EXECUTED/MERGED with this review link; master-state catalog line 364→372 (Z can fold both into the merge-prep commit if the operator prefers).
- **Status reminder:** the mic-PTT cherry-pick (`173cf63` onto master, zero-drift verified) is **still pending** — independent of this cycle.
- **VP-6 remains open** post-merge: one live LLD session on `lld-logging-framework` (loads, workspace opens with starter files, execute round-trip) — protocol per executor report §9.

## Fix slice (only if R-1 is not waived)

Files allowed: the 5 named `.md` files, one `- <tag>` line removed each, nothing else.
Prescribed message: `fix(question-bank): SPEC-011 trim tags to §2 cap on 5 seeded LLD files`
Re-verification (Z): tag recount (8→7 ×5), `LldCatalogSeedTest` + guard counts unchanged (7/40/192→8/41/211 delta unaffected), no re-run of dynamic gates needed (content metadata only).
