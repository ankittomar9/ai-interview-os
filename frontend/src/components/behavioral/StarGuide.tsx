import React from 'react';
import { CheckCircle2, Circle, Lightbulb, Sparkles } from 'lucide-react';

interface StarGuideProps {
  candidateAnswer?: string;
  className?: string;
}

interface StarCriterion {
  letter: 'S' | 'T' | 'A' | 'R';
  title: string;
  subtitle: string;
  description: string;
  patterns: RegExp[];
  tip: string;
}

const STAR_CRITERIA: StarCriterion[] = [
  {
    letter: 'S',
    title: 'Situation',
    subtitle: 'Context & Background',
    description: 'Describe the project, team dynamics, timeline, scale, or business scenario.',
    patterns: [
      /\b(situation|project|when I was|at my previous|company|team|client|background|scenario|context|working on|system had|quarter)\b/i
    ],
    tip: 'Keep it concise: 2-3 sentences setting up the context, scale, and timeline.'
  },
  {
    letter: 'T',
    title: 'Task',
    subtitle: 'Challenge & Ownership',
    description: 'Clarify the exact problem, constraints, requirements, and what was expected of YOU.',
    patterns: [
      /\b(task|goal|objective|challenge|requirement|needed to|assigned|responsible for|target|problem was|deadline|risk)\b/i
    ],
    tip: 'Define what was at stake if the problem was not solved.'
  },
  {
    letter: 'A',
    title: 'Action',
    subtitle: 'Initiative & Architecture',
    description: 'Explain the specific technical, architectural, or leadership steps YOU took.',
    patterns: [
      /\b(I designed|I built|I implemented|I led|I decided|I analyzed|I created|I refactored|I introduced|I resolved|my approach|I proposed)\b/i
    ],
    tip: 'Use "I" instead of "We". Highlight technical trade-offs and decision rationale.'
  },
  {
    letter: 'R',
    title: 'Result',
    subtitle: 'Measurable Impact',
    description: 'Share quantitative metrics, performance improvements, business impact, and learnings.',
    patterns: [
      /\b(result|outcome|improved|reduced|increased|decreased|saved|\d+%|\d+ms|latency|throughput|revenue|learned|impact|delivered)\b/i
    ],
    tip: 'Quantify impact (e.g., "Reduced p99 latency by 45% and saved $120k/yr in cloud costs").'
  }
];

export const StarGuide: React.FC<StarGuideProps> = ({ candidateAnswer = '', className = '' }) => {
  const coverage = STAR_CRITERIA.map((criterion) => {
    const isCovered = criterion.patterns.some((pattern) => pattern.test(candidateAnswer));
    return {
      ...criterion,
      isCovered
    };
  });

  const coveredCount = coverage.filter((c) => c.isCovered).length;
  const coveragePercent = Math.round((coveredCount / STAR_CRITERIA.length) * 100);

  return (
    <div className={`bg-surface border border-border rounded-xl p-4 space-y-3 select-text ${className}`}>
      {/* Header & Gauge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-text uppercase tracking-wide">STAR Framework Guide</h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            coveragePercent === 100
              ? 'bg-success/15 text-success border border-success/30'
              : coveragePercent >= 50
              ? 'bg-warning/15 text-warning border border-warning/30'
              : 'bg-elevated text-text-3 border border-border'
          }`}
        >
          {coveragePercent}% Covered
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-elevated rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            coveragePercent === 100 ? 'bg-success' : coveragePercent >= 50 ? 'bg-warning' : 'bg-primary'
          }`}
          style={{ width: `${Math.max(8, coveragePercent)}%` }}
        />
      </div>

      {/* STAR Items */}
      <div className="space-y-2 pt-1">
        {coverage.map((item) => (
          <div
            key={item.letter}
            className={`p-2.5 rounded-lg border text-xs transition-all ${
              item.isCovered
                ? 'bg-success/5 border-success/30 text-text'
                : 'bg-elevated/40 border-border text-text-2'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center font-bold font-mono text-[11px] ${
                    item.isCovered
                      ? 'bg-success text-white'
                      : 'bg-elevated border border-border text-text-3'
                  }`}
                >
                  {item.letter}
                </span>
                <span className="font-bold text-text">{item.title}</span>
                <span className="text-[10px] text-text-3">· {item.subtitle}</span>
              </div>
              {item.isCovered ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-text-3/40 shrink-0" />
              )}
            </div>

            <p className="text-[11px] text-text-3 leading-relaxed pl-7">{item.description}</p>

            {!item.isCovered && (
              <div className="mt-1.5 pl-7 flex items-center gap-1 text-[10px] text-warning/90">
                <Lightbulb className="w-3 h-3 shrink-0" />
                <span>Tip: {item.tip}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
