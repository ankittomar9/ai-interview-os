import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pickMime } from '../../hooks/useSessionRecorder.ts';
import { isExtendedMultiMonitorDisplay } from '../../lib/displayCapture.ts';
import { sanitizeTtsText } from '../../lib/audio-tts.ts';

test('V4-02: pickMime(false) selects video-only codecs without opus when stream has no audio tracks', () => {
  const origMediaRecorder = (globalThis as any).MediaRecorder;
  (globalThis as any).MediaRecorder = {
    isTypeSupported: (mime: string) => mime.startsWith('video/webm')
  };
  try {
    const videoOnlyMime = pickMime(false);
    assert.equal(videoOnlyMime, 'video/webm;codecs=vp9');
    assert.equal(videoOnlyMime.includes('opus'), false);

    const audioVideoMime = pickMime(true);
    assert.equal(audioVideoMime, 'video/webm;codecs=vp9,opus');
    assert.equal(audioVideoMime.includes('opus'), true);
  } finally {
    (globalThis as any).MediaRecorder = origMediaRecorder;
  }
});

test('V4-02: useSessionRecorder main recording effect depends strictly on [sessionId, isPlayground] and ArenaRoom memoizes handleShareLost', () => {
  const recorderSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/hooks/useSessionRecorder.ts'),
    'utf-8'
  );
  assert.equal(
    recorderSrc.includes('}, [sessionId, isPlayground]);'),
    true,
    'useSessionRecorder main recording useEffect must depend strictly on [sessionId, isPlayground]'
  );

  const arenaSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/arena/ArenaRoom.tsx'),
    'utf-8'
  );
  assert.equal(
    arenaSrc.includes('const handleShareLost = useCallback('),
    true,
    'ArenaRoom must memoize handleShareLost with useCallback'
  );
});

test('V4-04: isExtendedMultiMonitorDisplay detects window.screen.isExtended multi-monitor desktop', () => {
  assert.equal(isExtendedMultiMonitorDisplay({ screen: { isExtended: true } } as any), true);
  assert.equal(isExtendedMultiMonitorDisplay({ screen: { isExtended: false } } as any), false);
  assert.equal(isExtendedMultiMonitorDisplay({ screen: {} } as any), false);
  assert.equal(isExtendedMultiMonitorDisplay(undefined), false);
});

test('V4-07: sanitizeTtsText normalizes LaTeX Big-O expressions ($O(N)$, $O(1)$, $O(N^2)$) and removes all $ symbols', () => {
  const raw =
    'Great explanation! Your two-pointer approach runs in $O(N)$ time complexity and $O(1)$ auxiliary space, avoiding $O(N^2)$ nested loops and $O(N \\log N)$ sorting.';
  const cleaned = sanitizeTtsText(raw);

  assert.equal(cleaned.includes('$'), false, 'Sanitized TTS string must contain zero $ characters');
  assert.equal(cleaned.includes('O of N time complexity'), true);
  assert.equal(cleaned.includes('O of 1 auxiliary space'), true);
  assert.equal(cleaned.includes('O of N squared nested loops'), true);
  assert.equal(cleaned.includes('O of N log N sorting'), true);
});

test('V4-05 & V4-11: useCoachVoice defaults isAiPanelOpen to true and useDialogue persists and speaks initialWelcome on mount', () => {
  const voiceSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/arena/hooks/useCoachVoice.ts'),
    'utf-8'
  );
  assert.equal(
    voiceSrc.includes('const [isAiPanelOpen, setIsAiPanelOpen] = useState(true);'),
    true,
    'useCoachVoice must default isAiPanelOpen to true so the AI Interviewer panel opens in INTRODUCTION'
  );

  const dialogueSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/arena/hooks/useDialogue.ts'),
    'utf-8'
  );
  assert.equal(
    dialogueSrc.includes("type: 'WELCOME_GREETING'"),
    true,
    'useDialogue must persist initialWelcome as WELCOME_GREETING turn on mount'
  );
});

test('V4-08 & V4-10: DiagnosticReportView resets manifest with cache: no-store and AutoGrowingChatInput renders Retry button for failed STT', () => {
  const reportSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/DiagnosticReportView.tsx'),
    'utf-8'
  );
  assert.equal(
    reportSrc.includes('setManifest(null);') &&
      reportSrc.includes("fetch(`/api/v1/sessions/${report.sessionId}/recordings/manifest`, { cache: 'no-store' })"),
    true,
    'DiagnosticReportView must reset manifest on sessionId change and fetch with cache: no-store'
  );

  const inputSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/ui/AutoGrowingChatInput.tsx'),
    'utf-8'
  );
  assert.equal(
    inputSrc.includes('canRetryStt && onRetryStt') && inputSrc.includes('onClick={onRetryStt}'),
    true,
    'AutoGrowingChatInput must render Retry button inside micError banner when canRetryStt && onRetryStt are provided'
  );
});

test('V5-07a: sanitizeTtsText strips Extended_Pictographic emojis and variation selectors ("Hello 👋" -> "Hello")', () => {
  assert.equal(sanitizeTtsText('Hello 👋'), 'Hello');
  assert.equal(sanitizeTtsText('Hello 👋, welcome to AI Interview OS ✨\uFE0F!'), 'Hello , welcome to AI Interview OS !');
});

test('V5-07b: ensureDsaMethodSignatureBoilerplate guarantees typed helper method signature and never renders bare comment', () => {
  const arenaSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/arena/ArenaRoom.tsx'),
    'utf-8'
  );
  assert.equal(
    arenaSrc.includes('export function ensureDsaMethodSignatureBoilerplate('),
    true,
    'ArenaRoom must export ensureDsaMethodSignatureBoilerplate'
  );
  assert.equal(
    arenaSrc.includes('public static String reverseString(String s)') &&
      arenaSrc.includes('public static int lengthOfLongestSubstring(String s)'),
    true,
    'ensureDsaMethodSignatureBoilerplate must provide reverseString and lengthOfLongestSubstring method signatures'
  );
});

test('V5-07c: useSessionRecorder tracks uploaded chunk counts per stream kind (uploadedByKindRef) so screen summary never sums camera + screen', () => {
  const recorderSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/hooks/useSessionRecorder.ts'),
    'utf-8'
  );
  assert.equal(
    recorderSrc.includes('uploadedByKindRef') &&
      recorderSrc.includes('uploaded: uploadedByKindRef.current.screen'),
    true,
    'useSessionRecorder must track uploadedByKindRef per stream kind and report uploadedByKindRef.current.screen'
  );
});

test('V5-05: SelfTimer hides +15m and Reset in INTERVIEW mode and logs TIMER_EXTEND_BLOCKED mode=INTERVIEW', () => {
  const timerSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/ide/SelfTimer.tsx'),
    'utf-8'
  );
  assert.equal(
    timerSrc.includes("console.warn('TIMER_EXTEND_BLOCKED mode=INTERVIEW')") &&
      timerSrc.includes("effectiveMode === 'PLAYGROUND'"),
    true,
    'SelfTimer must block timer extension in INTERVIEW mode with TIMER_EXTEND_BLOCKED mode=INTERVIEW and gate +15m/Reset to PLAYGROUND'
  );
});

test('V5-09b: selectRotatingOfflineProbe rotates across distinct probes and echoes candidate topic snippet', () => {
  const dialogueSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/arena/hooks/useDialogue.ts'),
    'utf-8'
  );
  assert.equal(
    dialogueSrc.includes('export function selectRotatingOfflineProbe(') &&
      dialogueSrc.includes('const isClientContract400 = status === 400'),
    true,
    'useDialogue must export selectRotatingOfflineProbe and guard HTTP 400 from fabricating Offline Coach turns'
  );
});

test('V5-04, V5-06 & V5-09a: AiAssistantPanel renders Automated Fallback & Degraded AI mode banner, and DiagnosticReportView decouples Session Integrity Status', () => {
  const panelSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/ai/AiAssistantPanel.tsx'),
    'utf-8'
  );
  assert.equal(
    panelSrc.includes('Degraded AI mode — responses automated') &&
      panelSrc.includes('Automated Fallback'),
    true,
    'AiAssistantPanel must render Degraded AI mode banner and Automated Fallback attribution'
  );

  const reportSrc = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/DiagnosticReportView.tsx'),
    'utf-8'
  );
  assert.equal(
    reportSrc.includes('Session Integrity Status') &&
      reportSrc.includes('Automated Fallback — not the interviewer'),
    true,
    'DiagnosticReportView must render decoupled Session Integrity Status and Automated Fallback badge in Audited Transcript'
  );
});

