import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Bot
} from 'lucide-react';
import type {
  InterviewTrack,
  DifficultyLevel,
  ModelProvider,
  GenerateQuestionResponse,
  ResumeDocument
} from '../../types';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ConversationStage, type StageMessage } from './ConversationStage';
import { AnswerCaptureBar } from './AnswerCaptureBar';
import { ResumePanel } from './ResumePanel';
import { WebcamTile } from '../WebcamTile';
import { SelfTimer } from '../ide/SelfTimer';
import {
  processDialogueTurn,
  addMessageToSession,
  completeSession,
  getSessionResume
} from '../../services/api';
import { getPersona } from '../../lib/personas';

interface BehavioralStudioProps {
  sessionId: number;
  track: InterviewTrack;
  difficulty: DifficultyLevel;
  roleTitle: string;
  targetCompany?: string;
  jobDescription?: string;
  isPlayground?: boolean;
  provider: ModelProvider;
  apiKey?: string;
  initialQuestion?: GenerateQuestionResponse;
  candidateName?: string;
  onFinish: () => void;
  onBack?: () => void;
}

export const BehavioralStudio: React.FC<BehavioralStudioProps> = ({
  sessionId,
  track,
  difficulty,
  roleTitle,
  isPlayground = false,
  provider,
  apiKey,
  initialQuestion,
  candidateName = 'Candidate',
  onFinish,
  onBack
}) => {
  // Session Transcript & Messages
  const [messages, setMessages] = useState<StageMessage[]>([]);
  const currentQuestion = initialQuestion;
  const [activeResume, setActiveResume] = useState<ResumeDocument | null>(null);

  // Interaction State
  const [answerInput, setAnswerInput] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isSidePanelCollapsed, setIsSidePanelCollapsed] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);

  // Proctoring telemetry state (Interview mode only)
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const pasteCount = 0;

  // Timers & Audio Refs
  const recognitionRef = useRef<any>(null);
  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const hasInitializedGreetingRef = useRef(false);

  // --- 1. Text-to-Speech (TTS) Helper ---
  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/[*_#`]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsSpeakingNow(true);
      // Auto-mute candidate mic while AI speaks
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListening(false);
    };

    utterance.onend = () => {
      setIsSpeakingNow(false);
    };

    utterance.onerror = () => {
      setIsSpeakingNow(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // --- 2. Speech-to-Text (STT) Recognition ---
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const handleCandidateSubmitRef = useRef<() => Promise<void>>(async () => {});

  const startListening = useCallback(() => {
    if (!isSpeechSupported || isSpeakingNow || isAiResponding) return;

    try {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionClass) return;

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimStr = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalStr += trans + ' ';
          } else {
            interimStr += trans;
          }
        }

        if (finalStr) {
          setAnswerInput((prev) => {
            const updated = (prev + ' ' + finalStr).trim();
            // Voice trigger check: "that is my answer"
            if (/\b(that is my answer|that's my answer|submit my answer|submit answer)\b/i.test(updated)) {
              const cleaned = updated.replace(/\b(that is my answer|that's my answer|submit my answer|submit answer)\b/gi, '').trim();
              setTimeout(() => {
                void handleCandidateSubmitRef.current();
              }, 100);
              return cleaned;
            }
            return updated;
          });
          setInterimTranscript('');
        } else {
          setInterimTranscript(interimStr);
          // Check interim voice trigger as well
          if (/\b(that is my answer|that's my answer|submit my answer|submit answer)\b/i.test(interimStr)) {
            setTimeout(() => {
              void handleCandidateSubmitRef.current();
            }, 100);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition notice:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Microphone error:', err);
      setIsListening(false);
    }
  }, [isSpeechSupported, isSpeakingNow, isAiResponding]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // --- 3. Initial Mount & Greeting Flow ---
  useEffect(() => {
    let isMounted = true;

    const initStudio = async () => {
      // 1. Fetch Session Resume if already stored
      try {
        const storedResume = await getSessionResume(sessionId);
        if (storedResume && isMounted) {
          setActiveResume(storedResume);
        }
      } catch {
        // Ignore
      }

      // 2. Initial Question / Greeting
      if (hasInitializedGreetingRef.current) return;
      hasInitializedGreetingRef.current = true;

      const questionPrompt = initialQuestion?.problemStatement ||
        (track === 'RESUME_BASED'
          ? `Welcome ${candidateName}. Let's examine your background in distributed systems and cloud architecture. Tell me about the most complex microservice or data pipeline you engineered from your resume, the primary scaling bottlenecks you faced, and your architectural decisions.`
          : `Welcome ${candidateName}. In this behavioral and technical leadership assessment, we will explore how you handle complex engineering trade-offs, critical outages, and cross-functional team leadership. Describe a high-stakes technical disagreement or system failure you resolved, your specific ownership, and the final impact.`);

      const greetingTurn: StageMessage = {
        id: `turn_0_${Date.now()}`,
        role: 'interviewer',
        content: `${questionPrompt}\n\nFeel free to speak your answer into the microphone or type below. You can also update your resume in the right panel at any time to ground our discussion.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          turnSummary: 'Session Introduction & Grounded Problem Kickoff'
        }
      };

      if (isMounted) {
        setMessages([greetingTurn]);
        speakText(greetingTurn.content);
      }
    };

    void initStudio();

    return () => {
      isMounted = false;
      stopListening();
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [sessionId, track, candidateName, initialQuestion, speakText, stopListening]);

  // Window Focus Detection for proctoring
  useEffect(() => {
    if (isPlayground) return;

    const handleBlur = () => {
      setIsWindowBlurred(true);
      setTabSwitchCount((c) => c + 1);
    };
    const handleFocus = () => setIsWindowBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isPlayground]);

  // --- 4. Submit Candidate Response & AI Turn Progression ---
  const handleCandidateSubmit = async () => {
    const candidateText = answerInput.trim();
    if (!candidateText || isAiResponding || isSessionEnded) return;

    stopListening();
    setAnswerInput('');
    setInterimTranscript('');
    setIsAiResponding(true);

    const candidateMsg: StageMessage = {
      id: `turn_${messages.length + 1}_${Date.now()}`,
      role: 'candidate',
      content: candidateText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, candidateMsg]);

    // Persist Candidate Message to Session Document
    try {
      await addMessageToSession(sessionId, {
        senderRole: 'CANDIDATE',
        messageType: 'EXPLANATION',
        content: candidateText
      });
    } catch {
      // Ignore
    }

    // Call AI Orchestrator for Multi-Turn Behavioral Follow-Up
    try {
      const skillsContext = activeResume?.skills?.length
        ? `Grounded Candidate Skills: ${activeResume.skills.join(', ')}\nExperience: ${activeResume.yearsOfExperience || 4} years\nSummary: ${activeResume.summary || ''}`
        : 'Skills: Java, Distributed Systems, Microservices, Cloud Architecture';

      const dialogue = await processDialogueTurn({
        sessionId,
        questionContext: `[Track: ${track}] [Seniority: ${difficulty}] Role: ${roleTitle}\n${skillsContext}\nTarget Problem: ${currentQuestion?.title || 'Behavioral Architecture'}`,
        problemSlug: currentQuestion?.problemSlug || currentQuestion?.slug || 'behavioral-scenario',
        candidateExplanation: candidateText,
        candidateCode: candidateText,
        modelProvider: provider,
        apiKey,
        sessionMode: isPlayground ? 'PLAYGROUND' : 'INTERVIEW'
      });

      const replyText = `${dialogue.interviewerReply}\n\n${dialogue.followUpQuestion}`;
      const meta: Record<string, string> = {
        detectedIntent: dialogue.detectedIntent || 'EXPLAINING_APPROACH',
        turnSummary: dialogue.turnSummary || '',
        recommendedAction: dialogue.recommendedAction || 'PROBE_DEEPER'
      };

      const aiMsg: StageMessage = {
        id: `turn_${messages.length + 2}_${Date.now()}`,
        role: 'interviewer',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: meta
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(`${dialogue.interviewerReply}. ${dialogue.followUpQuestion}`);

      await addMessageToSession(sessionId, {
        senderRole: 'AI',
        messageType: 'FEEDBACK',
        content: replyText,
        metadata: meta
      });
    } catch {
      const fallbackReply =
        "Thank you for walking me through that scenario. That gives me great visibility into your decision-making.\n\nCould you elaborate on the specific trade-offs you considered, and how you measured the quantitative outcome or latency impact after the deployment?";

      const aiMsg: StageMessage = {
        id: `turn_${messages.length + 2}_${Date.now()}`,
        role: 'interviewer',
        content: fallbackReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: {
          turnSummary: 'Quantitative Impact & STAR Result Probe'
        }
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(fallbackReply);
    } finally {
      setIsAiResponding(false);
    }
  };

  useEffect(() => {
    handleCandidateSubmitRef.current = handleCandidateSubmit;
  });

  // --- 5. End Session ---
  const handleEndInterview = async () => {
    if (isSessionEnded) return;
    setIsSessionEnded(true);

    stopListening();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      await addMessageToSession(sessionId, {
        senderRole: 'AI',
        messageType: 'SYSTEM_EVENT',
        content: 'Candidate concluded Frontier Behavioral Studio session.'
      });
      await completeSession(sessionId);
    } catch {
      // Ignore
    }

    onFinish();
  };

  // Compile entire candidate transcript for STAR Guide live parsing
  const fullCandidateTranscript = messages
    .filter((m) => m.role === 'candidate')
    .map((m) => m.content)
    .join('\n') + ' ' + answerInput;

  return (
    <div className="flex flex-col h-screen bg-bg text-text overflow-hidden select-none">
      {/* TOP HEADER BAR */}
      <header className="h-12 bg-surface border-b border-border px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              title="Return to Setup Studio"
              className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 text-primary flex items-center justify-center font-bold">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-bold text-text truncate max-w-[200px] sm:max-w-xs">
              Frontier Behavioral Studio
            </span>
          </div>

          <Chip
            variant={isPlayground ? 'neutral' : 'warning'}
            size="sm"
            className="hidden sm:inline-flex"
          >
            {isPlayground ? 'Playground Practice' : 'Proctored Assessment'}
          </Chip>

          <Chip variant="neutral" size="sm" className="hidden md:inline-flex font-mono text-[10px]">
            {difficulty}
          </Chip>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SelfTimer />
          <ThemeToggle />

          <Button
            variant={isPlayground ? 'primary' : 'danger'}
            size="sm"
            onClick={handleEndInterview}
            className="font-bold text-xs"
          >
            {isPlayground ? 'Finish Practice' : 'End & View Report'}
          </Button>
        </div>
      </header>

      {/* PROCTORED MODE WEBCAM TILE (INTERVIEW MODE ONLY) */}
      {!isPlayground && (
        <WebcamTile
          isTabBlurred={isWindowBlurred}
          tabSwitchCount={tabSwitchCount}
          pasteCount={pasteCount}
          allowMinimize={true}
        />
      )}

      {/* MAIN STUDIO STAGE: CONVERSATION STAGE + RESUME/STAR PANEL */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* CENTER CONVERSATION STAGE + CAPTURE BAR */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          <ConversationStage
            messages={messages}
            isSpeakingNow={isSpeakingNow}
            isListening={isListening}
            isAiResponding={isAiResponding}
            onReplaySpeech={(text) => speakText(text)}
            targetRole={roleTitle}
            personaName={getPersona(isPlayground).name}
            personaTitle={getPersona(isPlayground).title}
            className="flex-1"
          />

          <AnswerCaptureBar
            input={answerInput}
            onChange={(val) => setAnswerInput(val)}
            onSubmit={() => void handleCandidateSubmit()}
            isListening={isListening}
            onToggleListen={toggleListening}
            isAiSpeaking={isSpeakingNow}
            isAiResponding={isAiResponding}
            interimTranscript={interimTranscript}
          />
        </div>

        {/* RIGHT RESUME & STAR SIDEBAR */}
        <ResumePanel
          sessionId={sessionId}
          resume={activeResume}
          onUpdateResume={(newResume) => {
            setActiveResume(newResume);
            // Announce resume grounding update
            speakText(`I have grounded our interview with your updated resume profile. We will focus on your projects in ${newResume.skills?.slice(0, 4).join(', ') || 'backend architecture'}.`);
          }}
          isPlayground={isPlayground}
          transcriptText={fullCandidateTranscript}
          isCollapsed={isSidePanelCollapsed}
          onToggleCollapse={() => setIsSidePanelCollapsed(!isSidePanelCollapsed)}
        />
      </div>
    </div>
  );
};
