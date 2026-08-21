import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface Props {
    personaName?: string;
    personaTitle?: string;
    isAiSpeaking: boolean;
    voiceEnabled: boolean;
    onToggleVoice: () => void;
    currentStage: string;
}

export const AiAvatarWaveform: React.FC<Props> = ({
    personaName = 'Dr. Anya Chen',
    personaTitle = 'AI Principal Bar Raiser',
    isAiSpeaking,
    voiceEnabled,
    onToggleVoice,
    currentStage
}) => {
    return (
        <div style={{
            background: '#090d16',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Ambient Background Glow when Speaking */}
            {isAiSpeaking && (
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '180px',
                    height: '80px',
                    background: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.25), transparent 70%)',
                    pointerEvents: 'none'
                }} />
            )}

            {/* Persona Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isAiSpeaking ? '0 0 16px rgba(6, 182, 212, 0.6)' : 'none',
                        border: '2px solid rgba(255, 255, 255, 0.15)',
                        transition: 'all 0.3s ease'
                    }}>
                        <Sparkles size={20} color="#ffffff" />
                    </div>

                    <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {personaName}
                            <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: 700 }}>
                                {currentStage}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {personaTitle}
                        </div>
                    </div>
                </div>

                <button
                    onClick={onToggleVoice}
                    title={voiceEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                    style={{
                        background: voiceEnabled ? '#1e293b' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${voiceEnabled ? '#334155' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '8px',
                        padding: '6px',
                        cursor: 'pointer',
                        color: voiceEnabled ? '#38bdf8' : '#f87171',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
            </div>

            {/* Dynamic Waveform Audio Bars */}
            <div style={{
                height: '36px',
                background: '#040711',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '0 12px'
            }}>
                {[14, 22, 30, 18, 28, 34, 20, 16, 26, 32, 18, 24, 30, 20, 15, 25, 30, 18, 22, 14].map((height, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: '3px',
                            height: isAiSpeaking ? `${height}px` : '4px',
                            borderRadius: '2px',
                            background: isAiSpeaking
                                ? `linear-gradient(to top, #4f46e5, #06b6d4)`
                                : '#334155',
                            transition: isAiSpeaking ? 'height 0.15s ease-in-out' : 'all 0.3s ease',
                            animation: isAiSpeaking ? `waveformBounce 0.8s ease-in-out infinite alternate ${idx * 0.05}s` : 'none'
                        }}
                    />
                ))}
            </div>

            <style>{`
                @keyframes waveformBounce {
                    0% { height: 6px; }
                    50% { height: 28px; }
                    100% { height: 12px; }
                }
            `}</style>
        </div>
    );
};
