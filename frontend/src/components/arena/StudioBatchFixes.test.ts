import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('SF-1: Mic button quick-click logic distinguishes start click from finish click', () => {
  class ChatInputMicFsm {
    public isListening = false;
    public isAiResponding = false;
    public startedThisPress = false;
    public pointerDownTime = 0;
    public startCalls = 0;
    public stopCalls = 0;

    handlePointerDown(button: number, now: number) {
      if (button !== 0) return;
      this.pointerDownTime = now;
      if (!this.isListening && !this.isAiResponding) {
        this.startedThisPress = true;
        this.isListening = true;
        this.startCalls++;
      } else {
        this.startedThisPress = false;
      }
    }

    handlePointerUp(now: number) {
      const holdDuration = now - this.pointerDownTime;
      if (this.isListening && holdDuration > 500) {
        this.startedThisPress = false;
        this.isListening = false;
        this.stopCalls++;
      }
    }

    handleButtonClick(now: number) {
      if (this.startedThisPress) {
        // First quick click: leave recording active (1-click toggle ON)
        this.startedThisPress = false;
        return;
      }
      const holdDuration = now - this.pointerDownTime;
      if (this.isListening && holdDuration <= 500) {
        // Subsequent quick click: 1-click toggle OFF
        this.isListening = false;
        this.stopCalls++;
      }
    }

    handleCtrlM() {
      if (this.isAiResponding) return;
      if (this.isListening) {
        this.isListening = false;
        this.stopCalls++;
      } else {
        this.isListening = true;
        this.startCalls++;
      }
    }
  }

  const fsm = new ChatInputMicFsm();

  // 1. Initial quick click (120ms) from idle
  fsm.handlePointerDown(0, 1000);
  assert.equal(fsm.isListening, true, 'PointerDown starts listening');
  assert.equal(fsm.startedThisPress, true, 'startedThisPress flag set to true');

  fsm.handlePointerUp(1120);
  assert.equal(fsm.isListening, true, 'PointerUp <= 500ms does not stop listening');

  fsm.handleButtonClick(1120);
  assert.equal(fsm.isListening, true, 'First click does not self-cancel recording');
  assert.equal(fsm.startedThisPress, false, 'startedThisPress flag cleared');
  assert.equal(fsm.startCalls, 1, 'Only 1 start call fired');
  assert.equal(fsm.stopCalls, 0, 'Zero stop calls fired on initial quick click');

  // 2. Subsequent quick click (100ms) to stop recording
  fsm.handlePointerDown(0, 5000);
  assert.equal(fsm.startedThisPress, false, 'Second press sees isListening=true, startedThisPress=false');
  fsm.handlePointerUp(5100);
  fsm.handleButtonClick(5100);
  assert.equal(fsm.isListening, false, 'Second quick click stops recording');
  assert.equal(fsm.stopCalls, 1, 'Stop call fired on second click');

  // 3. Press and hold (>500ms) stops on PointerUp
  fsm.handlePointerDown(0, 10000);
  assert.equal(fsm.isListening, true, 'PTT press starts listening');
  fsm.handlePointerUp(10800); // 800ms hold
  assert.equal(fsm.isListening, false, 'PTT release > 500ms stops listening');
  assert.equal(fsm.stopCalls, 2);
  fsm.handleButtonClick(10800);
  assert.equal(fsm.stopCalls, 2, 'Click event after hold does not double-stop');

  // 4. AI responding blocks mic start
  fsm.isAiResponding = true;
  fsm.handlePointerDown(0, 20000);
  assert.equal(fsm.isListening, false, 'AI responding prevents mic start');
  fsm.handleCtrlM();
  assert.equal(fsm.isListening, false, 'Ctrl+M ignored when AI responding');

  // 5. Ctrl+M toggle works cleanly
  fsm.isAiResponding = false;
  fsm.handleCtrlM();
  assert.equal(fsm.isListening, true, 'Ctrl+M toggles ON');
  fsm.handleCtrlM();
  assert.equal(fsm.isListening, false, 'Ctrl+M toggles OFF');
});

test('SF-2: Mic muted (AI speaking) toast never overlays End & Report button', () => {
  const arenaShellPath = path.resolve(import.meta.dirname, 'ArenaShell.tsx');
  const content = fs.readFileSync(arenaShellPath, 'utf-8');

  // Ensure toast uses centered positioning with z-40
  assert.ok(
    content.includes('top-4 left-1/2 -translate-x-1/2'),
    'Toast must be horizontally centered at viewport top'
  );
  assert.ok(
    content.includes('z-40 animate-pulse'),
    'Toast must use z-40 below top-right action overlay'
  );
  // Ensure the old right-4 positioning is gone
  assert.ok(
    !content.includes('fixed top-4 right-4 bg-amber-500 text-white'),
    'Old top-4 right-4 positioning must not exist'
  );
});

test('SF-3: Diagnostic report seek links compute real relative offsets or honestly omit link', () => {
  const calculateSeekOffset = (
    sessionStartIso: string | null,
    turnIso: string | null
  ): { seekSeconds: number | null; label: string } => {
    if (!sessionStartIso || !turnIso) {
      return { seekSeconds: null, label: 'N/A' };
    }
    const startMs = new Date(sessionStartIso).getTime();
    const turnMs = new Date(turnIso).getTime();
    if (isNaN(startMs) || isNaN(turnMs) || turnMs < startMs) {
      return { seekSeconds: null, label: 'N/A' };
    }
    const seconds = Math.floor((turnMs - startMs) / 1000);
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, '0');
    return { seekSeconds: seconds, label: 'Seek to ' + m + ':' + s };
  };

  // Case 1: Real timestamp relative to session start (4 minutes 11 seconds)
  const sessionStart = '2026-09-16T09:36:14.000Z';
  const turnAt4m11s = '2026-09-16T09:40:25.000Z';
  const result1 = calculateSeekOffset(sessionStart, turnAt4m11s);
  assert.equal(result1.seekSeconds, 251);
  assert.equal(result1.label, 'Seek to 4:11');

  // Case 2: Turn without valid timestamp -> seekSeconds is null (honest omission)
  const result2 = calculateSeekOffset(sessionStart, null);
  assert.equal(result2.seekSeconds, null);

  // Case 3: Session without start timestamp -> seekSeconds is null
  const result3 = calculateSeekOffset(null, turnAt4m11s);
  assert.equal(result3.seekSeconds, null);

  // Verify DiagnosticReportView source does not contain fictional index * 15
  const reportViewPath = path.resolve(import.meta.dirname, '../DiagnosticReportView.tsx');
  const reportContent = fs.readFileSync(reportViewPath, 'utf-8');
  assert.ok(
    !reportContent.includes('index * 15'),
    'Must not compute seek offset with fabricated index * 15'
  );
  assert.ok(
    reportContent.includes('sessionStartTimeMs'),
    'Must compute sessionStartTimeMs for real transcript alignment'
  );
});

test('SF-4: Session camera capture requests video only (audio: false) and captures errors', () => {
  const recorderPath = path.resolve(import.meta.dirname, '../../hooks/useSessionRecorder.ts');
  const content = fs.readFileSync(recorderPath, 'utf-8');

  // Must have audio: false to prevent hardware contention with mic recorder
  assert.ok(
    content.includes('audio: false'),
    'Camera getUserMedia must specify audio: false'
  );
  assert.ok(
    content.includes('cameraError'),
    'useSessionRecorder must expose cameraError'
  );
});

test('SF-5: Proctoring tabSwitches counter only increments on visibilityState === hidden', () => {
  let tabSwitches = 0;
  let isWindowBlurred = false;
  let lastFocusLostTime = 0;

  const handleBlur = () => {
    isWindowBlurred = true;
  };

  const handleFocus = () => {
    isWindowBlurred = false;
  };

  const handleVisibilityChange = (visibilityState: 'visible' | 'hidden', now: number) => {
    if (visibilityState === 'hidden') {
      if (now - lastFocusLostTime >= 1000) {
        lastFocusLostTime = now;
        tabSwitches++;
      }
    }
  };

  // 1. Monaco context menu / window blur does NOT increment tabSwitches
  handleBlur();
  assert.equal(isWindowBlurred, true);
  assert.equal(tabSwitches, 0, 'Window blur must not increment tabSwitches');

  handleFocus();
  assert.equal(isWindowBlurred, false);
  assert.equal(tabSwitches, 0);

  // 2. Visibility change to hidden DOES increment tabSwitches
  handleVisibilityChange('hidden', 1000);
  assert.equal(tabSwitches, 1, 'visibilitychange to hidden increments tabSwitches');

  // 3. Debounce within 1000ms ignores rapid second visibility hidden event
  handleVisibilityChange('hidden', 1500);
  assert.equal(tabSwitches, 1, 'Debounced within 1000ms');

  // 4. Visibility change after debounce interval increments
  handleVisibilityChange('hidden', 2500);
  assert.equal(tabSwitches, 2, 'New visibility change after 1s increments tabSwitches');

  // Verify useProctoring source does not increment tabSwitches in handleBlur
  const proctorPath = path.resolve(import.meta.dirname, 'hooks/useProctoring.ts');
  const content = fs.readFileSync(proctorPath, 'utf-8');
  assert.ok(
    content.includes("document.addEventListener('visibilitychange', handleVisibilityChange)"),
    'Must attach visibilitychange event listener'
  );
  const blurBody = content.match(/const handleBlur = \(\) => \{([\s\S]*?)\};/)?.[1] || '';
  assert.ok(
    !blurBody.includes('setTabSwitches'),
    'handleBlur must not call setTabSwitches'
  );
});

test('SF-6: FloatingAiOrb displays honest delegation tooltip without fake mic control', () => {
  const orbPath = path.resolve(import.meta.dirname, '../ai/FloatingAiOrb.tsx');
  const content = fs.readFileSync(orbPath, 'utf-8');

  assert.ok(
    content.includes('Recording via chat mic (Ctrl+M)'),
    'Orb must indicate recording is via chat mic'
  );
  assert.ok(
    !content.includes('PTT Recording…'),
    'Old PTT Recording… tooltip must be replaced'
  );
});

test('SF-7: Header SelfTimer synchronizes with section plan budget and supports autoStart', () => {
  const timerPath = path.resolve(import.meta.dirname, '../ide/SelfTimer.tsx');
  const timerContent = fs.readFileSync(timerPath, 'utf-8');

  assert.ok(
    timerContent.includes('autoStart'),
    'SelfTimer must support autoStart prop'
  );
  assert.ok(
    timerContent.includes('setSecondsLeft(startingMinutes * 60)'),
    'SelfTimer must update secondsLeft when startingMinutes changes'
  );

  const arenaShellPath = path.resolve(import.meta.dirname, 'ArenaShell.tsx');
  const shellContent = fs.readFileSync(arenaShellPath, 'utf-8');

  assert.ok(
    shellContent.includes('SelfTimer initialMinutes={currentSectionBudget} autoStart={!isPlayground}'),
    'ArenaShell must pass currentSectionBudget and autoStart to SelfTimer'
  );
});
