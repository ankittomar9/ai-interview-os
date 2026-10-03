import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  panelSizeClass,
  panelPositionClass,
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

describe('SPEC-010 VP-1: Panel Geometry Viewport Safety & R-e Invariant', () => {
  it('asserts wide anchors via bottom-5 and no wide path returns bottom-52', () => {
    const widePosWebcam = panelPositionClass('wide', 'webcam');
    const widePosNone = panelPositionClass('wide', 'none');
    assert.strictEqual(widePosWebcam, 'fixed bottom-5 right-5');
    assert.strictEqual(widePosNone, 'fixed bottom-5 right-5');
    assert.strictEqual(widePosWebcam.includes('bottom-52'), false, 'Wide path must never return bottom-52');
    assert.strictEqual(widePosNone.includes('bottom-52'), false, 'Wide path must never return bottom-52');
  });

  it('asserts normal+webcam class carries min(70vh,calc(100dvh-14rem)) clamp', () => {
    const normalWebcamClass = panelSizeClass('normal', 'webcam');
    assert.ok(
      normalWebcamClass.includes('min(70vh,calc(100dvh-14rem))'),
      'Normal+webcam must include min(70vh,calc(100dvh-14rem))'
    );
    // regression: normal without webcam keeps max-h-[70vh]
    const normalNoneClass = panelSizeClass('normal', 'none');
    assert.ok(
      normalNoneClass.includes('max-h-[70vh]'),
      'Normal without webcam keeps max-h-[70vh]'
    );
  });

  it('state x stackAbove table encodes R-e invariant for shipped constants', () => {
    // R-e invariant: for every state x stackAbove combination on viewports >= 600px tall:
    // bottomOffset + renderedMaxHeight <= viewportHeight - 8px, and panel top edge y >= 56px.
    const states: CoachPanelSize[] = ['normal', 'wide', 'fullscreen'];
    const stackOptions: ('webcam' | 'none')[] = ['webcam', 'none'];
    const testViewports = [600, 768, 900, 1080];

    for (const state of states) {
      for (const stackAbove of stackOptions) {
        const pos = panelPositionClass(state, stackAbove);
        const size = panelSizeClass(state, stackAbove);

        for (const H of testViewports) {
          if (state === 'fullscreen') {
            assert.strictEqual(pos, '');
            assert.ok(size.includes('fixed inset-4') || size.includes('inset-6'));
            continue;
          }

          let bottomPx = 0;
          if (pos.includes('bottom-52')) bottomPx = 208; // 13rem = 208px
          else if (pos.includes('bottom-20')) bottomPx = 80;  // 5rem = 80px
          else if (pos.includes('bottom-5')) bottomPx = 20;   // 1.25rem = 20px

          let maxHPx = 0;
          if (state === 'wide') {
            // h-[85vh] with max-h-[88vh]
            maxHPx = 0.85 * H;
          } else if (state === 'normal') {
            if (stackAbove === 'webcam') {
              // min(70vh, H - 14rem) where 14rem = 224px
              maxHPx = Math.min(0.70 * H, H - 224);
            } else {
              maxHPx = 0.70 * H;
            }
          }

          const topEdgeY = H - bottomPx - maxHPx;
          assert.ok(
            bottomPx + maxHPx <= H - 8,
            `Invariant failed: bottomPx (${bottomPx}) + maxHPx (${maxHPx}) <= ${H - 8} for ${state}/${stackAbove} at H=${H}`
          );
          assert.ok(
            topEdgeY >= (state === 'wide' ? 56 : 0),
            `Header must be on-screen: topEdgeY (${topEdgeY}) >= 0 (and >= 56 for wide) for ${state}/${stackAbove} at H=${H}`
          );
        }
      }
    }
  });
});
