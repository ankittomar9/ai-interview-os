import React from 'react';
import { CheckCircle2, CircleDot, Circle } from 'lucide-react';

export type InterviewStage = 'INTRODUCTION' | 'CORE_TECH' | 'CODING_DSA' | 'SYSTEM_DESIGN';

interface Props {
    currentStage: InterviewStage;
    onStageClick?: (stage: InterviewStage) => void;
}

interface StageInfo {
    key: InterviewStage;
    label: string;
    description: string;
}

const STAGES: StageInfo[] = [
    { key: 'INTRODUCTION', label: '1. Introduction', description: 'Background & Role Fit' },
    { key: 'CORE_TECH', label: '2. Core Tech', description: 'Deep Dive & Foundations' },
    { key: 'CODING_DSA', label: '3. Coding & DSA', description: 'Sandbox Implementation' },
    { key: 'SYSTEM_DESIGN', label: '4. System Design', description: 'Architecture & Scalability' },
];

export const StageStepper: React.FC<Props> = ({ currentStage, onStageClick }) => {
    const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0b1120',
            borderBottom: '1px solid #1e293b',
            padding: '10px 24px',
            position: 'relative',
            zIndex: 10
        }}>
            {STAGES.map((stage, idx) => {
                const isCompleted = idx < currentIndex;
                const isActive = idx === currentIndex;

                return (
                    <React.Fragment key={stage.key}>
                        <div
                            onClick={() => onStageClick && onStageClick(stage.key)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: onStageClick ? 'pointer' : 'default',
                                opacity: isCompleted || isActive ? 1 : 0.45,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isCompleted ? 'rgba(16, 185, 129, 0.2)' : isActive ? 'rgba(99, 102, 241, 0.25)' : '#1e293b',
                                border: `1.5px solid ${isCompleted ? '#10b981' : isActive ? '#818cf8' : '#334155'}`,
                                color: isCompleted ? '#10b981' : isActive ? '#818cf8' : '#94a3b8',
                                boxShadow: isActive ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none'
                            }}>
                                {isCompleted ? <CheckCircle2 size={16} /> : isActive ? <CircleDot size={16} /> : <Circle size={14} />}
                            </div>

                            <div>
                                <div style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: isActive ? '#f8fafc' : isCompleted ? '#10b981' : '#94a3b8',
                                    letterSpacing: '0.02em'
                                }}>
                                    {stage.label}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                    {stage.description}
                                </div>
                            </div>
                        </div>

                        {idx < STAGES.length - 1 && (
                            <div style={{
                                flex: 1,
                                height: '2px',
                                margin: '0 16px',
                                background: idx < currentIndex ? '#10b981' : '#1e293b',
                                transition: 'background 0.3s ease'
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};
