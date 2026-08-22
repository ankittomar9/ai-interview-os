import React from 'react';
import { Card } from './Card';
import { Quote } from 'lucide-react';

export interface RubricCardProps {
  dimension: string;
  score: number;
  rationale: string;
  evidence?: string;
  className?: string;
}

export const RubricCard: React.FC<RubricCardProps> = ({
  dimension,
  score,
  rationale,
  evidence,
  className = ''
}) => {
  const getScoreColor = (s: number) => {
    if (s >= 70) return { text: 'text-success', bg: 'bg-success', border: 'border-success/30' };
    if (s >= 40) return { text: 'text-warning', bg: 'bg-warning', border: 'border-warning/30' };
    return { text: 'text-danger', bg: 'bg-danger', border: 'border-danger/30' };
  };

  const colors = getScoreColor(score);
  const formattedDim = dimension.replace(/_/g, ' ');

  return (
    <Card padding="md" variant="elevated" className={`flex flex-col gap-3 ${className}`}>
      {/* Header: Dimension Title & Score Pill */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-text uppercase tracking-wide">
          {formattedDim}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-extrabold font-mono ${colors.text}`}>
            {score}/100
          </span>
        </div>
      </div>

      {/* Score Progress Bar */}
      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors.bg}`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>

      {/* Qualitative Rationale */}
      <p className="text-xs text-text-2 leading-relaxed">
        {rationale}
      </p>

      {/* Verbatim Transcript Evidence Quote */}
      {evidence && (
        <div className="mt-1 bg-surface border border-border-subtle rounded-md p-2.5 flex items-start gap-2">
          <Quote className="w-3.5 h-3.5 text-primary-2 shrink-0 mt-0.5" />
          <blockquote className="text-[11px] font-mono text-text-3 italic leading-snug break-words">
            "{evidence}"
          </blockquote>
        </div>
      )}
    </Card>
  );
};
