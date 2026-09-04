# SPEC-PLAN-2 Verification Log & Audit Trail

This append-only verification log records the evidence, automated test runs, line counts, and commit hashes for each batch executed under **SPEC-PLAN-2**.

---

## Batch 1: [A1 + A10 + A11] — Speech Salvage, Editor Sync, Workspace Clean Starter

- **Branch**: `fix/ledger-a1-a10-a11`
- **Scope**:
  - **A1**: Extracted `audio-encoder.ts`, `audio-recorder-fallback.ts`, `audio-tts.ts`, `audio-duplex-guard.ts` to shrink `useCoachVoice.ts` under 250 lines. Added `interimOnlyRef` and word-level overlap deduplication via `mergeSalvageText`. Prevented duplicate text injection on salvage. On mid-speech commit, parked continuation in composer with honest hint (`"continuation kept here — press send to add"`).
  - **A10**: Keyed editor workspace state per problem slug (`codeMap: Record<string, string>`) in `ArenaRoom.tsx`. Problem switches between Q1, Q2, and Q3 now isolate and preserve each question's own starter code and draft.
  - **A11**: Replaced full solution in `starterCode` and `starterCodeMap` for `valid-parentheses` in `QuestionDataInitializer.java` with a clean boilerplate stub.
- **Line Count Verification (`wc -l`)**:
  - `ArenaShell.tsx`: 249 lines (Budget: ≤ 250) — **PASS**
  - `ArenaRoom.tsx`: 248 lines (Budget: ≤ 250) — **PASS**
  - `useCoachVoice.ts`: 243 lines (Budget: ≤ 250) — **PASS**
- **Automated Test Evidence**:
  - `node --experimental-strip-types --test frontend/src/lib/salvage-dedup.test.ts`:
    ```
    # Subtest: A1: Deduplicates identical pending and interim fragments: ok
    # Subtest: A1: Deduplicates identical pending and interim with casing differences: ok
    # Subtest: A1: Merges disjoint pending and interim fragments losslessly: ok
    # Subtest: A1: Deduplicates overlapping boundary words: ok
    # Subtest: A1: Handles pending ending with interim: ok
    # Subtest: A1: Handles interim starting with pending: ok
    # Subtest: A1: Handles empty pending or interim: ok
    # tests 7, pass 7, fail 0
    ```
  - `mvn test -pl question-bank-service`:
    ```
    Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
    BUILD SUCCESS
    ```
  - `npm run build` (frontend):
    ```
    ✓ 2605 modules transformed.
    ✓ built in 1.62s
    Exit Code: 0
    ```
- **Reviewer Status**: PASS (Commit candidate ready for master merge)
