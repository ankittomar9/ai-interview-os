import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('SPEC-009 VP-5: Reel & Rail Auto-Hide for Single-Question Practice', () => {
  const shellPath = path.resolve(process.cwd(), 'src/components/arena/ArenaShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf-8');

  it('contains isPlayground && sections.length <= 1 at the StageStepper render site', () => {
    // Assert that StageStepper render check includes the playground single-section guard
    assert.ok(
      content.includes('isPlayground && sections.length <= 1'),
      'StageStepper must be guarded by "isPlayground && sections.length <= 1"'
    );

    // Locate the line with StageStepper
    const lines = content.split('\n');
    const stepperLine = lines.find((l) => l.includes('<StageStepper'));
    assert.ok(stepperLine, 'StageStepper element must exist in ArenaShell');
    assert.ok(
      stepperLine.includes('isPlayground && sections.length <= 1'),
      'StageStepper line must evaluate "isPlayground && sections.length <= 1"'
    );
  });

  it('contains isPlayground && railItems.length <= 1 at the QuestionRail render site', () => {
    // Assert QuestionRail hide check includes playground single-question guard
    assert.ok(
      content.includes('isPlayground && railItems.length <= 1'),
      'QuestionRail must be guarded by "isPlayground && railItems.length <= 1"'
    );

    const lines = content.split('\n');
    const railLine = lines.find((l) => l.includes('<QuestionRail'));
    assert.ok(railLine, 'QuestionRail element must exist in ArenaShell');
    assert.ok(
      railLine.includes('isPlayground && railItems.length <= 1'),
      'QuestionRail line must evaluate "isPlayground && railItems.length <= 1"'
    );
  });

  it('keeps SelfTimer render site intact and independent from StageStepper', () => {
    assert.ok(content.includes('<SelfTimer'), 'SelfTimer must remain rendered in ArenaShell topbar');
    const lines = content.split('\n');
    const timerLine = lines.find((l) => l.includes('<SelfTimer'));
    assert.ok(timerLine, 'SelfTimer line must exist');
    assert.strictEqual(
      timerLine.includes('StageStepper'),
      false,
      'SelfTimer must not be coupled to StageStepper'
    );
  });

  it('pure logic evaluation: hides in playground when count <= 1, keeps in interview mode', () => {
    const shouldHideStepper = (isPlayground: boolean, sectionCount: number) =>
      isPlayground && sectionCount <= 1;

    const shouldHideRail = (isFocusMode: boolean, isIntroRound: boolean, isPlayground: boolean, railCount: number) =>
      isFocusMode || isIntroRound || (isPlayground && railCount <= 1);

    // 1. Single-question playground: BOTH hide
    assert.strictEqual(shouldHideStepper(true, 1), true, 'Stepper must hide for 1-section playground');
    assert.strictEqual(shouldHideRail(false, false, true, 1), true, 'Rail must hide for 1-question playground');

    // 2. Multi-section / multi-question playground (if ever created): both show
    assert.strictEqual(shouldHideStepper(true, 3), false, 'Stepper must show for multi-section playground');
    assert.strictEqual(shouldHideRail(false, false, true, 3), false, 'Rail must show for multi-question playground');

    // 3. Interview mode (4 sections, e.g. 1 question in current round):
    // Stepper must NEVER hide in interview mode
    assert.strictEqual(shouldHideStepper(false, 4), false, 'Stepper must show for interview mode');
    assert.strictEqual(shouldHideStepper(false, 1), false, 'Stepper must show for interview mode even if 1 section');
    // Rail must show in interview coding rounds
    assert.strictEqual(shouldHideRail(false, false, false, 1), false, 'Rail must show in interview coding round');
  });
});
