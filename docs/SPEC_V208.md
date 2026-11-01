> **STATUS: HISTORICAL SPECIFICATION** — Retained for architectural provenance. Current active development and audits are governed by collab/ protocol.

# SPEC V-2.0.8 — Per-Question Project Scaffolds for Workspace-Profile Questions (LLD / HLD)

| Metadata | Value |
|---|---|
| **Task ID** | `V208-SPEC` |
| **Author Agent** | Z.ai (Architect & Quality Auditor) |
| **Trigger** | Operator validation report (2026-10-01): LLD/HLD playground questions boot an **empty** code-server workspace — no `pom.xml`, no packages, no project structure. Product contract: the platform provides the full per-question project scaffold; the candidate writes only the target files (service / controller / exception handling / etc.). |
| **Status** | **ISSUED** — Executor: Gemini. Reviewers: Z.ai + Qwen. |
| **Baseline** | `3a7e269` (HEAD of master at issue time) |

---

## 0. Root Cause (auditor-verified — read this first)

The platform feature is **already built end-to-end** and matches the operator's product vision
exactly. Nothing is missing from the code path except the data feeding it:

```
content .md frontmatter
  └─ QuestionMarkdownParser.java:72-117   parses starterFiles / editablePaths / hiddenTestFiles
      └─ ContentValidator.java            (only checks: LLD needs starterFiles OR starterCode)
          └─ QuestionDocument             stores all three
              └─ QuestionFullView (internal)  exposes all three
                  └─ QuestionBankClient.java:117-119  maps into ProblemDocument
                      ├─ WorkspaceProvisionerService.java:202,227  resolveStarterFiles() → seed volume /home/coder/project
                      └─ LldMavenRunner.java:120-147  skeleton → candidate files (whitelist editablePaths) → hidden JUnit tests server-side
```

| # | Verified fact | Evidence |
|---|---|---|
| RC-1 | **0 of 364** content files carry `starterFiles` (or `editablePaths` / `hiddenTestFiles`) frontmatter | repo-wide scan; all 11 LLD files carry only a legacy single-file `starterCode` blob |
| RC-2 | Empty `starterFiles` → `resolveStarterFiles` returns `Map.of()` **silently** → empty volume → the operator's empty EXPLORER tree | `WorkspaceProvisionerService.java:409-420` (no log on empty) |
| RC-3 | Empty `editablePaths` → `LldMavenRunner` drops **every candidate file write** silently (`allowedPaths` = empty set) | `LldMavenRunner.java:130-139` |
| RC-4 | Empty `hiddenTestFiles` → "Run Project Tests" runs a skeleton with no tests → guaranteed broken loop | `LldMavenRunner.java:142-147` |
| RC-5 | Validator cannot catch RC-1 because `starterCode` satisfies "starterFiles OR starterCode" | `ContentValidator.java:85-88` |
| RC-6 | All 356 non-SQL questions say `buildProfile: judge0` — mislabeled for the 38 workspace-profile (LLD/HLD) questions | frontmatter scan |
| RC-7 | **Latent leak:** `ProblemDocument.hiddenTestFiles` (no `@JsonIgnore`) is serialized by `GET /api/v1/problems/**` (`ProblemCatalogController`) — frontend does not call it today, but the gateway routes it and any client one fetch away receives every hidden test | `ProblemDocument.java:42-43`, gateway `api-gateway-service.yaml:39` |

The operator-visible "12 problems" is the LLD+HLD surface of the catalog; the defect is systemic to
every workspace-profile question (11 LLD + implementation-profile HLD).

## 1. Product Contract (per operator, verbatim intent)

For every workspace-profile question the candidate opens:
1. The workspace boots with a **complete, compiling project** — build file, directory structure,
   bootstrap classes, domain skeletons, and a README describing the intended structure.
2. The candidate writes **only** the target files the question asks for (service, controller,
   exception handling, strategy, dispenser, …). Creating/renaming boilerplate is never required.
3. "Run Project Tests" executes **server-side hidden JUnit tests** against the candidate's
   implementation. Hidden tests are never present in the editor volume nor in any payload that
   reaches the browser.

## 2. Work Items

### V8-01 (P0, code) — Hidden-test exposure fix + seed/write observability
- `ProblemDocument.hiddenTestFiles`: add `@JsonIgnore` (or return a slim DTO from
  `ProblemCatalogController`). Add a contract test: `GET /api/v1/problems/{slug}` response body
  contains no `hiddenTestFiles` key and no hidden-test content bytes.
- `WorkspaceProvisionerService`: log WARN (with sessionId + slug) when a workspace-profile question
  seeds **0** starter files. `LldMavenRunner`: log WARN with dropped-path summary when candidate
  writes are rejected by the whitelist (and surface the count in the run result DTO, not just logs).

### V8-02 (P0, code) — Validator hardening for workspace-profile tracks
Track ∈ {`SPRING_LLD`, implementation-profile HLD track} requires, per question:
- `starterFiles` non-empty **and** contains `pom.xml`;
- `editablePaths` non-empty; syntax: explicit file paths (overwrite) or directory prefixes ending
  in `/**` (create-new);
- `hiddenTestFiles` non-empty, every key under `src/test/java/`;
- every `editablePaths` entry must either match an existing `starterFiles` path or be a `/**`
  directory prefix.
Negative unit tests in `ContentValidatorTest` for each rule (failing-gate proof).

### V8-03 (P0, content batch A) — Author the 11 LLD scaffolds
For each of the 11 `content/questions/lld/*.md`: add `starterFiles`, `editablePaths`,
`hiddenTestFiles` frontmatter; keep the legacy `starterCode` untouched (byte-identical, no-loss rule).
Per question the scaffold must include:
- `pom.xml` (Java 21; Spring Boot 3.4.2 starter **only** where the question demands a web layer —
  otherwise plain Maven + JUnit 5 + surefire; dependency set is part of the question spec);
- package structure + skeleton types the candidate must implement (interfaces, enums, abstract
  classes, exception types, empty service/controller methods with `// TODO` contracts);
- **no solution logic in starters** — skeletons compile and fail hidden tests meaningfully;
- `hiddenTestFiles`: ≥ 3 JUnit 5 test classes covering the question's functional requirements and
  edge cases (aligned with the question's own reference approaches);
- `editablePaths`: exactly the files the candidate is expected to write/edit.
Authoring order: `lld-atm-system`, `lld-parking-lot`, `lld-vending-machine`, `lld-elevator-system`,
`lld-movie-ticket-booking`, `lld-restaurant-management-system`, `lld-tic-tac-toe`,
`lld-blackjack-card-game`, `lld-grocery-store-system`, `lld-shipping-locker-system`,
`lld-unix-file-search`. One commit per 2–3 questions (V8-03.a…e).

### V8-04 (P1, content batch B) — HLD implementation-profile scaffolds
Pre-gate: audit the 27 `content/questions/hld/*.md` and classify implementation-profile vs
writeup-only (a writeup-only question gets no scaffold; the classification list is committed as the
audit artifact). Author the implementation-profile subset exactly per V8-03 (commits V8-04.a…).

### V8-05 (P1, content/code) — buildProfile truth
Set `buildProfile: maven-workspace` on all workspace-profile questions (parser: accept the new
value; guard test: track `SPRING_LLD` ⇒ profile `maven-workspace`; judge0 retained for DSA, sql for SQL).
Runner selection must be derived from the profile (or track), never from an absent field.

### V8-06 (P2, code) — Never-empty fallback
If a workspace-profile question still yields empty `starterFiles` at provision time, seed a generic
fallback (`pom.xml` + `README.md` + `src/` tree) and WARN — a candidate must never again face a
fully empty EXPLORER tree. (Does not replace authoring; it is a floor.)

## 3. Gates

| Gate | Proof |
|---|---|
| V8-g1 | `ContentValidatorTest` negative cases: workspace-profile doc missing each of the three fields → validator errors (failing-gate receipt) |
| V8-g2 | No-leak: `GET /api/v1/problems/{slug}` and `GET /api/v1/problems` responses assert key-absence of `hiddenTestFiles`; grep-level check that no `src/test/java` content string appears in any public payload fixture |
| V8-g3 | E2E red→green on 2 sample questions (1 LLD + 1 HLD): provision workspace → volume contains `pom.xml` + skeletons → `mvn test` RED on untouched skeleton → write ONLY whitelisted candidate files → GREEN. Four-number receipts; screenshot of non-empty EXPLORER tree (operator's original symptom) |
| V8-g4 | Zero-loss: all 11 LLD + HLD files' pre-existing frontmatter byte-identical except added keys (`git diff` audit); 356 DSA/SQL files untouched |
| V8-g5 | `buildProfile` guard test green; 38 files relabeled |

## 4. Discipline

Inherit G1–G9 (`AGENTS-addendum.md`): branch + per-item commits + `--no-ff` merges; four-number
receipts (`files / test-cases / assertions / failures` — record assertions or file the G3 amendment
proposal, but stop reporting `n/r`); no secrets (G5/G9); honest-judge evidence with real container
runs for V8-g3. Content language: English, no emojis in shipped content.

## 5. Non-Goals

- No changes to interview-mode masking or the V-2.0.7 reference-solution contract.
- No new editor UI features; the code-server workspace stays as-is.
- No DSA/SQL content changes (Judge0 single-file path is out of scope).
- The legacy `starterCode` blobs stay byte-identical (their editor single-file role is unchanged).

## 6. Execution Order

V8-01 → V8-02 → V8-03.a…e → V8-g3 (LLD sample) → V8-04 (audit + batches) → V8-05 → V8-06 →
full gate run → `SPEC_V208_VERIFICATION.md` + `collab/gemini/V208-REPORT.md`.

## 7. Amendments

### Amendment A1 — 2026-10-01, Z.ai (during V8-01/V8-02 implementation)

1. **RC-7 severity corrected.** `ProblemPublicView` (introduced in `efc4f97`, M6) already excludes
   `hiddenTestFiles` from `GET /api/v1/problems/**` responses; there was **no active gateway leak**
   at baseline `3a7e269`. RC-7 was a latent-risk framing, not a live exposure. The `@JsonIgnore`
   on `ProblemDocument.hiddenTestFiles` is retained as defense-in-depth (any future controller
   returning the document directly still cannot leak), and the V8-g2 key-absence contract tests
   remain mandatory so the property is pinned.
2. **V8-02 trigger clarified as progressive.** The hard gate fires when a question *declares* a
   Maven workspace build profile (`maven-spring` / `maven-workspace`) or is `SPRING_LLD` with
   multi-file `starterFiles` present. Legacy `starterCode`-only LLD questions stay `PUBLISHED`
   with a migration warning until V8-03/V8-05 land. Literal track-level enforcement would have
   DRAFTed the entire unscaffolded LLD catalog at deploy time (11 questions vanish) — worse than
   the defect being fixed. End state unchanged: once V8-05 relabels the files, the full gate applies.
3. **V8-01 scope addition (runner `/**` support).** V8-02 defines the `dir/**` editablePaths
   syntax, but `LldMavenRunner` previously matched exact paths only — shipping the syntax without
   runner support would have recreated RC-3 (silent candidate-write drops) under the new grammar.
   `isEditablePath` policy (exact match or non-empty `/**` directory prefix, fail-closed) is part
   of V8-01's whitelist region.
4. **`ExecutionResultResponse` carries `droppedWriteCount`** (int, default 0) — additive,
   backward-compatible for the frontend. Required by the V8-01 wording "surface the count in the
   run result DTO, not just logs".

— Z.ai, architect. Cross-refs: operator report 2026-10-01 + screenshot,
`WorkspaceProvisionerService.java`, `LldMavenRunner.java`, `ContentValidator.java`,
`QuestionMarkdownParser.java`, `ProblemDocument.java`, `collab/z/V2P-HOTFIX1-*.md`.
