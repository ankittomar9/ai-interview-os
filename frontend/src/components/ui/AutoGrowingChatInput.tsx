import React, { useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Trash2, CornerDownLeft, XCircle, Square, Loader2 } from 'lucide-react';
import { getSttChip, subscribeSttChip } from '../../services/api';

interface AutoGrowingChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isListening: boolean;
  isRequestingMic?: boolean;
  onToggleListening: () => void;
  isAiResponding: boolean;
  interimTranscript?: string;
  salvageHint?: string | null;
  micError?: string | null;
  onClearMicError?: () => void;
  canRetryStt?: boolean;
  onRetryStt?: () => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onStartListening?: () => void;
  onStopListening?: () => void;
  onAbort?: () => void;
  onAbortTurn?: () => void;
  abortTurn?: () => void;
  onRecallLastDraft?: () => void;
  recallLastDraft?: () => void;
  sttChip?: string | null;
}

export const AutoGrowingChatInput: React.FC<AutoGrowingChatInputProps> = ({
  value,
  onChange,
  onSend,
  isListening,
  isRequestingMic = false,
  onToggleListening,
  isAiResponding,
  interimTranscript = '',
  salvageHint = null,
  micError = null,
  onClearMicError,
  canRetryStt = false,
  onRetryStt,
  placeholder = 'Speak or type your explanation...',
  minHeight = 44,
  maxHeight = 180,
  onStartListening,
  onStopListening,
  onAbort,
  onAbortTurn,
  abortTurn,
  onRecallLastDraft,
  recallLastDraft,
  sttChip: propSttChip
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pointerDownTimeRef = useRef<number>(0);
  const startedThisPressRef = useRef<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [globalSttChip, setGlobalSttChip] = React.useState<string | null>(() => getSttChip());

  useEffect(() => {
    return subscribeSttChip(setGlobalSttChip);
  }, []);

  const displaySttChip = propSttChip !== undefined ? propSttChip : globalSttChip;

  useEffect(() => {
    let interval: any;
    if (isListening) {
      setRecordingSeconds(0);
      interval = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Global Ctrl+M keyboard shortcut for PTT toggle
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (isAiResponding) return;
        if (isListening) {
          if (onStopListening) onStopListening();
          else onToggleListening();
        } else {
          if (onStartListening) onStartListening();
          else onToggleListening();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isListening, isAiResponding, onStartListening, onStopListening, onToggleListening]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Dynamically readjust height based on content
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [minHeight, maxHeight]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      if (isAiResponding) {
        e.preventDefault();
        onAbortTurn?.();
        abortTurn?.();
        return;
      }
      if (isListening || interimTranscript) {
        e.preventDefault();
        onAbort?.();
        return;
      }
    }
    if (e.key === 'ArrowUp') {
      if (!value.trim() && !isAiResponding && !isListening) {
        e.preventDefault();
        onRecallLastDraft?.();
        recallLastDraft?.();
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isAiResponding) {
        onSend();
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || isRequestingMic) return;
    pointerDownTimeRef.current = Date.now();
    if (!isListening && !isAiResponding) {
      startedThisPressRef.current = true;
      if (onStartListening) onStartListening();
      else onToggleListening();
    } else {
      startedThisPressRef.current = false;
    }
  };

  const handlePointerUp = () => {
    if (isRequestingMic) return;
    const holdDuration = Date.now() - pointerDownTimeRef.current;
    if (isListening && holdDuration > 500) {
      // Intentionally held down and released -> stop recording
      startedThisPressRef.current = false;
      if (onStopListening) onStopListening();
      else onToggleListening();
    }
  };

  const handleButtonClick = () => {
    if (isRequestingMic) return;
    if (startedThisPressRef.current) {
      // Quick click from idle initiated listening; leave recording active (1-click toggle ON)
      startedThisPressRef.current = false;
      return;
    }
    const holdDuration = Date.now() - pointerDownTimeRef.current;
    if (isListening && holdDuration <= 500) {
      // Subsequent quick click: 1-click toggle OFF
      if (onStopListening) onStopListening();
      else onToggleListening();
    } else if (!isListening && !isAiResponding) {
      // Direct click (e.g. keyboard activation via Enter/Space or click without pointerdown)
      if (onStartListening) onStartListening();
      else onToggleListening();
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isTranscribing = Boolean(interimTranscript && interimTranscript.toLowerCase().includes('transcrib'));

  return (
    <div
      className={`relative rounded-xl border bg-elevated/80 transition-all duration-200 shadow-sm ${
        isListening
          ? 'border-primary/80 ring-2 ring-primary/40 bg-primary/5'
          : 'border-border focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40'
      }`}
    >
      {/* Mic Error Banner */}
      {micError && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-danger/10 border-b border-danger/20 text-[11px] text-danger rounded-t-xl gap-2">
          <span className="flex-1">{micError}</span>
          <div className="flex items-center gap-2 shrink-0">
            {canRetryStt && onRetryStt && (
              <button
                type="button"
                onClick={onRetryStt}
                className="px-2 py-0.5 rounded bg-danger text-on-accent font-semibold hover:bg-danger/90 transition-colors cursor-pointer"
              >
                Retry
              </button>
            )}
            {onClearMicError && (
              <button type="button" onClick={onClearMicError} className="text-danger hover:text-danger/80 font-bold cursor-pointer">
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Live Recording Header Strip */}
      {isListening && (
        <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[11px] text-primary font-medium border-b border-primary/20">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
            <span className="font-semibold">Recording ({formatTimer(recordingSeconds)})…</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-3 font-normal">Click mic again or release to finish (Ctrl+M)</span>
            {onAbort && (
              <button
                type="button"
                onClick={onAbort}
                title="Cancel recording (Esc)"
                className="text-[10px] text-danger hover:underline font-semibold cursor-pointer flex items-center gap-1"
              >
                <XCircle className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Auto-growing Textarea */}
      <div className="p-2 pb-1">
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={value}
          rows={1}
          placeholder={isListening ? 'Speak now (Push-to-Talk active)...' : placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-xs text-text placeholder:text-text-3 resize-none focus:outline-none leading-relaxed transition-all min-h-[44px] max-h-[180px] scrollbar-thin scrollbar-thumb-border"
        />
        {/* Streaming Interim Transcript Live Preview */}
        {(isListening || isTranscribing) && interimTranscript && (
          <div className="mt-1 px-1 text-[11px] text-primary-2 italic animate-pulse flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5">
              <span>🎙️</span>
              <span>{interimTranscript}</span>
            </div>
            {isTranscribing && onAbort && (
              <button
                type="button"
                onClick={onAbort}
                className="text-[10px] text-danger hover:underline font-medium cursor-pointer"
              >
                Abort
              </button>
            )}
          </div>
        )}
        {/* Honest Salvage Continuation Hint */}
        {!isListening && !isTranscribing && salvageHint && value.trim() && (
          <div className="mt-1 px-1 text-[10px] text-primary-2/90 italic flex items-center gap-1">
            <span>📝</span>
            <span>{salvageHint}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-border/40 bg-surface/40 rounded-b-xl gap-2">
        {/* Left Actions: Voice Recording + Word Count */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isRequestingMic}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClick={handleButtonClick}
            title={
              isRequestingMic
                ? 'Requesting microphone access… Please allow microphone permission in your browser if prompted.'
                : isListening
                ? `Recording (${formatTimer(recordingSeconds)})… Click to finish or hold to talk (Ctrl+M)`
                : 'Click to record or hold to speak (Ctrl+M)'
            }
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-150 ${
              isRequestingMic
                ? 'bg-primary/10 text-primary border border-primary/40 animate-pulse'
                : isListening
                ? 'bg-danger text-on-accent ring-2 ring-danger/80 ring-offset-1 ring-offset-bg shadow-sm shadow-danger/30 animate-pulse'
                : 'bg-surface hover:bg-border/60 text-text-2 hover:text-text border border-border/60'
            }`}
          >
            {isRequestingMic ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span className="text-[11px] text-primary">Requesting mic…</span>
              </>
            ) : isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop & Send ({formatTimer(recordingSeconds)})</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-primary-2" />
                <span className="text-[11px]">Record (Ctrl+M)</span>
              </>
            )}
          </button>

          {isListening && onAbort && (
            <button
              type="button"
              onClick={onAbort}
              title="Abort turn without sending"
              className="px-2 py-1 text-xs rounded-md bg-surface hover:bg-danger/10 text-danger border border-danger/30 cursor-pointer"
            >
              Cancel
            </button>
          )}

          {wordCount > 0 && (
            <span className="text-[10px] text-text-3 font-mono">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          )}

          {displaySttChip && (
            <span className="text-[10px] text-text-3 px-1.5 py-0.5 rounded bg-surface border border-border/60 font-mono">
              {displaySttChip}
            </span>
          )}
        </div>

        {/* Right Actions: Clear, Shortcut hint, Send Button */}
        <div className="flex items-center gap-1.5">
          {value.trim().length > 0 && !isAiResponding && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Clear input"
              className="p-1.5 text-text-3 hover:text-danger rounded-md hover:bg-surface transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-text-3 mr-1">
            <span className="font-mono">Enter</span>
            <CornerDownLeft className="w-2.5 h-2.5" />
          </div>

          {isAiResponding ? (
            <button
              type="button"
              onClick={onAbortTurn || abortTurn}
              title="Stop response"
              aria-label="Stop response"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer bg-danger/20 text-danger hover:bg-danger hover:text-on-accent border border-danger/40 shadow-sm shadow-danger/20 hover:scale-105"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!value.trim()}
              title="Send response (Enter)"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
                value.trim()
                  ? 'bg-primary text-on-accent hover:bg-primary-2 shadow-sm shadow-primary/20 hover:scale-105'
                  : 'bg-surface text-text-3/40 border border-border/40 cursor-not-allowed opacity-50'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
