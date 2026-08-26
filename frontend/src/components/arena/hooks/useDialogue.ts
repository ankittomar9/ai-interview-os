import { useState, useCallback, useRef } from "react";
import type { ModelProvider, IntegritySignals } from "../../../types";
import { processDialogueTurn, addMessageToSession } from "../../../services/api";
import type { InterviewStage } from "../../StageStepper";

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
  initialWelcome?: string;
  onAiSpeechRequested?: (text: string) => void;
  getIntegritySignals?: () => IntegritySignals | undefined;
}

export function useDialogue({
  sessionId,
  provider,
  apiKey,
  isPlayground = false,
  questionContext,
  problemSlug,
  initialWelcome = "",
  onAiSpeechRequested,
  getIntegritySignals
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
  const [currentStage, setCurrentStage] = useState<InterviewStage>("INTRODUCTION");
  const [hasUnread, setHasUnread] = useState(false);
  const [providerError, setProviderError] = useState<ProviderErrorState | null>(null);

  const lastTurnRef = useRef<{ textToSend: string; codeSnapshot: string } | null>(null);

  const triggerCandidateTurn = useCallback(async (forcedText?: string, codeSnapshot = "") => {
    const textToSend = (forcedText !== undefined ? forcedText : chatInput).trim();
    if (!textToSend && !codeSnapshot) return;

    if (forcedText === undefined) setChatInput("");
    lastTurnRef.current = { textToSend, codeSnapshot };

    const candidateMsg: DialogueMessage = {
      role: "candidate",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, candidateMsg]);
    setIsAiResponding(true);

    try {
      const integrity = getIntegritySignals ? getIntegritySignals() : undefined;

      await addMessageToSession(sessionId, {
        senderRole: "CANDIDATE",
        content: textToSend,
        codeSnippet: codeSnapshot,
        messageType: "EXPLANATION",
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
        setCurrentStage((prev) => {
          if (prev === "INTRODUCTION") return "CORE_TECH";
          if (prev === "CORE_TECH") return "CODING_DSA";
          return "SYSTEM_DESIGN";
        });
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
  }, [chatInput, sessionId, provider, apiKey, isPlayground, questionContext, problemSlug, onAiSpeechRequested, getIntegritySignals]);

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
    hasUnread,
    setHasUnread,
    providerError,
    retryLastTurn,
    clearProviderError,
    triggerCandidateTurn
  };
}