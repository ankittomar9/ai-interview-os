import React from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Chip } from './ui/Chip';

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
  const barHeights = [14, 22, 28, 18, 26, 32, 20, 16, 26, 30, 18, 24, 28, 20, 15, 25, 30, 18, 22, 14];

  return (
    <div className="bg-surface border border-border rounded-lg p-3.5 flex flex-col gap-3 relative overflow-hidden select-none">
      {/* Ambient Radial Glow when AI is speaking */}
      {isAiSpeaking && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-44 h-20 bg-primary/20 rounded-full blur-xl pointer-events-none" />
      )}

      {/* Persona Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center border border-white/20 transition-all ${
              isAiSpeaking ? 'shadow-md shadow-primary/60 ring-2 ring-primary/40' : ''
            }`}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>

          <div>
            <div className="text-xs font-extrabold text-text flex items-center gap-1.5">
              <span>{personaName}</span>
              <Chip variant="primary" size="sm">
                {currentStage}
              </Chip>
            </div>
            <div className="text-[11px] text-text-3 font-medium">
              {personaTitle}
            </div>
          </div>
        </div>

        <button
          onClick={onToggleVoice}
          title={voiceEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
          className={`p-1.5 rounded-md border transition-colors cursor-pointer ${
            voiceEnabled
              ? 'bg-elevated border-border text-primary-2 hover:bg-border/60'
              : 'bg-danger/15 border-danger/30 text-danger hover:bg-danger/25'
          }`}
        >
          {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Waveform Audio Visualizer */}
      <div className="h-8 bg-elevated rounded-md border border-border flex items-center justify-center gap-1 px-3">
        {barHeights.map((height, idx) => (
          <div
            key={idx}
            className={`w-[3px] rounded-full transition-all duration-150 ${
              isAiSpeaking
                ? 'bg-gradient-to-t from-primary to-primary-2'
                : 'bg-border h-1'
            }`}
            style={{
              height: isAiSpeaking ? `${height}px` : undefined,
              animation: isAiSpeaking ? `waveformBounce 0.8s ease-in-out infinite alternate ${idx * 0.05}s` : undefined
            }}
          />
        ))}
      </div>
    </div>
  );
};
