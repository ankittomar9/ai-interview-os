import React from 'react';
import { Binary, Database, Code2, Layers, Users2, FileText, CheckCircle2, Sparkles } from 'lucide-react';
import type { DifficultyLevel, InterviewTrack } from '../../types';
import { getPlanPresetPreview } from '../../lib/plan-presets';

export interface TrackOption {
  track: InterviewTrack;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const TRACK_OPTIONS: TrackOption[] = [
  {
    track: 'FULL_LOOP',
    title: 'Full Loop (DSA+LLD+HLD)',
    description: 'Complete multi-stage interview loop calibrated to your seniority (45–60 min).',
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    track: 'DSA_LLD',
    title: 'DSA + LLD',
    description: 'Algorithmic problem solving followed by object-oriented low-level design.',
    icon: <Binary className="w-4 h-4" />
  },
  {
    track: 'DSA_LLD_HLD',
    title: 'DSA + LLD + HLD',
    description: 'Comprehensive tech evaluation: algorithms, component design, and architecture.',
    icon: <Layers className="w-4 h-4" />
  },
  {
    track: 'LLD_HLD',
    title: 'LLD + HLD',
    description: 'Modular component architecture and large-scale distributed system design.',
    icon: <Code2 className="w-4 h-4" />
  },
  {
    track: 'SQL',
    title: 'SQL & Database Eng',
    description: 'Window functions, sessionization, joins & live PostgreSQL sandbox.',
    icon: <Database className="w-4 h-4" />
  },
  {
    track: 'BEHAVIORAL_STAR',
    title: 'Behavioral & Leadership',
    description: 'AI-led dialogue on engineering dilemmas, leadership tradeoffs, and team culture.',
    icon: <Users2 className="w-4 h-4" />
  },
  {
    track: 'RESUME_BASED',
    title: 'Resume Deep-Dive (Non-Tech)',
    description: "AI-led conversation grounded in your resume — no rubrics, the interviewer's read matters.",
    icon: <FileText className="w-4 h-4" />
  }
];

const DIFFICULTIES: DifficultyLevel[] = ['JUNIOR', 'MID', 'SENIOR', 'STAFF'];

interface TrackGridProps {
  selectedTrack: InterviewTrack;
  onSelectTrack: (track: InterviewTrack) => void;
  selectedDifficulty: DifficultyLevel;
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  suggestedDifficulty?: DifficultyLevel | null;
  suggestedExperienceYears?: number | null;
  isDifficultyOverridden?: boolean;
}

export const TrackGrid: React.FC<TrackGridProps> = ({
  selectedTrack,
  onSelectTrack,
  selectedDifficulty,
  onSelectDifficulty,
  suggestedDifficulty,
  suggestedExperienceYears,
  isDifficultyOverridden
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text">Choose Evaluation Track</label>
        {/* Difficulty Pill Switcher */}
        <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => onSelectDifficulty(diff)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                selectedDifficulty === diff
                  ? 'bg-primary text-on-accent shadow-xs'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {suggestedDifficulty && (
        <div className="flex items-center justify-between text-[11px] px-0.5">
          <span className="text-primary font-medium">
            {!isDifficultyOverridden
              ? `Suggested ${suggestedDifficulty} — inferred from ${suggestedExperienceYears ?? 4} yrs experience. Override anytime.`
              : `Manual override: ${selectedDifficulty} (Resume suggested ${suggestedDifficulty} from ${suggestedExperienceYears ?? 4} yrs experience).`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TRACK_OPTIONS.map((item) => {
          const isSelected = selectedTrack === item.track;
          return (
            <div
              key={item.track}
              onClick={() => onSelectTrack(item.track)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                  : 'bg-surface border-border hover:border-border-2 hover:bg-elevated/40'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-primary text-on-accent' : 'bg-elevated text-primary'
                  }`}>
                    {item.icon}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.track === 'FULL_LOOP' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase">
                        Recommended · 45–60 min
                      </span>
                    )}
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-text">{item.title}</h4>
                  <p className="text-[11px] text-text-3 leading-relaxed mt-0.5">{item.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-elevated/70 border border-border text-xs">
        <span className="text-text-3 text-[11px] font-medium">Plan preview:</span>
        <span className="font-semibold text-text text-[11px] font-mono">{getPlanPresetPreview(selectedTrack, selectedDifficulty)}</span>
      </div>
    </div>
  );
};
