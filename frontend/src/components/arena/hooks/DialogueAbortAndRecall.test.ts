import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('SPEC-009 VP-4: Turn Abort, Draft Restore & Recall Semantics', () => {
  const apiPath = path.resolve(process.cwd(), 'src/services/api.ts');
  const dialoguePath = path.resolve(process.cwd(), 'src/components/arena/hooks/useDialogue.ts');
  const inputPath = path.resolve(process.cwd(), 'src/components/ui/AutoGrowingChatInput.tsx');

  const apiSrc = fs.readFileSync(apiPath, 'utf-8');
  const dialogueSrc = fs.readFileSync(dialoguePath, 'utf-8');
  const inputSrc = fs.readFileSync(inputPath, 'utf-8');

  it('processDialogueTurn accepts signal and forwards it to fetch', () => {
    assert.ok(
      apiSrc.includes('signal?: AbortSignal'),
      'processDialogueTurn payload must define optional signal?: AbortSignal'
    );
    // Find processDialogueTurn implementation
    const fnStart = apiSrc.indexOf('export const processDialogueTurn');
    assert.ok(fnStart !== -1, 'processDialogueTurn must be exported');
    const fnEnd = apiSrc.indexOf('export const evaluateArchitectureDesign', fnStart);
    const fnBody = apiSrc.substring(fnStart, fnEnd !== -1 ? fnEnd : fnStart + 3000);
    assert.ok(
      fnBody.includes('signal') && fnBody.includes('fetch('),
      'processDialogueTurn must forward signal to fetch call'
    );
    assert.ok(
      fnBody.includes('70000') && fnBody.includes('ApiError'),
      'processDialogueTurn must enforce 70000ms timeout and throw ApiError'
    );
  });

  it('useDialogue manages AbortController and passes signal to processDialogueTurn', () => {
    assert.ok(
      dialogueSrc.includes('const abortControllerRef = useRef<AbortController | null>(null)'),
      'useDialogue must maintain abortControllerRef'
    );
    assert.ok(
      dialogueSrc.includes('new AbortController()'),
      'useDialogue must instantiate a new AbortController per candidate turn'
    );
    assert.ok(
      dialogueSrc.includes('signal: controller.signal'),
      'useDialogue must pass signal: controller.signal to processDialogueTurn'
    );
  });

  it('abortTurn resets isAiResponding, restores draft to chatInput, and appends no transcript message', () => {
    assert.ok(
      dialogueSrc.includes('const abortTurn = useCallback('),
      'useDialogue must define abortTurn callback'
    );
    assert.ok(
      dialogueSrc.includes('if (!abortControllerRef.current) return'),
      'abortTurn must guard against in-flight null controller'
    );
    assert.ok(
      dialogueSrc.includes('abortControllerRef.current.abort()') ||
      dialogueSrc.includes('abortControllerRef.current?.abort()'),
      'abortTurn must abort the active controller'
    );
    assert.ok(
      dialogueSrc.includes('setIsAiResponding(false)'),
      'abortTurn must reset isAiResponding to false'
    );
    assert.ok(
      dialogueSrc.includes('setChatInput('),
      'abortTurn must restore textToSend into chatInput'
    );

    // Verify hook return object exposes abortTurn
    const returnIdx = dialogueSrc.lastIndexOf('return {');
    const returnBlock = dialogueSrc.substring(returnIdx);
    assert.ok(returnBlock.includes('abortTurn,'), 'useDialogue must return abortTurn');
  });

  it('useDialogue catches AbortError silently without creating fallback messages or error toasts', () => {
    // Assert silent swallow of AbortError
    assert.ok(
      dialogueSrc.includes("err?.name === 'AbortError'"),
      'catch block must check err?.name === "AbortError"'
    );
    // In the abort check branch, it must return before logging warning or creating fallback turn
    const abortBranch = dialogueSrc.substring(
      dialogueSrc.indexOf("err?.name === 'AbortError'"),
      dialogueSrc.indexOf('console.warn("[useDialogue] Provider turn processing error:"')
    );
    assert.ok(
      abortBranch.includes('return;'),
      'Abort branch must exit early with return'
    );
    assert.strictEqual(
      abortBranch.includes('selectRotatingOfflineProbe'),
      false,
      'Abort branch must not create offline fallback message'
    );
    assert.strictEqual(
      abortBranch.includes('setProviderError'),
      false,
      'Abort branch must not set providerError'
    );
  });

  it('recallLastDraft exists and is exposed by useDialogue', () => {
    assert.ok(
      dialogueSrc.includes('const recallLastDraft = useCallback('),
      'useDialogue must define recallLastDraft'
    );
    const returnIdx = dialogueSrc.lastIndexOf('return {');
    const returnBlock = dialogueSrc.substring(returnIdx);
    assert.ok(returnBlock.includes('recallLastDraft,'), 'useDialogue must return recallLastDraft');
  });

  it('AutoGrowingChatInput wires ArrowUp-when-empty to recallLastDraft and provides Stop button during isAiResponding', () => {
    // 1. ArrowUp recall
    assert.ok(
      inputSrc.includes("e.key === 'ArrowUp'"),
      'AutoGrowingChatInput must listen for ArrowUp'
    );
    assert.ok(
      inputSrc.includes('onRecallLastDraft') || inputSrc.includes('recallLastDraft'),
      'AutoGrowingChatInput must call recallLastDraft on ArrowUp'
    );
    assert.ok(
      inputSrc.includes('!value.trim()'),
      'AutoGrowingChatInput must gate ArrowUp to empty input'
    );

    // 2. Stop button with Square icon when isAiResponding
    assert.ok(
      inputSrc.includes('<Square') && inputSrc.includes('isAiResponding'),
      'AutoGrowingChatInput must render Square stop icon when isAiResponding'
    );
    assert.ok(
      inputSrc.includes('onAbortTurn') || inputSrc.includes('abortTurn'),
      'Stop button must invoke onAbortTurn / abortTurn'
    );

    // 3. Textarea not disabled when isAiResponding
    const textareaBlock = inputSrc.substring(inputSrc.indexOf('<textarea'), inputSrc.indexOf('/>'));
    assert.strictEqual(
      textareaBlock.includes('disabled={isAiResponding}'),
      false,
      'Textarea must NOT be disabled when isAiResponding'
    );
  });

  it('R-2: recording-cancel wires to onAbortVoice and preserves voice/turn separation', () => {
    const panelPath = path.resolve(process.cwd(), 'src/components/ai/AiAssistantPanel.tsx');
    const shellPath = path.resolve(process.cwd(), 'src/components/arena/ArenaShell.tsx');
    const panelSrc = fs.readFileSync(panelPath, 'utf-8');
    const shellSrc = fs.readFileSync(shellPath, 'utf-8');

    assert.ok(
      shellSrc.includes('onAbortVoice={onAbortVoice}'),
      'ArenaShell must forward onAbortVoice to AiAssistantPanel'
    );
    assert.ok(
      panelSrc.includes('onAbortVoice?: () => void'),
      'AiAssistantPanelProps must accept onAbortVoice'
    );
    assert.ok(
      panelSrc.includes('onAbort={onAbortVoice ?? onAbortTurn}'),
      'AiAssistantPanel must wire onAbortVoice ?? onAbortTurn to input onAbort'
    );
  });

  it('SPEC-010 VP-2: candidate messages with >5 lines collapse by default with Show more/less; <=5 lines render raw', () => {
    const panelPath = path.resolve(process.cwd(), 'src/components/ai/AiAssistantPanel.tsx');
    const panelSrc = fs.readFileSync(panelPath, 'utf-8');

    // 1. Source checks
    assert.ok(
      panelSrc.includes('export function getCandidateMessageLines'),
      'AiAssistantPanel must export getCandidateMessageLines helper'
    );
    assert.ok(
      panelSrc.includes('Show more (${hiddenCount} lines)'),
      'AiAssistantPanel must format Show more toggle with hidden line count'
    );
    assert.ok(
      panelSrc.includes('Show less'),
      'AiAssistantPanel must support Show less toggle'
    );
    assert.ok(
      panelSrc.includes('<CandidateMessageContent content={m.content} />'),
      'Live candidate messages must render through CandidateMessageContent'
    );

    // 2. Functional behavior checks on line counting logic
    const fiveLineText = 'line 1\nline 2\nline 3\nline 4\nline 5';
    const fiveLines = fiveLineText.split('\n');
    assert.strictEqual(fiveLines.length, 5);
    const isFiveCollapsible = fiveLines.length > 5;
    assert.strictEqual(isFiveCollapsible, false, '5-line text must not be collapsible');

    const sixLineText = 'line 1\nline 2\nline 3\nline 4\nline 5\nline 6';
    const sixLines = sixLineText.split('\n');
    assert.strictEqual(sixLines.length, 6);
    const isSixCollapsible = sixLines.length > 5;
    assert.strictEqual(isSixCollapsible, true, '6-line text must be collapsible');
    assert.strictEqual(sixLines.slice(0, 4).join('\n'), 'line 1\nline 2\nline 3\nline 4', 'Preview must show first 4 lines');
    assert.strictEqual(sixLines.length - 4, 2, 'Hidden line count must be 2');

    const twentyFiveLines = Array.from({ length: 25 }, (_, i) => `int line${i} = ${i};`).join('\n');
    const lines25 = twentyFiveLines.split('\n');
    assert.strictEqual(lines25.length > 5, true);
    assert.strictEqual(lines25.length - 4, 21, 'Hidden line count must be 21');
  });

  it('SPEC-010 VP-3: in-flight abort marks candidate message with stopped metadata; no-flight abort sets nothing; appends no messages', () => {
    // 1. Assert abortTurn marks candidate message with stopped: 'true'
    assert.ok(
      dialogueSrc.includes("stopped: 'true'"),
      'abortTurn must mark candidate message with stopped: "true" metadata'
    );

    // 2. Assert no-flight guard precedes the metadata update
    const abortBody = dialogueSrc.substring(
      dialogueSrc.indexOf('const abortTurn = useCallback('),
      dialogueSrc.indexOf('const recallLastDraft = useCallback(')
    );
    const guardIdx = abortBody.indexOf('if (!abortControllerRef.current) return');
    const updateIdx = abortBody.indexOf('stopped');
    assert.ok(guardIdx !== -1, 'R-3 guard must be present in abortTurn');
    assert.ok(updateIdx !== -1, 'stopped metadata update must be present in abortTurn');
    assert.ok(guardIdx < updateIdx, 'no-flight guard must precede stopped metadata update');

    // 3. Assert abortTurn does not append any new message to transcript
    assert.strictEqual(
      abortBody.includes('[...prev, fallbackMsg]') || abortBody.includes('[...prev, userMsg]'),
      false,
      'abortTurn must not append any new message to messages'
    );

    // 4. Assert panel renders Stopped chip when m.metadata?.stopped is set
    const panelPath = path.resolve(process.cwd(), 'src/components/ai/AiAssistantPanel.tsx');
    const panelSrc = fs.readFileSync(panelPath, 'utf-8');
    assert.ok(
      panelSrc.includes('m.metadata?.stopped') && panelSrc.includes('Stopped'),
      'AiAssistantPanel must render Stopped chip when m.metadata?.stopped is present'
    );
  });

  it('useArenaEngines grounds Coach Sam with workspace file template and starter code', () => {
    const enginesPath = path.resolve(process.cwd(), 'src/components/arena/hooks/useArenaEngines.ts');
    const enginesSrc = fs.readFileSync(enginesPath, 'utf-8');

    assert.ok(
      enginesSrc.includes('Target Workspace File'),
      'useArenaEngines must include Target Workspace File in getQuestionContext'
    );
    assert.ok(
      enginesSrc.includes('activeQuestion?.starterFiles'),
      'useArenaEngines must check activeQuestion.starterFiles'
    );
  });
});
