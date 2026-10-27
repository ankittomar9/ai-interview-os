# Hotfix Report: QB51-HOTFIX — Offline Maven Runner Plugins & Coach Sam Workspace Grounding

| Metadata | Value |
|---|---|
| **Task ID** | `QB51-HOTFIX` |
| **Author Agent** | Gemini (Primary Execution Agent) |
| **Base Commit** | `37ac732` |
| **Branch** | `hotfix/qb51-offline-runner-coach-grounding` |
| **Verdict / Status** | `IMPLEMENTED — READY FOR REVIEW` |
| **Date** | 2026-10-27 |

---

## 1. Executive Summary

Following operator testing on `/session/189` (`agentic-mcp-order-service`), two operational defects were identified and resolved:

1. **Defect 1: Offline Maven Container Plugin Resolution (Image 4)**:
   - **Symptom**: Clicking "Run Project Tests" inside the sandboxed container resulted in `PluginResolutionException`:
     `[ERROR] Plugin org.apache.maven.plugins:maven-resources-plugin:3.4.0 or one of its dependencies could not be resolved: Cannot access central in offline mode and the artifact org.apache.maven.plugins:maven-resources-plugin:jar:3.4.0 has not been downloaded from it before.`
   - **Root Cause**: `LldMavenRunner.java` executes `mvn -o -B test` inside `ai-interview-os/lld-runner:latest` with network disabled (`networkMode: none`). The container image pre-warms Maven plugins (`maven-resources-plugin:3.3.1`, `maven-compiler-plugin:3.13.0`, `maven-surefire-plugin:3.5.2`). When `agentic-mcp-order-service.md`'s `pom.xml` omitted explicit versions for resources and compiler plugins, Maven 3.9 attempted to resolve the latest (`3.4.0`) from Central, which is unavailable in offline mode.
   - **Remediation**: Explicitly pinned `maven-resources-plugin:3.3.1` and `maven-compiler-plugin:3.13.0` inside `starterFiles: pom.xml`. Machine-verified in `ai-interview-os/lld-runner:latest` container: build compiles and tests pass offline in 128ms with exit code 0.

2. **Defect 2: Coach Sam Workspace Context Blindness (Images 1–3)**:
   - **Symptom**: When candidate asked Coach Sam *"give me the code i need to see that answer"*, Coach Sam generated a generic standalone class `public class OrderToolServer` with a `main` method, rather than implementing the workspace's `Solution` class in `package com.interviewos.workspace;`. Pasting this into `src/main/java/com/interviewos/workspace/Solution.java` caused compilation errors.
   - **Root Cause**: In `useArenaEngines.ts`, `getQuestionContext()` only forwarded `activeQuestion?.problemStatement` (raw markdown). In multi-file workspace questions (`EmbeddedWorkspace`), the code lives inside the VS Code iframe; Coach Sam's prompt was blind to the package declaration, target class name (`Solution`), and primary editable file template.
   - **Remediation**: In `useArenaEngines.ts`, updated `getQuestionContext` and `getStarterCode` to detect `activeQuestion.starterFiles` and append the primary editable workspace file template (`### Target Workspace File (src/main/java/com/interviewos/workspace/Solution.java): ...`) into the problem context. Coach Sam is now grounded in the exact package, class name, and method signatures expected by the question scaffold.

---

## 2. Test Execution & Machine Receipt

Output from `bash scripts/count-tests.sh --markdown` (WSL / single command invocation):

| Module | Test Files (on disk) | Test Cases | Assertions | Skipped | Status |
|---|---|---|---|---|---|
| `ai-orchestrator-service` | 19 | 129 | 482 | 1 | PASS |
| `interview-session-service` | 44 | 223 | 836 | 1 | PASS |
| `frontend` | 53 | 329 | 1287 | 0 | PASS |
| **Total / Reactor** | **116** | **681** | **2605** | **2** | **PASS** |

### Assertion Delta Provenance vs Base (`37ac732` @ `116 / 680 / 2603 / 2`)
- **Files**: `116` → `116` (+0)
- **Cases**: `680` → `681` (+1 in `DialogueAbortAndRecall.test.ts`)
- **Assertions**: `2603` → `2605` (+2 in `DialogueAbortAndRecall.test.ts` asserting Target Workspace File grounding)
- **Skipped**: `2` → `2` (+0)
- **Suite Results**:
  - `frontend`: `npm test` → 329 passed, 0 failed; `npm run build` → Exit 0.
  - `backend`: `mvn test -pl question-bank-service` → 41 passed, 0 failures, BUILD SUCCESS.
  - `container`: `docker run ... ai-interview-os/lld-runner:latest mvn -o -B test` → Exit 0 (128ms).

---

## 3. Files Modified
1. `question-bank-service/src/main/resources/content/questions/agentic/agentic-mcp-order-service.md`: Pinned `maven-resources-plugin:3.3.1` and `maven-compiler-plugin:3.13.0`.
2. `frontend/src/components/arena/hooks/useArenaEngines.ts`: Injected workspace file template and starter code fallback into Coach Sam's context.
3. `frontend/src/components/arena/hooks/DialogueAbortAndRecall.test.ts`: Added unit test asserting workspace template context grounding.
4. `collab/gemini/QB51-HOTFIX-OFFLINE-MAVEN.md`: This report file.
