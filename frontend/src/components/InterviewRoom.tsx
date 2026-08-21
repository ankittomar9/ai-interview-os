import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import type { GenerateQuestionResponse, ModelProvider } from '../types';
import { addMessageToSession, completeSession, processDialogueTurn, transcribeAudio, getStoredApiKey, executeCode } from '../services/api';
import { useProctorSentinel } from '../hooks/useProctorSentinel';
import { StageStepper, type InterviewStage } from './StageStepper';
import { AiAvatarWaveform } from './AiAvatarWaveform';
import { WebcamTile } from './WebcamTile';
import { HldWhiteboardCanvas } from './HldWhiteboardCanvas';
import {
    Timer,
    Send,
    Play,
    Code,
    Mic,
    MicOff,
    FileText,
    Sparkles,
    ShieldCheck,
    ShieldAlert,
    Layers,
    Copy,
    Check
} from 'lucide-react';

interface Props {
    sessionId: number;
    question: GenerateQuestionResponse;
    provider: ModelProvider;
    apiKey: string;
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
    const [leftPanelTab, setLeftPanelTab] = useState<'problem' | 'examples' | 'scratchpad'>('problem');
    const [scratchpadNotes, setScratchpadNotes] = useState<string>(
        '// Architecture & Thought Scratchpad\n// 1. Core Assumptions:\n// 2. Algorithm & Complexity (Time / Space):\n// 3. Edge Cases to Test:\n'
    );
    const [latestExecution, setLatestExecution] = useState<{ status: string; passedTests: number; totalTests: number; executionTimeMs: number; memoryUsedMb: number } | null>(null);
    const [architectureSummary, setArchitectureSummary] = useState<string>('');

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

    // P2 #1: Greeting TTS spoken once on mount
    useEffect(() => {
        if (!hasSpokenIntroRef.current && messages.length > 0 && voiceOutputEnabled) {
            hasSpokenIntroRef.current = true;
            const timer = setTimeout(() => {
                speakText(messages[0].content);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [speakText, voiceOutputEnabled, messages]);

    // --- P1: Full Duplex Continuous Speech Recognition with 9s Buffer & End Phrases ---
    const startListening = useCallback(() => {
        if (isSessionEndedRef.current || isAiSpeaking) return;

        const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('Web Speech API not supported in this browser.');
            return;
        }

        try {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }

            const rec = new SpeechRec();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-US';

            rec.onstart = () => {
                setIsListening(true);
                setIsSpeakingNow(false);
            };

            rec.onresult = (event: any) => {
                setIsSpeakingNow(true);
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        final += event.results[i][0].transcript;
                    } else {
                        interim += event.results[i][0].transcript;
                    }
                }

                const currentText = (final || interim).trim();
                setChatInput(currentText);

                const lower = currentText.toLowerCase();
                const hasEndPhrase = END_PHRASES.some((phrase) => lower.includes(phrase));

                if (hasEndPhrase) {
                    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                    rec.stop();
                    void triggerCandidateTurn(currentText);
                    return;
                }

                // Generous 9.0-second thinking buffer for candidate reasoning aloud
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = setTimeout(() => {
                    if (currentText.length > 3) {
                        rec.stop();
                        void triggerCandidateTurn(currentText);
                    }
                }, 9000);
            };

            rec.onerror = (event: any) => {
                if (event.error !== 'no-speech' && event.error !== 'aborted') {
                    console.warn('Speech recognition warning:', event.error);
                }
                setIsListening(false);
                setIsSpeakingNow(false);
            };

            rec.onend = () => {
                setIsListening(false);
                setIsSpeakingNow(false);
            };

            recognitionRef.current = rec;
            rec.start();

            // Native MediaRecorder for high-accuracy Whisper fallback
            navigator.mediaDevices?.getUserMedia({ audio: true }).then((stream) => {
                audioChunksRef.current = [];
                const mr = new MediaRecorder(stream);
                mr.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };
                mr.start();
                mediaRecorderRef.current = mr;
            }).catch(() => {});

        } catch (e) {
            console.warn('Could not start speech recognition:', e);
            setIsListening(false);
        }
    }, [isAiSpeaking]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        setIsListening(false);
        setIsSpeakingNow(false);
    }, []);

    // Tab blur window telemetry tracking
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

    // P2 #4: Countdown Timer with 60s Grace Re-Arm on Cancel
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    void handleEndInterview(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Format mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Candidate Turn Submission
    const triggerCandidateTurn = async (explicitText?: string) => {
        let candidateText = explicitText !== undefined ? explicitText : chatInput;
        setChatInput('');
        stopListening();

        if (audioChunksRef.current.length > 0 && (!candidateText || candidateText.length < 5)) {
            try {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                // P2 #2: Use BYOK Groq Whisper key if present, fallback to session apiKey
                const whisperApiKey = getStoredApiKey('GROQ') || apiKey;
                const whisperResult = await transcribeAudio(audioBlob, whisperApiKey);
                if (whisperResult && whisperResult.transcript && whisperResult.transcript.trim().length > 3) {
                    candidateText = whisperResult.transcript.trim();
                }
            } catch (err) {
                console.warn('Whisper fallback note:', err);
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

        // Stage progression heuristics based on turns (no aggressive snatching)
        if (currentStage === 'INTRODUCTION') {
            setCurrentStage('CORE_TECH');
        } else if (currentStage === 'CORE_TECH' && messages.length >= 4) {
            setCurrentStage('CODING_DSA');
        }

        setIsAiResponding(true);

        try {
            const contextPayload = `Problem: ${question.title}\nDescription: ${question.problemStatement}\nCandidate Scratchpad:\n${scratchpadNotes}\n[Current Stage: ${currentStage}]\n${architectureSummary ? `\n[System Design Architecture Canvas Context]:\n${architectureSummary}` : ''}`;

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
            content += `// Standard Input (stdin):\n`;
            t.input.split('\n').forEach((l) => { content += `//   ${l}\n`; });
            content += `// Expected Output (stdout):\n`;
            t.expectedOutput.split('\n').forEach((l) => { content += `//   ${l}\n`; });
            content += `\n`;
        });
        return content;
    };

    // Real Judge0 CE Sandbox Test Runner
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

    const handleEndInterview = async (isAutoExpiry = false) => {
        const message = isAutoExpiry
            ? 'Assessment time has expired. Conclude interview and generate your 360° Diagnostic Report?'
            : 'Are you ready to conclude your interview session and generate your 360° Diagnostic Report?';

        if (window.confirm(message)) {
            isSessionEndedRef.current = true;
            stopListening();
            window.speechSynthesis?.cancel();
            try {
                await completeSession(sessionId);
                onFinish();
            } catch (err) {
                console.error('Session complete error:', err);
                onFinish();
            }
        } else if (isAutoExpiry) {
            // Re-arm 60s grace period if candidate cancels auto-expiry prompt
            setTimeLeft(60);
        }
    };

    const handleCopyExample = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#070b14', color: '#f8fafc', overflow: 'hidden' }}>

            {/* TOP BAR */}
            <header style={{
                height: '56px',
                background: '#090d16',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 20px',
                zIndex: 20
            }}>
                {/* Brand & Problem Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
                        }}>
                            <Sparkles size={16} color="#ffffff" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#f8fafc' }}>
                            AI Interview OS
                        </span>
                    </div>

                    <div style={{ width: '1px', height: '20px', background: '#1e293b' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>
                            {question.title}
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontWeight: 700 }}>
                            {question.track}
                        </span>
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontWeight: 700 }}>
                            {question.difficulty}
                        </span>
                    </div>
                </div>

                {/* Center / Right Telemetry & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Voice State Pill */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: isSpeakingNow ? 'rgba(6, 182, 212, 0.15)' : isListening ? 'rgba(16, 185, 129, 0.15)' : '#1e293b',
                        border: `1px solid ${isSpeakingNow ? 'rgba(6, 182, 212, 0.4)' : isListening ? 'rgba(16, 185, 129, 0.3)' : '#334155'}`,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isSpeakingNow ? '#38bdf8' : isListening ? '#34d399' : '#94a3b8'
                    }}>
                        <Mic size={13} color={isSpeakingNow ? '#38bdf8' : isListening ? '#34d399' : '#94a3b8'} />
                        <span>{isSpeakingNow ? 'Voice Active' : isListening ? 'Listening...' : 'Mic Ready'}</span>
                    </div>

                    {/* Proctor Chip */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: isWindowBlurred || tabSwitches > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.12)',
                        border: `1px solid ${isWindowBlurred || tabSwitches > 0 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isWindowBlurred || tabSwitches > 0 ? '#f87171' : '#34d399'
                    }}>
                        {isWindowBlurred || tabSwitches > 0 ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                        <span>{isWindowBlurred ? 'Focus Lost' : tabSwitches > 0 ? `${tabSwitches} Blurs` : 'Proctor: Clean'}</span>
                    </div>

                    {/* Countdown Timer */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        fontSize: '0.82rem',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: timeLeft < 300 ? '#f87171' : '#f8fafc'
                    }}>
                        <Timer size={14} color={timeLeft < 300 ? '#f87171' : '#818cf8'} />
                        <span>{formatTime(timeLeft)}</span>
                    </div>

                    {/* End & Report Button (Variant: Danger) */}
                    <button
                        onClick={() => void handleEndInterview(false)}
                        style={{
                            background: '#dc2626',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 0 12px rgba(220, 38, 38, 0.35)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
                    >
                        End & Report
                    </button>
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

            {/* THREE-PANEL INTERVIEW ARENA */}
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', flex: 1, overflow: 'hidden' }}>

                {/* LEFT PANEL: Problem | Examples | Scratchpad */}
                <div style={{
                    background: '#090d16',
                    borderRight: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    {/* Left Tabs */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #1e293b',
                        background: '#050811'
                    }}>
                        {(['problem', 'examples', 'scratchpad'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setLeftPanelTab(tab)}
                                style={{
                                    flex: 1,
                                    padding: '10px 8px',
                                    background: leftPanelTab === tab ? '#090d16' : 'transparent',
                                    border: 'none',
                                    borderBottom: leftPanelTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                                    color: leftPanelTab === tab ? '#f8fafc' : '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {tab === 'problem' ? 'Problem' : tab === 'examples' ? `Examples (${question.sampleTests?.length || 0})` : 'Scratchpad'}
                            </button>
                        ))}
                    </div>

                    {/* Left Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        {leftPanelTab === 'problem' && (
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                                    {question.title}
                                </h2>
                                <div style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
                                    {question.problemStatement}
                                </div>

                                {question.evaluationCriteria && question.evaluationCriteria.length > 0 && (
                                    <div style={{ marginTop: '16px', background: '#040711', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', marginBottom: '6px' }}>
                                            Evaluation Criteria:
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '16px', color: '#94a3b8', fontSize: '0.78rem', lineHeight: '1.5' }}>
                                            {question.evaluationCriteria.map((c, i) => <li key={i}>{c}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {leftPanelTab === 'examples' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {question.sampleTests && question.sampleTests.length > 0 ? (
                                    question.sampleTests.map((test, i) => (
                                        <div key={i} style={{ background: '#040711', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
                                                    {test.name}
                                                </span>
                                                <button
                                                    onClick={() => handleCopyExample(test.input, i)}
                                                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                                                    title="Copy Input"
                                                >
                                                    {copiedIndex === i ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px' }}>Input:</div>
                                            <pre style={{ background: '#090d16', padding: '6px 8px', borderRadius: '4px', color: '#34d399', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', margin: '0 0 8px', overflowX: 'auto' }}>
                                                {test.input}
                                            </pre>
                                            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '2px' }}>Expected Output:</div>
                                            <pre style={{ background: '#090d16', padding: '6px 8px', borderRadius: '4px', color: '#cbd5e1', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', margin: 0, overflowX: 'auto' }}>
                                                {test.expectedOutput}
                                            </pre>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No public sample test fixtures.</div>
                                )}
                            </div>
                        )}

                        {leftPanelTab === 'scratchpad' && (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px' }}>
                                    Live Thought Scratchpad (Visible to AI Reviewer):
                                </div>
                                <textarea
                                    value={scratchpadNotes}
                                    onChange={(e) => setScratchpadNotes(e.target.value)}
                                    style={{
                                        flex: 1,
                                        width: '100%',
                                        minHeight: '260px',
                                        background: '#040711',
                                        border: '1px solid #1e293b',
                                        borderRadius: '8px',
                                        color: '#cbd5e1',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.82rem',
                                        padding: '12px',
                                        resize: 'none',
                                        outline: 'none',
                                        lineHeight: '1.4'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* CENTER PANEL: Monaco Workspace + Test Console / Whiteboard */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#070b14',
                    overflow: 'hidden'
                }}>
                    {/* Workspace Tabs Header */}
                    <div style={{
                        height: '44px',
                        background: '#090d16',
                        borderBottom: '1px solid #1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 14px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                onClick={() => setEditorTab('solution')}
                                style={{
                                    background: editorTab === 'solution' ? '#1e293b' : 'transparent',
                                    border: `1px solid ${editorTab === 'solution' ? '#334155' : 'transparent'}`,
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    color: editorTab === 'solution' ? '#f8fafc' : '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Code size={14} color="#818cf8" />
                                Solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'java'}
                            </button>

                            <button
                                onClick={() => setEditorTab('tests')}
                                style={{
                                    background: editorTab === 'tests' ? '#1e293b' : 'transparent',
                                    border: `1px solid ${editorTab === 'tests' ? '#334155' : 'transparent'}`,
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    color: editorTab === 'tests' ? '#f8fafc' : '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <FileText size={14} color="#38bdf8" />
                                tests.{language === 'python' ? 'py' : 'java'} (Read-Only)
                            </button>

                            <button
                                onClick={() => setEditorTab('whiteboard')}
                                style={{
                                    background: editorTab === 'whiteboard' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    border: `1px solid ${editorTab === 'whiteboard' ? '#6366f1' : 'transparent'}`,
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    color: editorTab === 'whiteboard' ? '#c7d2fe' : '#94a3b8',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Layers size={14} color="#a855f7" />
                                System Design Whiteboard
                            </button>
                        </div>

                        {/* Language Selector & Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <select
                                value={language}
                                onChange={(e) => handleLanguageChange(e.target.value as any)}
                                style={{
                                    background: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid #334155',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600,
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="java">Java 21 LTS</option>
                                <option value="python">Python 3.12</option>
                                <option value="javascript">JavaScript (Node)</option>
                            </select>

                            <button
                                onClick={handleRunCode}
                                disabled={testStatus === 'running'}
                                style={{
                                    background: testStatus === 'running' ? '#334155' : 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '5px 14px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: testStatus === 'running' ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <Play size={13} fill="#ffffff" />
                                {testStatus === 'running' ? 'Executing...' : 'Run Test Suite'}
                            </button>

                            <button
                                onClick={() => void triggerCandidateTurn('I have updated and tested my code in the editor.')}
                                style={{
                                    background: '#4f46e5',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '5px 12px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                Submit Code Turn
                            </button>
                        </div>
                    </div>

                    {/* Main Workspace Area */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                        {editorTab === 'solution' && (
                            <Editor
                                height="100%"
                                language={language === 'python' ? 'python' : language === 'javascript' ? 'javascript' : 'java'}
                                theme="vs-dark"
                                value={code}
                                onChange={(val) => setCode(val || '')}
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
                            <div style={{ height: '100%', padding: '8px' }}>
                                <HldWhiteboardCanvas onArchitectureUpdate={(sum) => setArchitectureSummary(sum)} />
                            </div>
                        )}
                    </div>

                    {/* Bottom Test Suite Runner Console */}
                    {executionOutput && (
                        <div style={{
                            height: '160px',
                            background: '#040711',
                            borderTop: '1px solid #1e293b',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <div style={{
                                padding: '6px 14px',
                                background: '#090d16',
                                borderBottom: '1px solid #1e293b',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Code size={13} /> Judge0 CE Sandbox Console
                                </span>
                                <button
                                    onClick={() => setExecutionOutput(null)}
                                    style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer' }}
                                >
                                    ✕ Close
                                </button>
                            </div>
                            <pre style={{
                                flex: 1,
                                margin: 0,
                                padding: '10px 14px',
                                overflowY: 'auto',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                color: testStatus === 'passed' ? '#34d399' : '#f87171',
                                lineHeight: '1.45'
                            }}>
                                {executionOutput}
                            </pre>
                        </div>
                    )}
                </div>

                {/* RIGHT PANEL: AI Persona Card, Dialogue Transcript & Controls */}
                <div style={{
                    background: '#090d16',
                    borderLeft: '1px solid #1e293b',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {/* AI Avatar & Audio Waveform */}
                    <div style={{ padding: '14px 14px 8px' }}>
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
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '10px 14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {messages.map((m, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    background: m.role === 'candidate' ? '#1e1b4b' : '#0f172a',
                                    border: `1px solid ${m.role === 'candidate' ? '#4f46e5' : '#1e293b'}`,
                                    fontSize: '0.85rem',
                                    lineHeight: '1.5'
                                }}
                            >
                                <div style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: m.role === 'candidate' ? '#c7d2fe' : '#818cf8',
                                    marginBottom: '4px',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>{m.role === 'candidate' ? 'You (Candidate)' : 'AI Principal Interviewer'}</span>
                                    {m.timestamp && <span style={{ color: '#64748b', fontWeight: 500 }}>{m.timestamp}</span>}
                                </div>
                                <div style={{ color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                                    {m.content}
                                </div>
                            </div>
                        ))}

                        {isAiResponding && (
                            <div style={{
                                padding: '10px 14px',
                                borderRadius: '8px',
                                background: '#0f172a',
                                border: '1px solid #1e293b',
                                color: '#818cf8',
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <Sparkles size={14} className="animate-spin" />
                                AI Interviewer is evaluating technical response...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Candidate Input & Mic Controller */}
                    <div style={{
                        padding: '12px 14px',
                        borderTop: '1px solid #1e293b',
                        background: '#040711'
                    }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                                onClick={() => {
                                    if (isListening) stopListening();
                                    else startListening();
                                }}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    background: isListening ? '#dc2626' : '#1e293b',
                                    border: `1px solid ${isListening ? '#ef4444' : '#334155'}`,
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none',
                                    transition: 'all 0.2s ease'
                                }}
                                title={isListening ? 'Stop Speaking' : 'Start Speaking'}
                            >
                                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                            </button>

                            <input
                                type="text"
                                placeholder="Speak or type your explanation here..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        void triggerCandidateTurn();
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    background: '#090d16',
                                    border: '1px solid #1e293b',
                                    borderRadius: '8px',
                                    padding: '8px 12px',
                                    color: '#f8fafc',
                                    fontSize: '0.85rem',
                                    outline: 'none'
                                }}
                            />

                            <button
                                onClick={() => void triggerCandidateTurn()}
                                disabled={isAiResponding}
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    background: '#4f46e5',
                                    border: 'none',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Floating Corner Proctor Tile */}
                    <div style={{
                        position: 'absolute',
                        bottom: '72px',
                        right: '16px',
                        zIndex: 30
                    }}>
                        <WebcamTile
                            isTabBlurred={isWindowBlurred}
                            tabSwitchCount={tabSwitches}
                            pasteCount={pasteDumps}
                        />
                    </div>

                </div>

            </div>

        </div>
    );
};