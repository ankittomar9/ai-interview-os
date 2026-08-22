import React from 'react';
import { GitBranch, AlertCircle, AlertTriangle } from 'lucide-react';
import { Chip } from '../ui/Chip';

interface StatusBarProps {
  ln: number;
  col: number;
  language: string;
  engine: 'Judge0' | 'Maven';
  engineReady: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  ln = 1,
  col = 1,
  language = 'java',
  engine = 'Judge0',
  engineReady = true
}) => {
  return (
    <div className="h-6 bg-elevated border-t border-border font-mono text-[11px] flex items-center justify-between px-3 shrink-0 select-none text-text-3 z-10">
      {/* Left side: Branch & Diagnostics */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-text-2">
          <GitBranch className="w-3 h-3 text-primary-2" />
          <span>workspace</span>
        </div>

        <div className="flex items-center gap-2 text-text-3 border-l border-border pl-3">
          <span className="flex items-center gap-0.5 hover:text-text cursor-default">
            <AlertCircle className="w-3 h-3 text-danger/80" /> 0
          </span>
          <span className="flex items-center gap-0.5 hover:text-text cursor-default">
            <AlertTriangle className="w-3 h-3 text-warning/80" /> 0
          </span>
        </div>
      </div>

      {/* Right side: Position, Encoding, Language, Engine Status */}
      <div className="flex items-center gap-3">
        <span>
          Ln {ln}, Col {col}
        </span>

        <span className="hidden sm:inline text-text-3/60">•</span>
        <span className="hidden sm:inline">UTF-8</span>

        <span className="text-text-3/60">•</span>
        <span className="capitalize text-text-2">{language}</span>

        <span className="text-text-3/60">•</span>
        <Chip
          variant={engineReady ? 'success' : 'warning'}
          size="sm"
          className="font-mono text-[10px] py-0 px-1.5 h-4"
        >
          {engine} {engineReady ? 'ready' : 'offline'}
        </Chip>
      </div>
    </div>
  );
};
