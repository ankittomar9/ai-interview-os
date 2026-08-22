import React from 'react';
import { CheckCircle2, CircleDot, Circle } from 'lucide-react';

export type InterviewStage = 'INTRODUCTION' | 'CORE_TECH' | 'CODING_DSA' | 'SYSTEM_DESIGN';

interface Props {
  currentStage: InterviewStage;
  onStageClick?: (stage: InterviewStage) => void;
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

export const StageStepper: React.FC<Props> = ({ currentStage, onStageClick }) => {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="flex items-center justify-between bg-surface border-b border-border px-6 py-2.5 relative z-10 select-none">
      {STAGES.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;

        return (
          <React.Fragment key={stage.key}>
            <div
              onClick={() => { if (onStageClick) onStageClick(stage.key); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onStageClick) onStageClick(stage.key);
                }
              }}
              className={`flex items-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded p-1 ${
                onStageClick ? 'cursor-pointer' : 'cursor-default'
              } ${isCompleted || isActive ? 'opacity-100' : 'opacity-45'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
                  isCompleted
                    ? 'bg-success/20 border-success text-success'
                    : isActive
                    ? 'bg-primary/25 border-primary-2 text-primary-2 shadow-sm shadow-primary/40'
                    : 'bg-elevated border-border text-text-3'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : isActive ? (
                  <CircleDot className="w-4 h-4" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
              </div>

              <div>
                <div
                  className={`text-xs font-bold tracking-wide ${
                    isActive ? 'text-text' : isCompleted ? 'text-success' : 'text-text-3'
                  }`}
                >
                  {stage.label}
                </div>
                <div className="text-[11px] text-text-3 hidden sm:block">
                  {stage.description}
                </div>
              </div>
            </div>

            {idx < STAGES.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 sm:mx-4 transition-colors ${
                  idx < currentIndex ? 'bg-success' : 'bg-border'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
