import React, { useState } from 'react';
import { PlayCircle, CheckCircle2, Code2, Copy, Check } from 'lucide-react';
import type { GenerateQuestionResponse } from '../../types';
import { MarkdownProblem } from './MarkdownProblem';
import { Chip } from '../ui/Chip';
import { SolutionReveal } from './SolutionReveal';

interface ProblemDescriptionTabProps {
  question: GenerateQuestionResponse;
  slug: string;
  isSolved: boolean;
  isPracticeMode: boolean;
  hasRunAttempt: boolean;
  hasSubmissions: boolean;
  solutionViewed: boolean;
  onViewSolution: (slug: string) => void;
}

export const ProblemDescriptionTab: React.FC<ProblemDescriptionTabProps> = ({
  question,
  slug,
  isSolved,
  isPracticeMode,
  hasRunAttempt,
  hasSubmissions,
  solutionViewed,
  onViewSolution
}) => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopyExample = (input: string, output: string, idx: number) => {
    const text = `Input:\n${input}\nOutput:\n${output}`;
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
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

      {/* Example cards from sampleTests */}
      {question.sampleTests && question.sampleTests.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider">Examples</h4>
          <div className="space-y-2.5">
            {question.sampleTests.map((st, idx) => (
              <div key={idx} className="rounded-lg border border-border bg-elevated/40 p-3 text-xs font-mono space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-2">{st.name || `Example ${idx + 1}`}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyExample(st.input || '', st.expectedOutput || '', idx)}
                    title="Copy Example"
                    className="p-1 rounded hover:bg-surface text-text-3 hover:text-text transition-colors cursor-pointer"
                  >
                    {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {st.input && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-text-3 block font-mono">Input:</span>
                    <pre className="p-2 rounded bg-surface border border-border text-text overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{st.input}</pre>
                  </div>
                )}
                {st.expectedOutput && (
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-text-3 block font-mono">Output:</span>
                    <pre className="p-2 rounded bg-surface border border-border text-text overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{st.expectedOutput}</pre>
                  </div>
                )}
                {(st.explanation || (st as any).description) && (
                  <div className="space-y-0.5 font-sans text-text-2 text-[11px]">
                    <span className="font-semibold text-text-3 font-mono">Explanation: </span>
                    <span>{st.explanation || (st as any).description}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraints Pills */}
      {question.constraints && question.constraints.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider">Constraints</h4>
          <div className="flex flex-wrap gap-1.5">
            {question.constraints.map((c, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-full bg-elevated border border-border text-text-2 font-mono text-[11px]">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

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
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-picture"
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
            hasRunAttempt={hasRunAttempt || hasSubmissions}
            isAssisted={solutionViewed}
            onViewSolution={() => onViewSolution(slug)}
          />
        </div>
      )}
    </div>
  );
};
