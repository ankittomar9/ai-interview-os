import { useState, useCallback, useEffect } from 'react';
import type { InterviewTrack } from '../../../types';
import type { TrackKey } from '../ArenaShellTypes';
import type { InterviewStage } from '../../StageStepper';
import { evaluateNavigationGate } from '../../../lib/gating';
import { addMessageToSession } from '../../../services/api';

interface UseArenaNavigationProps {
  sessionId: number;
  isPlayground: boolean;
  initialTrack: TrackKey;
  navSections: Array<{ stage: InterviewStage; sectionType: string; track?: InterviewTrack; label: string }>;
  dialogue: {
    activeSectionIndex: number;
    stageTurnCounts: Record<string, number>;
    transitionSection: (idx: number, reason: any) => void;
    transitionStage: (stage: InterviewStage, reason: any) => void;
  };
  activeQuestionIndex: number;
  questionsCount: number;
  selectQuestion: (idx: number) => void;
}

export function useArenaNavigation({
  sessionId,
  isPlayground,
  initialTrack,
  navSections,
  dialogue,
  activeQuestionIndex,
  questionsCount,
  selectQuestion
}: UseArenaNavigationProps) {
  const [activeTrack, setActiveTrack] = useState<TrackKey>(initialTrack);
  const [pendingStageSwitch, setPendingStageSwitch] = useState<{
    stage: InterviewStage;
    targetTrack: InterviewTrack;
    targetIndex?: number;
  } | null>(null);

  const [isFocusMode, setIsFocusMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('interview-os:focus-mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('interview-os:focus-mode', String(next));
      } catch {}
      return next;
    });
  }, []);

  const handleSectionClick = useCallback(
    (targetIndex: number, targetStage: InterviewStage) => {
      const sec = navSections[targetIndex];
      if (!sec) return;

      const gate = evaluateNavigationGate(
        targetIndex,
        dialogue.activeSectionIndex,
        isPlayground,
        navSections[dialogue.activeSectionIndex]?.label
      );
      if (gate.isLocked) {
        const confirmed = window.confirm(
          `Finish current round first — or end the round early?\n\nDo you want to end this round early and proceed to ${sec.label}?`
        );
        if (!confirmed) return;
        dialogue.transitionSection(targetIndex, 'SKIPPED_BY_USER');
        return;
      }

      if (sec.track && sec.track !== activeTrack) {
        setPendingStageSwitch({ stage: targetStage, targetTrack: sec.track, targetIndex });
      } else {
        dialogue.transitionSection(targetIndex, 'MANUAL_JUMP');
      }
    },
    [activeTrack, dialogue, navSections, isPlayground]
  );

  const handleStageClick = useCallback(
    (targetStage: InterviewStage) => {
      const targetIdx = navSections.findIndex((s) => s.stage === targetStage);
      if (targetIdx !== -1) handleSectionClick(targetIdx, targetStage);
      else dialogue.transitionStage(targetStage, 'MANUAL_JUMP');
    },
    [handleSectionClick, navSections, dialogue]
  );

  const handleNextQuestion = useCallback(() => {
    if (activeQuestionIndex < questionsCount - 1) selectQuestion(activeQuestionIndex + 1);
  }, [activeQuestionIndex, questionsCount, selectQuestion]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage && sessionId) {
      const count = dialogue.stageTurnCounts['INTRODUCTION'] ?? 0;
      window.sessionStorage.setItem(`arena_intro_turn_count_${sessionId}`, String(count));
    }
  }, [dialogue.stageTurnCounts, sessionId]);

  const handleNextStage = useCallback(
    (options?: { introSkipped?: boolean }) => {
      if (options?.introSkipped) {
        console.info('[ArenaRoom] Stage advance: introSkipped=true');
        if (sessionId) {
          addMessageToSession(sessionId, {
            senderRole: 'CANDIDATE',
            messageType: 'SYSTEM_EVENT',
            content: '[SYSTEM_MARKER] Candidate skipped introduction.',
            metadata: { introSkipped: 'true' }
          }).catch(() => {});
        }
      }
      if (dialogue.activeSectionIndex < navSections.length - 1) {
        const nextSec = navSections[dialogue.activeSectionIndex + 1];
        handleSectionClick(dialogue.activeSectionIndex + 1, nextSec.stage);
      }
    },
    [dialogue.activeSectionIndex, navSections, handleSectionClick, sessionId]
  );

  const handleConfirmStageSwitch = useCallback(() => {
    if (pendingStageSwitch) {
      setActiveTrack(pendingStageSwitch.targetTrack);
      if (pendingStageSwitch.targetIndex !== undefined) {
        dialogue.transitionSection(pendingStageSwitch.targetIndex, 'MANUAL_JUMP');
      } else {
        dialogue.transitionStage(pendingStageSwitch.stage, 'MANUAL_JUMP');
      }
      setPendingStageSwitch(null);
    }
  }, [pendingStageSwitch, dialogue]);

  const handleCancelStageSwitch = useCallback(() => setPendingStageSwitch(null), []);

  return {
    activeTrack,
    setActiveTrack,
    pendingStageSwitch,
    isFocusMode,
    toggleFocusMode,
    handleSectionClick,
    handleStageClick,
    handleNextQuestion,
    handleNextStage,
    handleConfirmStageSwitch,
    handleCancelStageSwitch
  };
}
