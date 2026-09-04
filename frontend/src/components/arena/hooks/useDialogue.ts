import { useState, useCallback, useRef } from "react";
import type { ModelProvider, IntegritySignals, PlannedSection } from "../../../types";
import { processDialogueTurn, addMessageToSession, recordSectionTransition } from "../../../services/api";
import type { InterviewStage, StageTransitionReason } from "../../StageStepper";
import { buildNavSections, type StageNavInfo } from "../../../lib/plan-navigation";
import { isEchoOverlap } from "../../../lib/echo-overlap-filter";
import { toast } from "../../../hooks/useToast";

export interface DialogueMessage {
  role: "interviewer" | "candidate";
  content: string;
  timestamp?: string;
  metadata?: Record<string, string>;
}

export interface ProviderErrorState {
  type: "API_KEY_REJECTED" | "RATE_LIMITED" | "UNREACHABLE";
  message: string;
  label: string;
}

interface UseDialogueProps {
  sessionId: number;
  provider: ModelProvider;
  apiKey: string;
  isPlayground?: boolean;
  questionContext: string;
  problemSlug?: string;
  candidateName?: string;
  initialWelcome?: string;
  sections?: PlannedSection[];
  onAiSpeechRequested?: (text: string) => void;
  getIntegritySignals?: () => IntegritySignals | undefined;
  onSectionChanged?: (sectionIndex: number, section: StageNavInfo) => void;
}

export function useDialogue({
  sessionId,
  provider,
  apiKey,
  isPlayground = false,
  questionContext,
  problemSlug,
  candidateName,
  initialWelcome = "",
  sections,
  onAiSpeechRequested,
  getIntegritySignals,
  onSectionChanged
}: UseDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>(() => [
    {
      role: "interviewer",
      content: initialWelcome,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);

  const navSections = buildNavSections(sections);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const currentNavSection = navSections[activeSectionIndex] || navSections[0];
  const [currentStage, setCurrentStage] = useState<InterviewStage>(() => currentNavSection.stage);

  const [stageTurnCounts, setStageTurnCounts] = useState<Record<string, number>>({
    INTRODUCTION: 0,
    CORE_TECH: 0,
    CODING_DSA: 0,
    SYSTEM_DESIGN: 0
  });
  const [stageTransitionReasons, setStageTransitionReasons] = useState<Record<string, StageTransitionReason>>({} as any);
  const [hasUnread, setHasUnread] = useState(false);
  const [providerError, setProviderError] = useState<ProviderErrorState | null>(null);

  const lastTurnRef = useRef<{ textToSend: string; codeSnapshot: string } | null>(null);
  const echoFilteredCountRef = useRef<number>(0);

  const transitionSection = useCallback(async (targetIndex: number, reason: StageTransitionReason = 'MANUAL_JUMP') => {
    if (targetIndex < 0 || targetIndex >= navSections.length) return;
    const fromIdx = activeSectionIndex;
    const toIdx = targetIndex;
    if (fromIdx === toIdx) return;

    if (toIdx > fromIdx) {
      for (let i = fromIdx; i < toIdx; i++) {
        const sec = navSections[i];
        const isIntermediateSkipped = i > fromIdx;
        const turnCountForStage = isIntermediateSkipped ? 0 : (stageTurnCounts[sec.key] ?? stageTurnCounts[sec.stage] ?? 0);
        const stageReason = isIntermediateSkipped ? 'MANUAL_JUMP' : reason;

        setStageTransitionReasons((prev) => ({ ...prev, [sec.key]: stageReason, [sec.stage]: stageReason }));
        if (isIntermediateSkipped) {
          setStageTurnCounts((prev) => ({ ...prev, [sec.key]: 0, [sec.stage]: 0 }));
        }

        if (sessionId) {
          try {
            await recordSectionTransition(sessionId, {
              fromSectionType: String(sec.sectionType),
              toSectionType: String(navSections[i + 1]?.sectionType),
              sectionIndex: i,
              reason: stageReason,
              turnCount: turnCountForStage
            });
          } catch (e) {
            console.warn('[useDialogue] Failed to record section transition:', e);
          }
        }
      }
    } else {
      const curSec = navSections[fromIdx];
      setStageTransitionReasons((prev) => ({ ...prev, [curSec.key]: reason, [curSec.stage]: reason }));
      if (sessionId) {
        try {
          await recordSectionTransition(sessionId, {
            fromSectionType: String(curSec.sectionType),
            toSectionType: String(navSections[toIdx]?.sectionType),
            sectionIndex: fromIdx,
            reason,
            turnCount: stageTurnCounts[curSec.key] ?? stageTurnCounts[curSec.stage] ?? 0
          });
        } catch (e) {
          console.warn('[useDialogue] Failed to record section transition:', e);
        }
      }
    }

    const targetSec = navSections[toIdx];
    setActiveSectionIndex(toIdx);
    setCurrentStage(targetSec.stage);
    if (onSectionChanged) {
      onSectionChanged(toIdx, targetSec);
    }
  }, [activeSectionIndex, navSections, stageTurnCounts, sessionId, onSectionChanged]);

  const transitionStage = useCallback(async (targetStage: InterviewStage, reason: StageTransitionReason = 'MANUAL_JUMP') => {
    const targetIdx = navSections.findIndex((s) => s.stage === targetStage);
    if (targetIdx !== -1) {
      await transitionSection(targetIdx, reason);
    } else {
      setCurrentStage(targetStage);
    }
  }, [navSections, transitionSection]);

  const triggerCandidateTurn = useCallback(async (forcedText?: string, codeSnapshot = "", latestExecution?: any) => {
    const textToSend = (forcedText !== undefined ? forcedText : chatInput).trim();
    if (!textToSend && !codeSnapshot) return;

    // SPEC-008: Acoustic Echo Overlap Filter (Candidate turn choke point)
    const lastAiMsg = [...messages].reverse().find((m) => m.role === "interviewer");
    if (lastAiMsg && isEchoOverlap(textToSend, lastAiMsg.content, 8, 0.60)) {
      echoFilteredCountRef.current += 1;
      toast.warning("Echo filtered — please continue.");
      return;
    }

    if (forcedText === undefined) setChatInput("");
    lastTurnRef.current = { textToSend, codeSnapshot };
    const curKey = currentNavSection.key;
    const curStageKey = currentNavSection.stage;
    setStageTurnCounts((prev) => ({
      ...prev,
      [curKey]: (prev[curKey] || 0) + 1,
      [curStageKey]: (prev[curStageKey] || 0) + 1
    }));

    const candidateMsg: DialogueMessage = {
      role: "candidate",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, candidateMsg]);
    setIsAiResponding(true);

    try {
      const baseIntegrity = getIntegritySignals ? getIntegritySignals() : undefined;
      const integrity: IntegritySignals = {
        ...(baseIntegrity || {}),
        echoFilteredCount: echoFilteredCountRef.current
      };

      await addMessageToSession(sessionId, {
        senderRole: "CANDIDATE",
        content: textToSend,
        codeSnippet: codeSnapshot,
        messageType: "EXPLANATION",
        metadata: { stage: currentStage, sectionType: String(currentNavSection.sectionType) },
        integritySignals: integrity
      });

      const aiResponse = await processDialogueTurn({
        sessionId,
        questionContext,
        problemSlug,
        candidateExplanation: textToSend,
        candidateCode: codeSnapshot,
        modelProvider: provider,
        apiKey,
        sessionMode: isPlayground ? "PLAYGROUND" : "INTERVIEW",
        candidateName,
        currentStage,
        sectionType: String(currentNavSection.sectionType),
        sectionIndex: activeSectionIndex,
        totalSections: navSections.length,
        softTimeBudgetMinutes: currentNavSection.softTimeBudgetMinutes,
        sectionNote: currentNavSection.note,
        latestExecution: latestExecution ? {
          status: latestExecution.status || 'FAILED',
          passedTests: latestExecution.passedTests || 0,
          totalTests: latestExecution.totalTests || 0,
          executionTimeMs: latestExecution.executionTimeMs || 0,
          memoryUsedMb: latestExecution.memoryUsedMb || 0
        } : undefined,
        integritySignals: integrity
      });

      setProviderError(null);
      const replyText = aiResponse.interviewerReply || "Thank you. Let us explore the next step.";
      const fullText = replyText + (aiResponse.followUpQuestion ? "\n\n" + aiResponse.followUpQuestion : "");
      const aiMsg: DialogueMessage = {
        role: "interviewer",
        content: fullText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        metadata: {
          recommendedAction: aiResponse.recommendedAction || "",
          codeAnalysis: aiResponse.codeAnalysis || "",
          detectedIntent: aiResponse.detectedIntent || "",
          turnSummary: aiResponse.turnSummary || ""
        }
      };

      setMessages((prev) => [...prev, aiMsg]);
      setHasUnread(true);

      if (aiResponse.recommendedAction === "ADVANCE_STAGE") {
        if (activeSectionIndex < navSections.length - 1) {
          await transitionSection(activeSectionIndex + 1, 'CONSENTED');
        }
      }

      if (onAiSpeechRequested) {
        onAiSpeechRequested(fullText);
      }
    } catch (err: any) {
      console.warn("[useDialogue] Provider turn processing error:", err);

      const errStr = (err?.message || "").toLowerCase();
      const status = err?.status || 0;

      let errorType: ProviderErrorState["type"] = "UNREACHABLE";
      let label = "Provider unreachable";

      if (status === 401 || status === 403 || errStr.includes("401") || errStr.includes("403") || errStr.includes("key rejected") || errStr.includes("unauthorized")) {
        errorType = "API_KEY_REJECTED";
        label = "API key rejected";
      } else if (status === 429 || errStr.includes("429") || errStr.includes("rate limit")) {
        errorType = "RATE_LIMITED";
        label = "Rate limited";
      }

      setProviderError({
        type: errorType,
        message: err?.message || label,
        label
      });

      const fallbackMsg: DialogueMessage = {
        role: "interviewer",
        content: isPlayground
          ? "I noted your input. How would you handle potential edge cases or scale constraints?"
          : "Thank you for sharing your approach. How does your solution handle scale or boundary conditions?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        metadata: {
          offlineFallback: "true",
          senderName: "Offline Coach"
        }
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      setHasUnread(true);
    } finally {
      setIsAiResponding(false);
    }
  }, [chatInput, messages, sessionId, provider, apiKey, isPlayground, questionContext, problemSlug, onAiSpeechRequested, getIntegritySignals, currentStage, currentNavSection, activeSectionIndex, navSections, transitionSection]);

  const retryLastTurn = useCallback(async () => {
    if (lastTurnRef.current) {
      const { textToSend, codeSnapshot } = lastTurnRef.current;
      await triggerCandidateTurn(textToSend, codeSnapshot);
    }
  }, [triggerCandidateTurn]);

  const clearProviderError = useCallback(() => {
    setProviderError(null);
  }, []);

  return {
    messages,
    setMessages,
    chatInput,
    setChatInput,
    isAiResponding,
    currentStage,
    setCurrentStage,
    activeSectionIndex,
    navSections,
    transitionSection,
    transitionStage,
    stageTurnCounts,
    stageTransitionReasons,
    hasUnread,
    setHasUnread,
    providerError,
    retryLastTurn,
    clearProviderError,
    triggerCandidateTurn,
    echoFilteredCount: echoFilteredCountRef.current
  };
}