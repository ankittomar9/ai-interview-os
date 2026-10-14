import React from 'react';
import { Play, X, BookOpen, AlertCircle } from 'lucide-react';
import type { GenerateQuestionResponse } from '../../types';
import { Button } from '../ui/Button';

interface PracticeLauncherCardProps {
  question: GenerateQuestionResponse | null;
  slug: string;
  notFound?: boolean;
  onLaunch: (question: GenerateQuestionResponse) => void;
  onDismiss: () => void;
}

export const PracticeLauncherCard: React.FC<PracticeLauncherCardProps> = ({
  question,
  slug,
  notFound = false,
  onLaunch,
  onDismiss,
}) => {
  return (
    <div className="bg-surface border-2 border-primary/40 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/15 text-primary border border-primary/30">
            <BookOpen className="w-3 h-3" />
            Practice Launcher
          </span>
          {question?.track && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-text-3 border border-border">
              {question.track}
            </span>
          )}
          {question?.difficulty && (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface text-text-3 border border-border">
              {question.difficulty}
            </span>
          )}
        </div>

        <h4 className="text-base font-semibold text-text">
          {question?.title || slug}
        </h4>

        {notFound ? (
          <p className="text-xs text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Question not found in catalog
          </p>
        ) : (
          <p className="text-xs text-text-3">
            Ready to solve in playground mode. Click start to begin practicing.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={onDismiss}
          className="text-text-3 hover:text-text"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Dismiss
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={notFound || !question}
          onClick={() => {
            if (question) onLaunch(question);
          }}
          className="bg-primary hover:bg-primary/90 text-on-accent"
        >
          <Play className="w-3.5 h-3.5 mr-1 fill-current" />
          Start practice
        </Button>
      </div>
    </div>
  );
};
