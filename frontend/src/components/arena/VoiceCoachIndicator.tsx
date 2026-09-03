import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lightbulb, Volume2, X } from 'lucide-react';
import { useVoiceCoach } from '../../hooks/useVoiceCoach';

interface VoiceCoachIndicatorProps {
  tip?: string;
  category?: string;
  shouldSpeak?: boolean;
  voiceEnabled?: boolean;
  problemTitle?: string;
  currentTrack?: string;
  elapsedSeconds?: number;
  testFailures?: number;
  candidateWords?: number;
  className?: string;
}

export const VoiceCoachIndicator: React.FC<VoiceCoachIndicatorProps> = ({
  tip: explicitTip,
  category: explicitCategory,
  shouldSpeak: explicitShouldSpeak,
  voiceEnabled = true,
  problemTitle = '',
  currentTrack = 'ALGORITHMS_DATA_STRUCTURES',
  elapsedSeconds = 0,
  testFailures = 0,
  candidateWords = 0,
  className = ''
}) => {
  const { tip: autoTip, category: autoCategory, shouldSpeak: autoShouldSpeak } = useVoiceCoach({
    enabled: voiceEnabled,
    problemTitle,
    currentTrack,
    elapsedSeconds,
    testFailures,
    candidateWords
  });

  const activeTip = explicitTip || autoTip;
  const activeCategory = explicitCategory || autoCategory || 'COACH';
  const activeShouldSpeak = explicitShouldSpeak !== undefined ? explicitShouldSpeak : autoShouldSpeak;

  const [isVisible, setIsVisible] = useState(false);
  const [currentTip, setCurrentTip] = useState(activeTip);
  const lastSpokenTimeRef = useRef<number>(0);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    const now = Date.now();
    // 10-second cooldown between auto spoken tips
    if (now - lastSpokenTimeRef.current < 10000) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    lastSpokenTimeRef.current = now;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  useEffect(() => {
    if (activeTip && activeTip.trim()) {
      setCurrentTip(activeTip);
      setIsVisible(true);
      if (activeShouldSpeak) {
        speak(activeTip);
      }
    }
  }, [activeTip, activeShouldSpeak, speak]);

  if (!isVisible || !currentTip) return null;

  return (
    <div
      className={`fixed bottom-20 right-6 z-40 max-w-sm p-3 rounded-lg shadow-xl border bg-surface/95 backdrop-blur-sm border-amber-500/30 text-text transition-all animate-in fade-in slide-in-from-bottom-2 ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <div className="p-1.5 rounded-md bg-amber-500/15 text-amber-500 shrink-0">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Coach • {activeCategory}
            </span>
          </div>
          <p className="text-xs text-text-2 leading-relaxed">{currentTip}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              lastSpokenTimeRef.current = 0; // manual replay ignores cooldown
              speak(currentTip);
            }}
            title="Replay Tip Audio"
            className="p-1 rounded text-text-3 hover:text-text hover:bg-elevated transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            title="Dismiss Coach Tip"
            className="p-1 rounded text-text-3 hover:text-text hover:bg-elevated transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
