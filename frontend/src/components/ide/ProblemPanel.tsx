import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Lightbulb, PlayCircle, CheckCircle2, ChevronRight, Code2, Database } from 'lucide-react';
import type { GenerateQuestionResponse } from '../../types';
import { MarkdownProblem } from './MarkdownProblem';
import { Chip } from '../ui/Chip';

interface ProblemPanelProps {
  question: GenerateQuestionResponse;
  isSolved?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  hintsRevealed?: number;
  onRevealHint?: () => void;
  isPracticeMode?: boolean;
  className?: string;
}

export const ProblemPanel: React.FC<ProblemPanelProps> = ({
  question,
  isSolved = false,
  isBookmarked = false,
  onToggleBookmark,
  hintsRevealed = 0,
  onRevealHint,
  isPracticeMode = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'submissions' | 'editorial'>('description');
  const [isVideoOpen, setIsVideoOpen] = useState(false);

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
              onClick={() => setActiveTab('editorial')}
              className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'editorial'
                  ? 'border-primary text-text'
                  : 'border-transparent text-text-3 hover:text-text'
              }`}
            >
              Editorial
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

            {/* Hint Row Banner */}
            <div className="bg-elevated/60 border border-border rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Lightbulb className="w-4 h-4 text-warning shrink-0" />
                <span className="text-xs text-text-2 line-clamp-2">Stuck somewhere? Get a hint to move forward.</span>
              </div>

              {onRevealHint && hintsRevealed < tips.length ? (
                <button
                  type="button"
                  onClick={onRevealHint}
                  className="px-2.5 py-1 text-xs font-bold rounded-md bg-primary text-white hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
                >
                  Use Hint ({hintsRevealed}/{tips.length})
                </button>
              ) : (
                <span className="text-[11px] text-text-3 font-mono shrink-0">All hints revealed</span>
              )}
            </div>

            {/* Revealed Hints Box */}
            {hintsRevealed > 0 && (
              <div className="space-y-2 bg-elevated/40 border border-border rounded-lg p-3">
                <div className="text-xs font-bold text-text flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-warning" />
                  <span>Hints ({hintsRevealed} of {tips.length}):</span>
                </div>
                {tips.slice(0, hintsRevealed).map((tip: string, idx: number) => (
                  <div key={idx} className="text-xs text-text-2 flex items-start gap-2 pl-2">
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
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
          <div className="space-y-3">
            <div className="text-sm font-bold text-text">Coaching Invariants &amp; Algorithmic Hints</div>
            <div className="space-y-2">
              {tips.map((tip: string, idx: number) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs leading-relaxed space-y-1 ${
                    idx < hintsRevealed
                      ? 'bg-elevated border-border text-text'
                      : 'bg-elevated/30 border-dashed border-border text-text-3'
                  }`}
                >
                  <div className="font-bold flex items-center justify-between">
                    <span>Hint {idx + 1}</span>
                    {idx < hintsRevealed ? (
                      <span className="text-success text-[10px]">Unlocked</span>
                    ) : (
                      <span className="text-text-3 text-[10px]">Locked</span>
                    )}
                  </div>
                  <p>{idx < hintsRevealed ? tip : 'Click "Use Hint" on the Description tab to unlock this guidance.'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-text">Submissions History</div>
            <div className="bg-elevated border border-border rounded-lg p-4 text-xs text-text-3 text-center space-y-1">
              <Code2 className="w-6 h-6 mx-auto text-text-3/60 mb-1" />
              <div className="text-text-2 font-semibold">Live Session Run History</div>
              <div>Submissions submitted during this assessment are evaluated in real-time by the AI Bar Raiser.</div>
            </div>
          </div>
        )}

        {/* TAB 4: EDITORIAL (PRACTICE MODE ONLY) */}
        {activeTab === 'editorial' && (
          <div className="space-y-3">
            <div className="text-sm font-bold text-text">Optimal Solution &amp; Complexity Analysis</div>
            <div className="bg-elevated border border-border rounded-lg p-3 text-xs text-text-2 space-y-2">
              <div className="font-bold text-text">Time Complexity: O(N)</div>
              <div>Single-pass hash table lookup achieves linear runtime.</div>
              <div className="font-bold text-text pt-2">Space Complexity: O(N)</div>
              <div>Stores up to N elements in the map.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
