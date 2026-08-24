import React from 'react';
import { Sparkles } from 'lucide-react';

export interface WaveformBarsProps {
  isSpeaking: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const WaveformBars: React.FC<WaveformBarsProps> = ({
  isSpeaking,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-0.5 select-none ${className}`}>
      <span
        className={`w-[2px] rounded-full transition-all duration-150 ${
          isSpeaking ? 'bg-primary h-3 animate-pulse' : 'bg-text-3/40 h-1'
        }`}
      />
      <span
        className={`w-[2px] rounded-full transition-all duration-150 ${
          isSpeaking ? 'bg-primary-2 h-4.5 animate-pulse' : 'bg-text-3/40 h-1'
        }`}
      />
      <span
        className={`w-[2px] rounded-full transition-all duration-150 ${
          isSpeaking ? 'bg-primary h-3.5 animate-pulse' : 'bg-text-3/40 h-1'
        }`}
      />
      <span
        className={`w-[2px] rounded-full transition-all duration-150 ${
          isSpeaking ? 'bg-primary-2 h-4 animate-pulse' : 'bg-text-3/40 h-1'
        }`}
      />
      <span
        className={`w-[2px] rounded-full transition-all duration-150 ${
          isSpeaking ? 'bg-primary h-2 animate-pulse' : 'bg-text-3/40 h-1'
        }`}
      />
    </div>
  );
};

export interface AiOrbAvatarProps {
  isAiSpeaking?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showBars?: boolean;
}

export const AiOrbAvatar: React.FC<AiOrbAvatarProps> = ({
  isAiSpeaking = false,
  size = 'md',
  className = '',
  showBars = false
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {/* Animated Concentric Wave Rings around Avatar when speaking */}
      {isAiSpeaking && (
        <>
          <span className="absolute -inset-1.5 rounded-full bg-primary/25 animate-ping" />
          <span className="absolute -inset-1 rounded-full border border-primary/60 animate-pulse" />
        </>
      )}

      {/* Main Avatar Circle with Persona Gradient */}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary via-primary-2 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary/20 border border-white/20 relative z-10 transition-transform duration-200 ${
          isAiSpeaking ? 'scale-105 ring-2 ring-primary/50' : ''
        }`}
      >
        <Sparkles className={`${iconSizes[size]} text-white`} />
      </div>

      {/* Embedded Waveform Bars if requested */}
      {showBars && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-surface/90 px-1 py-0.5 rounded-full border border-border">
          <WaveformBars isSpeaking={isAiSpeaking} size="sm" />
        </div>
      )}
    </div>
  );
};
