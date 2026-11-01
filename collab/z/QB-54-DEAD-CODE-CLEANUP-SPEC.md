# QB-54 — Dead-Code Cleanup SPEC (Executor: Gemini)

| Field | Value |
|---|---|
| **Task ID** | `QB-54` |
| **Author** | Z (audit lane) — at operator direction |
| **Base commit** | `d4307f3` (tag `v0.9.0-beta.1`) |
| **Branch** | `feat/qb54-dead-code-cleanup` — MUST branch from current master; report-before-merge applies |
| **Priority** | P1 (operator directive) |
| **Hard rule** | **Zero behavior change.** This is removal of provably-dead material only. No refactors, no renames, no moves, no "improvements while we're here". |

---

## S0. Discipline (carried forward — now applies to ALL changes, no exceptions)

1. **Report-before-merge**: every slice gets an execution report to the audit lane BEFORE merge. The QB-51 hotfix incident (merged unreported) is the last occurrence. Docs-only included.
2. **Four-number receipts** (files / test-cases / assertions / skipped) from `bash scripts/count-tests.sh --markdown`, in every report. Suite lines quote **surefire/runner execution counts**, never static counts (QB-18 + QB-51 recurrence rule).
3. **Honest-judge**: green receipts only from real runs. Any suite red at base = stop and report, do not "fix opportunistically".

## S1. Definition of Done

- Full suite green at base and after every slice: QBS + ISS (`mvn test`), FE (`npm test`), FE build (`npm run build`).
- Four-number **delta ledger** in every report: every change in the four numbers must map 1:1 to a named removed file (e.g., deleting an orphaned component also deletes its orphaned test → files −1, cases −n, explicitly listed).
- A `collab/gemini/QB54-DEAD-CODE-INVENTORY.md` exists: the complete candidate inventory with per-item evidence (reference counts, tool output), classification tier, and disposition.
- Zero changes to: question content (`content/questions/**`), API request/response shapes, gateway routes, docker images, `.env.example`, runtime behavior.

## S2. Seed Inventory (machine-scanned by Z at `d4307f3`)

Produced by `python3 scripts/dead-code-scan.py` (committed with this spec). **This seed is a candidate list, NOT deletion authorization.** Re-verify every item yourself (S3) and extend the inventory — the seed only covers what Z's scanner can see.

### Tier 1 — whole files never imported anywhere in `frontend/src` (11)
```
src/components/AiAvatarWaveform.tsx
src/components/CameraProctorHUD.tsx          ← see Tier-2 note: proctored-flow scaffold (P4 roadmap)
src/components/behavioral/StarGuide.tsx      ← behavioral UX scaffold
src/components/learn/RetryQueueCard.tsx      ← RetryQueue feature IS live (HubView/ModulesView); this card specifically is orphaned
src/components/setup/ResumeSection.tsx       ← resume ingestion UI scaffold
src/components/ui/SegmentedControl.tsx       ← design-system primitive
src/components/ui/SelectNative.tsx           ← design-system primitive
src/components/ui/Textarea.tsx               ← design-system primitive
src/components/ui/TrackCard.tsx              ← design-system primitive
src/lib/audio-duplex-guard.ts                ← P5 voice scaffold
src/lib/audio-recorder-fallback.ts           ← P5 voice scaffold
```
⚠️ Several of these are **roadmap scaffolding** (proctored HUD, voice pipeline, design system), not accidents. They move to **Tier-3 (retain, annotate)** unless the operator explicitly confirms the feature is abandoned. Your inventory must ask, per file: "scaffolded-for-roadmap or superseded?" with evidence (git history of last touch, replacement component name).

### Tier 1 — Java, zero references anywhere (2)
```
ai-orchestrator-service/.../ai/mcp/StdioMcpTransport.java
ai-orchestrator-service/.../ai/mcp/StreamableHttpMcpTransport.java
```
⚠️ Both implement `McpTransport`; only `InProcessMcpTransport` is ever constructed (`McpHostRegistry` L60). BUT `collab/gemini/SPEC-019-REPORT.md` documents them as delivered features, and they are the natural transports for the agentic track's MCP-host story. **Tier-3**: disposition = wire via config OR quarantine with `@Deprecated` + README note — operator decides. Do not silently delete.

### Tier 2 — export-level orphans (~137 exported VALUE symbols + 6 TYPE symbols)
Mostly unused `*Props` interfaces and one-off helpers alongside live components. Safe subset = delete the export AND the declaration when the symbol is referenced nowhere; keep types that document runtime contracts if deleting would strip documentation from a live component. Handle in bulk slices with per-symbol evidence lines from `dead-code-scan.py` output.

### Tier 2 — scripts / docs / config
- `scripts/promote_dsa_batch_{a,b,c}.py` — one-off batch promotion tools; batch work is complete. Disposition: move to `scripts/archive/` with a one-line README each (do not delete — they are batch provenance).
- `scripts/eval/`, `scripts/gates/` — inventory contents, classify live vs one-off, same rule.
- `docs/SPEC_006..011*, HOTFIX1_LIVE_CHECKLIST.md` etc. — historical specs. Disposition: **not deletion**; add a "STATUS: historical (superseded by collab/ process)" banner at top, or move to `docs/archive/` if operator prefers.
- `judge0-patches/isolate_job.rb` — verify it is part of the judge0 image build before touching; if referenced by any Dockerfile/docs it is LIVE.
- 31 `TODO` markers — produce a triage table (file, line, still-relevant?) in the inventory; do not resolve content in this task.

### Tier 2 — endpoints (3-way audit required, scanner output is a POINTER not proof)
Candidates flagged with no direct FE caller: `RetryQueueController`, `UserNoteController`, `CandidateProfileController`, `LearnTreeController` (verify FE dynamic paths first — FE builds URLs from constants; Z's quick scan only caught 6 literal paths), `DashboardController` (3 route variants — find which one the FE actually uses), `InternalSessionController` + `QuestionInternalController` (**`/internal/v1/**` = service-to-service, exempt from FE-caller logic — verify the *calling service* references them instead**).

## S3. Required Verification Method (per item, before any deletion)

1. **Frontend**: `npx knip` (or `ts-prune`) + manual: grep the symbol across ALL of `frontend/src` **including string literals and dynamic `import()`**; then `npm run build` (tsc catches type-level breakage) + `npm test`.
2. **Java**: full-repo grep across `.java/.yaml/.properties/.md` for the class simple name (reflection/config strings); check `application*.yaml`, `config-repo/`, `@Value`/`@ConditionalOnProperty` wiring; `mvn -pl <module> dependency:analyze` for unused-dependency corroboration (report-only this task).
3. **Endpoints**: three-way table — controller mapping vs `api.ts` constants (trace the constant, not the literal) vs gateway `application.yaml` routes. `/internal/**` needs its *service* caller proven live.
4. Every inventory line must carry: `refs(main)=N refs(test)=N refs(config/string)=N → verdict`.

## S4. Hard Prohibitions

- No deletion of anything under `content/questions/**`, `docker/`, `.github/` (if present), LICENSE, `collab/**` governance records.
- No deletion of FE components classified Tier-3 (roadmap scaffolds) without explicit operator sign-off in this chat.
- No deletion of test files whose component is retained (dead component + its dead test die together, or neither does).
- No edits disguised as cleanups: formatting churn, import reordering beyond the deletion site, license-header additions.

## S5. Phased Protocol

| Phase | Deliverable | Gate |
|---|---|---|
| **P1 Inventory** | `collab/gemini/QB54-DEAD-CODE-INVENTORY.md`: full candidate list (seed + your extensions), per-item evidence + tier + proposed disposition | **Z audits the manifest. NO code changes before sign-off.** |
| **P2 Deletion slices** | Slices ≤ ~15 files each, branch per slice or sequential commits; four-number receipts per slice; report-before-merge | Z audit per slice |
| **P3 Docs/config triage** | docs banners/archive, scripts/archive/, README "Repository Layout" refresh to match reality | Z audit |
| **P4 TODO ledger** | Triage table merged into the inventory doc | Z audit |

## S6. Report Template (per slice)

```
Slice ID / base commit / files (N, +X/−Y)
Removed: <list> | Retained-with-reason: <list>
Four-number: before → after (delta ledger line-by-line)
Suites: QBS n/0F · ISS n/0F · FE n/0F · build exit 0
Behavior-diff proof: none (list anything that even smells behavioral)
```

## S7. Non-Goals

Dependency upgrades · package.json changes · refactors · renames · new features · question content · CI changes · README rewrites (except Repository Layout sync) · P4/P5 roadmap implementation (the scaffolds stay until that work begins).
