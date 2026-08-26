import { useState, useCallback } from 'react';
import type { ModelProvider, IntegritySignals } from '../../../types';
import { processDialogueTurn, addMessageToSession } from '../../../services/api';
import type { InterviewStage } from '../../StageStepper';

export interface DialogueMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp?: string;
  metadata?: Record<string, string>;
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
  initialWelcome = '',
  onAiSpeechRequested,
  getIntegritySignals
}: UseDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>(() => [
    {
      role: 'interviewer',
      content: initialWelcome,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [currentStage, setCurrentStage] = useState<InterviewStage>('INTRODUCTION');
  const [hasUnread, setHasUnread] = useState(false);

  const triggerCandidateTurn = useCallback(async (forcedText?: string, codeSnapshot = '') => {
    const textToSend = (forcedText !== undefined ? forcedText : chatInput).trim();
    if (!textToSend && !codeSnapshot) return;

    if (forcedText === undefined) setChatInput('');

    const candidateMsg: DialogueMessage = {
      role: 'candidate',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, candidateMsg]);
    setIsAiResponding(true);

    try {
      const integrity = getIntegritySignals ? getIntegritySignals() : undefined;

      await addMessageToSession(sessionId, {
        senderRole: 'CANDIDATE',
        content: textToSend,
        codeSnippet: codeSnapshot,
        messageType: 'EXPLANATION',
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
        sessionMode: isPlayground ? 'PLAYGROUND' : 'INTERVIEW',
        integritySignals: integrity
      });

      const replyText = aiResponse.interviewerReply || 'Thank you. Let us explore the next step.';
      const fullText = replyText + (aiResponse.followUpQuestion ? `\n\n${aiResponse.followUpQuestion}` : '');
      const aiMsg: DialogueMessage = {
        role: 'interviewer',
        content: fullText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          recommendedAction: aiResponse.recommendedAction || '',
          codeAnalysis: aiResponse.codeAnalysis || '',
          detectedIntent: aiResponse.detectedIntent || '',
          turnSummary: aiResponse.turnSummary || ''
        }
      };

      setMessages((prev) => [...prev, aiMsg]);
      setHasUnread(true);

      if (aiResponse.recommendedAction === 'ADVANCE_STAGE') {
        setCurrentStage((prev) => {
          if (prev === 'INTRODUCTION') return 'CORE_TECH';
          if (prev === 'CORE_TECH') return 'CODING_DSA';
          return 'SYSTEM_DESIGN';
        });
      }

      if (onAiSpeechRequested) {
        onAiSpeechRequested(fullText);
      }
    } catch (err: any) {
      console.warn('[useDialogue] Turn processing error:', err);
      const fallbackMsg: DialogueMessage = {
        role: 'interviewer',
        content: isPlayground
          ? 'I noted your input. How would you handle potential edge cases or scale constraints?'
          : 'Thank you for sharing your approach. How does your solution handle scale or boundary conditions?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setHasUnread(true);
    } finally {
      setIsAiResponding(false);
    }
  }, [chatInput, sessionId, provider, apiKey, isPlayground, questionContext, problemSlug, onAiSpeechRequested, getIntegritySignals]);

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
    triggerCandidateTurn
  };
}
