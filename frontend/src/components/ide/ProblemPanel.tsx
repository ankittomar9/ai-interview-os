import React, { useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  PlayCircle,
  CheckCircle2,
  Code2,
  Edit3,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { GenerateQuestionResponse } from '../../types';
import { MarkdownProblem } from './MarkdownProblem';
import { Chip } from '../ui/Chip';
import { HintsPanel } from './HintsPanel';
import { SolutionReveal } from './SolutionReveal';
import { usePlaygroundProgress } from '../../hooks/usePlaygroundProgress';
import { getSubmissions, formatTimeAgo } from '../../lib/submissions';

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
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null);
  const slug = question.problemSlug || question.slug || '';

  const { getProgress, saveNotes, recordSolutionView } = usePlaygroundProgress();
  const currentProgress = getProgress(slug);
  const [scratchpadText, setScratchpadText] = useState(currentProgress.notes || '');
  const [prevSlug, setPrevSlug] = useState(slug);

  if (prevSlug !== slug) {
    setPrevSlug(slug);
    setScratchpadText(getProgress(slug).notes || '');
    setExpandedSubmissionId(null);
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
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'submissions'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
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

        {/* Action icons */}
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
        {/* TAB 1: DESCRIPTION */}
        {activeTab === 'description' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text">{question.title}</h3>
                {isSolved && (
                  <Chip variant="success" size="sm" icon={<CheckCircle2 className="w-3 h-3" />}>
                    Solved
                  </Chip>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Chip variant="neutral" size="sm" icon={<Code2 className="w-3 h-3" />}>
                  {question.track || 'DSA'}
                </Chip>
                <Chip
                  variant={
                    String(question.difficulty).toLowerCase() === 'hard'
                      ? 'danger'
                      : String(question.difficulty).toLowerCase() === 'medium'
                      ? 'warning'
                      : 'success'
                  }
                  size="sm"
                >
                  {question.difficulty || 'Easy'}
                </Chip>
              </div>
            </div>

            {/* Markdown rendered problem description */}
            <div className="md-prose text-xs leading-relaxed text-text-2">
              <MarkdownProblem statement={question.problemStatement} />
            </div>

            {/* Video Walkthrough (if present) */}
            {(question as any).videoSolutionUrl && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsVideoOpen(!isVideoOpen)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>{isVideoOpen ? 'Hide Video Walkthrough' : 'Watch Video Solution'}</span>
                </button>

                {isVideoOpen && (
                  <div className="mt-3 aspect-video bg-black rounded-lg overflow-hidden border border-border">
                    <iframe
                      src={(question as any).videoSolutionUrl}
                      title="Solution Walkthrough"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}

            {/* Solution Reveal Modal (Playground Practice Mode Only) */}
            {isPracticeMode && question.solutionCode && (
              <div className="pt-2 border-t border-border">
                <SolutionReveal
                  solutionCode={question.solutionCode}
                  hasRunAttempt={hasRunAttempt || submissions.length > 0}
                  isAssisted={currentProgress.solutionViewed}
                  onViewSolution={() => recordSolutionView(slug)}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: HINTS */}
        {activeTab === 'hints' && (
          <HintsPanel hints={question.hints || tips} />
        )}

        {/* TAB 3: SCRATCHPAD (PRACTICE MODE ONLY) */}
        {isPracticeMode && activeTab === 'scratchpad' && (
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

        {/* TAB 4: SUBMISSIONS (LEETCODE STYLE) */}
        {activeTab === 'submissions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="text-sm font-bold text-text flex items-center gap-2">
                <span>Submissions History</span>
                <span className="px-2 py-0.5 rounded-full bg-elevated border border-border text-xs font-mono text-text-2">
                  Total Attempts: {submissions.length}
                </span>
              </div>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-elevated border border-border rounded-xl p-8 text-xs text-text-3 text-center space-y-2">
                <Code2 className="w-8 h-8 mx-auto text-text-3/50" />
                <div className="font-semibold text-text-2 text-sm">No Submissions Recorded Yet</div>
                <p className="max-w-xs mx-auto text-text-3">
                  Run your test cases or submit code to track your progression and performance metrics.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map((sub) => {
                  const isExpanded = expandedSubmissionId === sub.id;
                  const isAccepted = sub.status === 'Accepted';
                  const isCompileError = sub.status === 'Compile Error';
                  const isTimeout = sub.status === 'Time Limit Exceeded';

                  const badgeVariantClass = isAccepted
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : isCompileError || isTimeout
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30';

                  return (
                    <div
                      key={sub.id}
                      className="border border-border rounded-lg bg-elevated/40 hover:bg-elevated transition-colors overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedSubmissionId(isExpanded ? null : sub.id)}
                        className="w-full p-2.5 sm:p-3 flex items-center justify-between text-xs cursor-pointer select-none text-left gap-2"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeVariantClass} shrink-0`}>
                            {sub.status}
                          </span>
                          <span className="font-mono text-text-2 font-semibold text-[11px] shrink-0">
                            {sub.runtimeMs !== undefined ? `${sub.runtimeMs.toFixed(0)} ms` : 'N/A'}
                          </span>
                          {sub.memoryMb !== undefined && sub.memoryMb > 0 && (
                            <span className="font-mono text-text-3 text-[11px] shrink-0">
                              {sub.memoryMb.toFixed(1)} MB
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-[10px] font-mono text-text-2 font-bold uppercase shrink-0">
                            {sub.language}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-text-3 font-mono text-[11px] shrink-0">
                          <span>{formatTimeAgo(sub.at)}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-3 border-t border-border/80 bg-surface/50 space-y-2.5 text-xs font-mono">
                          <div className="flex items-center justify-between text-text-3 text-[11px]">
                            <span>
                              Test Cases Passed: <strong className="text-text font-bold">{sub.passedTests} / {sub.totalTests}</strong>
                            </span>
                            <span>{new Date(sub.at).toLocaleTimeString()}</span>
                          </div>

                          {sub.compilerOutput && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-danger font-bold block">Execution / Compilation Output:</span>
                              <pre className="p-2.5 rounded bg-danger/10 border border-danger/20 text-danger text-[11px] whitespace-pre-wrap overflow-x-auto max-h-48 leading-relaxed">
                                {sub.compilerOutput}
                              </pre>
                            </div>
                          )}

                          {sub.cases && sub.cases.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] text-text-3 font-bold block">Case Results:</span>
                              {sub.cases.map((c, i) => (
                                <div
                                  key={i}
                                  className={`p-2 rounded border text-[11px] space-y-1 ${
                                    c.passed
                                      ? 'bg-emerald-500/5 border-emerald-500/20 text-text'
                                      : 'bg-danger/5 border-danger/20 text-text'
                                  }`}
                                >
                                  <div className="flex justify-between font-bold">
                                    <span>Case {i + 1} {c.name ? `(${c.name})` : ''}</span>
                                    <span className={c.passed ? 'text-emerald-500' : 'text-danger'}>
                                      {c.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                  {!c.passed && c.error && (
                                    <div className="text-danger text-[10px] pt-0.5">{c.error}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {sub.rawOutput && !sub.compilerOutput && (
                            <div className="pt-1">
                              <span className="text-[10px] text-text-3 block">Raw Logs:</span>
                              <pre className="mt-1 p-2 rounded bg-elevated border border-border text-[10px] text-text-3 whitespace-pre-wrap overflow-x-auto max-h-32">
                                {sub.rawOutput}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: EDITORIAL (PRACTICE MODE ONLY) */}
        {isPracticeMode && activeTab === 'editorial' && (
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
