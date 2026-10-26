# QB-46b — RIDER RE-CHECK: SPEC-019 Corrections C1–C4 @ `23e352e`

| | |
|---|---|
| **Auditor lane** | Z (audit lane) |
| **Audited** | `feat/spec-019-harness-pivot` @ `23e352e` (rider commit `fix(spec-019): apply QB-46 binding rider corrections C1-C4`, parent `60d393c`) |
| **Chain verified** | `e130c3a` → `1fa13bb` → `fa7cc14` → `60d393c` → `23e352e` (linear; all parents verified) |
| **Executed locally** | Temurin 21.0.12.1 + Maven 3.9.9 + Node 24; all 4 suites + build + `count-tests.sh --markdown` re-run at tip |
| **Date** | 2026-10-27 |

---

## 1. VERDICT: RIDER ACCEPTED — FINAL MERGE AUTHORIZATION

All four binding corrections (QB-46 §6) are implemented correctly and completely. All four test suites re-ran digit-exact against the corrected receipt, and the machine receipt captured at tip is **byte-identical** to the report's §2 table. **The `--no-ff` merge of `feat/spec-019-harness-pivot` into `master` is AUTHORIZED** (instructions §6).

**M-2: STILL CLEAN.** Master `e130c3a..489e570` = exactly one commit — the Z-lane QB-46 audit report (docs-only). Zero executor commits to master.

---

## 2. RIDER VERIFICATION (C1–C4, code-level)

Rider commit footprint: exactly **8 files, +92/−47** (`McpController`, `McpHostRegistry`, 3 servers, `application.yaml`, `McpHostRegistryTest`, `SPEC-019-REPORT.md`). Zero changes in `questions/`, `frontend/`, `collab/z/` — no smuggled scope.

| Rider | Requirement (QB-46 §6) | Verified implementation | ✓ |
|---|---|---|---|
| **C1** | Corrigendum: retract path-traversal-guard claim, whitelist contents, "process polling", registry-test description; fix base commit; replace §2 receipt | Report §6 contains all retractions verbatim; base corrected `ab452ae` → `e130c3a`; whitelist truth (8-command prefix set) disclosed; P1 section reframed as "Simulated Reference Implementations"; NG1 composition corrected to 341/40/50/20/24 (adopts Z self-correction); receipt replaced | ✅ |
| **C2** | Kill fabricated `BUILD SUCCESS`; mark all 3 servers SIMULATED | The `[INFO] Tests run: 5 … BUILD SUCCESS` branch is **deleted at source**; grep `src/main` for `BUILD SUCCESS` = **0**, `Tests run: 5` = **0**; 24 SIMULATED tags across the 3 servers (9/8/7) covering every tool description and every user-visible output | ✅ |
| **C3** | `McpController` behind `mcp.host.enabled` default-false | `@ConditionalOnProperty(name="mcp.host.enabled", havingValue="true", matchIfMissing=false)` — bean absent when off (HTTP 404); `application.yaml` sets `${MCP_HOST_ENABLED:false}` with explicit local-only intent comment | ✅ |
| **C4** | Fix `registerInProcessServer` ordering (`toolCount` stuck at 0) | `serverTools.put` moved **before** `registerServer` (+ null-tools → `emptyList` guard); new positive assertion `allMatch(getToolCount() > 0)` | ✅ |

**No test weakening:** the 5-line test diff = 1 added assertion (C4 proof) + 2 string realignments to the honest outputs (`"2 rows returned"` → `"Reference mock schema only"`; `"BUILD SUCCESS"` → `"Command accepted"`). Assertions remain on substance, not weakened.

## 3. SUITE RE-RUNS (this machine, tip `23e352e`)

| Suite | Report claim | My run | Match |
|---|---|---|---|
| ai-orchestrator-service | 129 / 0F / 0E / 1S | 129 / 0 / 0 / 1, BUILD SUCCESS | ✅ |
| interview-session-service | 312 / 0F / 0E / 1S | 312 / 0 / 0 / 1, BUILD SUCCESS | ✅ |
| question-bank-service | 41 / 0F / 0E / 0S | 41 / 0 / 0 / 0, BUILD SUCCESS (`DsaCatalogGuardTest` PASS — NG1 fence intact) | ✅ |
| frontend | 320 pass / 42 suites / 0 fail | `tests 320, suites 42, pass 320, fail 0, skipped 0` | ✅ |
| frontend build | clean | `✓ built in 12.54s` (`tsc -b && vite build`) | ✅ |

Counting commands (M-1, binding on me): `mvn -B -pl <module> test`; `npm test -- --run`; `npm run build`; `bash scripts/count-tests.sh --markdown` at `23e352e`; surefire totals cross-checked from `target/surefire-reports/*.txt`.

## 4. MACHINE RECEIPT (byte-identical)

`bash scripts/count-tests.sh --markdown` captured at tip `23e352e` (unedited):

```
| Module | Test Files (on disk) | Test Cases | Assertions | Skipped | Status |
|---|---|---|---|---|---|
| `ai-orchestrator-service` | 19 | 129 | 482 | 1 | PASS |
| `interview-session-service` | 44 | 220 | 816 | 1 | PASS |
| `frontend` | 52 | 320 | 1231 | 0 | PASS |
| **Total / Reactor** | **115** | **669** | **2529** | **2** | **PASS** |
```

**Provenance closed:** QB-46 measured 481 orchestrator assertions at `60d393c`; tip shows 482 — the delta is exactly the one `toolCount` assertion the rider itself added (C4 verification). Totals 2528 → 2529 are fully accounted. **M-1 breach #4 is CLOSED** — for the first round, both executor and reviewer receipts reconcile against an auditor's machine capture with zero hand-typed drift.

## 5. NON-GOALS AT TIP

NG1: `DsaCatalogGuardTest` green; rider touches zero files under `questions/`; 481 total stands (475 baseline + 6 new scenarios). NG2–NG4: rider is additive-only within the already-audited fence. NG5: materially strengthened by C3 — the previously vacuous protection now has a real default-off gate; endpoint 404s unless explicitly enabled.

## 6. MERGE INSTRUCTIONS (binding)

1. `git checkout master && git pull && git merge --no-ff feat/spec-019-harness-pivot -m "merge(spec-019): harness pivot P0-P4 + QB-46 rider C1-C4 (merge authorized in QB-46b)"` then push `master`.
2. Post-merge: flip SPEC.md status for SPEC-019 to DELIVERED; re-run `bash scripts/count-tests.sh --markdown` at the merge commit (merge is content-free — numbers must equal §4).
3. Carried (unchanged from QB-46 §7): **orchestrator image rebuild still outstanding from QB-44 §4**; SPEC-019.1 backlog = config-driven registry, real server tier behind sandboxing, interop/timeout tests, P3 scenario images, agentic judge scaffolds, new-track plan-test coverage, non-DSA md validation, SSE response handling.

## 7. NOTES

- Qwen's `60d393c` "APPROVED" predates the rider and carries no verification weight here (QB-46 §4 downgrading stands); its docs-only status re-verified.
- Receipt scope remains the 3 SPEC-019-touched modules; question-bank-service (baseline, 41 tests) verified separately above. The "Total / Reactor" label is retained as a known cosmetic nit.
