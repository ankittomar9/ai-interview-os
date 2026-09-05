import React from 'react';
import { CheckCircle2, CircleDot, Circle, Lock } from 'lucide-react';
import { toast } from '../hooks/useToast';
import type { PlannedSection, SectionType } from '../types';
import { buildNavSections, type StageNavInfo } from '../lib/plan-navigation';
import { evaluateNavigationGate } from '../lib/gating';

export type InterviewStage = SectionType;
export type StageTransitionReason = 'CONSENTED' | 'MANUAL_JUMP' | 'SESSION_ENDED' | 'SKIPPED_BY_USER';

interface Props {
  currentStage?: InterviewStage;
  currentSectionIndex?: number;
  sections?: PlannedSection[];
  isPlayground?: boolean;
  onStageClick?: (stage: InterviewStage) => void;
  onSectionClick?: (index: number, stage: InterviewStage) => void;
  stageTurnCounts?: Record<string, number>;
  stageTransitionReasons?: Record<string, StageTransitionReason>;
}

export const StageStepper: React.FC<Props> = ({
  currentSectionIndex,
  sections,
  isPlayground = false,
  onStageClick,
  onSectionClick,
  stageTurnCounts,
  stageTransitionReasons
}) => {
  const items: StageNavInfo[] = React.useMemo(() => {
    return buildNavSections(sections);
  }, [sections]);

  const currentIndex = currentSectionIndex !== undefined ? currentSectionIndex : 0;

  return (
    <div className="flex items-center justify-between bg-surface border-b border-border px-6 py-2.5 relative z-10 select-none overflow-x-auto">
      {items.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        const isClickable = !!onSectionClick || !!onStageClick;
        const turnCount = stageTurnCounts?.[stage.key] ?? 0;
        const isAdvancedPast = isCompleted && turnCount === 0;
        const gate = evaluateNavigationGate(idx, currentIndex, isPlayground, items[currentIndex]?.label);

        const Content = (
          <>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all shrink-0 ${
                gate.isLocked
                  ? 'bg-elevated/50 border-border text-text-3/60'
                  : isAdvancedPast
                  ? 'bg-transparent border-dashed border-text-3/60 text-text-3'
                  : isCompleted
                  ? 'bg-success/20 border-success text-success'
                  : isActive
                  ? 'bg-primary/25 border-primary-2 text-primary-2 shadow-sm shadow-primary/40'
                  : 'bg-elevated border-border text-text-3'
              }`}
            >
              {gate.isLocked ? (
                <Lock className="w-3.5 h-3.5 text-text-3/60" />
              ) : isAdvancedPast ? (
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
                className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                  isActive ? 'text-text' : isAdvancedPast ? 'text-text-3' : isCompleted ? 'text-success' : 'text-text-3'
                }`}
              >
                <span>{stage.label}</span>
                {gate.isReviewing && (
                  <span className="text-[10px] font-normal text-warning bg-warning/20 border border-warning/30 px-1 py-0.2 rounded">
                    Reviewing — round closed
                  </span>
                )}
                {isAdvancedPast && !gate.isReviewing && (
                  <span className="text-[10px] font-normal text-text-3">(advanced)</span>
                )}
              </div>
              <div className="text-[11px] text-text-3 hidden sm:block">
                {stage.description}
              </div>
            </div>
          </>
        );

        const reason = stageTransitionReasons?.[stage.key];
        const titleText = gate.isLocked
          ? gate.tooltip || `Finish current round first — or end the round early`
          : isAdvancedPast
          ? `${stage.label} (advanced past${reason ? `: ${reason}` : ''})`
          : isPlayground
          ? `Jump to ${stage.label} (playground)`
          : `Jump to ${stage.label}`;

        return (
          <React.Fragment key={stage.key}>
            {isClickable ? (
              <button
                type="button"
                onClick={() => {
                  if (gate.isLocked) {
                    toast.warning(gate.tooltip || 'This round is locked');
                    return;
                  }
                  if (onSectionClick) onSectionClick(idx, stage.stage);
                  else if (onStageClick) onStageClick(stage.stage);
                }}
                title={titleText}
                className={`flex items-center gap-2.5 transition-all rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                  gate.isLocked
                    ? 'opacity-40 cursor-not-allowed'
                    : isCompleted || isActive
                    ? 'opacity-100 cursor-pointer hover:bg-elevated'
                    : 'opacity-70 hover:opacity-100 cursor-pointer hover:bg-elevated'
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

            {idx < items.length - 1 && (
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
