> **STATUS: HISTORICAL SPECIFICATION** — Retained for architectural provenance. Current active development and audits are governed by collab/ protocol.

# V-2.0.7-SPEC — Reference-Solution Bank (Multi-Approach) & Arena Decomposition (r1)

| Metadata | Value |
|---|---|
| **Version** | V-2.0.7 |
| **Author** | Z.ai (Chief Architect) — issued at the operator's direction, 2026-09-30 |
| **Baseline** | `origin/master` = `5ae0531` — *Merge branch 'collab/z-v206-r3' into master (V206-R3 delta audit by Z.ai)* |
| **Executor** | Gemini |
| **Reviewers** | Z.ai + Qwen (independent, per COLLAB-4 protocol) |
| **Item IDs** | `V7-01` … `V7-11` |
| **Status** | ISSUED — awaiting executor acceptance |

> **Issue note:** All anchors in §1 were re-verified against `5ae0531` on 2026-09-30 in a fresh checkout.
> The operator relayed that the executor holds a design recommendation for the reference-solution feature;
> it did not reach the architect before issue time. Per §5 (delta protocol), any such recommendation must
> enter the ACCEPT/REBUT cycle as a **declared delta** — silent deviation from this SPEC is a review finding.
> The schema in `V7-01` is deliberately conservative: it extends the existing single-solution model rather
> than replacing it, so a delta against it is cheap to adjudicate.

---

## §0 — Discipline Rules (inherited from V2-Platform SPEC and `docs/SPEC_V206.md` §0, binding)

1. **Image-only deploy.** No `docker cp`, no bind-mount patches, no host-side file edits into running
   containers. A change that is not in the image does not exist.
2. **Flyway receipts are unfakeable.** Migrations ship as versioned files; `flyway_schema_history` output
   must be quoted in the report. Hand-edited DB state is a FAIL.
3. **Four-number test report, exact vocabulary:** `files / test-cases / assertions / failures`.
   `test-cases` = number of test functions, `assertions` = real assert calls, `files` = test source files
   touched/run. Any other vocabulary is rejected at review.
4. **Honest-judge gates.** Every item ships a gate that must be *capable of failing*. Evidence is quoted
   from real runs (command + output), never paraphrased. A gate that cannot fail is not a gate.
5. **Branch development, `--no-ff` merges.** Work on the §3 branches (or per-item branches). Merge to
   master with `--no-ff` and the item IDs in the merge message. Never push direct to master.
6. **Fence scope.** Each item lists its allowed file fence. Touching files outside all fences requires a
   written justification in the report.
7. **Worklog in English only**; every report section quotes `file:line` evidence.
8. **Content language & hygiene.** All authored solution content is English. No emojis in any source or
   content file (F6b precedent). YAML style follows the existing question files (2-space indent, quoting
   consistent with neighbours).
9. **No fabricated facts in content.** Complexity claims must match the shipped code. Every approach must
   be independently defensible in a real interview — interview-accepted patterns only, no padded pseudo-
   variants. Existing solutions are preserved verbatim (see `V7-03`/`V7-09` no-loss rule).

---

## §1 — Master State & Current-State Ledger (all verified on `5ae0531`)

### 1.1 Question bank inventory

Location: `question-bank-service/src/main/resources/content/questions/`

| Category | Files | Has a solution today | Notes |
|---|---|---|---|
| `dsa` | 316 | 316/316 via `solutionCode` (single approach) | judge0 build profile |
| `hld` | 27 | **0/27 — no solution of any kind** | whiteboard style |
| `lld` | 11 | 11/11 via `solutionCode` (single approach) | Spring Boot / Java OOD |
| `sql` | 8 | 8/8 via `solutionCode`/`solutionSql` | |
| `behavioral` | 2 | **0/2 — no solution of any kind** | |

Total: **364 questions**. Every existing solution is a *single* canonical answer — there is no notion of
alternative accepted approaches anywhere in the schema, the API, or the UI.

### 1.2 Existing solution plumbing (the delta surface)

| Fact | Anchor (file:line, on `5ae0531`) |
|---|---|
| Document fields `solutionCode`, `solutionFiles`, `solutionSql`, `solutionVideoUrl` | `question-bank-service/.../document/QuestionDocument.java:75-79` (video URL at :42) |
| Ingestion consumes frontmatter keys `solutionCode`, `solutionSql`, `solutionFiles`, `solution_video_url`/`solutionVideoUrl` | `question-bank-service/.../ingestion/QuestionMarkdownParser.java:52-53,66,75` |
| Mode-based masking in the public view: `hiddenTests`, `editorialMarkdown`, `solutionCode`, `solutionSql` are nulled when `isInterviewMode` | `question-bank-service/.../dto/QuestionPublicView.java:44-75` |
| **Latent gap 1:** `solutionVideoUrl` is NOT masked in interview mode | `QuestionPublicView.java` builder line `.solutionVideoUrl(doc.getSolutionVideoUrl())` |
| **Latent gap 2:** `solutionFiles` is never exposed through `QuestionPublicView` at all (not even in practice mode) | same builder |
| Catalog detail API with solution masking exists | `0b5a15b` (P1.2), `CatalogControllerTest.java` references `includeSolution` |
| Frontend consumers | `frontend/src/services/api.ts`, `frontend/src/components/learn/QuestionDetailModal.tsx` |

### 1.3 Arena decomposition anchors (re-verified by `wc -l` on `5ae0531`)

| File | Lines | Governance target |
|---|---|---|
| `frontend/src/components/arena/ArenaShell.tsx` | **352** | ≤ 250 |
| `frontend/src/components/arena/ArenaRoom.tsx` | **536** | ≤ 250 |
| `frontend/src/components/arena/hooks/useCoachVoice.ts` | **383** | ≤ 250 |

(R3 audit cited 353/537/384; the one-line deltas are counting-state drift, not new code — the report must
quote actual `wc -l` output, per G4.)

### 1.4 Test infrastructure facts

- Canonical frontend command: `tsx --test "src/**/*.test.ts"` — runner is **node:test via tsx** (no vitest
  dependency exists; see `V7-11`). Last verified full-suite state on the V-2.0.6 line: **184 / 184 pass,
  20 suites, 0 failures**.
- `SelfTimer` lives at `frontend/src/components/ide/SelfTimer.tsx`. V-2.0.6 shipped a *logic-level* drift
  test (deadline-based); a *render-level* (jsdom) test does not exist — F2 follow-up from
  `collab/z/V206-R2-AUDIT.md`.

---

## §2 — Work Items

### V7-01 (P0) — `referenceSolutions` schema + ingestion (backend)

**Fence:** `question-bank-service/src/main/java/com/interviewos/questionbank/**` (document, ingestion, dto,
test trees only).

**Required:**
1. New embedded type `ReferenceSolution` with exactly these fields:
   - `approachId` — unique within the question, kebab-case;
   - `label` — human-readable, e.g. `Canonical — State Pattern + Chain of Responsibility`;
   - `approachClass` — enum `PRIMARY | ALTERNATE`; **exactly one `PRIMARY` per question**;
   - `kind` — enum `CODE | SQL | WRITEUP`; must match the payload field actually used;
   - `summary` — 2–4 sentences, the "answer opener" a candidate would say out loud;
   - `keyIdea` — one sentence;
   - `timeComplexity`, `spaceComplexity` — required when `kind` is `CODE` or `SQL`; optional for `WRITEUP`;
   - `tradeoffs` — 1–4 short bullets;
   - `whenToUse` — one short paragraph;
   - payload — **exactly one** of: `code` (string), `files` (map path→content), `sql` (string),
     `writeUp` (markdown string). For `WRITEUP`, optional `diagramNotes` (string) is allowed.
2. `QuestionDocument` gains `List<ReferenceSolution> referenceSolutions`.
3. `QuestionMarkdownParser` consumes the `referenceSolutions:` frontmatter list. Validation failures
   (duplicate `approachId`, unknown `approachClass`/`kind`, `kind`/payload mismatch, missing or multiple
   `PRIMARY`) **fail ingestion for that file** with a message naming the slug and the rule broken.
4. Backward-compat adapter (view layer, not storage): when `referenceSolutions` is empty but legacy
   `solutionCode`/`solutionSql`/`solutionFiles` are present, expose one synthesized `PRIMARY` approach whose
   payload is the legacy content. When both are present, `referenceSolutions` wins. Stored documents are
   never rewritten by the adapter.
5. Frontmatter example to be added to the parser test fixtures (not to live content — content moves happen
   in `V7-03`…`V7-10`).

**Gate V7-01 (must be able to FAIL):** parser unit tests covering (a) a fixture with 2 valid approaches →
document carries 2 entries in order; (b) a fixture with only legacy `solutionCode` → adapter synthesizes 1
`PRIMARY`; (c) a fixture with `approachClass: BOGUS` or two `PRIMARY` entries → ingestion fails with the
rule named. Four-number report required.

### V7-02 (P0) — Exposure & no-leak masking (backend)

**Fence:** `QuestionPublicView.java`, `QuestionPublicController.java`, catalog detail DTO/controller, and
their tests.

**Required:**
1. `QuestionPublicView` gains `referenceSolutions`: practice mode → full list; `INTERVIEW` mode → `null`.
2. Close **latent gap 1**: `solutionVideoUrl` is masked in interview mode from now on.
3. Decide and document **latent gap 2** in the report: either expose `solutionFiles` in practice mode
   through the adapter of `V7-01` or keep it unexposed — both are acceptable, silence is not.
4. Catalog detail API follows the same mode rules as the public view (`includeSolution` semantics preserved
   for practice/learn surfaces).
5. No-leak contract test: for a fixture question served in `sessionMode=INTERVIEW`, the **raw serialized
   JSON** must contain none of the keys `referenceSolutions`, `solutionCode`, `solutionSql`,
   `editorialMarkdown`, `solutionVideoUrl` (assert key absence in the JSON string, not just field nullity —
   a regression here must trip the test).

**Gate V7-02 (must be able to FAIL):** the contract test above, run for both modes, output quoted. It must
fail if any masking line is removed. Four-number report required.

### V7-03 (P0) — LLD reference-approaches batch (11 questions)

**Fence:** `question-bank-service/src/main/resources/content/questions/lld/**` only.

**Required:**
1. For each of the 11 LLD files: promote the existing `solutionCode` **verbatim** into a `PRIMARY`
   approach (`kind: CODE`, `files` or `code` payload byte-identical to the legacy string).
2. Add 1–2 `ALTERNATE` approaches that are genuinely accepted in interviews for the same prompt (e.g. a
   different pattern selection with a defensible rationale, or a simpler enum-switch state machine as the
   accepted junior variant). 2–3 approaches per question total; padding with cosmetic variants is a
   review FAIL.
3. Each approach carries summary / keyIdea / tradeoffs / whenToUse; complexities optional for LLD but
   encouraged where meaningful.
4. English only; no emojis; YAML style consistent with the existing files.

**Gate V7-03 (must be able to FAIL):** a scripted gate over the 11 slugs that asserts: YAML parses; ≥2
approaches each; exactly one `PRIMARY`; `approachId` unique; payload present per `kind`; and **no-loss** —
for every file, the legacy `solutionCode` string extracted from git history (`git show 5ae0531:<path>`)
is byte-identical to the `PRIMARY` payload. Quote the script output for all 11 slugs. Four-number report
for any test files added.

### V7-04 (P1) — SQL reference-approaches batch (8 questions)

**Fence:** `content/questions/sql/**` only.

**Required:** same promotion + authoring rules as `V7-03` (payload `kind: SQL`). Where 2–3 genuinely
distinct accepted formulations exist (window function vs join+subquery vs correlated variant), ship them
with index/complexity notes; otherwise 2 approaches is the floor. Same gate shape as `V7-03` over the 8
slugs, with the same no-loss rule.

### V7-05 (P1) — HLD reference-approaches batch (27 questions)

**Fence:** `content/questions/hld/**` only.

**Required:**
1. These 27 questions have **no solution today** — there is nothing to promote; author from scratch.
2. Per question: 2–3 `WRITEUP` approaches representing genuinely different architectures an interviewer
   would accept (e.g. request-response monolith-first vs event-driven vs CQRS-flavoured, where the prompt
   admits them). Each write-up covers: requirements recap (1–2 lines), component breakdown, data flow,
   capacity/consistency notes, and `diagramNotes` for the whiteboard.
3. Each approach carries summary / keyIdea / tradeoffs / whenToUse. Complexity fields omitted (optional for
   `WRITEUP`).

**Gate V7-05 (must be able to FAIL):** scripted gate over the 27 slugs — YAML parses; ≥2 approaches each;
exactly one `PRIMARY`; `kind: WRITEUP` with non-empty `writeUp`; no legacy-content loss check required
(nothing existed). Quote the output. Four-number report for any test files added.

### V7-06 (P1) — Frontend reveal UI ("Reference Approaches")

**Fence:** `frontend/src/**` — `services/api.ts`, `components/learn/QuestionDetailModal.tsx`, a new
`ReferenceApproaches` component tree, the post-submission review/closed-round surface, and tests.

**Required:**
1. Type definitions in `api.ts` mirroring the `ReferenceSolution` schema.
2. Practice/learn surface (`QuestionDetailModal`): a "Reference Approaches" section listing each approach —
   label, `PRIMARY`/`ALTERNATE` badge, complexity chips (when present), payload rendering (code block with
   copy affordance, SQL block, or markdown write-up), tradeoffs and when-to-use.
3. Arena surface: reference approaches are rendered **only in the post-submission / closed-round review
   view**. During an active interview nothing renders and nothing is fetched. Backend masking (V7-02) is
   the source of truth; the UI adds defence in depth, not the reverse.
4. Responsive behaviour consistent with the existing modal/panel patterns; no new heavy dependencies.

**Gate V7-06 (must be able to FAIL):** render tests — (a) practice fixture with 3 approaches renders 3
cards with the expected labels; (b) an interview-mode fixture renders zero approach text (assert the
absence of a known approach label in the DOM). Four-number report required.

### V7-07 (P1) — SelfTimer jsdom render test (F2 follow-up)

**Fence:** a new test file next to `frontend/src/components/ide/SelfTimer.tsx` plus minimal dev tooling if
needed.

**Required:** a jsdom test that mounts `SelfTimer` and asserts at the DOM level: initial render format;
countdown decrements under fake time advance; reaches zero; pause/resume retains the remaining budget
(regression tie to `V206-F5`); deadline-based behaviour shows no drift beyond a stated threshold. If jsdom
tooling is absent from `devDependencies`, adding it is a **declared rider** in the report (F3 discipline).

**Gate V7-07 (must be able to FAIL):** the render test itself; four-number report.

### V7-08 (P1) — Arena decomposition (line-budget epic)

**Fence:** `frontend/src/components/arena/**` (the three named files, new extracted files in the same
tree, and their tests).

**Required:**
1. Decompose so that `wc -l` ≤ 250 for `ArenaShell.tsx`, `ArenaRoom.tsx`, and `hooks/useCoachVoice.ts`
   (§1.3 counts). Extracted units (hooks/subcomponents) are separate files and are also expected to
   respect the 250-line target.
2. **Mechanical decomposition only** — no behaviour change, no dependency additions, no public API changes
   outside the three files. Suggested (not mandatory) cuts: recording-status banner hook out of
   `ArenaShell`; per-slug code-map session hook and question-rail out of `ArenaRoom`; utterance chunk
   planner out of `useCoachVoice`.
3. All existing tests stay green; the report lists each extracted unit with its props/API and the
   before/after line counts.

**Gate V7-08 (must be able to FAIL):** quoted `wc -l` output for all three files (≤ 250 each) plus the
full-suite four-number report (must show ≥ the 184 passing baseline, 0 failures).

### V7-09 (P2) — DSA reference-approaches batch (316 questions, sub-batches a–h)

**Fence:** `content/questions/dsa/**` only.

**Required:** same promotion + authoring rules as `V7-03` (payload `kind: CODE`): legacy `solutionCode`
promoted verbatim to `PRIMARY`; add 1–2 `ALTERNATE` accepted approaches (e.g. brute-force baseline vs
optimal, or a second accepted pattern). Minimum 2 approaches per question; 3 where genuinely distinct.
Delivered in **8 sub-batches of ~40 slugs** (`V7-09.a` … `V7-09.h`), each sub-batch shipping its own
scripted gate output + no-loss check + four-number report, and may land as separate pushes.

**Gate V7-09:** per sub-batch, same gate shape as `V7-03` over its slugs.

### V7-10 (P2) — Behavioral reference-answers batch (2 questions)

**Fence:** `content/questions/behavioral/**` only.

**Required:** per question, 2–3 model answers as `kind: WRITEUP` approaches using distinct, defensible
STAR framings (different emphasis/impact angle — not paraphrases). Primary marked `PRIMARY`.

**Gate V7-10:** scripted gate over the 2 slugs (same shape as `V7-05`); output quoted.

### V7-11 (P2) — Docs cosmetic fixes (docs-only)

**Fence:** `docs/SPEC_V206_VERIFICATION.md` (and any doc mislabelling the test runner).

**Required:**
1. Add the base-commit qualifier to the corrected four-number table: it describes the `f5f25b5` fix-pack
   snapshot (182 frontend cases); live master differs (184 after `V6-09` + `V206-F5` additions) — per
   `collab/z/V206-R3-AUDIT.md` §3.1.
2. Runner label `Vitest` → `node:test (via tsx)` wherever mislabelled.

**Gate V7-11:** diff quotes in the report. No code changes allowed under this item.

---

## §3 — Execution Protocol

| Branch | Items | Merge message |
|---|---|---|
| `feat/v207-reference-solutions` | V7-01…V7-06 | `Merge branch 'feat/v207-reference-solutions' into master (V-2.0.7 V7-01..V7-06 reference-solution bank)` |
| `fix/v207-arena-decomp` | V7-08 | `Merge branch 'fix/v207-arena-decomp' into master (V-2.0.7 V7-08 arena decomposition)` |
| `fix/v207-tests-docs` | V7-07, V7-11 | `Merge branch 'fix/v207-tests-docs' into master (V-2.0.7 V7-07/V7-11 tests and docs)` |
| `feat/v207-content-batches` | V7-09 (per sub-batch), V7-10 | `feat(content): V7-09.x DSA reference approaches batch x/8` per sub-batch commit; final merge with item IDs |

- Commit types separated per item (`feat:` / `fix:` / `docs:` / `test:` — F4 discipline). Worklog English.
- **Executor report:** publish `docs/SPEC_V207_VERIFICATION.md` (per-item evidence, gates, four-number
  table) plus `collab/gemini/V207-REPORT.md` (response-style summary). The verification doc is the audited
  artifact; the collab file is the conversation record.
- **Closure bar:** V-2.0.7 closes when V7-01…V7-08 and V7-11 are verified AND at least DSA sub-batches
  `V7-09.a`…`V7-09.c` have landed with gates. Remaining DSA sub-batches (`V7-09.d`…`h`) and `V7-10` are
  **follow-through**: they continue on the same branch protocol with per-batch gates and are tracked in the
  ledger until exhausted, without holding the version closure hostage.
- **Review:** Z.ai + Qwen verify independently after each executor push (branch + `--no-ff` merges; findings
  answered with ACCEPT/REBUT per ID; contested items go to the operator).

## §4 — Non-Goals (explicitly out of scope for V-2.0.7)

1. Evaluation-service consumption of reference approaches (rubric grounding) — candidate for V-2.0.8.
2. AI-assisted bulk generation of solution content — all authored content is human-curated by the executor
   this version.
3. Localization of write-ups; mobile-specific redesign of approach cards (responsive styling only).
4. Any change to interview evaluation, timer logic beyond the V7-07 test, or recording pipeline.

## §5 — SPEC Delta Protocol

The executor may refine this SPEC (including the `V7-01` schema and the §1.2 gap decisions) **only** by
declaring a delta in the report: item ID, section, proposed change, rationale. Undeclared deviation is a
review finding (G6). Accepted deltas are appended to the ledger in the verification doc so the audited
artifact stays self-describing.

## §6 — Cross-References

- `collab/z/V206-R3-AUDIT.md` §3 (residual notes) and §4 (V-2.0.7 queue)
- `collab/gemini/V206-R2-RESPONSE.md` §3 (line-budget epic ACCEPT, scheduled here as V7-08)
- `collab/qwen/V6-09r-REVIEW.md` (line-budget governance origin)
- `docs/SPEC_V206.md` §0 (inherited discipline rules), `AGENTS-addendum.md` (G3–G8)
- Operator direction (2026-09-30): reference solutions with 2–3 alternative accepted approaches per question

— Z.ai, Chief Architect. End of SPEC V-2.0.7 (r1).
