import React, { useRef, useEffect } from 'react';
import {
  Volume2,
  Mic,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  HelpCircle,
  MessageSquareQuote
} from 'lucide-react';

export interface StageMessage {
  id?: number | string;
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
  metadata?: Record<string, string>;
  turnNumber?: number;
}

interface ConversationStageProps {
  messages: StageMessage[];
  isSpeakingNow: boolean;
  isListening: boolean;
  isAiResponding: boolean;
  onReplaySpeech?: (text: string) => void;
  targetRole?: string;
  className?: string;
}

export const ConversationStage: React.FC<ConversationStageProps> = ({
  messages,
  isSpeakingNow,
  isListening,
  isAiResponding,
  onReplaySpeech,
  targetRole = 'Engineering Lead',
  className = ''
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiResponding]);

  const lastAiMessage = [...messages].reverse().find((m) => m.role === 'interviewer');

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden bg-bg select-text ${className}`}>
      {/* Top AI Persona Banner */}
      <div className="bg-elevated border-b border-border p-3 sm:p-4 shrink-0 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          {/* Persona Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-white font-bold shadow-sm">
                <Bot className="w-5 h-5" />
              </div>
              {isSpeakingNow && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-surface animate-ping" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-text">Frontier AI Interviewer</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-text-3 font-mono">
                  {targetRole}
                </span>
              </div>
              <p className="text-[11px] text-text-3">
                Grounded conversational evaluation · Active Dialogue Turn #{messages.length}
              </p>
            </div>
          </div>

          {/* Live Persona State / Speaking Waveform */}
          <div className="flex items-center gap-2">
            {isSpeakingNow ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-semibold">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>Speaking Question...</span>
                {/* Audio Waves */}
                <div className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-3 bg-success rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-success rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-2 bg-success rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            ) : isAiResponding ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Evaluating &amp; Generating Follow-up...</span>
              </div>
            ) : isListening ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-warning/15 border border-warning/30 text-warning text-xs font-semibold">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Listening to Candidate...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-border text-text-3 text-xs font-semibold">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Awaiting Answer</span>
              </div>
            )}

            {lastAiMessage && onReplaySpeech && (
              <button
                type="button"
                onClick={() => onReplaySpeech(lastAiMessage.content)}
                title="Replay last AI question audio"
                className="p-1.5 rounded-lg bg-surface border border-border text-text-3 hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Conversation Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="max-w-4xl mx-auto space-y-5">
          {messages.length === 0 ? (
            <div className="bg-elevated border border-border rounded-xl p-8 text-center space-y-2.5 max-w-lg mx-auto">
              <MessageSquareQuote className="w-8 h-8 mx-auto text-primary animate-pulse" />
              <div className="font-bold text-text text-sm">Initializing Behavioral Studio...</div>
              <p className="text-xs text-text-3">
                Your AI interviewer is preparing the first resume-grounded scenario.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isAi = msg.role === 'interviewer';

              return (
                <div
                  key={msg.id || idx}
                  className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Left Avatar for AI */}
                  {isAi && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-2xl rounded-2xl p-4 space-y-2 text-xs sm:text-sm leading-relaxed ${
                      isAi
                        ? 'bg-elevated border border-border text-text rounded-tl-xs shadow-xs'
                        : 'bg-primary text-white rounded-tr-xs shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] opacity-80 border-b border-current/10 pb-1 mb-1">
                      <span className="font-bold uppercase tracking-wider">
                        {isAi ? 'AI Interviewer' : 'Candidate Response'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-wrap font-sans">{msg.content}</p>

                    {/* Metadata chips / Tags if available */}
                    {msg.metadata && Object.keys(msg.metadata).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                        {msg.metadata.detectedIntent && (
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono ${
                              isAi
                                ? 'bg-surface border border-border text-text-3'
                                : 'bg-white/20 text-white'
                            }`}
                          >
                            Intent: {msg.metadata.detectedIntent}
                          </span>
                        )}
                        {msg.metadata.turnSummary && (
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono italic ${
                              isAi
                                ? 'bg-surface border border-border text-text-3'
                                : 'bg-white/20 text-white'
                            }`}
                          >
                            {msg.metadata.turnSummary}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Avatar for Candidate */}
                  {!isAi && (
                    <div className="w-8 h-8 rounded-full bg-elevated border border-border flex items-center justify-center text-text-2 shrink-0 mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* AI Responding Indicator */}
          {isAiResponding && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shrink-0 mt-1">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-elevated border border-border rounded-2xl rounded-tl-xs p-4 text-xs text-text-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span>Interviewer is evaluating your response and preparing the next turn...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
};
