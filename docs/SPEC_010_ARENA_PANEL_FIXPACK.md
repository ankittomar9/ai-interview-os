> **STATUS: HISTORICAL SPECIFICATION** — Retained for architectural provenance. Current active development and audits are governed by collab/ protocol.

# SPEC-010 — Arena Panel Fixpack: Geometry Safety, Transcript Collapse, Inline Formatting

**Status:** APPROVED — AWAITING EXECUTION · REV 1
**Author:** Z.ai (architect/audit lane) · **Date:** 2026-10-03
**Lineage:** master `8865d24`. Follows SPEC-009 (merged + R1-R3 fix `bb03b19` verified ACCEPT).
**Trigger:** Operator live-session defect report (2 screenshots, playground, session/161) + Gemini root-cause analysis. All three root causes independently confirmed by Z on the tree at `8865d24` (file:line below). Gemini's proposal table adjudicated in §0.1 — several items corrected or deferred; execute against THIS document, not against the proposal table.

---

## §0.1 Gemini proposal cross-check ledger

| Gemini item | Adjudication |
|---|---|
| Trap root cause (bottom-52 + 85vh) | **Confirmed, and worse than stated:** traps on ANY viewport below 1387px — every laptop and 1080p monitor (208 + 0.85H > H ⟺ H < 1387). |
| Wide → `fixed top-14 bottom-5 right-5` docked column | **REJECTED** — collapses the 3-state model (docked wide ≈ fullscreen). Replaced by R-b: wide keeps its own geometry, anchors `bottom-5`, ignores the webcam offset. |
| `stackAbove={!isPlayground && !isFocusMode && cameraActive ? "webcam" : "none"}` | **Adopted, simplified:** `cameraActive` is in scope (ArenaShell L40 destructure) and already implies the tile renders; `isFocusMode` dropped (no evidence the PiP hides in focus mode; do not add unverified conditions). Final: `{!isPlayground && cameraActive ? "webcam" : "none"}`. |
| Double-click header cycles sizes | **DEFERRED** (§6) — unrequested affordance in a fixpack. |
| Collapse >5-line candidate prompts + Show more | **Adopted** (F-2), candidate messages only. |
| `(Stopped)` badge on aborted turns | **Adopted with constraints** (F-2): local metadata only, SPEC-009 abort silence preserved. |
| LaTeX `$…$` → chips with symbol substitution (≤ ≥ × √) | **Half adopted:** delimiter stripping + chip rendering yes; **character substitution DROPPED** (nondeterministic display mangling, untestable). |
| "Clean Math & Markdown Renderer" | **Minimal inline renderer adopted; full markdown DEFERRED** (§6) — no new deps, no XSS surface in a fixpack. Note: raw **backticks** also seep (visible in screenshot 2 around `2` and `n - 1`) — inline-code chips are in scope. |
| Backend prompt rule prohibiting LaTeX | **Adopted for BOTH blocks** (B-1 playground site + one-line interview append with explicit freeze amendment). Rationale beyond display: the voice coach reads raw content — `$N$` seeps into TTS speech; only the source-side rule repairs voice. |

---

## §1 Findings and root causes (verified on master `8865d24`)

### F-1 — Maximized panel traps its own header (MANDATORY)
1. `ArenaShell.tsx` L224 passes `stackAbove="webcam"` **unconditionally** — including playground, which has no webcam PiP.
2. `AiAssistantPanel.tsx` L134-136: `positionClass` = `fixed bottom-52 right-5` (208px) when webcam, `fixed bottom-20 right-5` (80px) otherwise; `""` for fullscreen.
3. `panelSizing.ts` L43: wide = `w-[90vw] sm:w-[720px] max-w-[90vw] max-h-[88vh] h-[85vh]`.
4. Trap: 208px + 85vh exceeds 100vh whenever viewport height < 1387px → header above the viewport → Maximize/Minimize and close unreachable → panel permanently traps (screenshot 1: orphaned send button at top edge, no header).
5. Secondary edge: normal + webcam = 208 + 70vh traps below 693px viewport height.
6. Fullscreen (`fixed inset-4 sm:inset-6 z-50`, positionClass `""`) is already safe — untouched.

### F-2 — Sent prompt hogs the transcript; stopped turn has no marker (MANDATORY)
- `AiAssistantPanel.tsx` L277: `<div className="whitespace-pre-wrap">{m.content}</div>` — raw render; a 25-line pasted snippet stays fully expanded (>400px).
- Studio-parity behavior expected: long candidate prompts collapse to a preview with a toggle; an aborted turn carries a visible `(Stopped)` marker.
- The message `metadata` bag already exists (`.type`, `.generator`, `.recommendedAction`, `.senderName` are read in the panel) — the badge rides it. No backend mutation (honors SPEC-009 §6 defer).

### F-3 — LaTeX and markdown artifacts seep into chat (MANDATORY)
- Coach Sam replies contain `$N$`, `$O(N)$`, `$n$` (screenshot 2) and inline backticks — all rendered literally. No markdown/math dependency exists in `package.json` (verified).
- Two-sided fix: display-side minimal inline renderer (F-3a) + source-side prompt rule (F-3b). Only the prompt rule repairs **voice** output (TTS reads raw content).

---

## §2 Requirements

### F-1 — Panel geometry viewport safety
- **R-a (ArenaShell.tsx L224):** replace the unconditional pass with
  `stackAbove={!isPlayground && cameraActive ? "webcam" : "none"}`.
- **R-b (AiAssistantPanel positionClass):** the `wide` state **ignores** `stackAbove` and anchors `fixed bottom-5 right-5`. Wide is a deliberate focus state; covering the small webcam PiP is an accepted tradeoff (documented here). The 208px offset must never combine with the 85vh height.
- **R-c (normal + webcam):** keep `fixed bottom-52 right-5` but clamp height: `max-h-[min(70vh,calc(100dvh-14rem))]` (224px = offset + clearance).
- **R-d (fullscreen):** unchanged (`fixed inset-4 sm:inset-6`, positionClass `""`).
- **R-e (INVARIANT — the gate):** for every state × stackAbove combination: bottomOffset + renderedMaxHeight ≤ viewportHeight − 8px, and panel top edge y ≥ 56px. No state may render its own header off-screen on any viewport ≥ 600px tall.

### F-2 — Transcript collapse + Stopped badge
- **R-f:** candidate messages (`m.role === "candidate"`) whose content has **more than 5 lines** (split `"\n"`, trailing empty lines trimmed) render **collapsed by default**: first 4 lines, bottom gradient fade, toggle `Show more (N lines)` / `Show less` (N = hidden line count). ≤5 lines render exactly as today (no toggle).
- **R-g:** `abortTurn()` in `useDialogue.ts` — when it passes the in-flight guard (controller non-null) it additionally marks the most recent candidate message with `metadata.stopped = true` (local React state; no transcript append, no toast, no backend write). Stopped messages show a small `Stopped` chip beside the sender row.
- **R-h:** SPEC-009 semantics preserved byte-for-byte: silent AbortError path, draft restore, R-3 null guard, no fake messages. The badge is additive metadata on the existing candidate message, nothing else changes in the abort flow.
- **R-i:** badge is transient (gone after reload) — accepted and documented; collapse toggle state is per-mount (defaults collapsed again) — accepted.

### F-3a — Inline formatting renderer (frontend)
- **R-j:** new pure helper `frontend/src/components/ai/inlineFormat.ts`. Export a parse function returning segments, e.g. `{ type: 'text' | 'code' | 'math' | 'fence', value: string }[]`; the panel maps segments to React nodes. **Pure and deterministic; `dangerouslySetInnerHTML` FORBIDDEN anywhere in the new code.**
- **R-k parsing rules (in order):**
  1. Split on ``` fenced blocks first → `fence` segments render as a pre-styled code block (monospace, `bg-elevated`, rounded, `overflow-x-auto`, newlines preserved).
  2. Inside remaining text: `$…$` pairs → `math` segment (rendered as a code-style inline chip, dollars stripped, content verbatim — **no character substitution**).
  3. Backtick spans → `code` segment (same inline chip style).
  4. Unmatched delimiters and empty `$…$`/`` `` `` bodies render **literally** — never swallow or mangle text.
- **R-l:** applied ONLY to assistant-side messages; candidate messages keep raw `whitespace-pre-wrap` (their pasted code must not be reinterpreted).

### F-3b — Source-side formatting rule (backend)
- **R-m (playground block, `AiOrchestratorService.java` — after the FOLLOW-UP RELEVANCE RULE, same text block, before the closing `"""`):** append verbatim:

```
FORMATTING RULE: Do NOT use LaTeX or dollar-sign math delimiters ($...$ or $$...$$). Write math
and complexity in plain text (O(N), O(n log n), n-1, 2^n). Use backticks ONLY around identifiers,
code, and file names — never around plain prose.
```

- **R-n (interview block — the Dr. Anya Chen system instruction text block):** append EXACTLY ONE line:

```
FORMATTING RULE: Plain text only — no LaTeX or $...$ math delimiters; write math as O(N), n-1, 2^n; backticks only around code and identifiers.
```

- **R-o:** this is an **explicit, scoped amendment of the SPEC-009 B-1 interview byte-freeze**: the ONLY permitted change to the interview block is this single appended line. The execution report must include a byte-level before/after diff of the interview block proving nothing else moved. Playground block change is likewise additive-only.

---

## §3 VP acceptance gates

- **VP-1 (F-1):** `panelSizing.test.ts` extended: asserts wide anchors via bottom-5 (and that no wide path returns bottom-52), normal+webcam class carries the `min(70vh, calc(100dvh-14rem))` clamp; a state × stackAbove table test encodes the R-e invariant for the shipped constants.
- **VP-2 (F-2):** collapse test: 6+ line candidate message renders collapsed by default with working Show more/Show less; 5-line message renders raw with no toggle.
- **VP-3 (F-2):** extends `DialogueAbortAndRecall.test.ts`: in-flight abort sets `stopped` metadata on the last candidate message; no-flight abort (R-3 guard) sets nothing; abort path still appends nothing to the transcript.
- **VP-4 (F-3a):** `inlineFormat.test.ts`: `$O(N)$` → math chip `O(N)`; `` `n - 1` `` → code chip; unmatched `$` and backtick render literally; ``` fences → code block segment; parse function is pure (no React import needed to test segments).
- **VP-5 (F-3b):** source assertions: playground block contains the FORMATTING RULE after the FOLLOW-UP RELEVANCE RULE; interview block contains the one-line rule; interview-block diff vs `8865d24` is exactly +1 line.
- **VP-6 (four numbers):** report deltas under G3 discipline against the baseline below. Expected ballpark: frontend +2..3 test files, +8..16 tests, 0 failures; backend +1..2 tests.
- **VP-7 (operator manual script, after merge):** at 1366×768 AND 1920×1080: (1) playground: expand → wide header fully visible, all controls reachable; cycle wide → fullscreen → normal; (2) interview with webcam on: normal panel still clears the PiP; wide reachable and closable; (3) paste a 25-line snippet, send, Stop → `Stopped` chip shows, Show more/less works; (4) coach reply shows no raw `$…$` or stray backticks; (5) voice readback of a coach reply contains no "dollar" artifacts.

**Baseline (master `8865d24`, Z-verified):** frontend 46 files / 249 tests / 989 asserts (Z-regex) / 0 failures (dynamically reproduced at the R1-R3 gate; docs-only commits since). Backend 13 files / 101 tests / 412 checks / 1 pre-existing `@Disabled` skip.

## §4 Fence

**Allowed files (nothing else):**
- `frontend/src/components/ai/panelSizing.ts` + `panelSizing.test.ts`
- `frontend/src/components/ai/AiAssistantPanel.tsx`
- `frontend/src/components/ai/inlineFormat.ts` (NEW) + `inlineFormat.test.ts` (NEW)
- `frontend/src/components/arena/ArenaShell.tsx`
- `frontend/src/components/arena/hooks/useDialogue.ts` + extend `DialogueAbortAndRecall.test.ts`
- `ai-orchestrator-service/src/main/java/com/interviewos/ai/service/AiOrchestratorService.java`
- `ai-orchestrator-service/src/test/java/com/interviewos/ai/service/AiOrchestratorServiceDialogueTest.java`
- `collab/gemini/SPEC-010-ARENA-PANEL-REPORT.md` (NEW, report only)

**Forbidden:** `AutoGrowingChatInput.tsx` (voice affordances — do not touch), `api.ts` (just stabilized at `bb03b19` — zero churn), `FloatingAiOrb.tsx`, `package.json` (**no new dependencies**), any component not listed, any backend file other than the two named.

## §5 Commit slices

1. `fix(spec-010): F-1 panel geometry viewport safety` — panelSizing.ts, panelSizing.test.ts, AiAssistantPanel.tsx (positionClass), ArenaShell.tsx (R-a)
2. `fix(spec-010): F-2 transcript collapse and stopped badge` — AiAssistantPanel.tsx (R-f), useDialogue.ts (R-g), DialogueAbortAndRecall.test.ts
3. `fix(spec-010): F-3 inline formatting renderer and prompt rules` — inlineFormat.ts + test, AiAssistantPanel.tsx (R-l), AiOrchestratorService.java + test (R-m/n)
4. `docs(spec-010): publish execution report for Z review`

Push the working branch (e.g. `fix/spec-010-arena-panel`) and stop. **Do not merge. Do not self-approve.** Z audits the branch → operator adjudicates → VP-7.

## §6 Defer list (explicitly OUT of this fixpack)

- Double-click header to cycle sizes (proposed by Gemini — good idea, wrong spec).
- Full markdown rendering (headers/lists/blockquotes), KaTeX/math symbol substitution (≤ ≥ × √).
- Collapsing assistant messages (only candidate prompts collapse in this pass).
- Persistence of collapse state / Stopped badge across reloads (needs a backend mutation API — still deferred from SPEC-009 §6).
- Normal-mode webcam-offset redesign beyond the R-c clamp.
