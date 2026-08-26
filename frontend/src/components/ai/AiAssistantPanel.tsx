import React, { useEffect, useRef } from "react";
import { Volume2, VolumeX, X, Sparkles, MessageSquare, ShieldCheck } from "lucide-react";
import { AiOrbAvatar, WaveformBars } from "./AiOrbAvatar";
import { Chip } from "../ui/Chip";
import { AutoGrowingChatInput } from "../ui/AutoGrowingChatInput";

export interface ChatMessage {
  role: "candidate" | "interviewer" | "system";
  content: string;
  timestamp?: string;
  metadata?: Record<string, string>;
}

export interface TranscriptTurn {
  senderRole: string;
  messageType?: string;
  content: string;
  codeSnippet?: string;
  timestamp?: string;
  metadata?: Record<string, string>;
}

export interface AiAssistantPanelProps {
  open: boolean;
  onClose: () => void;
  mode: "intro" | "live" | "review";
  personaName?: string;
  personaTitle?: string;
  currentStage?: string;
  isAiSpeaking?: boolean;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  messages?: ChatMessage[];
  isAiResponding?: boolean;
  chatInput?: string;
  setChatInput?: (val: string) => void;
  onSend?: (forcedText?: string) => void;
  onMicToggle?: () => void;
  isListening?: boolean;
  interimTranscript?: string;
  micError?: string | null;
  onClearMicError?: () => void;
  transcript?: TranscriptTurn[];
  stackAbove?: "webcam" | "none";
  className?: string;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  open,
  onClose,
  mode,
  personaName = "Coach Sam",
  personaTitle = "Senior Tech Lead",
  currentStage = "Assessment",
  isAiSpeaking = false,
  voiceEnabled = true,
  onToggleVoice,
  messages = [],
  isAiResponding = false,
  chatInput = "",
  setChatInput,
  onSend,
  onMicToggle,
  isListening = false,
  interimTranscript = "",
  micError = null,
  onClearMicError,
  transcript = [],
  stackAbove = "none",
  className = ""
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages, transcript, isAiResponding]);

  if (!open) return null;

  const positionClass = stackAbove === "webcam"
    ? "fixed bottom-52 right-5"
    : "fixed bottom-20 right-5";

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="AI Assistant"
      className={positionClass + " w-[360px] sm:w-[380px] max-h-[70vh] flex flex-col rounded-xl border border-border bg-surface shadow-2xl z-40 overflow-hidden animate-fade-in " + className}
    >
      <div className="h-12 px-3 bg-elevated/90 border-b border-border flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <AiOrbAvatar isAiSpeaking={isAiSpeaking} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">{personaName}</span>
              <Chip variant="primary" size="sm">
                {currentStage}
              </Chip>
            </div>
            <div className="text-[10px] text-text-3 truncate flex items-center gap-1.5">
              <span>{personaTitle}</span>
              {isAiSpeaking && <WaveformBars isSpeaking={true} size="sm" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onToggleVoice && (
            <button
              type="button"
              onClick={onToggleVoice}
              title={voiceEnabled ? "Mute AI Voice" : "Unmute AI Voice"}
              className="p-1.5 text-text-3 hover:text-text rounded-md hover:bg-surface transition-colors cursor-pointer"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-text-3" />}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title="Minimize Assistant"
            className="p-1.5 text-text-3 hover:text-text rounded-md hover:bg-surface transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-xs">
        {mode === "intro" && (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-elevated border border-border space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Autonomous AI Technical Evaluator</span>
              </div>
              <p className="text-text-2 text-[11px] leading-relaxed">
                Welcome to AI Interview OS. I am {personaName}, your {personaTitle}. Configure your target track, difficulty level, and optional resume grounding to begin.
              </p>
            </div>
          </div>
        )}

        {mode === "live" && (
          <>
            {messages.length === 0 && (
              <div className="text-center py-6 text-text-3 text-xs space-y-1">
                <MessageSquare className="w-5 h-5 mx-auto text-text-3/60 mb-1" />
                <p>Dialogue channel initialized.</p>
                <p className="text-[10px]">Your explanation and code submissions will be evaluated here.</p>
              </div>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={"p-2.5 rounded-lg border text-xs leading-relaxed " + (m.role === "candidate" ? "bg-primary/10 border-primary/40 text-text" : "bg-elevated border-border text-text")}
              >
                <div className="text-[10px] font-bold text-primary-2 mb-1 flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span>{m.role === "candidate" ? "You" : (m.metadata?.senderName || (m.metadata?.offlineFallback === "true" ? "Offline Coach" : personaName))}</span>
                    {m.metadata?.offlineFallback === "true" && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-warning/15 text-warning border border-warning/30 font-semibold inline-flex items-center gap-0.5">
                        Offline Coach
                      </span>
                    )}
                    {m.metadata?.recommendedAction === "OFFER_HINT" && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-warning/15 text-warning border border-warning/30 font-semibold inline-flex items-center gap-0.5">
                        💡 Hint
                      </span>
                    )}
                  </div>
                  {m.timestamp && <span className="text-text-3 font-normal text-[9px]">{m.timestamp}</span>}
                </div>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            {isAiResponding && (
              <div className="p-2 rounded-md bg-elevated border border-border text-primary-2 text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Evaluating technical response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}

        {mode === "review" && (
          <>
            <div className="p-2 rounded bg-elevated border border-border text-[11px] text-text-3 mb-2 flex items-center justify-between">
              <span>Audited Dialogue Transcript ({transcript.length} turns)</span>
              <Chip variant="neutral" size="sm">Read-Only</Chip>
            </div>
            {transcript.length === 0 && (
              <div className="text-center py-6 text-text-3 text-xs">
                <span>No transcript turns recorded for this session.</span>
              </div>
            )}
            {transcript.map((turn, idx) => (
              <div
                key={idx}
                className={"p-2.5 rounded-lg border text-xs leading-relaxed " + (turn.senderRole === "CANDIDATE" ? "bg-primary/10 border-primary/40" : "bg-elevated border-border")}
              >
                <div className="text-[10px] font-bold text-primary-2 mb-1 flex justify-between items-center">
                  <span>{turn.senderRole === "CANDIDATE" ? "Candidate" : personaName}</span>
                  {turn.messageType && (
                    <span className="text-text-3 text-[9px] font-mono">{turn.messageType}</span>
                  )}
                </div>
                <div className="whitespace-pre-wrap text-text">{turn.content}</div>
                {turn.codeSnippet && turn.codeSnippet.trim() && (
                  <pre className="mt-1.5 p-1.5 bg-bg rounded border border-border font-mono text-[10px] overflow-x-auto text-primary-2">
                    {turn.codeSnippet}
                  </pre>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {mode === "live" && setChatInput && onSend && (
        <div className="p-2.5 border-t border-border bg-elevated/70 shrink-0">
          <AutoGrowingChatInput
            value={chatInput}
            onChange={setChatInput}
            onSend={() => void onSend()}
            isListening={isListening}
            onToggleListening={onMicToggle || (() => {})}
            isAiResponding={isAiResponding}
            interimTranscript={interimTranscript}
            micError={micError}
            onClearMicError={onClearMicError}
            placeholder="Speak or type your response..."
          />
        </div>
      )}
    </div>
  );
};