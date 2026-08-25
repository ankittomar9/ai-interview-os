import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { GenerateQuestionResponse, ModelProvider } from '../types';
import {
  addMessageToSession,
  completeSession,
  processDialogueTurn,
  transcribeAudio,
  getStoredApiKey,
  executeCode,
  listQuestions,
  type TestCaseResult
} from '../services/api';
import { useProctorSentinel } from '../hooks/useProctorSentinel';
import { StageStepper, type InterviewStage } from './StageStepper';
import { WebcamTile } from './WebcamTile';
import { HldWhiteboardCanvas } from './HldWhiteboardCanvas';
import { EmbeddedWorkspace } from './workspace/EmbeddedWorkspace';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { ThemeToggle } from './ui/ThemeToggle';
import { StatusBar } from './ide/StatusBar';
import { QuestionRail, type QuestionRailItem, type QuestionStatus } from './ide/QuestionRail';
import { ProblemPanel } from './ide/ProblemPanel';
import { TestcasePanel, type TestCaseItem, type ExecutionResult } from './ide/TestcasePanel';
import { FloatingAiOrb } from './ai/FloatingAiOrb';
import { AiAssistantPanel } from './ai/AiAssistantPanel';
import { SelfTimer } from './ide/SelfTimer';
import { usePlaygroundProgress } from '../hooks/usePlaygroundProgress';
import { useTheme } from './theme-provider';
import { defineMonacoThemes } from '../lib/syntax-themes';
import { TrackNavMenu } from './ui/TrackNavMenu';
import { saveSubmission, type SubmissionStatus, type SubmissionCaseResult } from '../lib/submissions';
import {
  Timer,
  Play,
  Code2,
  Mic,
  ShieldAlert,
  Layers,
  ArrowLeft,
  CloudUpload
} from 'lucide-react';

interface Props {
  sessionId: number;
  question: GenerateQuestionResponse;
  initialQuestionsList?: GenerateQuestionResponse[];
  provider: ModelProvider;
  apiKey: string;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  onFinish: () => void;
}

const END_PHRASES = [
  "that's my answer",
  "that is my answer",
  "over to you",
  "i'm done",
  "i am done",
  "that's all",
  "that is all",
  "that's it",
  "that is it",
  "back to you"
];

// Candidate thinking buffer; AI replies ~25s after last word
const SILENCE_WINDOW_MS = 25_000;

let cachedTabId: string | null = null;
function getSessionTabId(): string {
  if (!cachedTabId && typeof window !== 'undefined') {
    cachedTabId = `tab-${Math.random().toString(36).slice(2, 9)}`;
  }
  return cachedTabId || 'tab-main';
}

export const InterviewRoom: React.FC<Props> = ({
  sessionId,
  question: initialQuestion,
  initialQuestionsList,
  provider,
  apiKey,
  sessionMode = 'INTERVIEW',
  onFinish
}) => {
  const isPlayground = sessionMode === 'PLAYGROUND';
  const { recordRun } = usePlaygroundProgress();
  const { resolvedTheme } = useTheme();

  const getMonacoTheme = (themeId: string) => {
    if (themeId === 'ide-slate') return 'ide-slate';
    if (themeId === 'ide-paper') return 'ide-paper';
    if (themeId === 'deep-ocean') return 'deep-ocean';
    if (themeId === 'material-oceanic') return 'material-oceanic';
    if (themeId === 'warm-charcoal') return 'warm-charcoal';
    if (themeId === 'light-studio') return 'vs';
    return 'vs-dark';
  };

  // --- Multi-Question State & Catalog ---
  const [questionsList, setQuestionsList] = useState<GenerateQuestionResponse[]>(() => {
    if (initialQuestionsList && initialQuestionsList.length > 0) {
      return initialQuestionsList;
    }
    return [initialQuestion];
  });
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const currentQuestion = questionsList[activeQuestionIdx] || initialQuestion;

  const [statusMap, setStatusMap] = useState<Record<string, QuestionStatus>>(() => {
    return { [initialQuestion.slug || 'q1']: 'UNTOUCHED' };
  });

  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});
  const [hintsRevealedMap, setHintsRevealedMap] = useState<Record<string, number>>({});

  const [allCatalogQuestions, setAllCatalogQuestions] = useState<GenerateQuestionResponse[]>([]);

  useEffect(() => {
    listQuestions({})
      .then((qs) => {
        if (qs && qs.length > 0) {
          setAllCatalogQuestions(qs);
        }
      })
      .catch((err) => {
        console.warn('Could not load multi-question catalog:', err);
      });
  }, []);

  useEffect(() => {
    if (initialQuestionsList && initialQuestionsList.length > 1) return;
    listQuestions({ track: initialQuestion.track })
      .then((qs) => {
        if (qs && qs.length > 0) {
          const others = qs.filter((q) => q.slug !== initialQuestion.slug);
          const combined = [initialQuestion, ...others].slice(0, 5);
          setQuestionsList(combined);
        }
      })
      .catch((err) => {
        console.warn('Could not load track questions:', err);
      });
  }, [initialQuestion, initialQuestionsList]);

  const handleSwitchTrack = async (trackKey: string) => {
    if (!isPlayground) return;
    try {
      let filtered = trackKey === 'ALL'
        ? allCatalogQuestions
        : allCatalogQuestions.filter((q) => q.track === trackKey);

      if (!filtered || filtered.length === 0) {
        filtered = await listQuestions(trackKey === 'ALL' ? {} : { track: trackKey });
      }

      if (filtered && filtered.length > 0) {
        setQuestionsList(filtered);
        setActiveQuestionIdx(0);
        const nextQ = filtered[0];
        const savedCode = localStorage.getItem(`code.${sessionId}.${nextQ.slug || 'q1'}`);
        setCode(savedCode || getStarterForLang(nextQ, nextQ.track === 'SQL' ? 'sql' : language));
      }
    } catch (err) {
      console.error('Failed to switch track:', err);
    }
  };

  // --- Natural Stage Mapping ---
  const getStageForQuestion = (q: GenerateQuestionResponse): InterviewStage => {
    const track = q.track;
    if (track === 'SYSTEM_DESIGN') return 'SYSTEM_DESIGN';
    if (track === 'BEHAVIORAL_STAR' || track === 'RESUME_BASED') return 'CORE_TECH';
    return 'CODING_DSA';
  };

  // --- State: Timer & Stages ---
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [stageOverride, setStageOverride] = useState<InterviewStage | null>(null);

  const currentStage: InterviewStage = stageOverride || getStageForQuestion(currentQuestion);

  const handleStageClick = (targetStage: InterviewStage) => {
    if (!isPlayground) return;
    setStageOverride(targetStage);

    if (targetStage === 'INTRODUCTION') {
      setActiveQuestionIdx(0);
      return;
    }

    // Find first matching question in current list
    const matchIdx = questionsList.findIndex((q) => getStageForQuestion(q) === targetStage);
    if (matchIdx !== -1) {
      handleSelectQuestion(matchIdx);
    } else {
      // If not in current list, search allCatalogQuestions
      const catIdx = allCatalogQuestions.findIndex((q) => getStageForQuestion(q) === targetStage);
      if (catIdx !== -1) {
        const matchTrack = allCatalogQuestions[catIdx].track;
        void handleSwitchTrack(matchTrack);
      }
    }
  };

  const isSqlTrack = currentQuestion.track === 'SQL';
  const isResumeTrack = currentQuestion.track === 'RESUME_BASED';

  const getStarterForLang = (q: GenerateQuestionResponse, lang: string) => {
    if (q.starterCodeMap && q.starterCodeMap[lang]) {
      return q.starterCodeMap[lang];
    }
    if (q.track === 'SQL') {
      return (
        q.starterCode ||
        '-- Write your SQL queries, schema designs, or joins below:\nSELECT \n  c.id AS customer_id,\n  c.name,\n  COUNT(o.id) AS total_orders,\n  COALESCE(SUM(o.total_amount), 0) AS total_spent\nFROM customers c\nLEFT JOIN orders o ON c.id = o.customer_id\nGROUP BY c.id, c.name\nORDER BY total_spent DESC;\n'
      );
    }
    if (q.track === 'RESUME_BASED') {
      return (
        q.starterCode ||
        '// Resume-based assessment thought scratchpad & solution notes\n// Ground your answers in specific engineering projects, leadership scenarios, and architectural choices from your resume.\n'
      );
    }
    return q.starterCode || '// Write your standard I/O solution here\n';
  };

  // --- State: Code & Buffer per Question ---
  const [language, setLanguage] = useState<'java' | 'python' | 'javascript'>('java');
  const [code, setCode] = useState<string>(() => {
    const saved = localStorage.getItem(`code.${sessionId}.${currentQuestion.slug || 'q1'}`);
    return saved || getStarterForLang(currentQuestion, isSqlTrack ? 'sql' : 'java');
  });

  const handleSelectQuestion = (idx: number) => {
    if (idx === activeQuestionIdx || !questionsList[idx]) return;
    localStorage.setItem(`code.${sessionId}.${currentQuestion.slug || 'q1'}`, code);

    const nextQ = questionsList[idx];
    setStageOverride(null);
    setActiveQuestionIdx(idx);

    const saved = localStorage.getItem(`code.${sessionId}.${nextQ.slug || 'q1'}`);
    setCode(saved || getStarterForLang(nextQ, isSqlTrack ? 'sql' : language));
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    localStorage.setItem(`code.${sessionId}.${currentQuestion.slug || 'q1'}`, newCode);
    const slug = currentQuestion.slug || `q${activeQuestionIdx + 1}`;
    if (statusMap[slug] !== 'PASSED') {
      setStatusMap((prev) => ({ ...prev, [slug]: 'ATTEMPTED' }));
    }
  };

  // --- State: Editor Tabs & Whiteboard ---
  const [editorTab, setEditorTab] = useState<'solution' | 'tests' | 'whiteboard'>('solution');

  // --- State: Test Execution & Cases ---
  const [customCases, setCustomCases] = useState<TestCaseItem[]>([]);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);

  const sampleTestItems: TestCaseItem[] = (currentQuestion.sampleTests || []).map((t, i) => ({
    id: i,
    input: t.input || '',
    expectedOutput: t.expectedOutput || ''
  }));

  const allTestCases = [...sampleTestItems, ...customCases];

  // --- State: Floating AI Assistant Panel (Open-on-entry with 10s auto-collapse) ---
  const coachCollapseKey = `ai.coach.collapsed.${sessionId}`;
  const [isAiPanelOpen, setIsAiPanelOpen] = useState<boolean>(() => {
    const saved = sessionStorage.getItem(coachCollapseKey);
    return saved !== 'true'; // Open by default on first entry in both modes
  });
  const [hasUnread, setHasUnread] = useState<boolean>(false);
  const isAiPanelOpenRef = useRef<boolean>(isAiPanelOpen);
  useEffect(() => {
    isAiPanelOpenRef.current = isAiPanelOpen;
  }, [isAiPanelOpen]);

  useEffect(() => {
    if (sessionStorage.getItem(coachCollapseKey) === 'true') {
      return;
    }

    const timer = setTimeout(() => {
      setIsAiPanelOpen(false);
      sessionStorage.setItem(coachCollapseKey, 'true');
    }, 10000);

    return () => clearTimeout(timer);
  }, [sessionId, coachCollapseKey]);

  const toggleAiPanel = () => {
    setIsAiPanelOpen((prev) => {
      const next = !prev;
      sessionStorage.setItem(coachCollapseKey, 'true');
      sessionStorage.setItem('ai.panel.room', String(next));
      if (next) setHasUnread(false);
      return next;
    });
  };

  // --- State: Caret Position & Modal Guard ---
  const [cursor, setCursor] = useState<{ ln: number; col: number }>({ ln: 1, col: 1 });
  const [showWorkspaceConflict, setShowWorkspaceConflict] = useState<boolean>(false);

  // --- Workspace Lifecycle Guard (Client-side Tab Collision Prevention) ---
  useEffect(() => {
    const currentTab = getSessionTabId();
    const key = `ws.active.${sessionId}`;
    const existing = sessionStorage.getItem(key);
    if (existing && existing !== currentTab) {
      setTimeout(() => {
        setShowWorkspaceConflict(true);
      }, 0);
    } else {
      sessionStorage.setItem(key, currentTab);
    }
  }, [sessionId]);

  // --- State: Conversation & Dialogue ---
  const [messages, setMessages] = useState<Array<{
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp?: string;
    metadata?: Record<string, string>;
  }>>(() => [
    {
      role: 'interviewer',
      content: isPlayground
        ? `Welcome to the Playground Practice Arena! 🧪\n\nI am your AI Socratic Coach. Feel free to explore solutions, request hints, or ask me for code explanations at any time.`
        : `Welcome to your technical assessment! 👋\n\nI am your AI Principal Interviewer. Let's begin with a brief introduction. Please tell me about your engineering background and recent backend systems you've built.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // --- Voice Management (Echo-Safe Full Duplex) ---
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSessionEndedRef = useRef(false);
  const hasSpokenIntroRef = useRef(false);
  const latestTranscriptRef = useRef<string>('');
  const chatInputRef = useRef<string>('');

  useEffect(() => {
    chatInputRef.current = chatInput;
  }, [chatInput]);

  const startListeningRef = useRef<() => void>(() => {});
  const triggerCandidateTurnRef = useRef<(text?: string) => Promise<void>>(async () => {});
  const handleEndInterviewRef = useRef<(isAuto?: boolean) => Promise<void>>(async () => {});

  // --- Execution Status ---
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');

  // --- Proctor Sentinel Active Monitoring ---
  const { tabSwitches, pasteDumps } = useProctorSentinel(sessionId, !isPlayground);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  // --- Echo-Safe Text-To-Speech (AI Voice) ---
  const speakText = useCallback((text: string) => {
    if (isSessionEndedRef.current || !voiceOutputEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*_#`]/g, '')
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Google US English') ||
        v.name.includes('Samantha') ||
        v.name.includes('Victoria') ||
        v.name.includes('Natural') ||
        v.name.includes('English')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsAiSpeaking(true);
    };

    utterance.onend = () => {
      setIsAiSpeaking(false);
      if (!isSessionEndedRef.current) {
        setTimeout(() => {
          if (!isSessionEndedRef.current && startListeningRef.current) {
            startListeningRef.current();
          }
        }, 400);
      }
    };

    utterance.onerror = () => {
      setIsAiSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voiceOutputEnabled]);

  // Unlocked Greeting TTS
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasSpokenIntroRef.current && messages.length > 0 && messages[0].role === 'interviewer') {
        hasSpokenIntroRef.current = true;
        speakText(messages[0].content);
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.speechSynthesis?.cancel();
    };
  }, [messages, speakText]);

  // --- Candidate Audio Streaming & Speech-To-Text ---
  const stopListening = useCallback(() => {
    setIsListening(false);
    setIsSpeakingNow(false);

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isSessionEndedRef.current || isAiSpeaking || isListening) return;

    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const groqApiKey = getStoredApiKey('groq');
        if (groqApiKey && audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          try {
            const result = await transcribeAudio(audioBlob, groqApiKey);
            if (result && result.transcript && result.transcript.trim().length > 0) {
              const text = result.transcript.trim();
              setChatInput(text);
              latestTranscriptRef.current = text;
              setTimeout(() => {
                if (triggerCandidateTurnRef.current) {
                  void triggerCandidateTurnRef.current(text);
                  latestTranscriptRef.current = '';
                }
              }, 200);
              return;
            }
          } catch (error) {
            console.warn('Groq Whisper transcription notice:', error);
          }
        }

        const textToSubmit = (latestTranscriptRef.current || chatInputRef.current || '').trim();
        if (textToSubmit.length > 0 && triggerCandidateTurnRef.current) {
          void triggerCandidateTurnRef.current(textToSubmit);
          latestTranscriptRef.current = '';
        }
      };

      mediaRecorder.start(250);

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const resetSilenceTimeout = () => {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
          }
          // Auto-submit if candidate pauses for SILENCE_WINDOW_MS (25s)
          silenceTimeoutRef.current = setTimeout(() => {
            stopListening();
            const textToSubmit = (latestTranscriptRef.current || chatInputRef.current || '').trim();
            if (textToSubmit.length > 0 && triggerCandidateTurnRef.current) {
              void triggerCandidateTurnRef.current(textToSubmit);
              latestTranscriptRef.current = '';
            }
          }, SILENCE_WINDOW_MS);
        };

        recognition.onstart = () => {
          setIsListening(true);
          resetSilenceTimeout();
        };

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            fullTranscript += event.results[i][0].transcript;
          }

          setIsSpeakingNow(true);
          latestTranscriptRef.current = fullTranscript;
          chatInputRef.current = fullTranscript;
          setChatInput(fullTranscript);
          resetSilenceTimeout();

          const lower = fullTranscript.toLowerCase().trim();
          const matchesWakePhrase = END_PHRASES.some((phrase) => lower.endsWith(phrase));
          if (matchesWakePhrase) {
            stopListening();
            const textToSubmit = (fullTranscript || latestTranscriptRef.current || chatInputRef.current || '').trim();
            if (textToSubmit.length > 0 && triggerCandidateTurnRef.current) {
              void triggerCandidateTurnRef.current(textToSubmit);
              latestTranscriptRef.current = '';
            }
          }
        };

        recognition.onerror = () => {
          setIsSpeakingNow(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setIsSpeakingNow(false);
        };

        recognition.start();
      } else {
        setIsListening(true);
      }
    } catch (err) {
      console.warn('Microphone access notice:', err);
      setIsListening(false);
    }
  }, [isAiSpeaking, isListening, stopListening]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Window Focus Detection
  useEffect(() => {
    const handleBlur = () => setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void handleEndInterviewRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- End Interview ---
  const handleEndInterview = useCallback(async (isAuto = false) => {
    if (isSessionEndedRef.current) return;
    isSessionEndedRef.current = true;

    stopListening();
    window.speechSynthesis?.cancel();

    try {
      await addMessageToSession(sessionId, {
        senderRole: 'AI',
        messageType: 'SYSTEM_EVENT',
        content: isAuto
          ? 'Interview concluded automatically as time expired.'
          : 'Candidate concluded technical assessment session.'
      });

      await completeSession(sessionId);
    } catch {
      // Ignore
    }

    onFinish();
  }, [sessionId, stopListening, onFinish]);

  // --- Candidate Interaction Turn ---
  const triggerCandidateTurn = async (forcedText?: string) => {
    const candidateText = (forcedText || chatInput).trim();
    if (!candidateText || isAiResponding) return;

    stopListening();
    setChatInput('');

    const candidateTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { role: 'candidate', content: candidateText, timestamp: candidateTimestamp }
    ]);

    try {
      await addMessageToSession(sessionId, {
        senderRole: 'CANDIDATE',
        messageType: 'EXPLANATION',
        content: candidateText,
        codeSnippet: code
      });
    } catch {
      // Ignore
    }

    setIsAiResponding(true);

    const latestExecPayload = executionResult ? {
      status: (executionResult.status === 'passed' || testStatus === 'passed') ? 'PASSED' : 'FAILED',
      passedTests: executionResult.passedTests !== undefined ? executionResult.passedTests : (testStatus === 'passed' ? 1 : 0),
      totalTests: executionResult.totalTests !== undefined ? executionResult.totalTests : 1,
      executionTimeMs: executionResult.executionTimeMs || 0,
      memoryUsedMb: executionResult.memoryUsedMb || 0
    } : (statusMap[currentQuestion.slug || 'q1'] === 'PASSED') ? {
      status: 'PASSED',
      passedTests: 1,
      totalTests: 1,
      executionTimeMs: 0,
      memoryUsedMb: 0
    } : undefined;

    try {
      const contextPayload = `Problem: ${currentQuestion.title}\nDescription: ${currentQuestion.problemStatement}\n[Current Stage: ${currentStage}]`;

      const dialogue = await processDialogueTurn({
        sessionId,
        questionContext: contextPayload,
        problemSlug: currentQuestion.problemSlug || currentQuestion.slug,
        candidateExplanation: candidateText,
        candidateCode: code,
        modelProvider: provider,
        apiKey,
        sessionMode: isPlayground ? 'PLAYGROUND' : 'INTERVIEW',
        latestExecution: latestExecPayload
      });

      // Adaptive Stage Progression
      if (dialogue.recommendedAction === 'ADVANCE_STAGE') {
        if (currentStage === 'INTRODUCTION') {
          setStageOverride('CORE_TECH');
        } else if (currentStage === 'CORE_TECH') {
          setStageOverride('CODING_DSA');
        } else if (currentStage === 'CODING_DSA') {
          setStageOverride('SYSTEM_DESIGN');
        }
      } else {
        // Fallback heuristic
        if (currentStage === 'INTRODUCTION') {
          setStageOverride('CORE_TECH');
        } else if (currentStage === 'CORE_TECH' && messages.length >= 4) {
          setStageOverride('CODING_DSA');
        }
      }

      const replyText = `${dialogue.interviewerReply}\n\n${dialogue.followUpQuestion}`;
      const meta: Record<string, string> = {
        detectedIntent: dialogue.detectedIntent || 'EXPLAINING_APPROACH',
        turnSummary: dialogue.turnSummary || '',
        recommendedAction: dialogue.recommendedAction || 'PROBE_DEEPER'
      };

      setMessages((prev) => [
        ...prev,
        {
          role: 'interviewer',
          content: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          metadata: meta
        }
      ]);

      if (!isAiPanelOpenRef.current) {
        setHasUnread(true);
      }

      speakText(`${dialogue.interviewerReply}. ${dialogue.followUpQuestion}`);

      await addMessageToSession(sessionId, {
        senderRole: 'AI',
        messageType: 'FEEDBACK',
        content: replyText,
        metadata: meta
      });
    } catch {
      let fallback: string;
      const isAllPassed = latestExecPayload?.status === 'PASSED' ||
        (latestExecPayload && latestExecPayload.passedTests > 0 && latestExecPayload.passedTests === latestExecPayload.totalTests);

      if (isAllPassed) {
        fallback = "Your solution is correct and passes all test cases! Excellent work.\n\nYou can now move to the next question using the Question Rail on the left, or finish and submit the practice session.";
      } else {
        fallback = "Thank you for sharing your approach. I see your logic taking shape. How would you optimize this solution for higher throughput or handle edge cases where input is empty or scaled?";
      }

      setMessages((prev) => [
        ...prev,
        { role: 'interviewer', content: fallback, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      if (!isAiPanelOpenRef.current) {
        setHasUnread(true);
      }
      speakText(fallback);
    } finally {
      setIsAiResponding(false);
    }
  };

  useEffect(() => {
    triggerCandidateTurnRef.current = triggerCandidateTurn;
  });

  // Sandbox Test Runner (DSA Judge0, LLD Maven, and SQL PostgreSQL 13)
  const handleRunCode = async () => {
    setTestStatus('running');

    try {
      const lang = (currentQuestion.track === 'SQL' || isSqlTrack) ? 'sql' :
                   language.toLowerCase().includes('python') ? 'python' :
                   language.toLowerCase().includes('script') ? 'javascript' : 'java';

      const slug = currentQuestion.problemSlug || currentQuestion.slug || currentQuestion.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const result = await executeCode(sessionId, {
        language: lang,
        codeSnippet: code,
        problemSlug: slug
      });

      let verdictTitle: string;
      let submissionStatus: SubmissionStatus;

      const isPass = result.status === 'PASSED' || result.status === 'ACCEPTED';
      if (result.status === 'COMPILE_ERROR' || result.status === 'SYNTAX_ERROR') {
        verdictTitle = result.status === 'SYNTAX_ERROR' ? 'Syntax Error' : 'Compile Error';
        submissionStatus = 'Compile Error';
        setTestStatus('failed');
        setExecutionResult({
          status: 'error',
          verdictTitle,
          executionTimeMs: result.executionTimeMs || 0,
          memoryUsedMb: result.memoryUsedMb || 0,
          rawOutput: result.compilerOutput || result.stderr || 'Compilation failed.'
        });
      } else if (isPass) {
        verdictTitle = 'Accepted';
        submissionStatus = 'Accepted';
        setTestStatus('passed');
        const caseItems: TestCaseItem[] = (result.testResults || []).map((t: TestCaseResult, idx: number) => ({
          id: idx,
          input: t.name || `Case ${idx + 1}`,
          expectedOutput: t.expectedOutput || 'Match',
          actualOutput: t.actualOutput || 'Match',
          passed: t.status === 'PASS',
          executionTimeMs: t.durationMs,
          error: t.error
        }));
        setExecutionResult({
          status: 'passed',
          verdictTitle: 'Accepted',
          executionTimeMs: result.executionTimeMs,
          memoryUsedMb: result.memoryUsedMb,
          passedTests: result.passedTests,
          totalTests: result.totalTests || (caseItems.length > 0 ? caseItems.length : 1),
          cases: caseItems,
          rawOutput: result.stdout || '🎉 All test cases passed successfully!'
        });
      } else {
        verdictTitle =
          result.status === 'TIMEOUT' ? 'Time Limit Exceeded' :
          result.status === 'ENGINE_UNAVAILABLE' ? 'Engine Unavailable' :
          result.status === 'RUNTIME_ERROR' ? 'Runtime Error' : 'Wrong Answer';
        submissionStatus =
          result.status === 'TIMEOUT' ? 'Time Limit Exceeded' :
          result.status === 'ENGINE_UNAVAILABLE' ? 'Engine Unavailable' :
          result.status === 'RUNTIME_ERROR' ? 'Runtime Error' : 'Wrong Answer';

        setTestStatus('failed');
        const caseItems: TestCaseItem[] = (result.testResults || []).map((t: TestCaseResult, idx: number) => ({
          id: idx,
          input: t.name || `Case ${idx + 1}`,
          expectedOutput: t.expectedOutput || 'Expected',
          actualOutput: t.actualOutput || t.error || 'Failed',
          passed: t.status === 'PASS',
          executionTimeMs: t.durationMs,
          error: t.error
        }));
        setExecutionResult({
          status: result.status === 'RUNTIME_ERROR' || result.status === 'ENGINE_UNAVAILABLE' ? 'error' : 'failed',
          verdictTitle,
          executionTimeMs: result.executionTimeMs || 0,
          memoryUsedMb: result.memoryUsedMb || 0,
          passedTests: result.passedTests || 0,
          totalTests: result.totalTests || (caseItems.length > 0 ? caseItems.length : 1),
          cases: caseItems,
          rawOutput: result.compilerOutput || result.stderr || result.stdout || 'Execution failed'
        });
      }

      // Record submission entry into session-scoped history
      const subCases: SubmissionCaseResult[] = (result.testResults || []).map((t: TestCaseResult) => ({
        name: t.name,
        passed: t.status === 'PASS',
        input: t.input,
        expectedOutput: t.expectedOutput,
        actualOutput: t.actualOutput,
        error: t.error,
        isHidden: t.isHidden
      }));

      saveSubmission(sessionId, slug, {
        language: lang,
        status: submissionStatus,
        runtimeMs: result.executionTimeMs || 0,
        memoryMb: result.memoryUsedMb || 0,
        passedTests: result.passedTests || 0,
        totalTests: result.totalTests || (subCases.length > 0 ? subCases.length : 1),
        rawOutput: result.stdout || result.stderr,
        compilerOutput: result.compilerOutput || (result.status === 'RUNTIME_ERROR' ? result.stderr : undefined),
        cases: subCases
      });

      if (isPlayground) {
        recordRun(slug, isPass, result.executionTimeMs, result.memoryUsedMb);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setExecutionResult({
        status: 'error',
        verdictTitle: 'Execution Error',
        executionTimeMs: 0,
        memoryUsedMb: 0,
        rawOutput: `[Execution Error] Sandbox unreachable: ${err.message || 'Unknown network error'}`
      });
    }
  };

  const handleSubmitSolution = async () => {
    const slug = currentQuestion.slug || `q${activeQuestionIdx + 1}`;
    setStatusMap((prev) => ({ ...prev, [slug]: 'PASSED' }));

    await triggerCandidateTurn(
      isSqlTrack
        ? 'I have completed and submitted my SQL queries. All test cases passed successfully.'
        : isResumeTrack
        ? 'I have finalized my explanation for this resume-grounded question.'
        : 'I have completed and submitted my implementation. All test cases passed successfully.'
    );
  };

  const railItems: QuestionRailItem[] = questionsList.map((q, idx) => ({
    slug: q.slug || `q${idx + 1}`,
    title: q.title,
    difficulty: q.difficulty,
    status: statusMap[q.slug || `q${idx + 1}`] || 'UNTOUCHED'
  }));

  const currentCodeExt = language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'java';

  return (
    <div className="flex flex-col h-screen bg-bg text-text overflow-hidden select-none">
      {showWorkspaceConflict && (
        <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl select-text">
            <div className="flex items-center gap-2.5 text-warning font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              <span>Workspace Session Active</span>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              A workspace is already active for this session in another browser tab.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowWorkspaceConflict(false)}>
                Dismiss
              </Button>
              <Button variant="primary" size="sm" onClick={() => {
                  sessionStorage.setItem(`ws.active.${sessionId}`, getSessionTabId());
                  setShowWorkspaceConflict(false);
                }}>
                Take Over Workspace
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="h-12 bg-surface border-b border-border flex items-center justify-between px-3 sm:px-4 z-20 shrink-0 gap-3 min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
          <TrackNavMenu
            isPlayground={isPlayground}
            activeTrack={currentQuestion.track}
            onSelectTrack={handleSwitchTrack}
            catalogQuestions={allCatalogQuestions.length > 0 ? allCatalogQuestions : questionsList}
          />
          <button type="button" onClick={() => void handleEndInterview()} className="p-1 rounded-md text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>

          {/* Mode Badge */}
          {isPlayground ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span>Playground Mode</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <span>Interview Mode</span>
            </div>
          )}

          <div className="w-6 h-6 rounded-md bg-elevated border border-border flex items-center justify-center text-primary shrink-0">
            <Code2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-text truncate min-w-0">
            {activeQuestionIdx + 1}. {currentQuestion.title}
          </span>
          <Chip variant="success" size="sm" className="shrink-0">{currentQuestion.difficulty || 'Easy'}</Chip>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {isPlayground ? (
            <SelfTimer defaultMinutes={45} onExpire={() => {}} />
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-elevated border border-border text-xs font-mono font-bold text-text shrink-0">
              <Timer className={`w-3.5 h-3.5 ${timeLeft < 300 ? 'text-danger' : 'text-text-3'}`} />
              <span className={timeLeft < 300 ? 'text-danger' : 'text-text'}>{formatTime(timeLeft)}</span>
            </div>
          )}

          {!isSqlTrack && !isResumeTrack && (
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="hidden md:block bg-elevated text-text border border-border rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shrink-0"
            >
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          )}

          <ThemeToggle size="sm" />
          {!isResumeTrack && (
            <Button variant="secondary" size="sm" icon={<Play className="w-3 h-3 text-text" />} onClick={handleRunCode} loading={testStatus === 'running'}>
              <span className="hidden sm:inline">Run</span>
            </Button>
          )}
          <Button variant="primary" size="sm" icon={<CloudUpload className="w-3.5 h-3.5" />} onClick={handleSubmitSolution}>
            Submit
          </Button>
        </div>
      </header>

      <div className="h-8 bg-elevated border-b border-border flex items-center justify-between px-3 text-xs shrink-0 select-none">
        <span className="px-2 py-0.5 rounded bg-surface border border-border text-text-2 font-mono text-[11px] font-bold">
          {isPlayground ? 'Practice Item' : 'Assignment'} {activeQuestionIdx + 1}/{questionsList.length}
        </span>
        <div className="flex items-center gap-2">
          <Chip variant={isSpeakingNow ? 'success' : isListening ? 'warning' : 'neutral'} size="sm" icon={<Mic className="w-3 h-3" />}>
            {isSpeakingNow ? 'Speaking' : isListening ? 'Mic Active' : 'Mic Ready'}
          </Chip>
          <button type="button" onClick={() => void handleEndInterview(false)} className={`text-[11px] font-semibold hover:underline pl-1 cursor-pointer ${isPlayground ? 'text-primary' : 'text-danger'}`}>
            {isPlayground ? 'Finish Practice' : 'End & Report'}
          </button>
        </div>
      </div>

      <StageStepper
        currentStage={currentStage}
        isPlayground={isPlayground}
        onStageClick={handleStageClick}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <QuestionRail items={railItems} selectedIndex={activeQuestionIdx} onSelect={handleSelectQuestion} className="w-12 shrink-0 border-r border-border h-full" />

        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <Group orientation="horizontal" id="arena-h-v2" className="h-full w-full flex-1 min-w-0">
            <Panel defaultSize="32%" minSize="24%" maxSize="45%" id="problem-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
              <ProblemPanel
                question={currentQuestion}
                sessionId={sessionId}
                isPracticeMode={isPlayground}
                hasRunAttempt={testStatus !== 'idle'}
                isSolved={statusMap[currentQuestion.slug || `q${activeQuestionIdx + 1}`] === 'PASSED'}
                isBookmarked={!!bookmarkedMap[currentQuestion.slug || 'q1']}
                onToggleBookmark={() => {
                  const s = currentQuestion.slug || 'q1';
                  setBookmarkedMap((prev) => ({ ...prev, [s]: !prev[s] }));
                }}
                hintsRevealed={hintsRevealedMap[currentQuestion.slug || 'q1'] || 0}
                onRevealHint={() => {
                  const s = currentQuestion.slug || 'q1';
                  setHintsRevealedMap((prev) => ({ ...prev, [s]: (prev[s] || 0) + 1 }));
                }}
              />
            </Panel>

            <Separator className="w-[3px] bg-border/60 hover:bg-primary/60 cursor-col-resize relative flex items-center justify-center z-10 select-none" />

            <Panel defaultSize="68%" minSize="50%" id="workspace-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
              {currentQuestion.starterFiles && Object.keys(currentQuestion.starterFiles).length > 0 ? (
                <EmbeddedWorkspace
                  key={currentQuestion.problemSlug || currentQuestion.slug || 'lld-service'}
                  sessionId={sessionId}
                  problemSlug={currentQuestion.problemSlug || currentQuestion.slug || 'lld-service'}
                  problemTitle={currentQuestion.title || 'Spring Boot Microservice'}
                  starterFiles={currentQuestion.starterFiles}
                  editablePaths={currentQuestion.editablePaths || []}
                  onSubmitProject={(summary) => void triggerCandidateTurn(summary)}
                />
              ) : (
                <Group orientation="vertical" id="arena-v-v2" className="h-full w-full flex-1 min-w-0">
                  <Panel defaultSize="65%" minSize="25%" id="editor-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
                    <div className="flex flex-col h-full bg-bg overflow-hidden relative">
                      {/* Editor Toolbar Tabs */}
                      <div className="h-9 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditorTab('solution')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                              editorTab === 'solution'
                                ? 'bg-elevated text-text border border-border'
                                : 'text-text-3 hover:text-text'
                            }`}
                          >
                            <Code2 className="w-3.5 h-3.5 text-text-3" />
                            <span>
                              {isSqlTrack ? 'Solution.sql' : isResumeTrack ? 'Response_Notes.md' : `Solution.${currentCodeExt}`}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditorTab('whiteboard')}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                              editorTab === 'whiteboard'
                                ? 'bg-elevated text-text border border-border'
                                : 'text-text-3 hover:text-text'
                            }`}
                          >
                            <Layers className="w-3.5 h-3.5 text-text-3" />
                            <span>HLD Whiteboard</span>
                          </button>
                        </div>

                        {/* Breadcrumbs */}
                        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-text-3">
                          <span>src</span>
                          <span>&gt;</span>
                          <span>main</span>
                          <span>&gt;</span>
                          <span>Solution.{currentCodeExt}</span>
                        </div>
                      </div>

                      {/* Code Editor Surface */}
                      <div className="flex-1 relative overflow-hidden bg-surface">
                        {editorTab === 'solution' && (
                          <Editor
                            height="100%"
                            language={
                              isSqlTrack
                                ? 'sql'
                                : isResumeTrack
                                ? 'markdown'
                                : language === 'python'
                                ? 'python'
                                : language === 'javascript'
                                ? 'javascript'
                                : 'java'
                            }
                            theme={getMonacoTheme(resolvedTheme)}
                            beforeMount={defineMonacoThemes}
                            value={code}
                            onChange={(val) => handleCodeChange(val || '')}
                            onMount={(editor) => {
                              editor.onDidChangeCursorPosition((e) => {
                                setCursor({ ln: e.position.lineNumber, col: e.position.column });
                              });
                            }}
                            options={{
                              fontSize: 13.5,
                              minimap: { enabled: false },
                              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                              automaticLayout: true,
                              tabSize: 4,
                              scrollBeyondLastLine: false,
                              lineNumbersMinChars: 3
                            }}
                          />
                        )}

                        {editorTab === 'whiteboard' && (
                          <HldWhiteboardCanvas
                            sessionId={sessionId}
                            provider={provider}
                            apiKey={apiKey}
                          />
                        )}
                      </div>

                      <StatusBar ln={cursor.ln} col={cursor.col} language={language} />
                    </div>
                  </Panel>
                  <Separator className="h-1 bg-border/60 hover:bg-primary/60 transition-colors cursor-row-resize relative flex items-center justify-center z-10 select-none">
                    <div className="h-0.5 w-6 bg-text-3/40 rounded-full" />
                  </Separator>
                  <Panel defaultSize="35%" minSize="15%" maxSize="75%" id="testcase-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
                    <TestcasePanel
                      testCases={allTestCases}
                      executionResult={executionResult}
                      onAddCustomCase={(input, expected) => {
                        setCustomCases((prev) => [
                          ...prev,
                          { id: Date.now(), input, expectedOutput: expected }
                        ]);
                      }}
                      onDeleteCase={(idx) => {
                        const sampleLen = sampleTestItems.length;
                        if (idx >= sampleLen) {
                          setCustomCases((prev) => prev.filter((_, i) => i !== idx - sampleLen));
                        }
                      }}
                    />
                  </Panel>
                </Group>
              )}
            </Panel>
          </Group>
        </div>
      </div>

      {!isPlayground && (
        <WebcamTile isTabBlurred={isWindowBlurred} tabSwitchCount={tabSwitches} pasteCount={pasteDumps} />
      )}
      <FloatingAiOrb
        isOpen={isAiPanelOpen}
        onToggle={toggleAiPanel}
        isAiSpeaking={isAiSpeaking}
        isListening={isListening}
        hasUnread={hasUnread}
      />
      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={() => {
          setIsAiPanelOpen(false);
          sessionStorage.setItem(coachCollapseKey, 'true');
        }}
        mode="live"
        personaName={isPlayground ? 'Coach Alex' : 'Dr. Anya Chen'}
        personaTitle={isPlayground ? 'AI Socratic Coach' : 'AI Principal Bar Raiser'}
        currentStage={currentStage}
        isAiSpeaking={isAiSpeaking}
        messages={messages}
        isAiResponding={isAiResponding}
        chatInput={chatInput}
        setChatInput={setChatInput}
        onSend={(text) => {
          sessionStorage.setItem(coachCollapseKey, 'true');
          void triggerCandidateTurn(text);
        }}
        isListening={isListening}
        voiceEnabled={voiceOutputEnabled}
        onToggleVoice={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
        onMicToggle={() => {
          sessionStorage.setItem(coachCollapseKey, 'true');
          if (isListening) stopListening();
          else startListening();
        }}
        stackAbove="webcam"
      />
    </div>
  );
};