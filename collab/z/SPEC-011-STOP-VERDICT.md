# SPEC-011 Pre-Flight STOP — Z Adjudication (STOP VALID, SPEC REV 2 ISSUED)

**By:** Z.ai (architect/audit lane) · **Date:** 2026-10-06 · **Base verified:** `origin/master` `e928e67`
**Subject:** Gemini executor STOP-and-REPORT under SPEC-011 §2 + hard rule 11 (AUDIT-PROTOCOL v1.1), filed 2026-10-06.

## Verdict

**STOP: VALID and correct.** Hard rule 11 worked exactly as designed: the executor detected that the spec's mechanical premises contradicted the repo, halted before writing a single file, and filed a precise report. No breach, no probation consequence — this is the protocol succeeding. The defect was in the spec (my lane), not in the execution.

**Root cause (owned by Z):** REV 1's §0 premise ("36 questions … zero LLD") and §2 exemplar were authored from a stale mental snapshot of the catalog (the ~36-question era from the first audit cycle) instead of a fresh fetch of master — violating my own dynamic > static > report trust order at spec-authoring time. The "exemplar (authoritative template)" was constructed, not copied from the live `lld-parking-lot.md`. REV 2 re-grounds every mechanical fact against `e928e67`.

## Claim-by-claim verification (Gemini report → Z ground truth)

| # | Gemini claim | Z verification | Result |
|---|---|---|---|
| 1 | Catalog already has 11 LLD systems; 364 total | `git ls-tree origin/master …/content/questions/lld/` = exactly the 11 slugs listed; census 364 = 316 dsa + 27 hld + 8 sql + 2 behavioral + 11 lld; all PUBLISHED | **CONFIRMED** |
| 2 | `lld-parking-lot`, `lld-vending-machine` collide; `lld-atm`/`lld-elevator` semantic dups | Both exact slugs exist; `lld-atm-system.md` / `lld-elevator-system.md` exist | **CONFIRMED** |
| 3 | ContentValidator requires `maven-workspace` for SPRING_LLD; spec's `maven-spring` would force DRAFT | ContentValidator.java:84-88 verbatim as quoted; Rules 1–3 (pom.xml L93, editablePaths L98, hiddenTestFiles L114) also unsatisfied by REV 1's exemplar; validator is in SPEC-011 §3 forbidden fence | **CONFIRMED** |
| 4 | Recommendation: author only the 8 missing systems, conform to live `maven-workspace` pattern | Matches Z's independent analysis; adopted in REV 2 | **ADOPTED** |

## Additional Z findings (beyond Gemini's report)

- **F-A (build breaker):** `DsaCatalogGuardTest.java` L110/L115/L116/L139 hard-asserts exactly 364 total and 364 PUBLISHED — any new question file without a literal bump breaks the build. The guard test sat in a REV-1 fence gap (neither allowed nor forbidden). REV 2 §3 authorizes a scoped 4-line literal bump (364 → 372) and closes the gap.
- **F-B (fabricated exemplar):** REV 1's exemplar diverged from the live file on nearly every axis: `maven-spring` vs `maven-workspace`, `MID` vs `MEDIUM`, missing `topics`/`est_minutes` (P1.0 enrichment fields), missing `pom.xml` in starterFiles, invented package base `com.interviewos.lld.…` vs live `com.interviewos.parkinglot`, invented hint/coaching shape.
- **F-C (vocabulary):** catalog difficulty vocabulary is EASY/MEDIUM/HARD (guard-enforced for DSA; used by all 11 LLD files) — REV 1's MID/SENIOR are foreign values.
- **F-D (runner nuance):** `LldMavenRunner.supports()` accepts BOTH profiles (L112); the binding gate is the validator. `mvn -o` is offline — per-question poms are restricted to image-cached deps (junit-jupiter 5.11.4 + surefire 3.5.2 is the proven set). Hidden tests across all 11 files are junit-only (no Mockito/Spring) — codified in REV 2.
- **F-E (citation trivia):** REV 1 cited `LldMavenRunner.java:110`; the supports() check is at L112. `docker/lld-runner/skeleton-pom.xml` DOES exist on master — the operator's `git ls-files origin/master` search returned empty because `ls-files` cannot take a remote ref; `git ls-tree origin/master docker/lld-runner/` shows it.
- **F-F (similarity short-circuit):** `ContentValidator.computeSourceSimilarity` returns 0.0 for any `source: inspired-by:*` (L143) — VP-2 will print 0.0000 for all files. Expected behavior, not a bypass; statement originality remains enforced by authoring rules + VP-5 grep.

## Decision

- **Path A (conform) adopted:** author the 8 missing systems under the live `maven-workspace` contract; ContentValidator and all pipeline code stay frozen.
- **Path B (2-line validator fence adjustment) rejected:** the runner treats both profiles identically, 11 live files prove the workspace pipeline end-to-end, and editing a test-covered, fenced validator for zero functional gain is unjustified churn.
- **SPEC-011 REV 2 published** in `docs/SPEC_011_LLD_CATALOG_SEED.md` (this commit): 8 slugs (§1), live-file schema as template (§2), scoped guard-test carve-out (§3), VP-1 total = 372, VP-3a/b honest-judge runner smoke, changelog §0-REV2.
- Gemini may now resume: branch → Pre-Flight → execute per REV 2 → report per §5. Qwen may review the report as usual.
