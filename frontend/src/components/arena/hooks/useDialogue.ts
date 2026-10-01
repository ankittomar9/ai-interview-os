import { useState, useCallback, useRef, useEffect } from "react";
import type { ModelProvider, IntegritySignals, PlannedSection, AiDialogueResponse } from "../../../types";
import { processDialogueTurn, addMessageToSession, recordSectionTransition, requestSectionHandoff, isSessionCompleted } from "../../../services/api";
import { isGatedSectionType } from "../../../lib/approachGate";
import type { InterviewStage, StageTransitionReason } from "../../StageStepper";
import { buildNavSections, type StageNavInfo } from "../../../lib/plan-navigation";
import { isEchoOverlap } from "../../../lib/echo-overlap-filter";
import { buildCandidateTurnPayload } from "../../../lib/turnPayload";
import { buildAiTurnMetadata } from "../../../lib/askedLedger";
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

const OFFLINE_PROBES = [
  (topic: string) =>
    `I noted your point${topic ? ` on "${topic}"` : ""}. Could you walk through the exact time and space complexity invariants of that approach?`,
  (topic: string) =>
    `Thank you for explaining${topic ? ` "${topic}"` : " your approach"}. What boundary inputs or degenerate cases could break your loop invariant?`,
  (topic: string) =>
    `Building on${topic ? ` "${topic}"` : " that design"}, how would you structure the helper method and test harness before running the code?`,
  (topic: string) =>
    `Understood${topic ? ` regarding "${topic}"` : ""}. What trade-offs exist between auxiliary memory and single-pass execution here?`
];

export function selectRotatingOfflineProbe(
  candidateText: string,
  turnIndex: number,
  lastProbeIndex?: number
): { probeIndex: number; probeText: string } {
  const cleaned = (candidateText || "").replace(/\s+/g, " ").trim();
  const words = cleaned ? cleaned.split(" ").slice(0, 6).join(" ") : "";
  let idx = Math.abs(turnIndex) % OFFLINE_PROBES.length;
  if (lastProbeIndex !== undefined && idx === lastProbeIndex) {
    idx = (idx + 1) % OFFLINE_PROBES.length;
  }
  return {
    probeIndex: idx,
    probeText: OFFLINE_PROBES[idx](words)
  };
}

interface UseDialogueProps {
  sessionId: number;
  provider: ModelProvider;
  apiKey: string;
  isPlayground?: boolean;
  questionContext?: string;
  getQuestionContext?: () => string;
  sectionQuestionTitle?: string;
  getSectionQuestionTitle?: () => string | undefined;
  problemSlug?: string;
  candidateName?: string;
  initialWelcome?: string;
  sections?: PlannedSection[];
  onAiSpeechRequested?: (text: string) => void;
  getIntegritySignals?: () => IntegritySignals | undefined;
  onSectionChanged?: (sectionIndex: number, section: StageNavInfo) => void;
  onAiTurnCompleted?: (response: AiDialogueResponse) => void;
  jobDescription?: string;
  targetCompany?: string;
  resumeSummary?: string;
  starterCode?: string;
  getStarterCode?: () => string | undefined;
  isApproachGateLocked?: boolean;
  getIsApproachGateLocked?: () => boolean | undefined;
  questionIndex?: number;
  totalQuestionsInSection?: number;
  getQuestionIndex?: () => number | undefined;
  getTotalQuestionsInSection?: () => number | undefined;
  activeSectionIndex?: number;
  onSectionIndexChange?: (index: number) => void;
}

export function useDialogue({
  sessionId,
  provider,
  apiKey,
  isPlayground = false,
  questionContext,
  getQuestionContext,
  sectionQuestionTitle,
  getSectionQuestionTitle,
  problemSlug,
  candidateName,
  initialWelcome = "",
  sections,
  onAiSpeechRequested,
  getIntegritySignals,
  onSectionChanged,
  onAiTurnCompleted,
  jobDescription,
  targetCompany,
  resumeSummary,
  starterCode,
  getStarterCode,
  isApproachGateLocked,
  getIsApproachGateLocked,
  questionIndex,
  totalQuestionsInSection,
  getQuestionIndex,
  getTotalQuestionsInSection,
  activeSectionIndex: controlledActiveSectionIndex,
  onSectionIndexChange
}: UseDialogueProps) {
  const lastHandoffIndexRef = useRef<number | null>(null);
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
  const [internalActiveSectionIndex, setInternalActiveSectionIndex] = useState(0);
  const isControlled = controlledActiveSectionIndex !== undefined;
  const activeSectionIndex = isControlled ? controlledActiveSectionIndex : internalActiveSectionIndex;
  const setActiveSectionIndex = useCallback((updater: number | ((prev: number) => number)) => {
    if (isControlled) {
      const next = typeof updater === 'function' ? updater(activeSectionIndex) : updater;
      onSectionIndexChange?.(next);
    } else {
      setInternalActiveSectionIndex(updater);
    }
  }, [isControlled, activeSectionIndex, onSectionIndexChange]);

  const currentNavSection = navSections[activeSectionIndex] || navSections[0];
  const [currentStage, setCurrentStage] = useState<InterviewStage>(() => currentNavSection.stage);

  useEffect(() => {
    if (navSections[activeSectionIndex]) {
      setCurrentStage(navSections[activeSectionIndex].stage);
    }
  }, [activeSectionIndex, navSections]);

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
  const highestSectionIndexRef = useRef<number>(0);
  const welcomePersistedSessionIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!sessionId || !initialWelcome.trim() || welcomePersistedSessionIdRef.current === sessionId) return;
    welcomePersistedSessionIdRef.current = sessionId;

    void addMessageToSession(sessionId, {
      senderRole: 'AI',
      content: initialWelcome,
      messageType: 'EXPLANATION',
      metadata: {
        type: 'WELCOME_GREETING',
        stage: currentStage,
        sectionType: String(currentNavSection.sectionType),
        provider
      }
    }).catch((err) => {
      console.warn('[useDialogue] Failed to persist initial welcome message:', err);
    });

    if (onAiSpeechRequested) {
      onAiSpeechRequested(initialWelcome);
    }
  }, [sessionId, initialWelcome, currentStage, currentNavSection.sectionType, provider, onAiSpeechRequested]);

  useEffect(() => {
    if (activeSectionIndex > highestSectionIndexRef.current) {
      highestSectionIndexRef.current = activeSectionIndex;
    }
  }, [activeSectionIndex]);

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
    const dividerMsg: DialogueMessage = {
      role: 'interviewer',
      content: `— Round ${toIdx + 1}: ${targetSec.label} —`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      metadata: {
        type: 'ROUND_BOUNDARY',
        sectionType: String(targetSec.sectionType)
      }
    };
    setMessages((prev) => [...prev, dividerMsg]);
    if (onSectionChanged) {
      onSectionChanged(toIdx, targetSec);
    }

    // P11 / IH3: AI-Narrated Section Handoff with dedup guard
    if (lastHandoffIndexRef.current !== toIdx && sessionId) {
      lastHandoffIndexRef.current = toIdx;
      const curSec = navSections[fromIdx];
      const isTargetGated = isGatedSectionType(String(targetSec.sectionType));

      requestSectionHandoff({
        sessionId,
        fromSectionType: curSec ? String(curSec.sectionType) : "",
        toSectionType: String(targetSec.sectionType),
        toSectionTitle: targetSec.label || String(targetSec.sectionType),
        toSectionGated: isTargetGated,
        candidateName,
        apiKey,
        modelProvider: provider
      }).then(async (handoffRes) => {
        if (handoffRes && handoffRes.interviewerReply) {
          const handoffMsg: DialogueMessage = {
            role: "interviewer",
            content: handoffRes.interviewerReply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            metadata: {
              type: "SECTION_HANDOFF",
              sectionType: String(targetSec.sectionType),
              detectedIntent: "SECTION_HANDOFF",
              turnSummary: handoffRes.turnSummary || "Section handoff transition"
            }
          };
          setMessages((prev) => [...prev, handoffMsg]);
          setHasUnread(true);

          try {
            await addMessageToSession(sessionId, {
              senderRole: "AI",
              content: handoffRes.interviewerReply,
              messageType: "EXPLANATION",
              metadata: {
                type: "SECTION_HANDOFF",
                stage: targetSec.stage,
                sectionType: String(targetSec.sectionType),
                provider
              }
            });
          } catch (saveErr) {
            console.warn("[useDialogue] Failed to persist handoff message:", saveErr);
          }

          if (onAiSpeechRequested) {
            onAiSpeechRequested(handoffRes.interviewerReply);
          }
        }
      }).catch((err) => {
        // Fall back to divider only — NEVER fabricate handoff text client-side
        console.warn("[useDialogue] Handoff narration failed, falling back to divider only:", err);
      });
    }
  }, [activeSectionIndex, navSections, stageTurnCounts, sessionId, onSectionChanged, candidateName, apiKey, provider, onAiSpeechRequested]);

  const transitionStage = useCallback(async (targetStage: InterviewStage, reason: StageTransitionReason = 'MANUAL_JUMP') => {
    const targetIdx = navSections.findIndex((s) => s.stage === targetStage || s.sectionType === targetStage);
    if (targetIdx !== -1) {
      await transitionSection(targetIdx, reason);
    }
  }, [navSections, transitionSection]);

  const triggerCandidateTurn = useCallback(async (forcedText?: string, codeSnapshot = "", latestExecution?: any, turnMetadata?: Record<string, any>) => {
    if (isSessionCompleted(sessionId)) {
      console.warn("[useDialogue] Suppressing candidate turn for completed session:", sessionId);
      return;
    }
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
    const isReviewingClosed = !isPlayground && activeSectionIndex < highestSectionIndexRef.current;
    if (!isReviewingClosed) {
      const curKey = currentNavSection.key;
      setStageTurnCounts((prev) => ({
        ...prev,
        [curKey]: (prev[curKey] || 0) + 1
      }));
    }

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

      const resolvedQuestionContext = getQuestionContext ? getQuestionContext() : (questionContext || "");
      const resolvedSectionTitle = getSectionQuestionTitle ? getSectionQuestionTitle() : sectionQuestionTitle;
      const currentGateLocked = getIsApproachGateLocked ? getIsApproachGateLocked() : isApproachGateLocked;
      const currentStarterCode = getStarterCode ? getStarterCode() : starterCode;

      const payload = buildCandidateTurnPayload({
        sectionType: currentNavSection.sectionType,
        textToSend,
        codeSnapshot,
        starterCode: currentStarterCode,
        isApproachGateLocked: currentGateLocked,
        questionContext: resolvedQuestionContext,
        problemSlug,
        sectionQuestionTitle: resolvedSectionTitle
      });

      await addMessageToSession(sessionId, {
        senderRole: "CANDIDATE",
        content: payload.candidateExplanation,
        codeSnippet: payload.codeSnippet,
        messageType: "EXPLANATION",
        metadata: {
          stage: currentStage,
          sectionType: String(currentNavSection.sectionType),
          ...(turnMetadata || {})
        },
        integritySignals: integrity
      });

      const isStt = Boolean(turnMetadata?.isStt === 'true' || turnMetadata?.isStt === true);
      const aiResponse = await processDialogueTurn({
        sessionId,
        questionContext: payload.questionContext,
        sectionQuestionTitle: payload.sectionQuestionTitle,
        problemSlug: payload.problemSlug,
        candidateExplanation: payload.candidateExplanation,
        candidateCode: payload.candidateCode,
        modelProvider: provider,
        apiKey,
        sessionMode: isPlayground ? "PLAYGROUND" : "INTERVIEW",
        candidateName,
        currentStage,
        sectionType: String(currentNavSection.sectionType),
        sectionIndex: activeSectionIndex,
        totalSections: navSections.length,
        questionIndex: getQuestionIndex ? getQuestionIndex() : questionIndex,
        totalQuestionsInSection: getTotalQuestionsInSection ? getTotalQuestionsInSection() : totalQuestionsInSection,
        softTimeBudgetMinutes: currentNavSection.softTimeBudgetMinutes,
        sectionNote: currentNavSection.note,
        jobDescription: currentNavSection.sectionType === 'INTRODUCTION' ? jobDescription : undefined,
        targetCompany: currentNavSection.sectionType === 'INTRODUCTION' ? targetCompany : undefined,
        resumeSummary: currentNavSection.sectionType === 'INTRODUCTION' ? resumeSummary : undefined,
        latestExecution: latestExecution ? {
          status: latestExecution.status || 'FAILED',
          passedTests: latestExecution.passedTests || 0,
          totalTests: latestExecution.totalTests || 0,
          executionTimeMs: latestExecution.executionTimeMs || 0,
          memoryUsedMb: latestExecution.memoryUsedMb || 0
        } : undefined,
        isStt,
        integritySignals: integrity
      });

      setProviderError(null);
      if (isSessionCompleted(sessionId)) {
        console.warn("[useDialogue] In-flight AI turn completed after session teardown; discarding for session:", sessionId);
        setIsAiResponding(false);
        return;
      }
      const replyText = aiResponse.interviewerReply || "Thank you. Let us explore the next step.";
      const fullText = replyText + (aiResponse.followUpQuestion ? "\n\n" + aiResponse.followUpQuestion : "");

      const generator = (aiResponse as any).generator || "LLM";
      const generatorReason = (aiResponse as any).generatorReason || "";
      const gateUnlockSource = (aiResponse as any).gateUnlockSource || "";
      const isAutomatedFallback = generator === "DETERMINISTIC_FALLBACK";

      const aiMetadata: Record<string, any> = {
        ...buildAiTurnMetadata({
          aiResponse,
          stage: currentStage,
          sectionType: String(currentNavSection.sectionType),
          provider,
          model: (aiResponse as any).model ?? ""
        }),
        generator,
        generatorReason,
        gateUnlockSource,
        ...(isAutomatedFallback ? { senderName: "Automated Fallback" } : {})
      };

      const aiMsg: DialogueMessage = {
        role: "interviewer",
        content: fullText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        metadata: {
          recommendedAction: aiResponse.recommendedAction || "",
          codeAnalysis: aiResponse.codeAnalysis || "",
          detectedIntent: aiResponse.detectedIntent || "",
          turnSummary: aiResponse.turnSummary || "",
          followUpQuestion: aiResponse.followUpQuestion || "",
          approachAssessment: aiResponse.approachAssessment || "NOT_APPLICABLE",
          usedFollowUpSeedIds: aiMetadata.usedFollowUpSeedIds,
          generator,
          generatorReason,
          gateUnlockSource,
          ...(isAutomatedFallback ? { senderName: "Automated Fallback" } : {})
        }
      };

      setMessages((prev) => [...prev, aiMsg]);
      setHasUnread(true);

      // SPEC-PLAN-3 D3: Persist interviewer turns to the persistent audit trail
      try {
        await addMessageToSession(sessionId, {
          senderRole: "AI",
          content: fullText,
          messageType: "EXPLANATION",
          metadata: aiMetadata,
          integritySignals: integrity
        });
      } catch (saveErr) {
        console.warn("[useDialogue] Failed to persist AI message:", saveErr);
      }

      onAiTurnCompleted?.(aiResponse);

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
      const isClientContract400 = status === 400 || errStr.includes("status 400") || errStr.includes("must not be blank");

      let errorType: ProviderErrorState["type"] = "UNREACHABLE";
      let label = "Provider unreachable";

      if (isClientContract400) {
        label = "Request validation error (400)";
      } else if (status === 401 || status === 403 || errStr.includes("401") || errStr.includes("403") || errStr.includes("key rejected") || errStr.includes("unauthorized")) {
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

      // V5-01: On HTTP 400 client validation error, surface banner and do NOT fabricate an Offline Coach turn
      if (isClientContract400) {
        toast.warning("Turn payload validation notice — please retry or advance stage.");
        return;
      }

      const candidateTurnCount = messages.filter((m) => m.role === "candidate").length + 1;
      const { probeText } = selectRotatingOfflineProbe(textToSend, candidateTurnCount);

      const fallbackMsg: DialogueMessage = {
        role: "interviewer",
        content: probeText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        metadata: {
          offlineFallback: "true",
          generator: "OFFLINE_COACH",
          generatorReason: `CLIENT_CATCH_${status || "NETWORK"}`,
          senderName: "Offline Coach"
        }
      };

      setMessages((prev) => [...prev, fallbackMsg]);
      setHasUnread(true);

      // SPEC-PLAN-3 D3: Honest-transcript doctrine - persist rendered fallback with metadata.error = "true"
      try {
        const baseIntegrity = getIntegritySignals ? getIntegritySignals() : undefined;
        const errIntegrity: IntegritySignals = {
          ...(baseIntegrity || {}),
          echoFilteredCount: echoFilteredCountRef.current
        };
        await addMessageToSession(sessionId, {
          senderRole: "AI",
          content: fallbackMsg.content,
          messageType: "EXPLANATION",
          metadata: {
            stage: currentStage,
            sectionType: String(currentNavSection.sectionType),
            provider,
            error: "true",
            offlineFallback: "true",
            generator: "OFFLINE_COACH",
            generatorReason: `CLIENT_CATCH_${status || "NETWORK"}`,
            senderName: "Offline Coach"
          },
          integritySignals: errIntegrity
        });
      } catch (saveErr) {
        console.warn("[useDialogue] Failed to persist fallback AI message:", saveErr);
      }
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