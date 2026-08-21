import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { GenerateQuestionResponse, ModelProvider } from '../types';
import { addMessageToSession, completeSession, processDialogueTurn, transcribeAudio, getStoredApiKey, executeCode } from '../services/api';
import { useProctorSentinel } from '../hooks/useProctorSentinel';
import { CameraProctorHUD } from './CameraProctorHUD';
import {
    Timer,
    ShieldAlert,
    Send,
    Play,
    Code,
    MessageSquare,
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    CheckCircle,
    XCircle,
    FileText,
    Sparkles,
    Radio,
    Zap,
    RotateCcw
} from 'lucide-react';

interface Props {
    sessionId: number;
    question: GenerateQuestionResponse;
    provider: ModelProvider;
    apiKey: string;
    onFinish: () => void;
}

export const InterviewRoom: React.FC<Props> = ({
    sessionId,
    question,
    provider,
    apiKey,
    onFinish
}) => {
    // --- State: Timer & Stages ---
    const [timeLeft, setTimeLeft] = useState(45 * 60);
    const [currentStage, setCurrentStage] = useState<'INTRODUCTION' | 'CORE_TECH' | 'CODING_DSA' | 'SYSTEM_DESIGN'>('INTRODUCTION');

    const getStarterForLang = (lang: string) => {
        if (question.starterCodeMap && question.starterCodeMap[lang]) {
            return question.starterCodeMap[lang];
        }
        return question.starterCode || '// Write your standard I/O solution here\n';
    };

    // --- State: Code & Scratchpad ---
    const [code, setCode] = useState(getStarterForLang('java'));
    const [language, setLanguage] = useState<'java' | 'python' | 'javascript'>('java');
    const [scratchpadNotes, setScratchpadNotes] = useState<string>(
        '// Architecture & Thought Scratchpad\n// 1. Core Assumptions:\n// 2. Algorithm & Complexity (Time / Space):\n// 3. Edge Cases to Test:\n'
    );
    const [activeTab, setActiveTab] = useState<'problem' | 'scratchpad'>('problem');
    const [latestExecution, setLatestExecution] = useState<{ status: string; passedTests: number; totalTests: number; executionTimeMs: number; memoryUsedMb: number } | null>(null);

    // --- State: Conversation & Dialogue ---
    const [messages, setMessages] = useState<Array<{ role: 'interviewer' | 'candidate'; content: string; timestamp?: string }>>([
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

    // --- Voice Management (Echo-Safe Full Duplex) ---
    const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [isSpeakingNow, setIsSpeakingNow] = useState(false);
    const recognitionRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const silenceTimeoutRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Execution Console ---
    const [executionOutput, setExecutionOutput] = useState<string | null>(null);
    const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');

    // --- Proctor Sentinel Active Monitoring ---
    const { tabSwitches, pasteDumps } = useProctorSentinel(sessionId, true);

    // Auto-scroll chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isAiResponding]);

    const isSessionEndedRef = useRef(false);
    const hasSpokenIntroRef = useRef(false);

    // --- Echo-Safe Text-To-Speech (AI Voice) ---
    const speakText = useCallback((text: string) => {
        if (isSessionEndedRef.current || !voiceOutputEnabled || !('speechSynthesis' in window)) return;

        // Cancel previous speech synthesis
        window.speechSynthesis.cancel();

        // Stop microphone immediately to prevent recording laptop speaker output
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
            } catch {}
            setIsListening(false);
            setIsSpeakingNow(false);
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
            if (isSessionEndedRef.current) {
                window.speechSynthesis.cancel();
                setIsAiSpeaking(false);
                return;
            }
            setIsAiSpeaking(true);
        };

        utterance.onend = () => {
            setIsAiSpeaking(false);
            if (isSessionEndedRef.current) return;
            // Wait 600ms safety buffer before re-enabling mic listening
            setTimeout(() => {
                if (!isSessionEndedRef.current) {
                    startListening();
                }
            }, 600);
        };

        utterance.onerror = () => {
            setIsAiSpeaking(false);
            if (isSessionEndedRef.current) return;
            setTimeout(() => {
                if (!isSessionEndedRef.current) {
                    startListening();
                }
            }, 600);
        };

        window.speechSynthesis.speak(utterance);
    }, [voiceOutputEnabled]);

    // Initial greeting aloud on start - spoken strictly ONCE on mount
    useEffect(() => {
        if (!hasSpokenIntroRef.current) {
            hasSpokenIntroRef.current = true;
            const timer = setTimeout(() => {
                speakText("Welcome to your technical assessment. I am your AI Interviewer. Please introduce yourself and discuss your recent engineering projects.");
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [speakText]);

    // --- Microphone Speech-To-Text & MediaRecorder Setup ---
    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (isAiSpeaking) return;

        // 1. Initialize High-Resolution Audio Recording for Groq Whisper
        try {
            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                audioChunksRef.current = [];
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };
                mediaRecorder.start(250);
                mediaRecorderRef.current = mediaRecorder;
            }).catch((err) => console.warn('MediaRecorder audio setup:', err));
        } catch (e) {
            console.warn('Audio stream recording warning:', e);
        }

        // 2. Real-time Web Speech Transcription
        if (SpeechRecognition) {
            try {
                if (recognitionRef.current) {
                    recognitionRef.current.abort();
                }

                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onstart = () => {
                    setIsListening(true);
                };

                recognition.onresult = (event: any) => {
                    let fullTranscript = '';
                    for (let i = 0; i < event.results.length; i++) {
                        fullTranscript += event.results[i][0].transcript;
                    }

                    if (fullTranscript.trim()) {
                        setChatInput(fullTranscript);
                        setIsSpeakingNow(true);

                        // Natural phrase termination ("that's my answer", "over to you", "I'm done", "that's all")
                        const lower = fullTranscript.toLowerCase();
                        const hasEndPhrase = lower.includes("that's my answer") ||
                                             lower.includes("thats my answer") ||
                                             lower.includes("over to you") ||
                                             lower.includes("i'm done") ||
                                             lower.includes("i am done") ||
                                             lower.includes("that is all") ||
                                             lower.includes("thats all");

                        if (hasEndPhrase) {
                            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                            setIsSpeakingNow(false);
                            triggerCandidateTurn(fullTranscript.trim());
                            return;
                        }

                        // Generous 9.0-second thinking buffer: Candidates can speak continuously for minutes without cutoffs
                        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                        silenceTimeoutRef.current = setTimeout(() => {
                            setIsSpeakingNow(false);
                            if (fullTranscript.trim().length > 8 && !isAiSpeaking && !isSessionEndedRef.current) {
                                triggerCandidateTurn(fullTranscript.trim());
                            }
                        }, 9000);
                    }
                };

                recognition.onend = () => {
                    setIsListening(false);
                    setIsSpeakingNow(false);
                };

                recognition.onerror = (err: any) => {
                    if (err.error !== 'no-speech' && err.error !== 'aborted') {
                        console.warn('Speech recognition notice:', err.error);
                    }
                    setIsListening(false);
                    setIsSpeakingNow(false);
                };

                recognitionRef.current = recognition;
                recognition.start();
            } catch (e) {
                console.warn('Failed to start speech recognition:', e);
            }
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch {}
            setIsListening(false);
            setIsSpeakingNow(false);
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch {}
        }
    };

    // Window Focus / Blur monitoring
    useEffect(() => {
        const onBlur = () => setIsWindowBlurred(true);
        const onFocus = () => setIsWindowBlurred(false);
        window.addEventListener('blur', onBlur);
        window.addEventListener('focus', onFocus);
        return () => {
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    // Timer Countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // --- Candidate Turn Dispatcher ---
    const triggerCandidateTurn = async (inputText: string) => {
        if (isAiResponding) return;

        let candidateText = inputText.trim();
        setChatInput('');
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        stopListening();

        // High-Precision Neural ASR with Groq Whisper if audio was recorded
        if (audioChunksRef.current.length > 0) {
            try {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const groqApiKey = getStoredApiKey('GROQ') || apiKey;
                const whisperResult = await transcribeAudio(audioBlob, groqApiKey);
                if (whisperResult && whisperResult.transcript && whisperResult.transcript.trim().length > 0) {
                    console.log('🎙️ Whisper neural transcript received:', whisperResult.transcript);
                    candidateText = whisperResult.transcript.trim();
                }
            } catch (err) {
                console.warn('Whisper fallback to Web Speech:', err);
            }
            audioChunksRef.current = [];
        }

        if (!candidateText && !code.trim()) return;
        if (!candidateText) candidateText = 'Shared code updates in editor.';

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages((prev) => [...prev, { role: 'candidate', content: candidateText, timestamp: timeStr }]);

        await addMessageToSession(sessionId, {
            senderRole: 'CANDIDATE',
            messageType: 'EXPLANATION',
            content: candidateText,
            codeSnippet: code
        });

        // Advance Stages
        if (currentStage === 'INTRODUCTION') {
            setCurrentStage('CORE_TECH');
        } else if (currentStage === 'CORE_TECH' && messages.length >= 4) {
            setCurrentStage('CODING_DSA');
        } else if (currentStage === 'CODING_DSA' && messages.length >= 8) {
            setCurrentStage('SYSTEM_DESIGN');
        }

        setIsAiResponding(true);

        try {
            const contextPayload = `Problem: ${question.title}\nDescription: ${question.problemStatement}\nCandidate Scratchpad:\n${scratchpadNotes}\n[Current Stage: ${currentStage}]`;

            const dialogue = await processDialogueTurn({
                questionContext: contextPayload,
                candidateExplanation: candidateText,
                candidateCode: code,
                modelProvider: provider,
                apiKey,
                latestExecution: latestExecution || undefined
            });

            const replyText = `${dialogue.interviewerReply}\n\n${dialogue.followUpQuestion}`;
            setMessages((prev) => [
                ...prev,
                { role: 'interviewer', content: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);

            speakText(`${dialogue.interviewerReply}. ${dialogue.followUpQuestion}`);

            await addMessageToSession(sessionId, {
                senderRole: 'AI',
                messageType: 'FEEDBACK',
                content: replyText
            });
        } catch {
            const fallback = "I see your technical direction. Looking at your data structure choices and scratchpad notes, how would you handle thread contention and cache eviction under peak write load?";
            setMessages((prev) => [
                ...prev,
                { role: 'interviewer', content: fallback, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
            speakText(fallback);
        } finally {
            setIsAiResponding(false);
        }
    };

    const handleLanguageChange = (newLang: 'java' | 'python' | 'javascript') => {
        const oldStarter = getStarterForLang(language);
        if (code.trim() === oldStarter.trim() || code.trim().length === 0) {
            setCode(getStarterForLang(newLang));
        }
        setLanguage(newLang);
    };

    // --- Real Judge0 CE Sandbox Test Runner ---
    const handleRunCode = async () => {
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
            setTestStatus('failed');
            setExecutionOutput(`[Sandbox Error] Could not connect to execution engine: ${err.message || 'Unknown network error'}`);
        }
    };

    const handleEndInterview = async () => {
        if (window.confirm('Are you ready to conclude your interview session and generate your 360° Diagnostic Report?')) {
            isSessionEndedRef.current = true;
            window.speechSynthesis?.cancel();
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            stopListening();
            try {
                await completeSession(sessionId);
            } catch (e) {
                console.warn('Session completion status:', e);
            }
            onFinish();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0b0f17', color: '#f1f5f9', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>

            {/* Top Navigation Bar: Minimalist Micro1 Style */}
            <header style={{
                height: '52px',
                borderBottom: '1px solid #1e293b',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(12px)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Zap size={18} color="#6366f1" />
                        <span>{question.title}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 600 }}>
                        {currentStage}
                    </span>
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(234, 179, 8, 0.15)', color: '#fbbf24', fontWeight: 600 }}>
                        {question.difficulty}
                    </span>
                </div>

                {/* Center: Live Voice Activity Status Indicator */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '4px 16px',
                    borderRadius: '20px',
                    background: isAiSpeaking ? 'rgba(99, 102, 241, 0.15)' : isSpeakingNow ? 'rgba(16, 185, 129, 0.2)' : isListening ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.5)',
                    border: `1px solid ${isAiSpeaking ? '#6366f1' : isSpeakingNow ? '#10b981' : '#334155'}`
                }}>
                    <Radio size={14} color={isAiSpeaking ? '#818cf8' : isSpeakingNow ? '#34d399' : '#94a3b8'} className={isAiSpeaking || isSpeakingNow ? 'animate-pulse' : ''} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isAiSpeaking ? '#c7d2fe' : isSpeakingNow ? '#6ee7b7' : '#94a3b8' }}>
                        {isAiSpeaking ? 'AI Interviewer Speaking...' : isSpeakingNow ? 'Transcribing Your Voice...' : isListening ? 'Listening (Speak when ready)...' : 'Microphone Ready'}
                    </span>
                </div>

                {/* Right: Controls & Timer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => setVoiceOutputEnabled(!voiceOutputEnabled)}
                        style={{ background: 'transparent', border: 'none', color: voiceOutputEnabled ? '#34d399' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                        title="Toggle AI Vocal Output"
                    >
                        {voiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                        <span>{voiceOutputEnabled ? 'AI Voice ON' : 'Muted'}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: (tabSwitches > 0 || pasteDumps > 0) ? '#f87171' : '#34d399' }}>
                        <ShieldAlert size={15} />
                        <span>Proctor: {tabSwitches === 0 && pasteDumps === 0 ? 'Clean' : `${tabSwitches} blurs | ${pasteDumps} pastes`}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: timeLeft < 300 ? '#ef4444' : '#f8fafc', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                        <Timer size={16} />
                        <span>{formatTimer(timeLeft)}</span>
                    </div>

                    <button
                        onClick={handleEndInterview}
                        style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        End & Report
                    </button>
                </div>
            </header>

            {/* Main Split Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '42% 58%', flex: 1, overflow: 'hidden' }}>

                {/* Left Column: Problem / Scratchpad + Dialogue Stream */}
                <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e293b', background: '#0f172a', overflow: 'hidden' }}>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', background: '#090d16' }}>
                        <button
                            onClick={() => setActiveTab('problem')}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                background: activeTab === 'problem' ? '#0f172a' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'problem' ? '2px solid #6366f1' : '2px solid transparent',
                                color: activeTab === 'problem' ? '#f8fafc' : '#94a3b8',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <FileText size={15} />
                            <span>Problem Statement</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('scratchpad')}
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                background: activeTab === 'scratchpad' ? '#0f172a' : 'transparent',
                                border: 'none',
                                borderBottom: activeTab === 'scratchpad' ? '2px solid #6366f1' : '2px solid transparent',
                                color: activeTab === 'scratchpad' ? '#f8fafc' : '#94a3b8',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Sparkles size={15} color="#818cf8" />
                            <span>Live Scratchpad & Notes</span>
                        </button>
                    </div>

                    {/* Top Left: Problem or Scratchpad */}
                    <div style={{ height: '38%', padding: '16px', overflowY: 'auto', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
                        {activeTab === 'problem' ? (
                            <div>
                                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                                    Requirements & Constraints
                                </h4>
                                <div style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                                    {question.problemStatement}
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '0.75rem', color: '#818cf8', marginBottom: '6px', fontWeight: 600 }}>
                                    💡 The AI reads your scratchpad thoughts in real time to ask deeper architectural questions.
                                </div>
                                <textarea
                                    value={scratchpadNotes}
                                    onChange={(e) => setScratchpadNotes(e.target.value)}
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        background: '#090d16',
                                        border: '1px solid #334155',
                                        borderRadius: '6px',
                                        padding: '10px',
                                        color: '#e2e8f0',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.85rem',
                                        resize: 'none'
                                    }}
                                    placeholder="Jot down algorithm trade-offs, Big-O complexity, and concurrency notes..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Bottom Left: Live Dialogue Stream */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#090d16' }}>
                        <div style={{ padding: '8px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MessageSquare size={14} color="#6366f1" />
                                <span>Live Dialogue Transcript</span>
                            </div>
                            {isListening && (
                                <span style={{ color: '#34d399', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} /> Mic Active
                                </span>
                            )}
                        </div>

                        {/* Transcript Messages */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {messages.map((m, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        alignSelf: m.role === 'candidate' ? 'flex-end' : 'flex-start',
                                        maxWidth: '88%',
                                        padding: '12px 16px',
                                        borderRadius: '12px',
                                        fontSize: '0.88rem',
                                        lineHeight: '1.5',
                                        background: m.role === 'candidate' ? '#4f46e5' : '#1e293b',
                                        color: '#f8fafc',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
                                        whiteSpace: 'pre-wrap'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: m.role === 'candidate' ? '#c7d2fe' : '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                                        <span>{m.role === 'candidate' ? 'You (Candidate)' : 'AI Principal Interviewer'}</span>
                                        {m.timestamp && <span>{m.timestamp}</span>}
                                    </div>
                                    {m.content}
                                </div>
                            ))}

                            {isAiResponding && (
                                <div style={{ alignSelf: 'flex-start', color: '#818cf8', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
                                    <Sparkles size={16} className="animate-spin" />
                                    <span>AI Interviewer is analyzing your response...</span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Speech / Text Input Bar */}
                        <div style={{ padding: '12px', borderTop: '1px solid #1e293b', background: '#0f172a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                type="button"
                                onClick={isListening ? stopListening : startListening}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: isListening ? '#10b981' : '#334155',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                title={isListening ? 'Click to Mute Mic' : 'Click to Speak via Mic'}
                            >
                                {isListening ? <Mic size={16} /> : <MicOff size={16} />}
                            </button>

                            <input
                                style={{
                                    flex: 1,
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    color: '#f8fafc',
                                    fontSize: '0.88rem',
                                    outline: 'none'
                                }}
                                placeholder={isListening ? 'Listening to your microphone...' : 'Speak or type your explanation here...'}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && triggerCandidateTurn(chatInput)}
                            />

                            <button
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#6366f1',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onClick={() => triggerCandidateTurn(chatInput)}
                                disabled={isAiResponding}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Monaco Editor IDE + Live Compiler Runner */}
                <div style={{ display: 'flex', flexDirection: 'column', background: '#1e1e1e', overflow: 'hidden' }}>

                    {/* Control Bar */}
                    <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#18181b'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                                <Code size={16} color="#10b981" />
                                <span>Monaco Code Workspace</span>
                            </div>

                            <select
                                style={{
                                    background: '#27272a',
                                    border: '1px solid #3f3f46',
                                    color: '#f8fafc',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.78rem'
                                }}
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value as any)}
                            >
                                <option value="java">Java 21 LTS</option>
                                <option value="python">Python 3.12</option>
                                <option value="javascript">TypeScript / Node</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleRunCode}
                                style={{
                                    background: '#27272a',
                                    color: '#f8fafc',
                                    border: '1px solid #3f3f46',
                                    padding: '5px 12px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Play size={13} color="#10b981" /> Run Test Suite
                            </button>

                            <button
                                onClick={() => triggerCandidateTurn(`I have updated the code in the editor:\n\`\`\`${language}\n${code}\n\`\`\``)}
                                style={{
                                    background: '#6366f1',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '5px 14px',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Submit Code Turn
                            </button>
                        </div>
                    </div>

                    {/* Monaco Canvas */}
                    <div style={{ flex: 1, minHeight: '300px' }}>
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={language}
                            value={code}
                            onChange={(val) => setCode(val || '')}
                            options={{
                                fontSize: 14,
                                fontFamily: 'var(--font-mono)',
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 4
                            }}
                        />
                    </div>

                    {/* Execution Output Console */}
                    {executionOutput && (
                        <div style={{ height: '140px', borderTop: '1px solid #334155', background: '#090d16', padding: '12px', overflowY: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                    {testStatus === 'passed' && <CheckCircle size={14} color="#34d399" />}
                                    {testStatus === 'failed' && <XCircle size={14} color="#f87171" />}
                                    <span style={{ color: testStatus === 'passed' ? '#34d399' : testStatus === 'failed' ? '#f87171' : '#94a3b8' }}>
                                        Test Fixture Results ({testStatus.toUpperCase()})
                                    </span>
                                </div>
                                <button
                                    onClick={() => setExecutionOutput(null)}
                                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <RotateCcw size={12} /> Clear
                                </button>
                            </div>
                            <pre style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{executionOutput}</pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Permanent Locked Webcam HUD */}
            <CameraProctorHUD isTabBlurred={isWindowBlurred} tabSwitches={tabSwitches} />
        </div>
    );
};