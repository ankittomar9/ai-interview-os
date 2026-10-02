import React from 'react';

export interface VerdictChipDescriptor {
  label: string;
  className: string;
}

/**
 * Returns canonical chip descriptor per SPEC-006 §4.
 * Unknown verdict values fall through to a neutral chip printing the raw text verbatim.
 */
export function getVerdictChipDescriptor(rawVerdict?: string | null): VerdictChipDescriptor {
  if (!rawVerdict || !rawVerdict.trim()) {
    return {
      label: '—',
      className: 'bg-surface text-text-3 border border-border'
    };
  }

  const v = rawVerdict.trim().toUpperCase();

  switch (v) {
    case 'PASSED':
      return {
        label: 'PASSED',
        className: 'bg-success/15 text-success border border-success/30'
      };
    case 'PARTIAL':
      return {
        label: 'PARTIAL',
        className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      };
    case 'TIME_LIMIT_EXCEEDED':
      return {
        label: 'TLE',
        className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      };
    case 'MEMORY_LIMIT_EXCEEDED':
      return {
        label: 'MLE',
        className: 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
      };
    case 'COMPILE_ERROR':
      return {
        label: 'COMPILE ERROR',
        className: 'bg-danger/15 text-danger border border-danger/30'
      };
    case 'RUNTIME_ERROR':
      return {
        label: 'RUNTIME ERROR',
        className: 'bg-danger/15 text-danger border border-danger/30'
      };
    case 'WRONG_ANSWER':
      return {
        label: 'WRONG ANSWER',
        className: 'bg-danger/15 text-danger border border-danger/30'
      };
    case 'FAILED':
      return {
        label: 'FAILED',
        className: 'bg-danger/15 text-danger border border-danger/30'
      };
    case 'UNATTEMPTED':
      return {
        label: 'UNATTEMPTED',
        className: 'bg-surface text-text-3 border border-border'
      };
    default:
      // Fallthrough: neutral chip that prints the raw string verbatim (uppercase, monospace)
      return {
        label: v,
        className: 'bg-surface text-text-3 border border-border font-mono'
      };
  }
}

export interface VerdictChipProps {
  verdict?: string | null;
  className?: string;
}

export const VerdictChip: React.FC<VerdictChipProps> = ({ verdict, className = '' }) => {
  const desc = getVerdictChipDescriptor(verdict);
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase whitespace-nowrap ${desc.className} ${className}`}
    >
      {desc.label}
    </span>
  );
};
