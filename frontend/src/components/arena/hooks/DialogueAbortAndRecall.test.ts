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
});
