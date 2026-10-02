import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  panelSizeClass,
  getNextPanelSize,
  PANEL_SIZE_STORAGE_KEY,
  type CoachPanelSize
} from './panelSizing';

describe('SPEC-009 VP-3: Coach Panel Sizing & Persistence', () => {
  it('returns correct classes for three states: normal, wide, fullscreen', () => {
    // 1. normal
    const normalClass = panelSizeClass('normal');
    assert.ok(normalClass.includes('w-[360px]') || normalClass.includes('sm:w-[380px]'), 'Normal size must constrain width to ~380px');
    assert.ok(normalClass.includes('max-h-[70vh]'), 'Normal size must constrain height to max-h-[70vh]');

    // 2. wide (min(720px, 90vw))
    const wideClass = panelSizeClass('wide');
    assert.ok(wideClass.includes('720px') || wideClass.includes('90vw'), 'Wide size must expand width to 720px / 90vw');
    assert.ok(wideClass.includes('max-h-[88vh]') || wideClass.includes('h-[85vh]'), 'Wide size must expand vertical space');

    // 3. fullscreen (fixed full overlay)
    const fullscreenClass = panelSizeClass('fullscreen');
    assert.ok(fullscreenClass.includes('fixed'), 'Fullscreen size must be fixed overlay');
    assert.ok(fullscreenClass.includes('inset-4') || fullscreenClass.includes('inset-6'), 'Fullscreen size must span screen with safe margins');
    assert.ok(fullscreenClass.includes('z-50'), 'Fullscreen size must have prominent z-index');

    // 4. Default fallback
    assert.strictEqual(panelSizeClass(undefined as any), normalClass, 'Undefined state must fall back to normal');
  });

  it('cycles through sizes correctly: normal -> wide -> fullscreen -> normal', () => {
    assert.strictEqual(getNextPanelSize('normal'), 'wide');
    assert.strictEqual(getNextPanelSize('wide'), 'fullscreen');
    assert.strictEqual(getNextPanelSize('fullscreen'), 'normal');
    assert.strictEqual(getNextPanelSize('unknown' as CoachPanelSize), 'normal');
  });

  it('asserts localStorage persistence key ai.coach.panelSize at source level', () => {
    assert.strictEqual(PANEL_SIZE_STORAGE_KEY, 'ai.coach.panelSize', 'Exported constant must equal ai.coach.panelSize');

    const sourcePath = path.resolve(process.cwd(), 'src/components/ai/panelSizing.ts');
    const sourceContent = fs.readFileSync(sourcePath, 'utf-8');
    assert.ok(
      sourceContent.includes("'ai.coach.panelSize'") || sourceContent.includes('"ai.coach.panelSize"'),
      'panelSizing.ts must define literal "ai.coach.panelSize" key'
    );
  });
});
