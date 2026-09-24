export interface PlayTtsOptions {
  text: string;
  voiceOutputEnabled: boolean;
  onStart: () => void;
  onEnd: () => void;
  onError: () => void;
}

export function sanitizeTtsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\uFEFF]/g, '')
    .replace(/\$?\bO\(\s*1\s*\)\$?/gi, 'O of 1')
    .replace(/\$?\bO\(\s*N\s*\\?log\s*N\s*\)\$?/gi, 'O of N log N')
    .replace(/\$?\bO\(\s*\\?log\s*N\s*\)\$?/gi, 'O of log N')
    .replace(/\$?\bO\(\s*N\^2\s*\)\$?/gi, 'O of N squared')
    .replace(/\$?\bO\(\s*N\^3\s*\)\$?/gi, 'O of N cubed')
    .replace(/\$?\bO\(\s*([A-Za-z0-9+\-*/\s]+)\s*\)\$?/g, 'O of $1')
    .replace(/\\log\b/g, 'log')
    .replace(/\\times\b/g, 'times')
    .replace(/[*#`_~\[\]$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function playTtsUtterance({
  text,
  voiceOutputEnabled,
  onStart,
  onEnd,
  onError
}: PlayTtsOptions): boolean {
  if (!voiceOutputEnabled || typeof window === 'undefined' || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const cleanText = sanitizeTtsText(text);
  if (!cleanText) return false;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onError;
  window.speechSynthesis.speak(utterance);
  return true;
}

