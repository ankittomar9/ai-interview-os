export interface PlayTtsOptions {
  text: string;
  voiceOutputEnabled: boolean;
  onStart: () => void;
  onEnd: () => void;
  onError: () => void;
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
  const cleanText = text.replace(/[*#`_~\[\]]/g, '').trim();
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
