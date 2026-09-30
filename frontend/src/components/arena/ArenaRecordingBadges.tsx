import React from 'react';

export interface ArenaRecordingBadgesProps {
  isPlayground: boolean;
  isRecording?: boolean;
  recordingSeconds?: number;
  recordingInterrupted?: boolean;
  failedChunkCount?: number;
  cameraActive?: boolean;
  screenActive?: boolean;
  verificationBroken?: boolean;
  recorderRestarts: number;
  audioConsent?: boolean;
  voiceLostAt?: string | null;
  voiceUnsentCount?: number;
  isVoiceRecording?: boolean;
}

export const ArenaRecordingBadges: React.FC<ArenaRecordingBadgesProps> = ({
  isPlayground,
  isRecording,
  recordingSeconds,
  recordingInterrupted,
  failedChunkCount = 0,
  cameraActive,
  screenActive,
  verificationBroken = false,
  recorderRestarts,
  audioConsent = true,
  voiceLostAt = null,
  voiceUnsentCount = 0,
  isVoiceRecording = false
}) => {
  if (isPlayground) return null;

  return (
    <>
      <div
        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated border border-border text-[11px] font-mono"
        title={recorderRestarts > 0 ? `Restarts: ${recorderRestarts}` : undefined}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            recordingInterrupted
              ? 'bg-danger animate-ping'
              : failedChunkCount > 0
              ? 'bg-amber-500 animate-pulse'
              : isRecording
              ? 'bg-danger animate-pulse'
              : 'bg-text-3'
          }`}
        />
        <span className="font-bold text-text-2">
          {recordingInterrupted
            ? 'REC INTERRUPTED'
            : failedChunkCount > 0
            ? `REC ⚠ ${failedChunkCount} unsent`
            : isRecording
            ? 'REC'
            : 'STANDBY'}
        </span>
        {isRecording && (
          <span className="text-text-3">
            ({Math.floor((recordingSeconds || 0) / 60)}:
            {String((recordingSeconds || 0) % 60).padStart(2, '0')})
          </span>
        )}
        {isRecording && (
          <span className="text-text-3 border-l border-border pl-1.5 ml-0.5">
            {cameraActive && '🎥 Cam'} {screenActive ? '· 🖥️ Screen' : verificationBroken ? '· ⚠ Unverified' : ''}
            {recorderRestarts > 0 ? ` · 🔄 ${recorderRestarts}` : ''}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated border border-border text-[11px] font-mono">
        <span
          className={`w-2 h-2 rounded-full ${
            !audioConsent
              ? 'bg-text-3'
              : voiceLostAt
              ? 'bg-danger animate-ping'
              : (voiceUnsentCount ?? 0) > 0
              ? 'bg-amber-500 animate-pulse'
              : isVoiceRecording
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-text-3'
          }`}
        />
        <span className="font-bold text-text-2">
          {!audioConsent
            ? 'VOICE OFF (no consent)'
            : voiceLostAt
            ? `VOICE ✕ lost at ${voiceLostAt}`
            : (voiceUnsentCount ?? 0) > 0
            ? `VOICE ⚠ ${voiceUnsentCount} unsent`
            : isVoiceRecording
            ? 'VOICE ●'
            : 'VOICE STANDBY'}
        </span>
      </div>
    </>
  );
};
