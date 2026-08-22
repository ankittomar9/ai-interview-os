import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { GenerateQuestionResponse, ModelProvider } from '../types';
import { addMessageToSession, completeSession, processDialogueTurn, transcribeAudio, getStoredApiKey, executeCode } from '../services/api';
import { useProctorSentinel } from '../hooks/useProctorSentinel';
import { StageStepper, type InterviewStage } from './StageStepper';
import { AiAvatarWaveform } from './AiAvatarWaveform';
import { WebcamTile } from './WebcamTile';
import { HldWhiteboardCanvas } from './HldWhiteboardCanvas';
import { ProjectWorkspace } from './ProjectWorkspace';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { ResizeHandle } from './ui/ResizeHandle';
import { TestConsole } from './ui/TestConsole';
import { ActivityBar } from './ide/ActivityBar';
import { BreadcrumbBar } from './ide/BreadcrumbBar';
import { StatusBar } from './ide/StatusBar';
import { MarkdownProblem } from './ide/MarkdownProblem';
import {
  Timer,
  Send,
  Play,
  Code2,
  Mic,
  MicOff,
  FileText,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';

interface Props {
  sessionId: number;
  question: GenerateQuestionResponse;
  provider: ModelProvider;
  apiKey: string;
  onFinish: () => void;
}

let cachedTabId: string | null = null;
function getSessionTabId(): string {
  if (!cachedTabId && typeof window !== 'undefined') {
    cachedTabId = `tab-${Math.random().toString(36).slice(2, 9)}`;
  }
  return cachedTabId || 'tab-main';
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

const DEFAULT_LEFT_WIDTH = 380;
const DEFAULT_RIGHT_WIDTH = 370;
const DEFAULT_CONSOLE_HEIGHT = 180;

export const InterviewRoom: React.FC<Props> = ({
  sessionId,
  question,
  provider,
  apiKey,
  onFinish
}) => {
  // --- State: Timer & Stages ---
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [currentStage, setCurrentStage] = useState<InterviewStage>('INTRODUCTION');

  const getStarterForLang = (lang: string) => {
    if (question.starterCodeMap && question.starterCodeMap[lang]) {
      return question.starterCodeMap[lang];
    }
    return question.starterCode || '// Write your standard I/O solution here\n';
  };

  // --- State: Code & Tabs ---
  const [code, setCode] = useState(getStarterForLang('java'));
  const [language, setLanguage] = useState<'java' | 'python' | 'javascript'>('java');
  const [editorTab, setEditorTab] = useState<'solution' | 'tests' | 'whiteboard'>('solution');
  const [leftPanelTab, setLeftPanelTab] = useState<'description' | 'scratchpad'>('description');
  const [scratchpadNotes, setScratchpadNotes] = useState<string>(
    '// Architecture & Thought Scratchpad\n// 1. Core Assumptions:\n// 2. Algorithm & Complexity (Time / Space):\n// 3. Edge Cases to Test:\n'
  );
  const [latestExecution, setLatestExecution] = useState<{ status: string; passedTests: number; totalTests: number; executionTimeMs: number; memoryUsedMb: number } | null>(null);
  const [architectureSummary, setArchitectureSummary] = useState<string>('');

  // --- State: Resizable Panels (Persisted in localStorage) ---
  const [leftWidth, setLeftWidth] = useState<number>(() => Number(localStorage.getItem('ui.leftWidth')) || DEFAULT_LEFT_WIDTH);
  const [rightWidth, setRightWidth] = useState<number>(() => Number(localStorage.getItem('ui.rightWidth')) || DEFAULT_RIGHT_WIDTH);
  const [consoleHeight, setConsoleHeight] = useState<number>(() => Number(localStorage.getItem('ui.consoleHeight')) || DEFAULT_CONSOLE_HEIGHT);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  const [isEditorMaximized, setIsEditorMaximized] = useState<boolean>(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);

  // --- State: IDE Caret & Engine Capabilities ---
  const [cursor, setCursor] = useState<{ ln: number; col: number }>({ ln: 1, col: 1 });
  const [engineReady, setEngineReady] = useState<boolean>(true);
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

  // Synchronize layout dimensions to localStorage
  useEffect(() => { localStorage.setItem('ui.leftWidth', String(leftWidth)); }, [leftWidth]);
  useEffect(() => { localStorage.setItem('ui.rightWidth', String(rightWidth)); }, [rightWidth]);
  useEffect(() => { localStorage.setItem('ui.consoleHeight', String(consoleHeight)); }, [consoleHeight]);



  // --- System Capabilities Probe ---
  useEffect(() => {
    const probeCapabilities = async () => {
      try {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        const resp = await fetch(`http://${host}:8080/api/v1/system/capabilities`);
        if (resp.ok) {
          const data = await resp.json();
          const track = question.track || '';
          if (track.includes('LLD') || (question.starterFiles && Object.keys(question.starterFiles).length > 0)) {
            setEngineReady(data.engines?.lld?.ready ?? true);
          } else {
            setEngineReady(data.engines?.dsa?.ready ?? true);
          }
        }
      } catch {
        // Resilient fallback
      }
    };
    void probeCapabilities();
  }, [question]);

  // --- State: Conversation & Dialogue ---
  const [messages, setMessages] = useState<Array<{
    role: 'interviewer' | 'candidate';
    content: string;
    timestamp?: string;
    metadata?: Record<string, string>;
  }>>([
    {
      role: 'interviewer',
      content: `Welcome to your technical assessment! 👋\n\nI am your AI Principal Interviewer. Let's begin with a brief introduction. Please tell me about your engineering background and recent backend systems you've built.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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

  const startListeningRef = useRef<() => void>(() => {});
  const triggerCandidateTurnRef = useRef<(text?: string) => Promise<void>>(async () => {});
  const handleEndInterviewRef = useRef<(isAuto?: boolean) => Promise<void>>(async () => {});

  // --- Execution Console ---
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');

  // --- Proctor Sentinel Active Monitoring ---
  const { tabSwitches, pasteDumps } = useProctorSentinel(sessionId, true);

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
              setChatInput(result.transcript.trim());
              setTimeout(() => {
                if (triggerCandidateTurnRef.current) {
                  void triggerCandidateTurnRef.current(result.transcript.trim());
                }
              }, 200);
              return;
            }
          } catch (error) {
            console.warn('Groq Whisper transcription notice:', error);
          }
        }

        if (chatInput.trim().length > 0) {
          void triggerCandidateTurnRef.current();
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
          silenceTimeoutRef.current = setTimeout(() => {
            stopListening();
          }, 9000);
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
          setChatInput(fullTranscript);
          resetSilenceTimeout();

          const lower = fullTranscript.toLowerCase().trim();
          const matchesWakePhrase = END_PHRASES.some((phrase) => lower.endsWith(phrase));
          if (matchesWakePhrase) {
            stopListening();
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
  }, [isAiSpeaking, isListening, chatInput, stopListening]);

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

    try {
      const contextPayload = `Problem: ${question.title}\nDescription: ${question.problemStatement}\nCandidate Scratchpad:\n${scratchpadNotes}\n[Current Stage: ${currentStage}]\n${architectureSummary ? `\n[System Design Architecture Canvas Context]:\n${architectureSummary}` : ''}`;

      const dialogue = await processDialogueTurn({
        sessionId,
        questionContext: contextPayload,
        problemSlug: question.problemSlug,
        candidateExplanation: candidateText,
        candidateCode: code,
        modelProvider: provider,
        apiKey,
        latestExecution: latestExecution || undefined
      });

      // Adaptive Stage Progression
      if (dialogue.recommendedAction === 'ADVANCE_STAGE') {
        if (currentStage === 'INTRODUCTION') {
          setCurrentStage('CORE_TECH');
        } else if (currentStage === 'CORE_TECH') {
          setCurrentStage('CODING_DSA');
        } else if (currentStage === 'CODING_DSA') {
          setCurrentStage('SYSTEM_DESIGN');
        }
      } else {
        // Fallback heuristic
        if (currentStage === 'INTRODUCTION') {
          setCurrentStage('CORE_TECH');
        } else if (currentStage === 'CORE_TECH' && messages.length >= 4) {
          setCurrentStage('CODING_DSA');
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

      speakText(`${dialogue.interviewerReply}. ${dialogue.followUpQuestion}`);

      await addMessageToSession(sessionId, {
        senderRole: 'AI',
        messageType: 'FEEDBACK',
        content: replyText,
        metadata: meta
      });
    } catch {
      const fallback = "I see your technical direction. Looking at your data structure choices and architecture scratchpad, how would you handle thread contention and cache eviction under peak write load?";
      setMessages((prev) => [
        ...prev,
        { role: 'interviewer', content: fallback, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      speakText(fallback);
    } finally {
      setIsAiResponding(false);
    }
  };

  useEffect(() => {
    triggerCandidateTurnRef.current = triggerCandidateTurn;
  });

  const handleLanguageChange = (newLang: 'java' | 'python' | 'javascript') => {
    const oldStarter = getStarterForLang(language);
    if (code.trim() === oldStarter.trim() || code.trim().length === 0) {
      setCode(getStarterForLang(newLang));
    }
    setLanguage(newLang);
  };

  // Generate read-only sample tests view for the tests tab
  const generateSampleTestsCode = () => {
    if (!question.sampleTests || question.sampleTests.length === 0) {
      return '// No public sample assertions specified for this problem.\n';
    }
    let content = `// ==========================================================\n`;
    content += `// SAMPLE TEST FIXTURES (Standard I/O Verification)\n`;
    content += `// Problem: ${question.title}\n`;
    content += `// ==========================================================\n\n`;

    question.sampleTests.forEach((t, i) => {
      content += `// Sample Case #${i + 1}: ${t.name}\n`;
      if (t.input) {
        content += `// Standard Input (stdin):\n`;
        t.input.split('\n').forEach((l) => { content += `//   ${l}\n`; });
      }
      if (t.expectedOutput) {
        content += `// Expected Output (stdout):\n`;
        t.expectedOutput.split('\n').forEach((l) => { content += `//   ${l}\n`; });
      }
      if (t.description) {
        content += `// Description:\n//   ${t.description}\n`;
      }
      content += `\n`;
    });
    return content;
  };

  // Real Judge0 CE Sandbox Test Runner
  const handleRunCode = async () => {
    setIsConsoleOpen(true);
    setTestStatus('running');
    setExecutionOutput('[Judge0 CE Sandbox] Submitting solution to zero-trust container sandbox...\nCompiling & executing test fixtures...\n');

    try {
      const lang = language.toLowerCase().includes('python') ? 'python' :
                   language.toLowerCase().includes('script') ? 'javascript' : 'java';

      const slug = question.problemSlug || question.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const result = await executeCode(sessionId, {
        language: lang,
        codeSnippet: code,
        problemSlug: slug
      });

      if (result.status !== 'ENGINE_UNAVAILABLE' && result.status !== 'PROBLEM_NOT_FOUND') {
        setLatestExecution({
          status: result.status,
          passedTests: result.passedTests,
          totalTests: result.totalTests,
          executionTimeMs: result.executionTimeMs,
          memoryUsedMb: result.memoryUsedMb
        });
      }

      if (result.status === 'ENGINE_UNAVAILABLE') {
        setTestStatus('failed');
        setEngineReady(false);
        setExecutionOutput(
          `🛑 [Execution Engine Offline]\n${result.stderr || 'Judge0 execution engine is currently unreachable. Start the judge0 container to enable sandbox execution.'}\n\n⚠️ Status: ENGINE_UNAVAILABLE (0 / ${result.totalTests} Tests Passed)`
        );
      } else if (result.status === 'PROBLEM_NOT_FOUND') {
        setTestStatus('failed');
        setExecutionOutput(
          `❌ [Catalog Error]\nProblem definition not found in catalog for slug: '${slug}'. Zero silent fallback enforced.\n\n⚠️ Status: PROBLEM_NOT_FOUND`
        );
      } else if (result.status === 'COMPILE_ERROR') {
        setTestStatus('failed');
        setExecutionOutput(
          `[Compiler Output] Compilation Failed:\n${result.compilerOutput || result.stderr || 'Syntax error encountered during build.'}\n\n❌ Status: COMPILE_ERROR (0 / ${result.totalTests} Tests Passed)`
        );
      } else if (result.status === 'TIMEOUT') {
        setTestStatus('failed');
        setExecutionOutput(
          `[Execution Limit] Time Limit Exceeded (${result.executionTimeMs}ms):\n${result.stderr || 'Execution aborted due to infinite loop or slow algorithm.'}\n\n❌ Status: TIMEOUT (0 / ${result.totalTests} Tests Passed)`
        );
      } else if (result.status === 'PASSED') {
        setTestStatus('passed');
        let output = `[Sandbox Status] Execution Succeeded in ${result.executionTimeMs.toFixed(1)}ms (Heap: ${result.memoryUsedMb.toFixed(1)}MB)\n\n`;
        result.testResults.forEach((t) => {
          output += `✅ ${t.name} ➔ PASS (${t.durationMs.toFixed(1)}ms)\n`;
        });
        output += `\n🎉 Status: ALL ${result.passedTests} / ${result.totalTests} TEST FIXTURES PASSED!`;
        setExecutionOutput(output);
      } else {
        setTestStatus('failed');
        let output = `[Sandbox Status] Execution Completed in ${result.executionTimeMs.toFixed(1)}ms (Heap: ${result.memoryUsedMb.toFixed(1)}MB)\n\n`;
        result.testResults.forEach((t) => {
          if (t.status === 'PASS') {
            output += `✅ ${t.name} ➔ PASS (${t.durationMs.toFixed(1)}ms)\n`;
          } else {
            output += `❌ ${t.name} ➔ FAILED (${t.durationMs.toFixed(1)}ms)\n   ${t.error || 'Expected match not met'}\n`;
          }
        });
        output += `\n⚠️ Status: ${result.passedTests} / ${result.totalTests} Tests Passed.`;
        setExecutionOutput(output);
      }
    } catch (err: any) {
      console.error('Execution failed:', err);
      setTestStatus('failed');
      setExecutionOutput(`[Execution Error] Could not connect to Judge0 sandbox: ${err.message || 'Unknown network error'}`);
    }
  };

  useEffect(() => {
    handleEndInterviewRef.current = handleEndInterview;
  }, [handleEndInterview]);

  const handleCopyExample = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const currentCodeExt = language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'java';

  return (
    <div className="flex flex-col h-screen bg-bg text-text overflow-hidden select-none">

      {/* WORKSPACE COLLISION GUARD MODAL */}
      {showWorkspaceConflict && (
        <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl select-text">
            <div className="flex items-center gap-2.5 text-warning font-bold text-base">
              <ShieldAlert className="w-5 h-5" />
              <span>Workspace Session Active</span>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              A workspace is already active for this session in another browser tab. Would you like to take over this workspace session?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowWorkspaceConflict(false)}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  sessionStorage.setItem(`ws.active.${sessionId}`, getSessionTabId());
                  setShowWorkspaceConflict(false);
                }}
              >
                Take Over Workspace
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TOP FLAT HEADER BAR */}
      <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 z-20 shrink-0">
        {/* Brand & Problem Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-elevated border border-border flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-2" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">
              AI Interview OS
            </span>
          </div>

          <div className="w-px h-5 bg-border hidden sm:block" />

          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm font-bold text-text truncate max-w-[200px] lg:max-w-xs">
              {question.title}
            </span>
            <Chip variant="primary" size="sm">
              {question.track}
            </Chip>
            <Chip variant="warning" size="sm">
              {question.difficulty}
            </Chip>
          </div>
        </div>

        {/* Center / Right Telemetry & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Voice State Chip */}
          <Chip
            variant={isSpeakingNow ? 'primary' : isListening ? 'success' : 'default'}
            size="sm"
            icon={<Mic className="w-3.5 h-3.5" />}
          >
            {isSpeakingNow ? 'Voice Active' : isListening ? 'Listening...' : 'Mic Ready'}
          </Chip>

          {/* Proctor Chip */}
          <Chip
            variant={isWindowBlurred || tabSwitches > 0 ? 'danger' : 'success'}
            size="sm"
            icon={isWindowBlurred || tabSwitches > 0 ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          >
            {isWindowBlurred ? 'Focus Lost' : tabSwitches > 0 ? `${tabSwitches} Blurs` : 'Proctor: Clean'}
          </Chip>

          {/* Countdown Timer */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-elevated border border-border text-xs font-mono font-bold text-text">
            <Timer className={`w-3.5 h-3.5 ${timeLeft < 300 ? 'text-danger' : 'text-primary-2'}`} />
            <span className={timeLeft < 300 ? 'text-danger' : 'text-text'}>{formatTime(timeLeft)}</span>
          </div>

          {/* End & Report Button (Variant: Danger) */}
          <Button
            variant="danger"
            size="sm"
            onClick={() => void handleEndInterview(false)}
          >
            End & Report
          </Button>
        </div>
      </header>

      {/* STAGE STEPPER (4 STAGES) */}
      <StageStepper
        currentStage={currentStage}
        onStageClick={(stage) => {
          setCurrentStage(stage);
          if (stage === 'SYSTEM_DESIGN') setEditorTab('whiteboard');
          else if (editorTab === 'whiteboard') setEditorTab('solution');
        }}
      />

      {/* RESIZABLE THREE-PANEL ARENA */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* 1. LEFT PANEL: LeetCode-style Problem Description & Scratchpad */}
        {!isEditorMaximized && !isLeftCollapsed && (
          <div
            className="bg-surface flex flex-col overflow-hidden relative shrink-0"
            style={{ width: `${leftWidth}px`, minWidth: '240px' }}
          >
            {/* Header Tabs with Collapse Toggle */}
            <div className="h-10 flex items-center justify-between border-b border-border bg-elevated/40 px-2 shrink-0">
              <div className="flex gap-1">
                <button
                  onClick={() => setLeftPanelTab('description')}
                  className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    leftPanelTab === 'description'
                      ? 'border-primary text-text'
                      : 'border-transparent text-text-3 hover:text-text'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setLeftPanelTab('scratchpad')}
                  className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                    leftPanelTab === 'scratchpad'
                      ? 'border-primary text-text'
                      : 'border-transparent text-text-3 hover:text-text'
                  }`}
                >
                  Scratchpad
                </button>
              </div>

              <button
                onClick={() => setIsLeftCollapsed(true)}
                title="Collapse Panel"
                className="p-1 text-text-3 hover:text-text hover:bg-surface rounded transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Left Scrollable Content: Markdown Problem + Examples + Constraints */}
            <div className="flex-1 overflow-y-auto p-4 select-text">
              {leftPanelTab === 'description' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-extrabold text-white mb-2">
                      {question.title}
                    </h2>
                    <div className="flex gap-1.5">
                      <Chip variant="success" size="sm">
                        {question.difficulty}
                      </Chip>
                      <Chip variant="primary" size="sm">
                        {question.track}
                      </Chip>
                    </div>
                  </div>

                  {/* Rendered Markdown Problem Statement */}
                  <MarkdownProblem statement={question.problemStatement} />

                  {/* Inline Examples */}
                  {question.sampleTests && question.sampleTests.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-text-3 uppercase tracking-wider">
                        Examples:
                      </div>
                      <div className="space-y-3">
                        {question.sampleTests.map((test, idx) => (
                          <div
                            key={idx}
                            className="bg-elevated border border-border rounded-lg p-3 space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white">
                                Example {idx + 1}: <span className="text-primary-2 font-medium">{test.name}</span>
                              </span>
                              {test.input && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyExample(test.input || '', idx)}
                                  icon={copiedIndex === idx ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                                >
                                  {copiedIndex === idx ? 'Copied' : 'Copy'}
                                </Button>
                              )}
                            </div>

                            <div className="space-y-1.5 text-xs font-mono">
                              {test.input && (
                                <div>
                                  <span className="text-text-3 font-semibold">Input: </span>
                                  <span className="text-success bg-surface px-1.5 py-0.5 rounded inline-block break-all">
                                    {test.input}
                                  </span>
                                </div>
                              )}
                              {test.expectedOutput && (
                                <div>
                                  <span className="text-text-3 font-semibold">Output: </span>
                                  <span className="text-text-2 bg-surface px-1.5 py-0.5 rounded inline-block break-all">
                                    {test.expectedOutput}
                                  </span>
                                </div>
                              )}
                              {test.description && (
                                <div className="text-text-3 text-[11px] font-sans">
                                  {test.description}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Constraints */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-text-3 uppercase tracking-wider">
                      Constraints:
                    </div>
                    <ul className="list-disc list-inside text-xs text-text-3 space-y-1 font-mono">
                      <li>Standard I/O stream execution (stdin / stdout)</li>
                      <li>Time Complexity: O(N) or O(log N) recommended</li>
                      <li>Memory Allocation Limit: 256 MB</li>
                    </ul>
                  </div>

                  {/* Evaluation Criteria */}
                  {question.evaluationCriteria && question.evaluationCriteria.length > 0 && (
                    <div className="bg-elevated border border-border rounded-lg p-3 space-y-1.5">
                      <div className="text-xs font-bold text-primary-2">
                        Evaluation Criteria:
                      </div>
                      <ul className="list-disc list-inside text-xs text-text-3 space-y-1">
                        {question.evaluationCriteria.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {leftPanelTab === 'scratchpad' && (
                <div className="h-full flex flex-col">
                  <div className="text-xs text-text-3 mb-2 font-medium">
                    Live Thought Scratchpad (Visible to AI Reviewer):
                  </div>
                  <textarea
                    value={scratchpadNotes}
                    onChange={(e) => setScratchpadNotes(e.target.value)}
                    className="flex-1 w-full min-h-[350px] bg-elevated border border-border rounded-lg text-text-2 font-mono text-xs p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Left Panel Expand Trigger when Collapsed */}
        {!isEditorMaximized && isLeftCollapsed && (
          <div className="w-8 bg-surface border-r border-border flex flex-col items-center py-2 shrink-0">
            <button
              onClick={() => setIsLeftCollapsed(false)}
              title="Expand Problem Panel"
              className="p-1 text-text-3 hover:text-text rounded transition-colors cursor-pointer"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <div className="[writing-mode:vertical-rl] rotate-180 text-[11px] text-text-3 font-bold mt-4 tracking-widest">
              PROBLEM
            </div>
          </div>
        )}

        {/* RESIZE HANDLE: Left to Center */}
        {!isEditorMaximized && !isLeftCollapsed && (
          <ResizeHandle
            direction="horizontal"
            onDelta={(delta) => {
              setLeftWidth((prev) => Math.max(240, Math.min(window.innerWidth * 0.55, prev + delta)));
            }}
            onDoubleClick={() => setLeftWidth(DEFAULT_LEFT_WIDTH)}
          />
        )}

        {/* 2. CENTER PANEL: Multi-File LLD OR Single-File Monaco Workspace */}
        {question.starterFiles && Object.keys(question.starterFiles).length > 0 ? (
          <div
            id="center-panel-container"
            className="flex-1 flex flex-col bg-bg overflow-hidden relative"
          >
            <ProjectWorkspace
              key={question.problemSlug || 'lld-order-service'}
              sessionId={sessionId}
              problemSlug={question.problemSlug || 'lld-order-service'}
              starterFiles={question.starterFiles}
              editablePaths={question.editablePaths || []}
              onSubmitProject={(summary) => void triggerCandidateTurn(summary)}
              isMaximized={isEditorMaximized}
              onToggleMaximize={() => setIsEditorMaximized(!isEditorMaximized)}
              engine="Maven"
              engineReady={engineReady}
              proctorClean={!(isWindowBlurred || tabSwitches > 0)}
            />
          </div>
        ) : (
          <div
            id="center-panel-container"
            className="flex-1 flex bg-bg overflow-hidden relative"
          >
            {/* ActivityBar */}
            <ActivityBar
              active="explorer"
              onRun={handleRunCode}
              proctorClean={!(isWindowBlurred || tabSwitches > 0)}
            />

            {/* Editor Column */}
            <div className="flex-1 flex flex-col overflow-hidden">

              {/* Workspace Header Toolbar */}
              <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-1">
                  <Button
                    variant={editorTab === 'solution' ? 'secondary' : 'ghost'}
                    size="sm"
                    icon={<Code2 className="w-3.5 h-3.5 text-primary-2" />}
                    onClick={() => setEditorTab('solution')}
                  >
                    Solution.{currentCodeExt}
                  </Button>

                  <Button
                    variant={editorTab === 'tests' ? 'secondary' : 'ghost'}
                    size="sm"
                    icon={<FileText className="w-3.5 h-3.5 text-sky-400" />}
                    onClick={() => setEditorTab('tests')}
                  >
                    tests.{language === 'python' ? 'py' : 'java'}
                  </Button>

                  <Button
                    variant={editorTab === 'whiteboard' ? 'secondary' : 'ghost'}
                    size="sm"
                    icon={<Layers className="w-3.5 h-3.5 text-purple-400" />}
                    onClick={() => setEditorTab('whiteboard')}
                  >
                    HLD Whiteboard
                  </Button>
                </div>

                {/* Language Selector, Run Tests, Submit & Maximize */}
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as any)}
                    className="bg-elevated text-text border border-border rounded-md px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="java">Java 21 LTS</option>
                    <option value="python">Python 3.12</option>
                    <option value="javascript">JavaScript (Node)</option>
                  </select>

                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Play className="w-3 h-3 fill-white" />}
                    onClick={handleRunCode}
                    loading={testStatus === 'running'}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    {testStatus === 'running' ? 'Running...' : 'Run Tests'}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void triggerCandidateTurn('I have updated and tested my code in the editor.')}
                  >
                    Submit Code
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditorMaximized(!isEditorMaximized)}
                    title={isEditorMaximized ? 'Restore Panels' : 'Maximize Editor'}
                  >
                    {isEditorMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {/* BREADCRUMB BAR */}
              <BreadcrumbBar
                segments={
                  editorTab === 'solution'
                    ? ['Solution.' + currentCodeExt]
                    : editorTab === 'tests'
                    ? ['tests.' + (language === 'python' ? 'py' : 'java')]
                    : ['HLD Whiteboard']
                }
              />

              {/* Monaco Editor / Whiteboard */}
              <div className="flex-1 relative overflow-hidden">
                {editorTab === 'solution' && (
                  <Editor
                    height="100%"
                    language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'java'}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => setCode(val || '')}
                    onMount={(editor) => {
                      editor.onDidChangeCursorPosition((e) => {
                        setCursor({ ln: e.position.lineNumber, col: e.position.column });
                      });
                    }}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      fontFamily: "var(--font-mono), 'Fira Code', monospace",
                      automaticLayout: true,
                      tabSize: 4,
                      scrollBeyondLastLine: false,
                      lineNumbersMinChars: 3
                    }}
                  />
                )}

                {editorTab === 'tests' && (
                  <Editor
                    height="100%"
                    language={language === 'python' ? 'python' : 'java'}
                    theme="vs-dark"
                    value={generateSampleTestsCode()}
                    onMount={(editor) => {
                      editor.onDidChangeCursorPosition((e) => {
                        setCursor({ ln: e.position.lineNumber, col: e.position.column });
                      });
                    }}
                    options={{
                      fontSize: 14,
                      readOnly: true,
                      minimap: { enabled: false },
                      fontFamily: "var(--font-mono), 'Fira Code', monospace",
                      automaticLayout: true
                    }}
                  />
                )}

                {editorTab === 'whiteboard' && (
                  <div className="h-full p-2">
                    <HldWhiteboardCanvas
                      sessionId={sessionId}
                      provider={provider}
                      apiKey={apiKey}
                      onArchitectureUpdate={(sum) => setArchitectureSummary(sum)}
                    />
                  </div>
                )}
              </div>

              {/* RESIZE HANDLE: Editor to Bottom Console */}
              {isConsoleOpen && (
                <ResizeHandle
                  direction="vertical"
                  onDelta={(delta) => {
                    setConsoleHeight((prev) => Math.max(70, Math.min(500, prev - delta)));
                  }}
                  onDoubleClick={() => setConsoleHeight(DEFAULT_CONSOLE_HEIGHT)}
                />
              )}

              {/* Resizable Bottom Execution Console */}
              {isConsoleOpen && (
                <TestConsole
                  status={testStatus}
                  output={executionOutput}
                  height={consoleHeight}
                  onClear={() => setExecutionOutput(null)}
                  onClose={() => setIsConsoleOpen(false)}
                  onToggleExpand={() => setConsoleHeight(consoleHeight > 250 ? 120 : 340)}
                  isExpanded={consoleHeight > 250}
                />
              )}

              {/* STATUS BAR */}
              <StatusBar
                ln={cursor.ln}
                col={cursor.col}
                language={language}
                engine="Judge0"
                engineReady={engineReady}
              />
            </div>
          </div>
        )}

        {/* RESIZE HANDLE: Center to Right */}
        {!isEditorMaximized && !isRightCollapsed && (
          <ResizeHandle
            direction="horizontal"
            onDelta={(delta) => {
              setRightWidth((prev) => Math.max(260, Math.min(window.innerWidth * 0.55, prev - delta)));
            }}
            onDoubleClick={() => setRightWidth(DEFAULT_RIGHT_WIDTH)}
          />
        )}

        {/* 3. RIGHT PANEL: AI Persona Card, Dialogue Transcript & Proctor */}
        {!isEditorMaximized && !isRightCollapsed && (
          <div
            className="bg-surface flex flex-col overflow-hidden relative shrink-0"
            style={{ width: `${rightWidth}px`, minWidth: '260px' }}
          >
            {/* Header with Collapse Toggle */}
            <div className="h-10 flex items-center justify-between border-b border-border bg-elevated/40 px-3 shrink-0">
              <span className="text-xs font-bold text-white">
                AI Principal Interviewer
              </span>
              <button
                onClick={() => setIsRightCollapsed(true)}
                title="Collapse AI Chat"
                className="p-1 text-text-3 hover:text-text hover:bg-surface rounded transition-colors cursor-pointer"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>

            {/* AI Avatar & Animated Audio Waveform */}
            <div className="p-3 pb-1">
              <AiAvatarWaveform
                personaName="Dr. Anya Chen"
                personaTitle="AI Principal Bar Raiser"
                isAiSpeaking={isAiSpeaking}
                voiceEnabled={voiceOutputEnabled}
                onToggleVoice={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
                currentStage={currentStage}
              />
            </div>

            {/* Dialogue Transcript */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 select-text">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs leading-relaxed ${
                    m.role === 'candidate'
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-elevated border-border'
                  }`}
                >
                  <div className="text-[11px] font-bold text-primary-2 mb-1 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span>{m.role === 'candidate' ? 'You (Candidate)' : 'AI Principal Interviewer'}</span>
                      {m.metadata?.recommendedAction === 'OFFER_HINT' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-warning/15 text-warning border border-warning/30 font-semibold inline-flex items-center gap-1">
                          💡 Hint Offered
                        </span>
                      )}
                    </div>
                    {m.timestamp && <span className="text-text-3 font-normal">{m.timestamp}</span>}
                  </div>
                  <div className="text-text whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              ))}

              {isAiResponding && (
                <div className="p-2.5 rounded-md bg-elevated border border-border text-primary-2 text-xs flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  AI Interviewer is evaluating technical response...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Candidate Input & Mic Controller */}
            <div className="p-3 border-t border-border bg-surface shrink-0">
              <div className="flex gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) stopListening();
                    else startListening();
                  }}
                  className={`w-9 h-9 rounded-md border flex items-center justify-center cursor-pointer transition-colors ${
                    isListening
                      ? 'bg-danger border-danger text-white'
                      : 'bg-elevated border-border text-text hover:bg-border/60'
                  }`}
                  title={isListening ? 'Stop Speaking' : 'Start Speaking'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  placeholder="Speak or type explanation..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void triggerCandidateTurn();
                    }
                  }}
                  className="flex-1 bg-elevated border border-border rounded-md px-3 py-1.5 text-xs text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-primary"
                />

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void triggerCandidateTurn()}
                  disabled={isAiResponding}
                  icon={<Send className="w-3.5 h-3.5" />}
                  className="w-9 h-9 p-0"
                />
              </div>
            </div>

            {/* Pinned Corner Webcam Tile (Strictly Non-Movable) */}
            <div className="absolute bottom-16 right-3 z-30 pointer-events-auto">
              <WebcamTile
                isTabBlurred={isWindowBlurred}
                tabSwitchCount={tabSwitches}
                pasteCount={pasteDumps}
              />
            </div>

          </div>
        )}

        {/* Right Panel Expand Trigger when Collapsed */}
        {!isEditorMaximized && isRightCollapsed && (
          <div className="w-8 bg-surface border-l border-border flex flex-col items-center py-2 shrink-0">
            <button
              onClick={() => setIsRightCollapsed(false)}
              title="Expand AI Chat Panel"
              className="p-1 text-text-3 hover:text-text rounded transition-colors cursor-pointer"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
            <div className="[writing-mode:vertical-rl] text-[11px] text-text-3 font-bold mt-4 tracking-widest">
              AI DIALOGUE
            </div>
          </div>
        )}

      </div>

    </div>
  );
};