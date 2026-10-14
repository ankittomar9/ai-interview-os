# SPEC-015 EXECUTION REPORT: Voice/PTT Hardening

| Metadata | Value |
|---|---|
| **Specification** | SPEC-015 (Voice/PTT Hardening: `e.repeat` guard, `!isRequestingMic` parity, contract pins) |
| **Author / Execution Lane** | Gemini (Pair Programmer & Execution Lane) |
| **Architect & Auditor** | Z (Architect / Audit Lane) |
| **Protocol** | AUDIT-PROTOCOL v1.1 (`collab/AUDIT-PROTOCOL.md`) |
| **Base Commit** | `38c9e34` (`master` tip at authorization; master moved docs-only to `ae3845d` via QB-33) |
| **Working Branch** | `feat/spec-015-voice-ptt-hardening` |
| **Code Slice Commit** | `d74048e` |
| **Date** | 2026-10-14 |
| **Authorization** | Approved in `collab/z/SPEC-015-PREFLIGHT-QB33.md` (`ae3845d`) |

---

## 1. Executive Summary

This report delivers the verified, test-backed execution of **SPEC-015: Voice/PTT Hardening**, resolving findings F-1 and F-2 identified in Z's QB-31 review:

1. **AC-1 (`e.repeat` guard)**:
   - In both [`ArenaShell.tsx`](file:///D:/ai-interview-os/frontend/src/components/arena/ArenaShell.tsx#L84) and [`AutoGrowingChatInput.tsx`](file:///D:/ai-interview-os/frontend/src/components/ui/AutoGrowingChatInput.tsx#L87), added `if (e.repeat) return;` immediately following `if (e.defaultPrevented) return;` and prior to modifier matching. Holding down the `Ctrl+M` / `Cmd+M` hotkey no longer causes repeated start/stop toggle flapping.

2. **AC-2 (`!isRequestingMic` keyboard parity)**:
   - In both [`ArenaShell.tsx`](file:///D:/ai-interview-os/frontend/src/components/arena/ArenaShell.tsx#L90) and [`AutoGrowingChatInput.tsx`](file:///D:/ai-interview-os/frontend/src/components/ui/AutoGrowingChatInput.tsx#L93), updated the start branch to `} else if (!isRequestingMic) {`, bringing full parity with the click path.
   - Added `isRequestingMic` to the `useEffect` dependency array in both handlers to prevent stale closure risks.

3. **AC-3 (Contract Pins)**:
   - Added 2 new source-contract test cases in [`PushToTalk.test.ts`](file:///D:/ai-interview-os/frontend/src/components/arena/hooks/PushToTalk.test.ts#L293-L338), asserting the verbatim presence of `if (e.repeat) return;`, `else if (!isRequestingMic)`, and the complete dependency arrays across both production files.

---

## 2. Commit Topology

| Slice | Commit SHA | Message | Deliverables |
|---|---|---|---|
| **Pre-Flight** | `000fefd` | `docs(spec-015): publish NOTE and Pre-Flight request for Z QB-33 review` | Published NOTE & baseline |
| **Slice 1 (Code & Tests)** | `d74048e` | `feat(voice): SPEC-015 e.repeat guard and isRequestingMic keyboard parity for Ctrl+M` | Handlers hardened + 2 tests in `PushToTalk.test.ts` |
| **Slice 2 (Report)** | *(this commit)* | `docs(spec-015): publish execution report for Z QB-34 merge audit` | Full execution report with G3 verification |

---

## 3. Fence Census (§4 Hard Fence)

- **EDITABLE (3 files exactly):**
  - `frontend/src/components/arena/ArenaShell.tsx` (+2 / -1)
  - `frontend/src/components/ui/AutoGrowingChatInput.tsx` (+2 / -1)
  - `frontend/src/components/arena/hooks/PushToTalk.test.ts` (+48 / -0)
- **FORBIDDEN (Tolerance = 0):** Zero edits outside the 3 fenced files. All 14 forbidden paths remain 100% untouched.

---

## 4. G3 Four-Number Report & Pre-Pinned Verification

Reproduced in Node 24 sandbox against Z's pre-pinned targets in `collab/z/SPEC-015-PREFLIGHT-QB33.md`:

| Metric | Baseline (`38c9e34`) | QB-33 Pre-Pinned Target | Executed (`d74048e`) | Verdict |
|---|---|---|---|---|
| **Test Files** | 49 | **49** | **49** | ✔ Exact match |
| **Suites (`suites:`)** | 39 | **39** | **39** | ✔ Exact match |
| **Test Cases** | 304 | **306** (+2) | **306** (306 pass / 0 fail / 0 skip) | ✔ Exact match |
| **Static Assertions (`assert.`)** | 1,155 | **1,155 + N** ($N=6$) | **1,161** (+6 in diff) | ✔ Exact match |
| **Build (`tsc -b && vite build`)** | exit 0 | **exit 0** | **exit 0 (1.01s)** | ✔ Clean build |

### Assertion Delta Reconciliation ($N = 6$):
1. `PushToTalk.test.ts` AC-1 test: 2 `assert.ok` calls (ArenaShell repeat pin + ChatInput repeat pin).
2. `PushToTalk.test.ts` AC-2 test: 4 `assert.ok` calls (ArenaShell start guard pin + deps pin, ChatInput start guard pin + deps pin).
Total: $2 + 4 = 6$ assertions added. $1,155 + 6 = 1,161$.

---

## 5. Audit-Time Behavior Contracts Check

1. `if (e.repeat) return;` executes after `defaultPrevented` and before modifier matching: **PASS**.
2. Start branch requires `!isRequestingMic`; stop branch unchanged: **PASS**.
3. `isRequestingMic` present in both handlers' `useEffect` dep arrays: **PASS**.
4. Diff vs base touches only the 3 fenced files: **PASS**.
5. No click path, audio capture, transcription, or abort/recall regressions: **PASS**.

---

## 6. Status & Disposition

Per the F-0 rider, execution is complete and frozen on `feat/spec-015-voice-ptt-hardening`. **No merge will be performed without Z's QB-34 authorization.**

Standing by for Z's QB-34 Merge Audit.
