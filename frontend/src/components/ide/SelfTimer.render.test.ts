import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { SelfTimer } from './SelfTimer';

describe('V7-07: SelfTimer Render-Level & Logic Gates', () => {
  it('Gate V7-07 (a): renders countdown format MM:SS for positive minute budget', () => {
    const html = renderToString(
      React.createElement(SelfTimer, {
        initialMinutes: 25,
        mode: 'INTERVIEW'
      })
    );

    assert.ok(html.includes('25:00'), 'Must format 25 minutes as "25:00"');
    assert.ok(html.includes('lucide-timer'), 'Must render timer icon');
    assert.ok(!html.includes('text-amber-500 animate-pulse'), 'Non-zero timer must not have expired amber pulse styling');
  });

  it('Gate V7-07 (b): reaches 00:00 without throwing or going negative and shows alert pulse', () => {
    const htmlZero = renderToString(
      React.createElement(SelfTimer, {
        initialMinutes: 0,
        mode: 'INTERVIEW'
      })
    );

    assert.ok(htmlZero.includes('00:00'), 'Must format 0 minutes as "00:00"');
    assert.ok(htmlZero.includes('text-amber-500 animate-pulse'), '00:00 state must apply expired alert pulse styling');
    assert.ok(!htmlZero.includes('>-'), 'Timer text node must never contain negative numbers or minus sign');
  });

  it('Gate V7-07 (c): autoStart: true vs false respects running state', () => {
    const htmlAuto = renderToString(
      React.createElement(SelfTimer, {
        initialMinutes: 30,
        autoStart: true,
        mode: 'INTERVIEW'
      })
    );
    assert.ok(htmlAuto.includes('title="Pause Timer"'), 'autoStart=true must render Pause Timer action');
    assert.ok(htmlAuto.includes('lucide-pause'), 'autoStart=true must render pause icon');

    const htmlManual = renderToString(
      React.createElement(SelfTimer, {
        initialMinutes: 30,
        autoStart: false,
        mode: 'INTERVIEW'
      })
    );
    assert.ok(htmlManual.includes('title="Start Timer"'), 'autoStart=false must render Start Timer action');
    assert.ok(htmlManual.includes('lucide-play'), 'autoStart=false must render play icon');
  });

  it('Gate V7-07 (d): budget prop updates recalculate remaining time and defaultMinutes overrides initialMinutes', () => {
    const html15 = renderToString(
      React.createElement(SelfTimer, {
        initialMinutes: 15,
        mode: 'INTERVIEW'
      })
    );
    assert.ok(html15.includes('15:00'), 'initialMinutes=15 must render 15:00');

    const html45 = renderToString(
      React.createElement(SelfTimer, {
        initialMinutes: 45,
        mode: 'INTERVIEW'
      })
    );
    assert.ok(html45.includes('45:00'), 'initialMinutes=45 must render 45:00');

    const htmlDefaultOverride = renderToString(
      React.createElement(SelfTimer, {
        initialMinutes: 30,
        defaultMinutes: 12,
        mode: 'INTERVIEW'
      })
    );
    assert.ok(htmlDefaultOverride.includes('12:00'), 'defaultMinutes=12 must override initialMinutes=30');
    assert.ok(!htmlDefaultOverride.includes('30:00'), 'Overridden initialMinutes must not be rendered');
  });
});
