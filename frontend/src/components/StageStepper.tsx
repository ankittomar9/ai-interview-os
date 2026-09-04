import React from 'react';
import { CheckCircle2, CircleDot, Circle } from 'lucide-react';

export type InterviewStage = 'INTRODUCTION' | 'CORE_TECH' | 'CODING_DSA' | 'SYSTEM_DESIGN';
export type StageTransitionReason = 'CONSENTED' | 'MANUAL_JUMP' | 'SESSION_ENDED' | 'SKIPPED_BY_USER';

interface Props {
  currentStage: InterviewStage;
  isPlayground?: boolean;
  onStageClick?: (stage: InterviewStage) => void;
  stageTurnCounts?: Record<InterviewStage, number>;
  stageTransitionReasons?: Record<InterviewStage, StageTransitionReason>;
}

interface StageInfo {
  key: InterviewStage;
  label: string;
  description: string;
}

const STAGES: StageInfo[] = [
  { key: 'INTRODUCTION', label: '1. Introduction', description: 'Background & Role Fit' },
  { key: 'CORE_TECH', label: '2. Core Tech', description: 'Deep Dive & Foundations' },
  { key: 'CODING_DSA', label: '3. Coding & DSA', description: 'Sandbox Implementation' },
  { key: 'SYSTEM_DESIGN', label: '4. System Design', description: 'Architecture & Scalability' },
];

export const StageStepper: React.FC<Props> = ({ currentStage, isPlayground = false, onStageClick, stageTurnCounts, stageTransitionReasons }) => {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="flex items-center justify-between bg-surface border-b border-border px-6 py-2.5 relative z-10 select-none">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isClickable = !!onStageClick;
        const turnCount = stageTurnCounts?.[stage.key] ?? 0;
        const isAdvancedPast = isCompleted && turnCount === 0;

        const Content = (
          <>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                isAdvancedPast
                  ? 'bg-transparent border-dashed border-text-3/60 text-text-3'
                  : isCompleted
                  ? 'bg-success/20 border-success text-success'
                  : isActive
                  ? 'bg-primary/25 border-primary-2 text-primary-2 shadow-sm shadow-primary/40'
                  : 'bg-elevated border-border text-text-3'
              }`}
            >
              {isAdvancedPast ? (
                <Circle className="w-3.5 h-3.5 text-text-3/70 stroke-[1.5]" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isActive ? (
                <CircleDot className="w-4 h-4" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="text-left">
              <div
                className={`text-xs font-bold tracking-wide ${
                  isActive ? 'text-text' : isAdvancedPast ? 'text-text-3' : isCompleted ? 'text-success' : 'text-text-3'
                }`}
              >
                {stage.label}
                {isAdvancedPast && <span className="ml-1 text-[10px] font-normal text-text-3">(advanced)</span>}
              </div>
              <div className="text-[11px] text-text-3 hidden sm:block">
                {stage.description}
              </div>
            </div>
          </>
        );

        const reason = stageTransitionReasons?.[stage.key];
        const titleText = isAdvancedPast
          ? `${stage.label} (advanced past${reason ? `: ${reason}` : ''})`
          : isPlayground
          ? `Jump to ${stage.label} (playground)`
          : `Jump to ${stage.label}`;

        return (
          <React.Fragment key={stage.key}>
            {isClickable ? (
              <button
                type="button"
                onClick={() => onStageClick(stage.key)}
                title={titleText}
                className={`flex items-center gap-2.5 transition-all rounded-md px-2 py-1 cursor-pointer hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  isCompleted || isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {Content}
              </button>
            ) : (
              <div
                title={titleText}
                className={`flex items-center gap-2.5 transition-all p-1 cursor-default ${
                  isCompleted || isActive ? 'opacity-100' : 'opacity-45'
                }`}
              >
                {Content}
              </div>
            )}

            {idx < STAGES.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors ${
                  idx < currentIndex
                    ? (stageTurnCounts?.[stage.key] ?? 0) === 0
                      ? 'bg-border border-t border-dashed border-text-3/40'
                      : 'bg-success'
                    : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
