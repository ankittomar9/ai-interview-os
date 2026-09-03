import React from 'react';
import { ShieldCheck, Cloud } from 'lucide-react';
import type { ModelProvider } from '../types';
import { useLocalPurity } from '../hooks/useLocalPurity';

interface LocalPurityBadgeProps {
  provider?: ModelProvider;
  apiKey?: string;
  className?: string;
}

export const LocalPurityBadge: React.FC<LocalPurityBadgeProps> = ({
  provider,
  apiKey,
  className = ''
}) => {
  const { isLocal } = useLocalPurity({ provider, apiKey });

  if (isLocal) {
    return (
      <div
        title="100% Local: All AI inference, code execution, and telemetry remain strictly on your machine."
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${className}`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>100% Local</span>
      </div>
    );
  }

  return (
    <div
      title="Cloud Connected: Interview runs with authenticated cloud AI provider."
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 ${className}`}
    >
      <Cloud className="w-3.5 h-3.5" />
      <span>Cloud AI</span>
    </div>
  );
};
