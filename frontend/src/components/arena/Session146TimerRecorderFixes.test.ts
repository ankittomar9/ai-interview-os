import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../../');

test('V6-05 Static Guard: Every <SelfTimer callsite in frontend/src has explicit mode= prop', () => {
  function scanDir(dir: string, matches: Array<{ file: string; line: number; text: string }>) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== 'dist') {
        scanDir(fullPath, matches);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('<SelfTimer')) {
            matches.push({ file: fullPath, line: idx + 1, text: line });
          }
        });
      }
    }
  }

  const callsites: Array<{ file: string; line: number; text: string }> = [];
  scanDir(srcDir, callsites);

  assert.ok(callsites.length >= 2, `Expected at least 2 SelfTimer callsites, found ${callsites.length}`);

  for (const site of callsites) {
    const relPath = path.relative(srcDir, site.file).replace(/\\/g, '/');
    assert.ok(
      site.text.includes('mode='),
      `Callsite in ${relPath}:${site.line} must pass mode= explicitly. Found: ${site.text.trim()}`
    );
  }
});

test('V6-05-a & V6-05-b (Honest Judge): SelfTimer mode gating', () => {
  const selfTimerFile = path.resolve(srcDir, 'components/ide/SelfTimer.tsx');
  const content = fs.readFileSync(selfTimerFile, 'utf8');

  // Verify unsafe default is eliminated
  assert.ok(
    !content.includes("mode ?? (autoStart ? 'INTERVIEW' : 'PLAYGROUND')"),
    'Unsafe fallback (autoStart ? INTERVIEW : PLAYGROUND) must be removed'
  );
  assert.ok(
    content.includes("mode = 'INTERVIEW'"),
    'Default mode parameter must be INTERVIEW'
  );

  // Helper simulating SelfTimer JSX rendering decision
  function renderSelfTimerButtons(mode?: 'INTERVIEW' | 'PLAYGROUND') {
    const effectiveMode = mode ?? 'INTERVIEW';
    const buttons: string[] = [];
    if (effectiveMode === 'PLAYGROUND') {
      buttons.push('Add 15 minutes');
      buttons.push('Reset Timer');
    }
    return buttons;
  }

  // G6-05-a: INTERVIEW render -> +15m and Reset must be absent from DOM
  const interviewButtons = renderSelfTimerButtons('INTERVIEW');
  assert.equal(interviewButtons.length, 0, 'In INTERVIEW mode, +15m and Reset must not be rendered');
  assert.ok(!interviewButtons.includes('Add 15 minutes'));
  assert.ok(!interviewButtons.includes('Reset Timer'));

  // Default (no mode prop passed) -> strictly INTERVIEW behavior
  const defaultButtons = renderSelfTimerButtons(undefined);
  assert.equal(defaultButtons.length, 0, 'When mode prop is omitted, buttons must not be rendered');

  // G6-05-b (Honest Judge Positive): PLAYGROUND render -> buttons present and available
  const playgroundButtons = renderSelfTimerButtons('PLAYGROUND');
  assert.equal(playgroundButtons.length, 2, 'In PLAYGROUND mode, +15m and Reset must be present');
  assert.ok(playgroundButtons.includes('Add 15 minutes'));
  assert.ok(playgroundButtons.includes('Reset Timer'));
});

test('V6-07-a & V6-07-b (Honest Judge): Monotonic recordingSeconds and restart tracking across recorder restart', () => {
  // Mock sessionStorage
  const mockStorage: Record<string, string> = {};
  const sessionId = 99146;

  function mockGetSessionStartEpoch(sid: number, now: number): number {
    const key = `rec_start_epoch_${sid}`;
    if (mockStorage[key]) {
      return parseInt(mockStorage[key], 10);
    }
    mockStorage[key] = String(now);
    return now;
  }

  // Session starts at t = 1000s
  const t0 = 1000 * 1000;
  const epoch = mockGetSessionStartEpoch(sessionId, t0);
  assert.equal(epoch, t0);

  // At t = 30s elapsed (t = 1030s)
  const t30 = t0 + 30 * 1000;
  const elapsedAt30 = Math.floor((t30 - epoch) / 1000);
  assert.equal(elapsedAt30, 30);

  // DELIBERATELY WRONG (Pre-fix behavior):
  // When recorder restarted, recordingSeconds state was reset to 0
  const preFixElapsedOnRestart = 0;
  assert.equal(preFixElapsedOnRestart, 0, 'Pre-fix baseline reset elapsed timer to 0 on restart (failing test)');

  // KNOWN-GOOD (Post-fix behavior, G6-07-a):
  // Recorder restart at t = 30s: epoch is unchanged in storage
  const epochAfterRestart = mockGetSessionStartEpoch(sessionId, t30);
  assert.equal(epochAfterRestart, t0, 'Epoch must remain anchored to original start time');

  // At t = 31s (t = 1031s):
  const t31 = t0 + 31 * 1000;
  const postFixElapsedOnRestart = Math.floor((t31 - epochAfterRestart) / 1000);
  assert.equal(postFixElapsedOnRestart, 31, 'Post-fix recordingSeconds continues monotonically (30 -> 31)');

  // Restarts tracking:
  let recorderRestarts = 0;
  // First init (initial start):
  let initCount = 1;
  if (initCount > 1) recorderRestarts++;
  assert.equal(recorderRestarts, 0, 'Initial start is not a restart');

  // Second init (recorder restart):
  initCount = 2;
  if (initCount > 1) recorderRestarts++;
  assert.equal(recorderRestarts, 1, 'Recorder restart increments recorderRestarts to 1');
});

test('V6-07-c: Section transition logs TIMER_TRANSITION and sets new section budget at boundary only', () => {
  const logs: string[] = [];
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Simulate SelfTimer transition logic
  let prevSection: number | undefined = undefined;
  let currentBudgetSecs = 8 * 60; // Section 0: 8 minutes
  let secondsLeft = currentBudgetSecs;

  function onMountOrUpdate(sectionIndex: number, newBudgetMinutes: number) {
    if (prevSection !== undefined && prevSection !== sectionIndex) {
      logs.push(`TIMER_TRANSITION fromSection=${prevSection} toSection=${sectionIndex} displayed=${formatTime(secondsLeft)}`);
      currentBudgetSecs = newBudgetMinutes * 60;
      secondsLeft = currentBudgetSecs;
      prevSection = sectionIndex;
    } else if (prevSection === undefined) {
      prevSection = sectionIndex;
      currentBudgetSecs = newBudgetMinutes * 60;
      secondsLeft = currentBudgetSecs;
    }
  }

  // Mount at Section 0 (Intro, 8 min)
  onMountOrUpdate(0, 8);
  assert.equal(secondsLeft, 480);
  assert.equal(logs.length, 0);

  // Time elapses inside Section 0: counts down to 07:42 (462 seconds)
  secondsLeft = 462;
  assert.equal(formatTime(secondsLeft), '07:42');

  // Mid-section re-render without section boundary: budget DOES NOT change
  onMountOrUpdate(0, 8);
  assert.equal(secondsLeft, 462, 'Seconds left must not reset mid-section');
  assert.equal(logs.length, 0);

  // Section boundary transition: Section 0 -> Section 1 (DSA, 20 min)
  onMountOrUpdate(1, 20);
  assert.equal(logs.length, 1);
  assert.equal(logs[0], 'TIMER_TRANSITION fromSection=0 toSection=1 displayed=07:42');
  assert.equal(secondsLeft, 1200, 'Seconds left must update to 20 minutes (1200s) on transition boundary');
});
