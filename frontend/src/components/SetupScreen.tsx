import React, { useState } from 'react';
import type { DifficultyLevel, InterviewTrack, ModelProvider } from '../types';
import { getStoredApiKey, setStoredApiKey, uploadResumeFile, uploadResumeText } from '../services/api';
import { Sparkles, Key, ArrowRight, ShieldCheck, Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
    onStart: (config: {
        candidateId: string;
        roleTitle: string;
        track: InterviewTrack;
        difficulty: DifficultyLevel;
        targetCompany: string;
        jobDescription: string;
        provider: ModelProvider;
        apiKey: string;
    }) => void;
    isLoading: boolean;
}

export const SetupScreen: React.FC<Props> = ({ onStart, isLoading }) => {
    const [candidateId, setCandidateId] = useState('candidate-01');
    const [candidateName, setCandidateName] = useState('Harish Rahangdale');
    const [roleTitle, setRoleTitle] = useState('Senior Java Backend Engineer');
    const [track, setTrack] = useState<InterviewTrack>('JAVA_SPRING_BOOT');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('SENIOR');
    const [targetCompany, setTargetCompany] = useState('Amazon');
    const [jobDescription, setJobDescription] = useState('Deep knowledge of Java 21 Virtual Threads, Spring Boot 3.4 microservices, JPA caching, and concurrency.');
    const [provider, setProvider] = useState<ModelProvider>('GEMINI');
    const [apiKey, setApiKey] = useState(getStoredApiKey('GEMINI'));
    const [showKeyModal, setShowKeyModal] = useState(false);

    // --- Resume Ingestion State ---
    const [resumeMode, setResumeMode] = useState<'upload' | 'paste'>('upload');
    const [pastedResumeText, setPastedResumeText] = useState('');
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [parsedResumeData, setParsedResumeData] = useState<{
        id: string;
        fileName: string;
        skills: string[];
        yearsOfExperience: number;
        summary: string;
    } | null>(null);

    const handleProviderChange = (newProvider: ModelProvider) => {
        setProvider(newProvider);
        setApiKey(getStoredApiKey(newProvider));
    };

    const handleSaveKey = () => {
        setStoredApiKey(provider, apiKey);
        setShowKeyModal(false);
    };

    // --- Resume File Upload Handler ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsingResume(true);
        try {
            const result = await uploadResumeFile(file, candidateId, candidateName, `${roleTitle} Resume`);
            setParsedResumeData({
                id: result.id,
                fileName: result.fileName,
                skills: result.skills || [],
                yearsOfExperience: result.yearsOfExperience || 4,
                summary: result.summary || 'Resume parsed successfully.'
            });
            // Enrich the job description context automatically with candidate resume skills
            if (result.summary) {
                setJobDescription((prev) => `${prev}\n\n[Candidate Resume Context: ${result.summary}]`);
            }
        } catch (err) {
            console.error('Resume upload failed:', err);
            alert('Failed to parse resume file. Please ensure it is a valid PDF or text file.');
        } finally {
            setIsParsingResume(false);
        }
    };

    // --- Resume Text Paste Ingest Handler ---
    const handleTextIngest = async () => {
        if (!pastedResumeText.trim()) return;

        setIsParsingResume(true);
        try {
            const result = await uploadResumeText({
                candidateId,
                candidateName,
                resumeTitle: `${roleTitle} Profile`,
                resumeText: pastedResumeText
            });
            setParsedResumeData({
                id: result.id,
                fileName: result.fileName,
                skills: result.skills || [],
                yearsOfExperience: result.yearsOfExperience || 4,
                summary: result.summary || 'Pasted text parsed successfully.'
            });
            if (result.summary) {
                setJobDescription((prev) => `${prev}\n\n[Candidate Resume Context: ${result.summary}]`);
            }
        } catch (err) {
            console.error('Resume text parsing failed:', err);
        } finally {
            setIsParsingResume(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onStart({
            candidateId,
            roleTitle,
            track,
            difficulty,
            targetCompany,
            jobDescription,
            provider,
            apiKey
        });
    };

    return (
        <div style={{ maxWidth: '880px', margin: '30px auto', padding: '0 20px' }}>
            <div className="glass-card" style={{ padding: '36px', background: '#0f172a', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={24} color="#6366f1" />
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc' }}>AI Interview OS</h1>
                        </div>
                        <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.92rem' }}>
                            Enterprise Autonomous Interview Simulator, Resume Pipeline & Real-Time Proctor Sentinel
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowKeyModal(true)}
                        style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
                    >
                        <Key size={16} />
                        BYOK Settings ({provider})
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

                    {/* Candidate Identity */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                                Candidate Full Name
                            </label>
                            <input
                                className="form-input"
                                value={candidateName}
                                onChange={(e) => setCandidateName(e.target.value)}
                                placeholder="e.g. Harish Rahangdale"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                                Candidate ID
                            </label>
                            <input
                                className="form-input"
                                value={candidateId}
                                onChange={(e) => setCandidateId(e.target.value)}
                                placeholder="e.g. candidate-01"
                                required
                            />
                        </div>
                    </div>

                    {/* Role & Track Selection */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                                Target Role Title
                            </label>
                            <input
                                className="form-input"
                                value={roleTitle}
                                onChange={(e) => setRoleTitle(e.target.value)}
                                placeholder="e.g. Senior Java Backend Engineer"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                                Interview Track
                            </label>
                            <select
                                className="form-select"
                                value={track}
                                onChange={(e) => setTrack(e.target.value as InterviewTrack)}
                            >
                                <option value="JAVA_SPRING_BOOT">☕ Java 21 & Spring Boot 3 Deep Dive</option>
                                <option value="ALGORITHMS_DATA_STRUCTURES">🧩 Data Structures & Algorithms</option>
                                <option value="SYSTEM_DESIGN">🏗️ System Design & Architecture (HLD/LLD)</option>
                                <option value="BEHAVIORAL_STAR">🤝 Behavioral & Leadership (STAR Method)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                                Seniority Level
                            </label>
                            <select
                                className="form-select"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                            >
                                <option value="JUNIOR">Junior (0-2 yrs)</option>
                                <option value="MID">Mid-Level (2-5 yrs)</option>
                                <option value="SENIOR">Senior (5-8+ yrs)</option>
                                <option value="STAFF">Staff / Principal (8+ yrs)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                                Target Company
                            </label>
                            <input
                                className="form-input"
                                value={targetCompany}
                                onChange={(e) => setTargetCompany(e.target.value)}
                                placeholder="e.g. Google, Amazon, Netflix, Uber"
                            />
                        </div>
                    </div>

                    {/* ========================================================================= */}
                    {/* RESUME INGESTION & PARSING PIPELINE (MongoDB Document Repository)        */}
                    {/* ========================================================================= */}
                    <div style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={18} color="#818cf8" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
                                    Resume Ingestion Pipeline (MongoDB Powered)
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    type="button"
                                    onClick={() => setResumeMode('upload')}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: resumeMode === 'upload' ? '#6366f1' : '#1e293b',
                                        color: '#ffffff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Upload PDF
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setResumeMode('paste')}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: resumeMode === 'paste' ? '#6366f1' : '#1e293b',
                                        color: '#ffffff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Paste Text
                                </button>
                            </div>
                        </div>

                        {resumeMode === 'upload' ? (
                            <div style={{
                                border: '2px dashed #334155',
                                borderRadius: '8px',
                                padding: '20px',
                                textAlign: 'center',
                                background: 'rgba(30, 41, 59, 0.3)',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="file"
                                    id="resume-file-input"
                                    accept=".pdf,.txt,.docx"
                                    onChange={handleFileUpload}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="resume-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    {isParsingResume ? (
                                        <Loader2 size={28} color="#818cf8" className="animate-spin" />
                                    ) : (
                                        <Upload size={28} color="#94a3b8" />
                                    )}
                                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
                                        {isParsingResume ? 'Parsing PDF via Apache PDFBox & MongoDB...' : 'Drop candidate resume PDF here or click to browse'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        Supports PDF and TXT. Multi-page architectures supported.
                                    </span>
                                </label>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={pastedResumeText}
                                    onChange={(e) => setPastedResumeText(e.target.value)}
                                    placeholder="Paste resume text or key career highlights here..."
                                    style={{ fontSize: '0.82rem' }}
                                />
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleTextIngest}
                                    disabled={isParsingResume || !pastedResumeText.trim()}
                                    style={{ alignSelf: 'flex-end', padding: '6px 14px', fontSize: '0.78rem' }}
                                >
                                    {isParsingResume ? 'Ingesting...' : 'Ingest Resume Text'}
                                </button>
                            </div>
                        )}

                        {/* Extracted Resume Confirmation Card */}
                        {parsedResumeData && (
                            <div style={{
                                marginTop: '14px',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem', fontWeight: 600 }}>
                                        <CheckCircle2 size={16} />
                                        <span>Resume Ingested: {parsedResumeData.fileName} (~{parsedResumeData.yearsOfExperience} yrs exp)</span>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Stored in MongoDB</span>
                                </div>

                                <div style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>
                                    {parsedResumeData.summary}
                                </div>

                                {parsedResumeData.skills.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                        {parsedResumeData.skills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    fontSize: '0.72rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(99, 102, 241, 0.2)',
                                                    color: '#a5b4fc',
                                                    fontWeight: 600
                                                }}
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Target Job Description */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1' }}>
                            Target Job Description / Assessment Focus
                        </label>
                        <textarea
                            className="form-textarea"
                            rows={2}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste specific JD requirements or focus topics..."
                        />
                    </div>

                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={20} color="#818cf8" />
                        <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                            <strong>Personalized Grounding</strong>: The AI Interviewer uses your ingested resume and selected track to formulate deep, real-world technical scenarios.
                        </span>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || isParsingResume}
                        style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '6px', background: '#6366f1', color: '#ffffff', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {isLoading ? 'Synthesizing Custom Question...' : 'Launch Technical Assessment'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>

            {/* BYOK Modal */}
            {showKeyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-card" style={{ width: '480px', padding: '28px', background: '#12121a', border: '1px solid #334155' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#f8fafc' }}>🔑 BYOK Model & Key Settings</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>Inference Provider</label>
                            <select
                                className="form-select"
                                value={provider}
                                onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
                            >
                                <option value="GEMINI">Google Gemini (Gemini 1.5 Flash - Free)</option>
                                <option value="GROQ">Groq Cloud (Llama 3.3 70B - Fast & Free)</option>
                                <option value="OLLAMA">Local Ollama (100% Offline / Zero Keys)</option>
                                <option value="OPENAI">OpenAI (GPT-4o Mini)</option>
                                <option value="QWEN">Qwen (Qwen 2.5 Coder)</option>
                                <option value="GLM">GLM (Zhipu AI GLM-4)</option>
                                <option value="KIMI">Kimi (Moonshot AI)</option>
                                <option value="DEEPSEEK">DeepSeek (DeepSeek-V3)</option>
                            </select>
                        </div>

                        {provider !== 'OLLAMA' && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#cbd5e1' }}>API Key for {provider}</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={`Paste your ${provider} API key here`}
                                />
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                                    Stored only in your browser localStorage. Never saved on any remote database.
                                </span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn btn-secondary" onClick={() => setShowKeyModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveKey}>Save Credentials</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};