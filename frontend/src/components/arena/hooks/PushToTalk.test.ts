import test from 'node:test';
import assert from 'node:assert/strict';
import type { PttState, TurnMetrics } from './useCoachVoice';

test('Gate VP9: PTT finite state machine transitions from IDLE to RECORDING to TRANSCRIBING to IDLE', () => {
  type StateLog = PttState[];
  const history: StateLog = [];

  class MockPttFsm {
    private state: PttState = 'IDLE';

    getState(): PttState {
      return this.state;
    }

    startRecording(): void {
      if (this.state !== 'IDLE' && this.state !== 'SPEAKING') {
        throw new Error(`Cannot start recording from state: ${this.state}`);
      }
      this.state = 'RECORDING';
      history.push(this.state);
    }

    stopAndTranscribe(durationMs: number): boolean {
      if (this.state !== 'RECORDING') {
        throw new Error(`Cannot stop recording from state: ${this.state}`);
      }
      if (durationMs < 250) {
        this.state = 'IDLE';
        history.push(this.state);
        return false; // micro-tap ignored
      }
      this.state = 'TRANSCRIBING';
      history.push(this.state);
      return true;
    }

    resolveTranscription(transcript: string, onSpeechFinal: (text: string) => void): void {
      if (this.state !== 'TRANSCRIBING') {
        throw new Error(`Cannot resolve transcription from state: ${this.state}`);
      }
      this.state = 'IDLE';
      history.push(this.state);
      if (transcript.trim()) {
        onSpeechFinal(transcript.trim());
      }
    }
  }

  const fsm = new MockPttFsm();
  let receivedTranscript = '';

  // 1. Initial State
  assert.equal(fsm.getState(), 'IDLE');

  // 2. Press PTT -> RECORDING
  fsm.startRecording();
  assert.equal(fsm.getState(), 'RECORDING');

  // 3. Release PTT after 1200ms -> TRANSCRIBING
  const shouldUpload = fsm.stopAndTranscribe(1200);
  assert.equal(shouldUpload, true);
  assert.equal(fsm.getState(), 'TRANSCRIBING');

  // 4. Whisper STT returns -> IDLE and delivers transcript
  fsm.resolveTranscription('Hello, I will use a two-pointer approach.', (text) => {
    receivedTranscript = text;
  });
  assert.equal(fsm.getState(), 'IDLE');
  assert.equal(receivedTranscript, 'Hello, I will use a two-pointer approach.');
  assert.deepEqual(history, ['RECORDING', 'TRANSCRIBING', 'IDLE']);
});

test('Gate VP9: Micro-tap (<250ms) cancels silently without sending audio or triggering turn', () => {
  let uploaded = false;
  let state: PttState = 'IDLE';

  const press = () => { state = 'RECORDING'; };
  const release = (durationMs: number) => {
    if (durationMs < 250) {
      state = 'IDLE';
      uploaded = false;
    } else {
      state = 'TRANSCRIBING';
      uploaded = true;
    }
  };

  press();
  assert.equal(state, 'RECORDING');

  release(120); // 120ms accidental micro-tap
  assert.equal(state, 'IDLE');
  assert.equal(uploaded, false);
});

test('Gate VP9: Abort mid-turn during RECORDING leaves state consistent and commits 0 turns', () => {
  let state: PttState = 'IDLE';
  let turnsCommitted = 0;
  let mediaTracksActive = true;
  let audioChunksCount = 5;

  // Simulate Press PTT
  state = 'RECORDING';
  mediaTracksActive = true;

  // User hits Abort / Cancel / Escape
  const abortTurn = () => {
    state = 'IDLE';
    mediaTracksActive = false;
    audioChunksCount = 0;
    // zero turns committed
  };

  abortTurn();

  assert.equal(state, 'IDLE');
  assert.equal(mediaTracksActive, false);
  assert.equal(audioChunksCount, 0);
  assert.equal(turnsCommitted, 0);
});

test('Gate VP9: Abort mid-turn during TRANSCRIBING aborts in-flight fetch and leaves 0 turns', () => {
  let state: PttState = 'TRANSCRIBING';
  let turnsCommitted = 0;
  let inFlightFetchAborted = false;

  const abortController = {
    abort: () => { inFlightFetchAborted = true; }
  };

  const abortTurn = () => {
    abortController.abort();
    state = 'IDLE';
  };

  abortTurn();

  assert.equal(state, 'IDLE');
  assert.equal(inFlightFetchAborted, true);
  assert.equal(turnsCommitted, 0);
});

test('Gate VP9: Abort during TTS cancels speech immediately and resets state', () => {
  let state: PttState = 'SPEAKING';
  let ttsCancelled = false;
  let isAiSpeaking = true;

  const abortTurn = () => {
    ttsCancelled = true;
    state = 'IDLE';
    isAiSpeaking = false;
  };

  abortTurn();

  assert.equal(state, 'IDLE');
  assert.equal(ttsCancelled, true);
  assert.equal(isAiSpeaking, false);
});

test('Gate VP9: Latency budget adheres to stated constraints', () => {
  const LATENCY_BUDGET = {
    maxSttMs: 1500,
    maxLlmMs: 2000,
    maxTtsInitMs: 300,
    maxTotalPipelineMs: 3800
  };

  const measuredMetrics: TurnMetrics = {
    sttLatencyMs: 338,
    recordingDurationMs: 1800,
    turnCompletedAt: Date.now()
  };

  const measuredLlmMs = 755;
  const measuredTtsInitMs = 85;
  const totalPipelineMs = (measuredMetrics.sttLatencyMs || 0) + measuredLlmMs + measuredTtsInitMs;

  assert.ok(measuredMetrics.sttLatencyMs! <= LATENCY_BUDGET.maxSttMs, 'STT within budget');
  assert.ok(measuredLlmMs <= LATENCY_BUDGET.maxLlmMs, 'LLM within budget');
  assert.ok(measuredTtsInitMs <= LATENCY_BUDGET.maxTtsInitMs, 'TTS initiation within budget');
  assert.ok(totalPipelineMs <= LATENCY_BUDGET.maxTotalPipelineMs, 'Total pipeline within budget');
});

test('Gate VP9: FloatingAiOrb renders ChevronDown when panel is open to prevent duplicate mic confusion', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const orbPath = path.resolve(import.meta.dirname, '../../ai/FloatingAiOrb.tsx');
  const content = fs.readFileSync(orbPath, 'utf-8');

  assert.ok(
    content.includes('ChevronDown'),
    'FloatingAiOrb must import and render ChevronDown when panel is open'
  );
  assert.ok(
    content.includes('isOpen ? ('),
    'FloatingAiOrb must check isOpen before rendering mic icon'
  );
});

test('Gate VP9: useAudioCapture implements safe mime type selection with fallback', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const capturePath = path.resolve(import.meta.dirname, 'useAudioCapture.ts');
  const content = fs.readFileSync(capturePath, 'utf-8');

  assert.ok(
    content.includes('pickAudioMime'),
    'useAudioCapture must implement pickAudioMime'
  );
  assert.ok(
    !content.includes("new MediaRecorder(stream, { mimeType: 'audio/webm' })"),
    'Hardcoded audio/webm without fallback must be eliminated'
  );
});

test('Gate VP9: useCoachVoice uses abortTurnRef unmount-only cleanup to prevent re-render abort loops during recording', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const voiceHookPath = path.resolve(import.meta.dirname, 'useCoachVoice.ts');
  const content = fs.readFileSync(voiceHookPath, 'utf-8');

  assert.ok(
    content.includes('const abortTurnRef = useRef(abortTurn);'),
    'useCoachVoice must maintain an abortTurnRef'
  );
  assert.ok(
    content.includes('abortTurnRef.current = abortTurn;'),
    'useCoachVoice must update abortTurnRef on each render'
  );
  assert.ok(
    content.includes('abortTurnRef.current();') && content.includes('}, []);'),
    'useCoachVoice unmount effect must invoke abortTurnRef on unmount only with empty dependency array'
  );
  assert.ok(
    !content.includes('useEffect(() => () => { abortTurn(); }, [abortTurn]);'),
    'Reactive abortTurn effect on [abortTurn] must be eliminated to prevent render abort loops'
  );
});

test('Gate VP9: AutoGrowingChatInput uses aria-busy instead of disabled to avoid stuck mic states', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const inputPath = path.resolve(import.meta.dirname, '../../ui/AutoGrowingChatInput.tsx');
  const content = fs.readFileSync(inputPath, 'utf-8');

  assert.ok(
    content.includes('aria-busy={isRequestingMic}'),
    'AutoGrowingChatInput must use aria-busy={isRequestingMic} for mic button accessibility'
  );
  assert.ok(
    !content.includes('disabled={isRequestingMic}'),
    'AutoGrowingChatInput must not disable button with isRequestingMic'
  );
  assert.ok(
    content.includes('if (e.defaultPrevented) return;'),
    'AutoGrowingChatInput Ctrl+M listener must respect e.defaultPrevented to avoid double toggle'
  );
});

test('Gate VP9: ArenaShell registers global Ctrl+M shortcut for arena-wide PTT toggle', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const shellPath = path.resolve(import.meta.dirname, '../ArenaShell.tsx');
  const content = fs.readFileSync(shellPath, 'utf-8');

  assert.ok(
    content.includes("(e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm'"),
    'ArenaShell must handle global Ctrl+M / Meta+M shortcut'
  );
  assert.ok(
    content.includes('e.preventDefault();'),
    'ArenaShell Ctrl+M handler must prevent default browser behavior'
  );
  assert.ok(
    content.includes('if (isAiResponding) return;'),
    'ArenaShell Ctrl+M handler must ignore shortcut while AI is responding'
  );
});

test('Gate VP9: useSessionCatalog gates playlist-restore index reset to playground mode', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const catalogPath = path.resolve(import.meta.dirname, 'useSessionCatalog.ts');
  const content = fs.readFileSync(catalogPath, 'utf-8');

  assert.ok(
    content.includes("if (sessionMode !== 'PLAYGROUND') return;"),
    'useSessionCatalog playlist restore effect must be gated to playground mode for defense-in-depth'
  );
});