import React from 'react';
import type { DiagnosticReportResponse } from '../types';
import { Award, CheckCircle2, AlertTriangle, Calendar, Printer, RotateCcw } from 'lucide-react';

interface Props {
    report: DiagnosticReportResponse;
    onRestart: () => void;
}

export const DiagnosticReportView: React.FC<Props> = ({ report, onRestart }) => {
    const getVerdictBadge = (verdict: string) => {
        switch (verdict) {
            case 'STRONG_HIRE': return { color: '#34d399', bg: 'rgba(16, 185, 129, 0.2)', label: 'Strong Hire (Top 5%)' };
            case 'HIRE': return { color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.2)', label: 'Hire (Meets All Bars)' };
            case 'LEAN_HIRE': return { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.2)', label: 'Lean Hire (Borderline)' };
            default: return { color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)', label: 'No Hire (Gaps Spotted)' };
        }
    };

    const badge = getVerdictBadge(report.verdict);

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px 60px' }}>

            {/* Top Action Bar */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <button className="btn btn-secondary" onClick={onRestart}>
                    <RotateCcw size={16} /> Start New Interview
                </button>

                <button className="btn btn-primary" onClick={() => window.print()}>
                    <Printer size={16} /> Print / Export PDF
                </button>
            </div>

            <div className="glass-card" style={{ padding: '36px' }}>

                {/* Banner */}
                <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>360° Candidate Diagnostic Report</h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
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

                {/* 5-Dimension Scorecard Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', margin: '28px 0' }}>
                    {[
                        { label: 'Technical Accuracy', score: report.scorecard.technicalAccuracy },
                        { label: 'Problem Solving', score: report.scorecard.problemSolving },
                        { label: 'Communication', score: report.scorecard.communicationClarity },
                        { label: 'Code Quality', score: report.scorecard.codeQuality },
                        { label: 'Integrity Index', score: report.scorecard.integrityScore }
                    ].map((item, idx) => (
                        <div key={idx} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-card)', borderRadius: '8px', padding: '14px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.score >= 80 ? '#34d399' : item.score >= 65 ? '#fbbf24' : '#f87171', fontFamily: 'var(--font-mono)' }}>
                                {item.score}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.label}</div>
                        </div>
                    ))}
                </div>

                {/* Executive Summary */}
                <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '28px' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={18} /> Executive Evaluation Summary
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                        {report.executiveSummary}
                    </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '18px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={18} /> Key Strengths Observed
                        </h3>
                        <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                            {report.keyStrengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>

                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '18px', borderRadius: '8px' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} /> Focus & Improvement Areas
                        </h3>
                        <ul style={{ paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                            {report.areasForImprovement.map((w, i) => <li key={i}>{w}</li>)}
                        </ul>
                    </div>
                </div>

                {/* 7-Day Remediation Plan */}
                <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={20} color="#6366f1" /> Personalized 7-Day Technical Action Plan
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {report.sevenDayStudyPlan.map((step, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-card)', padding: '12px 16px', borderRadius: '8px' }}>
                                <input type="checkbox" style={{ marginTop: '4px', cursor: 'pointer' }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{step}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};