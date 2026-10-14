# QB-40 MERGE AUTHORIZATION — SPEC-016 Rotation Engine & Catalog Depth

| Field | Value |
|---|---|
| **Audit round** | QB-40 (branch-level, full A1–A9) |
| **Auditor lane** | Z @ `ffd5423` (master) |
| **Subject** | `feat/spec-016-rotation-catalog-depth` @ `4df1def` (8 commits, base `ddbe91a`) |
| **Pre-audit** | `collab/z/SPEC-016-PREAUDIT-QB40.md` @ `ffd5423` (16-point transcript table) |
| **Method** | Branch fetched & checked out locally; every gate re-executed on the branch tip; static claims re-derived from source, not trusted |
| **Verdict** | **✅ MERGE AUTHORIZED** — 9/9 checks PASS, 2 non-blocking WARNs (N-1 eponyms, N-2 deviations section) |

---

## 1. A1–A9 Verdict Table

| # | Check | Verdict | Evidence (independently re-derived) |
|---|---|---|---|
| A1 | Fence compliance | **PASS** | `git diff --name-status ddbe91a..4df1def` = 92 files, every path inside §5 fence: session-service (9 files: engine, exposure svc/record, V13, 2 test classes), qb content +78 & 2 guard tests, root `content/` disposition (1 del), `collab/gemini/` lane docs (2 add). **frontend = 0 files. SPEC.md untouched.** |
| A2 | Parser-test deviation adjudication | **PASS (WARN N-2)** | `QuestionMarkdownParserTest.java` held a **second count-pin** (27 HLD / 19 LLD exact + 46 unique-slug pin). Diff converts all three to `>=` floors — exactly what §3 P1 mandates; without it the suite fails after P2. Substance compliant. **But report §6 declares "Deviations: NONE" — the touch is undocumented.** Process slip only → N-2. |
| A3 | Migrations additive-only | **PASS** | V13 = single `CREATE INDEX IF NOT EXISTS idx_sessions_candidate_track ON interview_sessions(candidate_id, track)`. Base highest migration = V12 → **V13 next-free correct** (SPEC-017 link: H-12 rule intact, its migration slots into V14). Repo change = additive read-only native `@Query` + nested `ExposureProjection`; correctly filters `session_mode != 'PLAYGROUND'` so practice never pollutes the interview exposure ledger. No entity/schema mutation. |
| A4 | Copyright & provenance sweep | **PASS (WARN N-1)** | 78/78 new files carry `source: ai-generated:v1`. Word-boundary brand sweep over all 78 files: only standalone hits are **"Twitter Snowflake"** (1 file) and **"Uber H3"** (1 file) — canonical eponyms of the algorithm/library itself, in solution/architecture body text, not scenario framing or metadata. `meta`×6 hits = "metadata" substrings (false positives). §4.4(3) hard rule ("never name platforms in any field, tag, or body text") read strictly flags these → N-1, non-blocking: eponyms denote the artifact, not a source. Disposition: accept as-is; optional rider to reword to "Snowflake-style ID scheme" / "H3-class hexagonal spatial index". |
| A5 | Dynamic gates (re-run by Z) | **PASS — digit-exact** | session: `Tests run: 287, Failures: 0, Errors: 0, Skipped: 1` + BUILD SUCCESS. qb: `Tests run: 41, Failures: 0, Errors: 0, Skipped: 0` + BUILD SUCCESS. frontend (re-run despite zero-diff): `tests 306 / suites 39 / pass 306 / fail 0`; `npm run build` exit 0. Full reactor `mvn -DskipTests package`: **BUILD SUCCESS, 0 errors**. Static assertion count 1,161 carried by git zero-diff proof on `frontend/**`. |
| A6 | VP-01..06 receipts | **PASS** | `QuestionRotationIntegrationTest` (6) + `QuestionExposureServiceTest` (3) present, named per spec, all green in Z's own run. Entropy injection verified in source: injectable `LongSupplier sessionNonceSupplier` (default `nanoTime ^ UUID.hashCode()`) mixed into seed **inside the non-PLAYGROUND branch only** — playground determinism explicitly preserved (pre-audit concern resolved). `[ROTATION_DEGRADED]` sample in report matches the actual `RotationState.emitTelemetryLog` code path. |
| A7 | Root `content/` disposition | **PASS** | `git ls-tree ddbe91a -- content/` = exactly 1 tracked file (`content/questions/lld/SOURCES.md`, a SPEC-011 reference-URL log). At tip: `git ls-tree origin/spec-016 -- content/` = empty → stray folder fully untracked. §4.5 satisfied. |
| A8 | qb suite integrity | **PASS** | Guard evolution diff verified line-by-line: `assertEquals(397,…)` ×2 → `assertTrue(>=397,…)` ×2; new per-family RED floors at old counts (dsa 341 / hld 27 / lld 19 / sql 8 / behavioral 2) — **as §3 mandates** (floors intentionally RED at old counts; hard floors deferred); `[STARVATION_ALARM]` soft warning present; PUBLISHED-ratio-1.0 assertion retained. Floors all satisfied by delivered counts. |
| A9 | `rotationPolicy` persistence | **PASS** | `SessionPlan` record extended with `@JsonProperty("rotationPolicy")`/`("reusedSlugs")` (+ legacy-constructor default `STRICT`, compact-constructor null-normalization, `@JsonIgnoreProperties` back-compat); plan JSON write path unchanged → fields persist. Integration tests assert round-trip values: `plan().rotationPolicy()` = `STRICT` (L130, L195) and `DEGRADED_LRU` (L229). |

## 2. Catalog Ledger (Z recount, frontmatter scan)

| Family | Prior | Delivered | E / M / H |
|---|---|---|---|
| dsa | 341 | **341** (±0) | 105 / 208 / 28 |
| hld | 27 | **50** (+23) | 8 / 17 / 25 |
| lld | 19 | **40** (+21) | 7 / 17 / 16 |
| sql | 8 | **20** (+12) | 7 / 6 / 7 |
| behavioral | 2 | **24** (+22) | 7 / 10 / 7 |
| **Total** | 397 | **475** (+78) | **134 / 258 / 83** |

- Every family × every difficulty cell ≥ 6 → **zero starvation** (starvation alarm silence confirmed in qb run).
- Per-difficulty share of new batches ≤ 60% on sql/behavioral; hld/lld within spec tolerance. Report table matches Z recount digit-for-digit.
- Merge-base = `ddbe91a` (branch pulled the spec commit before executing — report's "Base Commit `814ff2d`" is a cosmetic metadata slip; `814ff2d` is an ancestor, immaterial).

## 3. Merge Topology & Instruction

- Branch = strict descendant of `ddbe91a`; master tip `ffd5423` adds only `collab/z/` docs (SPEC-017 spec + pre-audit) → **no overlap, no conflicts**.
- **Authorized merge procedure for Gemini**: merge `feat/spec-016-rotation-catalog-depth` → `master` with a **merge commit** (do not rebase), then flip SPEC-016 status in SPEC.md to `COMPLETED & MERGED` + append honest completion summary, single push. Delete is NOT authorized (operator standing order: branches preserved).
- Post-merge, operator executes the §4.4(4) 5-point vetting pass on a sample of new files.

## 4. Non-Blocking WARNs (register in QB-42 lane)

- **N-1 (eponyms)**: "Twitter Snowflake" / "Uber H3" in body text of 2 hld files. Strict §4.4(3) reading flags platform names; accepted as canonical technical nomenclature. Optional one-line rider for Gemini's next push.
- **N-2 (deviations section)**: Report §6 "Deviations: NONE" while §5 fence unnamed `QuestionMarkdownParserTest.java` was modified (legitimately, per §3 P1). Future single-push reports must list every fenced-but-unnamed file under Deviations, even when mandated by the spec.

## 5. Lane Continuity

- SPEC-016 → **CLOSED PENDING MERGE** (this doc is the merge authorization).
- SPEC-017 (streak/calendar/history @ `4436183`) is now **published on master** and unblocked; per Rider R-2 ordering, SPEC-016 merge must land before Gemini starts SPEC-017 execution. QB-42 = one-shot audit of SPEC-017 report after its single push.
