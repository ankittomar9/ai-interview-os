import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Trash2,
  Volume2,
  Keyboard,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';

interface AnswerCaptureBarProps {
  input: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isListening: boolean;
  onToggleListen: () => void;
  isAiSpeaking: boolean;
  isAiResponding: boolean;
  disabled?: boolean;
  interimTranscript?: string;
  className?: string;
}

export const AnswerCaptureBar: React.FC<AnswerCaptureBarProps> = ({
  input,
  onChange,
  onSubmit,
  isListening,
  onToggleListen,
  isAiSpeaking,
  isAiResponding,
  disabled = false,
  interimTranscript = '',
  className = ''
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isAiResponding && !disabled) {
        onSubmit();
      }
    }
  };

  const hasText = input.trim().length > 0;

  return (
    <div className={`bg-elevated border-t border-border p-3.5 sm:p-4 shrink-0 select-none ${className}`}>
      <div className="max-w-4xl mx-auto space-y-2.5">
        {/* Main Capture Row */}
        <div className="flex items-end gap-2.5 sm:gap-3">
          {/* Big Microphone Button */}
          <div className="relative shrink-0">
            {isListening && !isAiSpeaking && (
              <span className="absolute -inset-1 rounded-full bg-primary/30 animate-ping" />
            )}
            <button
              type="button"
              onClick={onToggleListen}
              disabled={isAiSpeaking || disabled}
              title={
                isAiSpeaking
                  ? 'Microphone muted while AI is speaking'
                  : isListening
                  ? 'Mute Microphone'
                  : 'Start Speaking (Mic On)'
              }
              className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
                isAiSpeaking
                  ? 'bg-elevated border border-border text-text-3 opacity-60 cursor-not-allowed'
                  : isListening
                  ? 'bg-primary text-white scale-105 shadow-primary/30 ring-4 ring-primary/20'
                  : 'bg-surface border border-border text-text hover:text-primary hover:border-primary/50'
              }`}
            >
              {isAiSpeaking ? (
                <Volume2 className="w-5 h-5 text-success animate-pulse" />
              ) : isListening ? (
                <Mic className="w-5 h-5 animate-pulse" />
              ) : (
                <MicOff className="w-5 h-5 text-text-3" />
              )}
            </button>
          </div>

          {/* Textarea Container with Live Interim Stream */}
          <div className="flex-1 bg-surface border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 rounded-xl p-2.5 transition-all relative flex flex-col justify-between min-h-[52px]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isAiResponding}
              placeholder={
                isListening
                  ? 'Listening... Speak your answer (interim voice will appear here in real time)'
                  : 'Speak into microphone or type your behavioral answer here...'
              }
              rows={1}
              className="w-full bg-transparent border-0 text-xs sm:text-sm text-text placeholder:text-text-3 focus:outline-none resize-none leading-relaxed select-text"
            />

            {/* Interim Transcript Sub-line if active */}
            {isListening && interimTranscript && (
              <div className="pt-1 text-[11px] font-mono text-primary/80 italic flex items-center gap-1.5 border-t border-border/40 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                <span className="truncate">{interimTranscript}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasText && (
              <button
                type="button"
                onClick={() => onChange('')}
                title="Clear input"
                className="p-2.5 rounded-lg bg-surface border border-border text-text-3 hover:text-danger hover:border-danger/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <Button
              variant="primary"
              size="md"
              disabled={!hasText || isAiResponding || disabled}
              onClick={onSubmit}
              className="px-4 h-12 font-bold shadow-xs cursor-pointer"
              icon={isAiResponding ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Submit Answer</span>
              <span className="sm:hidden">Submit</span>
            </Button>
          </div>
        </div>

        {/* Helper Footer Bar */}
        <div className="flex items-center justify-between text-[11px] text-text-3 px-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3 h-3 text-text-3" />
              <span>Press <strong className="text-text-2 font-mono">Enter ↵</strong> to submit</span>
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline text-text-3">
              Say <strong className="text-text-2">"That is my answer"</strong> for voice submission
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isListening ? (
              <span className="text-primary font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Microphone Active (Continuous)</span>
              </span>
            ) : (
              <span className="text-text-3">Mic Idle</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
