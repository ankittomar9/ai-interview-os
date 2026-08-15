import React, { useState } from 'react';
import type { DifficultyLevel, InterviewTrack, ModelProvider } from '../types';
import { getStoredApiKey, setStoredApiKey } from '../services/api';
import { Sparkles, Key, ArrowRight, ShieldCheck } from 'lucide-react';

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
    const [roleTitle, setRoleTitle] = useState('Senior Java Backend Engineer');
    const [track, setTrack] = useState<InterviewTrack>('JAVA_SPRING_BOOT');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('SENIOR');
    const [targetCompany, setTargetCompany] = useState('Amazon');
    const [jobDescription, setJobDescription] = useState('Deep knowledge of Java 21 Virtual Threads, Spring Boot 3.4 microservices, JPA caching, and concurrency.');
    const [provider, setProvider] = useState<ModelProvider>('GEMINI');
    const [apiKey, setApiKey] = useState(getStoredApiKey('GEMINI'));
    const [showKeyModal, setShowKeyModal] = useState(false);

    const handleProviderChange = (newProvider: ModelProvider) => {
        setProvider(newProvider);
        setApiKey(getStoredApiKey(newProvider));
    };

    const handleSaveKey = () => {
        setStoredApiKey(provider, apiKey);
        setShowKeyModal(false);
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
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            <div className="glass-card" style={{ padding: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Sparkles size={24} color="#6366f1" />
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>AI Interview OS</h1>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
                            Autonomous Technical Interview Simulator & Real-time Proctor Sentinel
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowKeyModal(true)}
                    >
                        <Key size={16} />
                        BYOK Settings ({provider})
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Candidate ID</label>
                            <input
                                className="form-input"
                                value={candidateId}
                                onChange={(e) => setCandidateId(e.target.value)}
                                placeholder="e.g. candidate-01"
                                required
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Role Title</label>
                            <input
                                className="form-input"
                                value={roleTitle}
                                onChange={(e) => setRoleTitle(e.target.value)}
                                placeholder="e.g. Senior Java Backend Engineer"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Interview Track</label>
                            <select
                                className="form-select"
                                value={track}
                                onChange={(e) => setTrack(e.target.value as InterviewTrack)}
                            >
                                <option value="JAVA_SPRING_BOOT">Java 21 & Spring Boot 3 Deep Dive</option>
                                <option value="ALGORITHMS_DATA_STRUCTURES">Data Structures & Algorithms</option>
                                <option value="SYSTEM_DESIGN">System Design & Architecture</option>
                                <option value="BEHAVIORAL_STAR">Behavioral (STAR Method)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Seniority Level</label>
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
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Company (Optional)</label>
                        <input
                            className="form-input"
                            value={targetCompany}
                            onChange={(e) => setTargetCompany(e.target.value)}
                            placeholder="e.g. Google, Amazon, Uber"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Target Job Description / Focus Areas</label>
                        <textarea
                            className="form-textarea"
                            rows={3}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Paste specific JD requirements or technologies to focus on..."
                        />
                    </div>

                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={20} color="#818cf8" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>Zero Cloud Cost</strong>: Runs on localhost with local Proctor Sentinel and BYOK inference.
            </span>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading}
                        style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: '8px' }}
                    >
                        {isLoading ? 'Synthesizing Question...' : 'Launch Interview Session'}
                        {!isLoading && <ArrowRight size={18} />}
                    </button>
                </form>
            </div>

            {/* BYOK Modal */}
            {showKeyModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="glass-card" style={{ width: '480px', padding: '28px', background: '#12121a' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>🔑 BYOK Model & Key Settings</h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Inference Provider</label>
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
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>API Key for {provider}</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={`Paste your ${provider} API key here`}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
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