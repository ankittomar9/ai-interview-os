import React, { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, PlayCircle, CheckCircle2, Code2, Database, Edit3, BookOpen } from 'lucide-react';
import type { GenerateQuestionResponse } from '../../types';
import { MarkdownProblem } from './MarkdownProblem';
import { Chip } from '../ui/Chip';
import { HintsPanel } from './HintsPanel';
import { SolutionReveal } from './SolutionReveal';
import { usePlaygroundProgress } from '../../hooks/usePlaygroundProgress';

interface ProblemPanelProps {
  question: GenerateQuestionResponse;
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
  isSolved = false,
  isBookmarked = false,
  onToggleBookmark,
  hintsRevealed = 0,
  isPracticeMode = false,
  hasRunAttempt = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'scratchpad' | 'editorial' | 'submissions'>('description');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const slug = question.problemSlug || question.slug || '';

  const { getProgress, saveNotes, recordSolutionView } = usePlaygroundProgress();
  const currentProgress = getProgress(slug);
  const [scratchpadText, setScratchpadText] = useState(currentProgress.notes || '');

  useEffect(() => {
    setScratchpadText(getProgress(slug).notes || '');
  }, [slug]);

  const handleNotesChange = (text: string) => {
    setScratchpadText(text);
    saveNotes(slug, text);
  };

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
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            Description
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hints')}
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1 ${
              activeTab === 'hints'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            <span>Hints</span>
            {hintsRevealed > 0 && (
              <span className="px-1 py-0.2 rounded-full bg-primary/20 text-primary text-[10px] font-mono">
                {hintsRevealed}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('submissions')}
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'submissions'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            Submissions
          </button>

          {isPracticeMode && (
            <button
              type="button"
              onClick={() => setActiveTab('scratchpad')}
              className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1 ${
                activeTab === 'scratchpad'
                  ? 'border-primary text-text'
                  : 'border-transparent text-text-3 hover:text-text'
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
                  : 'border-transparent text-text-3 hover:text-text'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-text-3" />
              <span>Editorial</span>
            </button>
          )}
        </div>

        {/* Bookmark Action */}
        <div className="flex items-center gap-1.5">
          {onToggleBookmark && (
            <button
              type="button"
              onClick={onToggleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
              className="p-1 rounded text-text-3 hover:text-text hover:bg-surface transition-colors cursor-pointer"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-warning" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'description' && (
          <>
            {/* Title, Badges & Solved status */}
            <div className="space-y-2 pb-2 border-b border-border">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-text tracking-tight leading-snug">
                  {question.title}
                </h1>

                {isSolved && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/30 text-xs font-semibold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Solved</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Chip variant="success" size="sm">
                  {question.difficulty || 'Easy'}
                </Chip>
                <Chip variant="primary" size="sm">
                  {question.track}
                </Chip>
                {question.buildProfile && (
                  <Chip variant="neutral" size="sm">
                    {question.buildProfile}
                  </Chip>
                )}
              </div>
            </div>

            {/* Video Guide Strip (Optional Placeholder) */}
            <div className="hidden md:flex bg-elevated border border-border rounded-lg p-3 items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-md bg-surface border border-border flex items-center justify-center text-primary shrink-0">
                  <PlayCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-text truncate">Video Guide: Problem Walkthrough &amp; Invariants</div>
                  <div className="text-[10px] text-text-3 font-mono shrink-0">12:45 • Interactive Explanation</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsVideoOpen(!isVideoOpen)}
                className="px-2.5 py-1 text-xs rounded-md bg-surface border border-border text-text hover:bg-elevated font-semibold transition-colors cursor-pointer shrink-0"
              >
                {isVideoOpen ? 'Hide' : 'Watch'}
              </button>
            </div>

            {isVideoOpen && (
              <div className="p-4 rounded-lg bg-black/60 border border-border text-center text-xs text-text-3 font-mono">
                [Video Guide stream asset configured for {question.slug || 'active-problem'}]
              </div>
            )}

            {/* Solution Reveal Component in Practice Mode */}
            {isPracticeMode && (
              <SolutionReveal
                solutionCode={question.solutionCode || question.solutionSql}
                hasRunAttempt={hasRunAttempt}
                onViewSolution={() => recordSolutionView(slug)}
                isAssisted={currentProgress.status === 'assisted' || currentProgress.solutionViewed}
              />
            )}

            {/* Rendered Markdown Problem Statement */}
            <div className="md-prose">
              <MarkdownProblem statement={question.problemStatement} />
            </div>

            {/* Rendered Database Schema for SQL track */}
            {question.schemaMarkdown && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-text-3 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-primary" />
                  <span>Database Schema:</span>
                </div>
                <div className="bg-elevated border border-border rounded-lg p-3 md-prose overflow-x-auto text-xs">
                  <MarkdownProblem statement={question.schemaMarkdown} />
                </div>
              </div>
            )}

            {/* Sample Examples */}
            {question.sampleTests && question.sampleTests.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-text-3 uppercase tracking-wider font-mono">
                  Examples
                </div>
                {question.sampleTests.map((t, idx) => (
                  <div key={idx} className="bg-elevated border border-border rounded-lg p-3 space-y-2 text-xs font-mono">
                    <div className="font-bold text-text">Example {idx + 1}:</div>
                    <div>
                      <span className="text-text-3">Input: </span>
                      <span className="text-text">{t.input}</span>
                    </div>
                    <div>
                      <span className="text-text-3">Output: </span>
                      <span className="text-success font-semibold">{t.expectedOutput}</span>
                    </div>
                    {t.explanation && (
                      <div className="text-[11px] text-text-2 font-sans italic border-t border-border/40 pt-1 mt-1">
                        Explanation: {t.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: HINTS */}
        {activeTab === 'hints' && (
          <HintsPanel hints={question.hints || tips} />
        )}

        {/* TAB 3: SCRATCHPAD (PRACTICE MODE ONLY) */}
        {activeTab === 'scratchpad' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-text">Personal Problem Scratchpad</h4>
                <p className="text-xs text-text-3">Notes are auto-saved to localStorage for this challenge.</p>
              </div>
            </div>
            <textarea
              value={scratchpadText}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Jot down time complexity equations, edge cases, invariants, or pseudocode notes..."
              rows={14}
              className="w-full bg-elevated border border-border rounded-xl p-4 text-xs font-mono text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y leading-relaxed"
            />
          </div>
        )}

        {/* TAB 4: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-text">Submissions History</div>
            <div className="bg-elevated border border-border rounded-lg p-4 text-xs text-text-3 text-center space-y-1">
              <Code2 className="w-6 h-6 mx-auto text-text-3/60 mb-1" />
              <div className="text-text-2 font-semibold">Live Session Run History</div>
              <div>
                Total Attempts: <span className="font-mono font-bold text-text">{currentProgress.attempts}</span>
                {currentProgress.bestTimeMs !== undefined && (
                  <span> · Best Runtime: <span className="font-mono font-bold text-success">{currentProgress.bestTimeMs.toFixed(0)}ms</span></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: EDITORIAL (PRACTICE MODE ONLY) */}
        {activeTab === 'editorial' && (
          <div className="space-y-4">
            <div className="text-sm font-bold text-text">Optimal Solution &amp; Algorithmic Editorial</div>
            
            {question.editorialMarkdown ? (
              <div className="md-prose text-xs bg-elevated border border-border rounded-xl p-4">
                <MarkdownProblem statement={question.editorialMarkdown} />
              </div>
            ) : (
              <div className="bg-elevated border border-border rounded-xl p-4 text-xs text-text-2 space-y-3">
                {question.coaching?.approachHint && (
                  <div>
                    <div className="font-bold text-text mb-1">Recommended Approach:</div>
                    <p className="leading-relaxed">{question.coaching.approachHint}</p>
                  </div>
                )}
                {question.coaching?.commonMistakes && question.coaching.commonMistakes.length > 0 && (
                  <div>
                    <div className="font-bold text-text mb-1">Common Pitfalls &amp; Mistakes:</div>
                    <ul className="list-disc pl-4 space-y-1 text-text-2">
                      {question.coaching.commonMistakes.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <div className="font-bold text-text mb-1">Evaluation &amp; Complexity Standards:</div>
                  <ul className="list-disc pl-4 space-y-1 text-text-3 font-mono text-[11px]">
                    {question.evaluationCriteria.map((c, idx) => (
                      <li key={idx}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
