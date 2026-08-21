import React, { useState, useEffect } from 'react';
import type { DiagnosticReportResponse } from '../types';
import { fetchSessionTranscript } from '../services/api';
import { Award, CheckCircle2, AlertTriangle, Calendar, Printer, RotateCcw, Download, MessageSquare, Sparkles, BookOpen, Quote } from 'lucide-react';

interface Props {
    report: DiagnosticReportResponse;
    onRestart: () => void;
}

export const DiagnosticReportView: React.FC<Props> = ({ report, onRestart }) => {
    const [activeTab, setActiveTab] = useState<'report' | 'transcript'>('report');
    const [transcriptData, setTranscriptData] = useState<any | null>(null);

    useEffect(() => {
        if (report.sessionId) {
            fetchSessionTranscript(report.sessionId)
                .then((data) => setTranscriptData(data))
                .catch((err) => console.warn('Could not load transcript from MongoDB:', err));
        }
    }, [report.sessionId]);

    const getVerdictBadge = (verdict: string) => {
        switch (verdict) {
            case 'STRONG_HIRE': return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.2)', label: 'Strong Hire (Top 5%)' };
            case 'HIRE': return { color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.2)', label: 'Hire (Meets All Bars)' };
            case 'LEAN_HIRE': return { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.2)', label: 'Lean Hire (Borderline)' };
            default: return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)', label: 'No Hire (Gaps Spotted)' };
        }
    };

    const badge = getVerdictBadge(report.verdict);

    const getDimensionColor = (score: number) => {
        if (score >= 70) return '#34d399';
        if (score >= 40) return '#fbbf24';
        return '#f87171';
    };

    const formatDimensionName = (dim: string) => {
        return dim.replace(/_/g, ' ');
    };

    // Export Transcript to text file for recruiters / hiring managers
    const handleDownloadTranscript = () => {
        if (!transcriptData || !transcriptData.transcript) return;

        let content = `==========================================================\n`;
        content += `AI INTERVIEW OS - CANDIDATE TRANSCRIPT AUDIT LOG\n`;
        content += `==========================================================\n`;
        content += `Session ID: ${report.sessionId}\n`;
        content += `Candidate: ${transcriptData.candidateName || report.candidateId}\n`;
        content += `Target Role: ${report.roleTitle} (${report.difficulty})\n`;
        content += `Track: ${report.track}\n`;
        content += `Overall Score: ${report.overallScore}/100 [Verdict: ${report.verdict}]\n`;
        content += `Total Dialogue Turns: ${transcriptData.totalTurns || 0}\n`;
        content += `==========================================================\n\n`;

        transcriptData.transcript.forEach((turn: any, index: number) => {
            content += `[TURN #${turn.turnNumber || index + 1}] - ${turn.senderRole} (${turn.timestamp || 'N/A'})\n`;
            content += `Type: ${turn.messageType}\n`;
            content += `Content: ${turn.content}\n`;
            if (turn.codeSnippet && turn.codeSnippet.trim()) {
                content += `Code Snapshot:\n${turn.codeSnippet}\n`;
            }
            content += `----------------------------------------------------------\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_Transcript_Session_${report.sessionId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{ maxWidth: '960px', margin: '30px auto', padding: '0 20px 60px' }}>

            {/* Top Action Bar */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setActiveTab('report')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'report' ? '#6366f1' : '#1e293b',
                            color: '#ffffff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Award size={16} /> 360° Diagnostic Scorecard
                    </button>

                    <button
                        onClick={() => setActiveTab('transcript')}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'transcript' ? '#6366f1' : '#1e293b',
                            color: '#ffffff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <MessageSquare size={16} /> Audit Transcript ({transcriptData?.totalTurns || 0} Turns)
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    {transcriptData && (
                        <button
                            onClick={handleDownloadTranscript}
                            style={{
                                background: '#1e293b',
                                color: '#e2e8f0',
                                border: '1px solid #334155',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Download size={15} color="#818cf8" /> Export Transcript (.TXT)
                        </button>
                    )}

                    <button className="btn btn-secondary" onClick={onRestart}>
                        <RotateCcw size={16} /> Start New
                    </button>

                    <button className="btn btn-primary" onClick={() => window.print()}>
                        <Printer size={16} /> Print Report
                    </button>
                </div>
            </div>

            {activeTab === 'report' ? (
                <div className="glass-card" style={{ padding: '36px', background: '#0f172a', border: '1px solid #1e293b' }}>

                    {/* Banner */}
                    <div style={{ borderBottom: '1px solid #1e293b', paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>360° Candidate Diagnostic Report</h1>
                                {report.llmGenerated ? (
                                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                        <Sparkles size={12} /> LLM Rubric
                                    </span>
                                ) : (
                                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '12px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.3)', fontWeight: 700 }}>
                                        Deterministic Fallback
                                    </span>
                                )}
                            </div>
                            <p style={{ color: '#94a3b8', marginTop: '6px' }}>
                                Target: <strong>{report.roleTitle}</strong> ({report.difficulty}) • Track: <strong>{report.track}</strong>
                            </p>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: badge.color, fontFamily: 'var(--font-mono)' }}>
                                {report.overallScore}/100
                            </div>
                            <div style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '20px', background: badge.bg, color: badge.color, fontWeight: 700, fontSize: '0.85rem', marginTop: '4px' }}>
                                {badge.label}
                            </div>
                        </div>
                    </div>

                    {/* 6-Metric Breakdown Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', margin: '28px 0' }}>
                        {[
                            { label: 'Technical Accuracy', score: report.scorecard.technicalAccuracy },
                            { label: 'Problem Solving', score: report.scorecard.problemSolving },
                            { label: 'Communication', score: report.scorecard.communicationClarity },
                            { label: 'Code Quality', score: report.scorecard.codeQuality },
                            { label: 'Requirements Clarity', score: report.scorecard.requirementsClarification ?? 40 },
                            { label: 'Integrity Index', score: report.scorecard.integrityScore }
                        ].map((item, idx) => (
                            <div key={idx} style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 8px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 700, color: getDimensionColor(item.score), fontFamily: 'var(--font-mono)' }}>
                                    {item.score}%
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', lineHeight: '1.2' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Executive Summary */}
                    <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '18px', borderRadius: '8px', marginBottom: '28px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Award size={18} /> Executive Evaluation Summary
                        </h3>
                        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.55' }}>
                            {report.executiveSummary}
                        </p>
                    </div>

                    {/* Qualitative 5-Dimension Rubric Cards */}
                    {report.dimensions && report.dimensions.length > 0 && (
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={18} color="#818cf8" /> Qualitative Dimension Rubric Breakdown
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {report.dimensions.map((dim, idx) => {
                                    const dimColor = getDimensionColor(dim.score);
                                    return (
                                        <div key={idx} style={{ background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', padding: '18px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.82rem', padding: '2px 8px', borderRadius: '4px', background: '#1e293b', color: '#cbd5e1', fontWeight: 700 }}>
                                                        DIMENSION {idx + 1}
                                                    </span>
                                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                                                        {formatDimensionName(dim.dimension)}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '100px', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${dim.score}%`, height: '100%', background: dimColor }} />
                                                    </div>
                                                    <span style={{ fontSize: '1rem', fontWeight: 800, color: dimColor, fontFamily: 'var(--font-mono)' }}>
                                                        {dim.score}/100
                                                    </span>
                                                </div>
                                            </div>

                                            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: '1.5', margin: '0 0 12px' }}>
                                                {dim.rationale}
                                            </p>

                                            <div style={{ background: '#0f172a', borderLeft: `3px solid ${dimColor}`, padding: '10px 14px', borderRadius: '0 6px 6px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                <Quote size={14} color={dimColor} style={{ marginTop: '2px', flexShrink: 0 }} />
                                                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', fontFamily: 'var(--font-mono)', lineHeight: '1.4' }}>
                                                    <strong>Verbatim Evidence:</strong> "{dim.evidence}"
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Strengths & Weaknesses */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '18px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle2 size={18} /> Key Strengths Observed
                            </h3>
                            <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                                {report.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>

                        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '18px', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={18} /> Focus & Improvement Areas
                            </h3>
                            <ul style={{ paddingLeft: '18px', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.6', margin: 0 }}>
                                {report.areasForImprovement.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                        </div>
                    </div>

                    {/* 7-Day Action Plan */}
                    <div style={{ borderTop: '1px solid #1e293b', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
                            <Calendar size={18} color="#6366f1" /> Personalized 7-Day Technical Action Plan
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {report.sevenDayStudyPlan.map((step, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: '#090d16', border: '1px solid #1e293b', padding: '12px 16px', borderRadius: '8px' }}>
                                    <input type="checkbox" style={{ marginTop: '4px', cursor: 'pointer' }} />
                                    <span style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: '1.4' }}>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            ) : (
                /* Full Multi-Turn Transcript Audit Replay */
                <div className="glass-card" style={{ padding: '32px', background: '#0f172a', border: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '18px', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f8fafc' }}>Interview Transcript & Audit Log</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '2px' }}>
                                Full multi-turn dialogue record stored in MongoDB document repository.
                            </p>
                        </div>

                        <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', fontWeight: 600 }}>
                            {transcriptData?.totalTurns || 0} Chronological Turns
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {transcriptData?.transcript && transcriptData.transcript.length > 0 ? (
                            transcriptData.transcript.map((turn: any, idx: number) => (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '10px',
                                        background: turn.senderRole === 'CANDIDATE' ? '#1e1b4b' : '#1e293b',
                                        border: `1px solid ${turn.senderRole === 'CANDIDATE' ? '#4f46e5' : '#334155'}`
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: turn.senderRole === 'CANDIDATE' ? '#c7d2fe' : '#94a3b8', marginBottom: '6px' }}>
                                        <span>Turn #{turn.turnNumber || idx + 1}: {turn.senderRole === 'CANDIDATE' ? 'Candidate Response' : 'AI Principal Interviewer'}</span>
                                        {turn.timestamp && <span>{new Date(turn.timestamp).toLocaleTimeString()}</span>}
                                    </div>

                                    <div style={{ fontSize: '0.9rem', color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                                        {turn.content}
                                    </div>

                                    {turn.codeSnippet && turn.codeSnippet.trim() && (
                                        <div style={{ marginTop: '10px', background: '#090d16', padding: '10px', borderRadius: '6px', border: '1px solid #334155' }}>
                                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Code Snapshot at this turn:</div>
                                            <pre style={{ color: '#34d399', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', margin: 0, overflowX: 'auto' }}>
                                                {turn.codeSnippet}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                No transcript messages recorded for this session.
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};