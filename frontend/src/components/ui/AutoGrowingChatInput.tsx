import React, { useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Send, Trash2, CornerDownLeft, Sparkles } from 'lucide-react';

interface AutoGrowingChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  isAiResponding: boolean;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
}

export const AutoGrowingChatInput: React.FC<AutoGrowingChatInputProps> = ({
  value,
  onChange,
  onSend,
  isListening,
  onToggleListening,
  isAiResponding,
  placeholder = 'Speak or type your explanation...',
  minHeight = 44,
  maxHeight = 180
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isAiResponding) {
        onSend();
      }
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div
      className={`relative rounded-xl border bg-elevated/80 transition-all duration-200 shadow-sm ${
        isListening
          ? 'border-danger/70 ring-1 ring-danger/40 bg-danger/5'
          : 'border-border focus-within:border-primary/80 focus-within:ring-1 focus-within:ring-primary/40'
      }`}
    >
      {/* Live Recording Header Strip */}
      {isListening && (
        <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[11px] text-danger font-medium border-b border-danger/20">
          <div className="flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-danger animate-ping" />
            <span>Recording live candidate audio...</span>
          </div>
          <span className="text-[10px] text-text-3 font-normal">Click mic to finish</span>
        </div>
      )}

      {/* Auto-growing Textarea */}
      <div className="p-2 pb-1">
        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          placeholder={isListening ? 'Listening to your speech...' : placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          disabled={isAiResponding}
          className="w-full bg-transparent text-xs text-text placeholder:text-text-3 resize-none focus:outline-none leading-relaxed transition-all min-h-[44px] max-h-[180px] scrollbar-thin scrollbar-thumb-border"
        />
      </div>

      {/* Bottom Action Strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-border/40 bg-surface/40 rounded-b-xl gap-2">
        {/* Left Actions: Voice Recording + Word Count */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleListening}
            title={isListening ? 'Stop Speaking' : 'Start Voice Input (Groq Whisper / WebSpeech)'}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-150 ${
              isListening
                ? 'bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/20 animate-pulse'
                : 'bg-surface hover:bg-border/60 text-text-2 hover:text-text border border-border/60'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-primary-2" />
                <span className="text-[11px]">Voice</span>
              </>
            )}
          </button>

          {wordCount > 0 && (
            <span className="text-[10px] text-text-3 font-mono">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
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

          <button
            type="button"
            onClick={onSend}
            disabled={!value.trim() || isAiResponding}
            title="Send response (Enter)"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 cursor-pointer ${
              value.trim() && !isAiResponding
                ? 'bg-primary text-white hover:bg-primary-2 shadow-sm shadow-primary/20 hover:scale-105'
                : 'bg-surface text-text-3/40 border border-border/40 cursor-not-allowed opacity-50'
            }`}
          >
            {isAiResponding ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
