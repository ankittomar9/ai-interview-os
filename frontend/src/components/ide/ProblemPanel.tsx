import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Edit3,
  BookOpen
} from 'lucide-react';
import type { GenerateQuestionResponse } from '../../types';
import { HintsPanel } from './HintsPanel';
import { SubmissionsTab } from './SubmissionsTab';
import { ProblemEditorialTab } from './ProblemEditorialTab';
import { ProblemScratchpadTab } from './ProblemScratchpadTab';
import { ProblemDescriptionTab } from './ProblemDescriptionTab';
import { usePlaygroundProgress } from '../../hooks/usePlaygroundProgress';
import { getSubmissions } from '../../lib/submissions';

interface ProblemPanelProps {
  question: GenerateQuestionResponse;
  sessionId?: number;
  isSolved?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  hintsRevealed?: number;
  onRevealHint?: () => void;
  isPracticeMode?: boolean;
  hasRunAttempt?: boolean;
  className?: string;
}

export const ProblemPanel: React.FC<ProblemPanelProps> = ({
  question,
  sessionId = 0,
  isSolved = false,
  isBookmarked = false,
  onToggleBookmark,
  hintsRevealed = 0,
  isPracticeMode = false,
  hasRunAttempt = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'scratchpad' | 'editorial' | 'submissions'>('description');
  const slug = question.problemSlug || question.slug || '';

  const { getProgress, saveNotes, recordSolutionView } = usePlaygroundProgress();
  const currentProgress = getProgress(slug);
  const [scratchpadText, setScratchpadText] = useState(currentProgress.notes || '');
  const [prevSlug, setPrevSlug] = useState(slug);

  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setScratchpadText(getProgress(slug).notes || '');
  }

  const handleNotesChange = (text: string) => {
    setScratchpadText(text);
    saveNotes(slug, text);
  };

  const submissions = getSubmissions(sessionId, slug);

  const tips = question.coaching?.presentationTips || [
    'Analyze the constraints: Can an auxiliary Hash Map optimize the search from O(N²) to O(N)?',
    'Consider corner cases: duplicate elements, empty arrays, or single-element inputs.',
    'Formulate your time and space complexity before finalizing the code.'
  ];

  return (
    <div className={`bg-surface flex flex-col h-full overflow-hidden select-text ${className}`}>
      {/* Top Tabs */}
      <div className="h-9 bg-elevated border-b border-border px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('description')}
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'description'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text font-semibold'
            }`}
          >
            Description
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hints')}
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'hints'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text font-semibold'
            }`}
          >
            <span>Hints</span>
            {hintsRevealed > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-mono font-bold">
                {hintsRevealed}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'submissions'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text font-semibold'
            }`}
          >
            <span>Submissions</span>
            {submissions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-surface border border-border text-text-2 text-[10px] font-mono font-bold">
                {submissions.length}
              </span>
            )}
          </button>

          {isPracticeMode && (
            <button
              type="button"
              onClick={() => setActiveTab('scratchpad')}
              className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1 ${
                activeTab === 'scratchpad'
                  ? 'border-primary text-text'
                  : 'border-transparent text-text-3 hover:text-text font-semibold'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-text-3" />
              <span>Scratchpad</span>
            </button>
          )}

          {isPracticeMode && (
            <button
              type="button"
              onClick={() => setActiveTab('editorial')}
              className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1 ${
                activeTab === 'editorial'
                  ? 'border-primary text-text'
                  : 'border-transparent text-text-3 hover:text-text font-semibold'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-text-3" />
              <span>Editorial</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
              className="p-1 rounded text-text-3 hover:text-warning hover:bg-surface transition-colors cursor-pointer"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-warning fill-warning" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'description' && (
          <ProblemDescriptionTab
            question={question}
            slug={slug}
            isSolved={isSolved}
            isPracticeMode={isPracticeMode}
            hasRunAttempt={hasRunAttempt}
            hasSubmissions={submissions.length > 0}
            solutionViewed={currentProgress.solutionViewed}
            onViewSolution={recordSolutionView}
          />
        )}

        {activeTab === 'hints' && (
          <HintsPanel hints={question.hints || tips} />
        )}

        {isPracticeMode && activeTab === 'scratchpad' && (
          <ProblemScratchpadTab
            scratchpadText={scratchpadText}
            onNotesChange={handleNotesChange}
          />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsTab submissions={submissions} />
        )}

        {isPracticeMode && activeTab === 'editorial' && (
          <ProblemEditorialTab question={question} />
        )}
      </div>
    </div>
  );
};
