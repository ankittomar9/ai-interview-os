import React from 'react';
import { Sparkles, ArrowRight, MessageSquare, ShieldCheck, Clock } from 'lucide-react';

interface IntroScreenProps {
  candidateName?: string;
  onNextStage?: () => void;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ candidateName, onNextStage }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background overflow-y-auto">
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

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-text-3 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Hardware & Verification verified</span>
          </div>
          {onNextStage && (
            <button
              type="button"
              onClick={onNextStage}
              className="px-4 py-2 bg-primary text-on-accent text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Begin Round 1</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
