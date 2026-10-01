# Issue queue: P7-AUTOVAULT defect fix-pack (for Gemini execution)

| Metadata | Value |
|---|---|
| **Author Agent** | Z.ai |
| **Date** | 2026-10-01 |
| **Context** | GitHub mirrors of the CONDITIONAL audit `62eb4c6` + verified Qwen-amendment findings `813dca8`; executor = Gemini |
| **Filing state** | Issue bodies final; Issues-API filing pending (token lacked Issues:RW at 1st attempt) |
| **Order** | R1 -> R2 -> NIT -> VP4/VP5 re-capture |

| Issue | Title | GitHub |
|---|---|---|
| 01-R1-verified-without-report | [P7-AUTOVAULT][R1][MUST] Vault finalized as VERIFIED without report files on transient ERS outage (audit F4a) | (file when Issues:RW granted) |
| 02-R2-platform-dependent-test | [P7-AUTOVAULT][R2][MUST] testVaultHealthUnmounted is platform-dependent — suite red on Linux, litters Z:\ dir (audit F7a) | (file when Issues:RW granted) |
| 03-nit-report-corrections | [P7-AUTOVAULT][NIT] Report corrections — four-number files=40 (not 25) for ISS full suite + real G4 test method names (audit F7b + F8 NIT) | (file when Issues:RW granted) |
| 04-gate-vp4-vp5-recapture | [GATE][VP4/VP5] Re-capture topic=arrays catalog + perf evidence on rebuilt stack — expect totalElements=110 (QB-18 F1) | (file when Issues:RW granted) |
| 05-bug-extension-hardcode | [P7-AUTOVAULT][BUG][MEDIUM] resolveExtension archives Python/JS DSA solutions as .java — track check overrides content (Qwen amendment F2, verified) | (file when Issues:RW granted) |
| 06-bug-section-sequence-hardcode | [P7-AUTOVAULT][BUG][LOW] Manual-jump skipped-section recording hardcodes DEFAULT_SECTION_SEQUENCE — wrong for custom plans (Qwen amendment F3, verified) | (file when Issues:RW granted) |

## Execution order & gates

1. **fix-01 (R1, MUST)** — VERIFIED-without-report + expected-artifact schema (audit F4a + Qwen F1).
2. **fix-02 (R2, MUST)** — platform-neutral unmount test (audit F7a).
3. **fix-03 (NIT)** — four-number files=40 restatement + real G4 method names.
4. **fix-04 (SHOULD)** — VP4/VP5 re-capture on rebuilt stack (expect totalElements=110).
5. **fix-05 (MUST)** — resolveExtension content-first (Qwen F2, Z-verified L638-643).
6. **fix-06 (SHOULD)** — plan-sourced section sequence (Qwen F3, Z-verified L660/742-762).

ACCEPT flip on the audit requires fix-01 + fix-02; VP11-m live closure remains operator-side.
Full bodies identical to the GitHub issues (verbatim). Fix-pack branches per issue:
feat/p7-fix-01 .. feat/p7-fix-06, --no-ff merge, issue number in commit message.
Note: this queue supersedes the branch naming in the Qwen amendment (its 'P7-AUTOVAULT-R2'
collides with audit item R2); Qwen F1 is absorbed into issue 01, F2 -> 05, F3 -> 06.

— Z.ai
