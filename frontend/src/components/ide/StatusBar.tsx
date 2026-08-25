import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface StatusBarProps {
  ln: number;
  col: number;
  language: string;
  engine?: 'Judge0' | 'Maven';
  engineReady?: boolean;
  connected?: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  ln = 1,
  col = 1,
  language = 'java',
  connected = true
}) => {
  return (
    <div className="h-6 border-t border-border font-mono text-[11px] flex items-center justify-between px-3 shrink-0 select-none text-text-3 z-10 bg-elevated">
      {/* Left side: Connected status & Diagnostics */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-text-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-success' : 'bg-danger animate-pulse'}`} />
          <span className="font-semibold">{connected ? 'Connected' : 'Offline'}</span>
        </div>

        <div className="flex items-center gap-2 text-text-3 border-l border-border/40 pl-3">
          <span className="flex items-center gap-0.5 hover:text-text cursor-default">
            <AlertCircle className="w-3 h-3 text-danger/80" /> 0
          </span>
          <span className="flex items-center gap-0.5 hover:text-text cursor-default">
            <AlertTriangle className="w-3 h-3 text-warning/80" /> 0
          </span>
        </div>
      </div>

      {/* Right side: Position, Spaces, Encoding, LF, Language */}
      <div className="flex items-center gap-2.5 sm:gap-3 text-text-2">
        <span>Ln {ln}, Col {col}</span>
        <span className="hidden sm:inline text-text-3/60">•</span>
        <span className="hidden sm:inline">Spaces: 4</span>
        <span className="hidden sm:inline text-text-3/60">•</span>
        <span className="hidden sm:inline">UTF-8</span>
        <span className="hidden sm:inline text-text-3/60">•</span>
        <span className="hidden sm:inline">LF</span>
        <span className="text-text-3/60">•</span>
        <span className="capitalize font-semibold text-text">{`{ } ${language}`}</span>
      </div>
    </div>
  );
};
