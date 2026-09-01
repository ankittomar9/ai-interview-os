import React from 'react';
import type { GenerateQuestionResponse } from '../../types';
import { MarkdownProblem } from './MarkdownProblem';

interface ProblemEditorialTabProps {
  question: GenerateQuestionResponse;
}

export const ProblemEditorialTab: React.FC<ProblemEditorialTabProps> = ({ question }) => {
  return (
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
  );
};
