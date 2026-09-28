import React, { useState } from 'react';
import { Sparkles, ArrowRight, MessageSquare, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

export interface IntroScreenProps {
  candidateName?: string;
  introTurnCount?: number;
  onNextStage?: (options?: { introSkipped?: boolean }) => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ candidateName, introTurnCount, onNextStage }) => {
  const [showSkipModal, setShowSkipModal] = useState(false);

  const getStoredIntroTurns = (): number => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith('arena_intro_turn_count_')) {
          const val = parseInt(window.sessionStorage.getItem(key) || '0', 10);
          if (!isNaN(val)) return val;
        }
      }
    }
    return 0;
  };

  const effectiveIntroTurns = introTurnCount !== undefined ? introTurnCount : getStoredIntroTurns();

  const handleBeginRound1 = () => {
    if (effectiveIntroTurns === 0) {
      setShowSkipModal(true);
      return;
    }
    onNextStage?.();
  };

  const handleAnswerIntro = () => {
    setShowSkipModal(false);
    document.getElementById('chat-input')?.focus();
  };

  const handleStartAnyway = () => {
    setShowSkipModal(false);
    console.info('[IntroScreen] Candidate explicitly chose to start anyway with introSkipped=true');
    onNextStage?.({ introSkipped: true });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background overflow-y-auto relative">
      {showSkipModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-text">Introduction Incomplete</h3>
                <p className="text-xs text-text-2 leading-relaxed">
                  You haven't introduced yourself yet. The interviewer expects a brief intro before we start.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleAnswerIntro}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-elevated hover:bg-surface text-text text-xs font-semibold cursor-pointer transition-colors"
              >
                Answer intro
              </button>
              <button
                type="button"
                onClick={handleStartAnyway}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-on-accent hover:bg-primary/90 text-xs font-semibold cursor-pointer transition-colors"
              >
                Start anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-xl w-full bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text">Welcome to your Interview Session</h2>
            <p className="text-xs text-text-3">Warm-up, role calibration & introductory briefing</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-text-2 leading-relaxed">
          <p>
            {candidateName ? `Hello ${candidateName}. ` : 'Hello. '}
            Your interviewer is calibrating the session plan based on your selected seniority and technical focus areas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-elevated/50 border border-border/80 flex items-start gap-2.5">
              <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-text block">AI Interviewer Audio</span>
                <span className="text-[11px] text-text-3">Discuss your background, ask questions, and clarify scope in the chat panel.</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-elevated/50 border border-border/80 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-text block">5-Minute Warm-Up</span>
                <span className="text-[11px] text-text-3">This introductory section is not scored. Take your time to settle in.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-text-3 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Hardware &amp; Verification verified · AI Interviewer panel is open</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => document.getElementById('chat-input')?.focus()}
              className="px-3.5 py-2 bg-elevated border border-border text-text text-xs font-semibold rounded-lg hover:bg-surface transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Reply to Interviewer</span>
            </button>
            {onNextStage && (
              <button
                type="button"
                onClick={handleBeginRound1}
                className="px-4 py-2 bg-primary text-on-accent text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Begin Round 1</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
