import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, X, Sparkles, MessageSquare, ShieldCheck, Maximize2, Minimize2 } from "lucide-react";
import { AiOrbAvatar, WaveformBars } from "./AiOrbAvatar";
import { Chip } from "../ui/Chip";
import { AutoGrowingChatInput } from "../ui/AutoGrowingChatInput";
import { RoundDivider } from "../arena/RoundDivider";
import {
  type CoachPanelSize,
  panelSizeClass,
  panelPositionClass,
  getNextPanelSize,
  getStoredPanelSize,
  setStoredPanelSize
} from "./panelSizing";
import { parseInlineFormat } from "./inlineFormat";

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

export function getCandidateMessageLines(content: string) {
  const trimmed = content.replace(/\s+$/, '');
  const lines = trimmed.split('\n');
  const isCollapsible = lines.length > 5;
  const preview = isCollapsible ? lines.slice(0, 4).join('\n') : content;
  const hiddenCount = isCollapsible ? lines.length - 4 : 0;
  return { lines, isCollapsible, preview, hiddenCount };
}

export const CandidateMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const [expanded, setExpanded] = useState(false);
  const { isCollapsible, preview, hiddenCount } = getCandidateMessageLines(content);

  if (!isCollapsible) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  return (
    <div>
      <div className={`whitespace-pre-wrap ${!expanded ? 'relative' : ''}`}>
        {expanded ? content : preview}
        {!expanded && (
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="mt-1 text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
      >
        {expanded ? 'Show less' : `Show more (${hiddenCount} lines)`}
      </button>
    </div>
  );
};

export const AssistantMessageContent: React.FC<{ content: string }> = ({ content }) => {
  const segments = parseInlineFormat(content);
  return (
    <div className="leading-relaxed">
      {segments.map((segment, idx) => {
        if (segment.type === "fence") {
          return (
            <pre
              key={idx}
              className="p-2 my-1.5 bg-surface rounded border border-border font-mono text-[11px] overflow-x-auto text-primary-2 whitespace-pre"
            >
              <code>{segment.value}</code>
            </pre>
          );
        }
        if (segment.type === "math") {
          return (
            <code
              key={idx}
              className="font-mono text-[11px] px-1 py-0.5 rounded bg-surface border border-border text-primary font-semibold"
            >
              {segment.value}
            </code>
          );
        }
        if (segment.type === "code") {
          return (
            <code
              key={idx}
              className="font-mono text-[11px] px-1 py-0.5 rounded bg-surface border border-border text-text font-semibold"
            >
              {segment.value}
            </code>
          );
        }
        return (
          <span key={idx} className="whitespace-pre-wrap">
            {segment.value}
          </span>
        );
      })}
    </div>
  );
};

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
  onStartListening?: () => void;
  onStopListening?: () => void;
  onAbortVoice?: () => void;
  onAbortTurn?: () => void;
  onRecallLastDraft?: () => void;
  isListening?: boolean;
  isRequestingMic?: boolean;
  interimTranscript?: string;
  salvageHint?: string | null;
  micError?: string | null;
  onClearMicError?: () => void;
  canRetryStt?: boolean;
  onRetryStt?: () => void;
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
  onStartListening,
  onStopListening,
  onAbortVoice,
  onAbortTurn,
  onRecallLastDraft,
  isListening = false,
  isRequestingMic = false,
  interimTranscript = "",
  salvageHint = null,
  micError = null,
  onClearMicError,
  canRetryStt = false,
  onRetryStt,
  transcript = [],
  stackAbove = "none",
  className = ""
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [panelSize, setPanelSize] = useState<CoachPanelSize>(() => getStoredPanelSize());

  const handleCyclePanelSize = () => {
    const next = getNextPanelSize(panelSize);
    setPanelSize(next);
    setStoredPanelSize(next);
  };

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

  const isDegradedAiMode = messages.some(
    (m) =>
      m.metadata?.generator === "DETERMINISTIC_FALLBACK" ||
      m.metadata?.generator === "OFFLINE_COACH" ||
      m.metadata?.offlineFallback === "true"
  );

  const sizeClasses = panelSizeClass(panelSize, stackAbove);
  const positionClass = panelPositionClass(panelSize, stackAbove);
  const containerClasses = `${positionClass} ${sizeClasses} flex flex-col rounded-xl border border-border bg-surface shadow-2xl z-40 overflow-hidden animate-fade-in ${className}`.trim();

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="AI Assistant"
      className={containerClasses}
    >
      <div className="h-12 px-3 bg-elevated/90 border-b border-border flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <AiOrbAvatar isAiSpeaking={isAiSpeaking} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-text truncate">{isDegradedAiMode ? "Automated Fallback" : personaName}</span>
              <Chip variant={isDegradedAiMode ? "warning" : "primary"} size="sm">
                {currentStage}
              </Chip>
            </div>
            <div className="text-[10px] text-text-3 truncate flex items-center gap-1.5">
              <span>{isDegradedAiMode ? "Degraded AI mode — responses automated" : personaTitle}</span>
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
            onClick={handleCyclePanelSize}
            title={panelSize === "normal" ? "Expand Coach (Wide)" : panelSize === "wide" ? "Fullscreen Coach" : "Restore Coach (Normal)"}
            className="p-1.5 text-text-3 hover:text-text rounded-md hover:bg-surface transition-colors cursor-pointer"
            aria-label="Toggle panel size"
          >
            {panelSize === "fullscreen" ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
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

      {isDegradedAiMode && (
        <div className="px-3 py-1.5 bg-warning/15 border-b border-warning/30 text-warning text-[10px] font-semibold flex items-center justify-between">
          <span>⚠ Degraded AI mode — responses automated</span>
          <span className="font-mono text-[9px] uppercase">Fallback Active</span>
        </div>
      )}

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
            {messages.map((m, idx) => {
              if (m.metadata?.type === 'ROUND_BOUNDARY') {
                return <RoundDivider key={idx} title={m.content} sectionType={m.metadata?.sectionType} />;
              }
              const isDetFallback = m.metadata?.generator === "DETERMINISTIC_FALLBACK";
              const isOfflineFallback = m.metadata?.generator === "OFFLINE_COACH" || m.metadata?.offlineFallback === "true";
              const displaySender = m.role === "candidate"
                ? "You"
                : isDetFallback
                ? "Automated Fallback"
                : isOfflineFallback
                ? "Offline Coach"
                : (m.metadata?.senderName || personaName);
              return (
              <div
                key={idx}
                className={"p-2.5 rounded-lg border text-xs leading-relaxed " + (m.role === "candidate" ? "bg-primary/10 border-primary/40 text-text" : "bg-elevated border-border text-text")}
              >
                <div className="text-[10px] font-bold text-primary-2 mb-1 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{displaySender}</span>
                    {isDetFallback && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-warning/15 text-warning border border-warning/30 font-semibold inline-flex items-center gap-0.5">
                        Automated Fallback
                      </span>
                    )}
                    {isOfflineFallback && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-warning/15 text-warning border border-warning/30 font-semibold inline-flex items-center gap-0.5">
                        Offline Coach
                      </span>
                    )}
                    {m.metadata?.gateUnlockSource === "FALLBACK_HEURISTIC" && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold inline-flex items-center gap-0.5">
                        Heuristic Gate Unlock
                      </span>
                    )}
                    {m.metadata?.recommendedAction === "OFFER_HINT" && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-warning/15 text-warning border border-warning/30 font-semibold inline-flex items-center gap-0.5">
                        💡 Hint
                      </span>
                    )}
                    {m.metadata?.stopped && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-danger/15 text-danger border border-danger/30 font-semibold inline-flex items-center gap-0.5">
                        Stopped
                      </span>
                    )}
                  </div>
                  {m.timestamp && <span className="text-text-3 font-normal text-[9px]">{m.timestamp}</span>}
                </div>
                {m.role === "candidate" ? (
                  <CandidateMessageContent content={m.content} />
                ) : (
                  <AssistantMessageContent content={m.content} />
                )}
                {m.metadata?.recommendedAction === "PROPOSE_STAGE_ADVANCE" && idx === messages.length - 1 && onSend && (
                  <div className="mt-2.5 pt-2 border-t border-border flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-text-2">Move on to coding?</span>
                    <button
                      type="button"
                      onClick={() => onSend("Yes, let's move on to coding.")}
                      className="px-2.5 py-1 rounded text-[11px] font-bold bg-primary text-on-accent hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => onSend("Not yet, I'd like to share a bit more.")}
                      className="px-2.5 py-1 rounded text-[11px] font-medium bg-surface text-text-2 hover:bg-elevated border border-border transition-colors cursor-pointer"
                    >
                      Not yet
                    </button>
                  </div>
                )}
              </div>
              );
            })}
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
            {transcript.map((turn, idx) => {
              const isFallbackTurn = turn.senderRole === "AI" && (
                (turn as any).metadata?.generator === "DETERMINISTIC_FALLBACK" ||
                (turn as any).metadata?.generator === "OFFLINE_COACH" ||
                (turn as any).metadata?.offlineFallback === "true" ||
                (turn.content && turn.content.includes("10M records"))
              );
              return (
              <div
                key={idx}
                className={"p-2.5 rounded-lg border text-xs leading-relaxed " + (turn.senderRole === "CANDIDATE" ? "bg-primary/10 border-primary/40" : "bg-elevated border-border")}
              >
                <div className="text-[10px] font-bold text-primary-2 mb-1 flex justify-between items-center">
                  <span>{turn.senderRole === "CANDIDATE" ? "Candidate" : isFallbackTurn ? "Automated Fallback — not the interviewer" : personaName}</span>
                  {turn.messageType && (
                    <span className="text-text-3 text-[9px] font-mono">{isFallbackTurn ? "DETERMINISTIC_FALLBACK" : turn.messageType}</span>
                  )}
                </div>
                {turn.senderRole === "CANDIDATE" ? (
                  <CandidateMessageContent content={turn.content} />
                ) : (
                  <AssistantMessageContent content={turn.content} />
                )}
                {turn.codeSnippet && turn.codeSnippet.trim() && (
                  <pre className="mt-1.5 p-1.5 bg-bg rounded border border-border font-mono text-[10px] overflow-x-auto text-primary-2">
                    {turn.codeSnippet}
                  </pre>
                )}
              </div>
              );
            })}
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
            isRequestingMic={isRequestingMic}
            onToggleListening={onMicToggle || (() => {})}
            onStartListening={onStartListening}
            onStopListening={onStopListening}
            onAbort={onAbortVoice ?? onAbortTurn}
            onAbortTurn={onAbortTurn}
            onRecallLastDraft={onRecallLastDraft}
            recallLastDraft={onRecallLastDraft}
            abortTurn={onAbortTurn}
            isAiResponding={isAiResponding}
            interimTranscript={interimTranscript}
            salvageHint={salvageHint}
            micError={micError}
            onClearMicError={onClearMicError}
            canRetryStt={canRetryStt}
            onRetryStt={onRetryStt}
            placeholder="Speak or type your response..."
          />
        </div>
      )}
    </div>
  );
};