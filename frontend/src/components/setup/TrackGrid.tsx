import React from 'react';
import { Binary, Database, Code2, Layers, Users2, CheckCircle2, Sparkles } from 'lucide-react';
import type { DifficultyLevel, InterviewTrack, CustomDomainConfig } from '../../types';
import { getPlanPresetPreview, formatCustomPlanPreview } from '../../lib/plan-presets';
import { CustomPlanBuilder } from './CustomPlanBuilder';

export interface TrackOption {
  track: InterviewTrack;
  title: string;
  description: string;
  icon: React.ReactNode;
  isTechOnly: boolean;
}

export const TRACK_OPTIONS: TrackOption[] = [
  {
    track: 'ALGORITHMS_DATA_STRUCTURES',
    title: 'DSA',
    description: 'Algorithms + sandbox coding',
    icon: <Binary className="w-4 h-4" />,
    isTechOnly: true
  },
  {
    track: 'SPRING_LLD',
    title: 'LLD',
    description: 'Object-oriented low-level design',
    icon: <Code2 className="w-4 h-4" />,
    isTechOnly: true
  },
  {
    track: 'SYSTEM_DESIGN',
    title: 'HLD',
    description: 'System architecture & scalability',
    icon: <Layers className="w-4 h-4" />,
    isTechOnly: true
  },
  {
    track: 'SQL',
    title: 'SQL',
    description: 'Window functions, joins, live PostgreSQL sandbox',
    icon: <Database className="w-4 h-4" />,
    isTechOnly: true
  },
  {
    track: 'RESUME_BASED',
    title: 'Others',
    description: 'Resume-grounded AI-led interview (tech or non-tech; AI is the judge)',
    icon: <Users2 className="w-4 h-4" />,
    isTechOnly: false
  },
  {
    track: 'CUSTOM',
    title: 'Custom',
    description: 'Checkbox multi-select of domains + per-domain minutes slider (10–60m)',
    icon: <Sparkles className="w-4 h-4" />,
    isTechOnly: false
  }
];

const DIFFICULTIES: DifficultyLevel[] = ['JUNIOR', 'MID', 'SENIOR', 'STAFF'];

export interface TrackGridProps {
  selectedTrack: InterviewTrack;
  onSelectTrack: (track: InterviewTrack) => void;
  selectedDifficulty: DifficultyLevel;
  onSelectDifficulty: (difficulty: DifficultyLevel) => void;
  suggestedDifficulty?: DifficultyLevel | null;
  suggestedExperienceYears?: number | null;
  isDifficultyOverridden?: boolean;
  persona: 'TECH' | 'NON_TECH';
  onChangePersona: (persona: 'TECH' | 'NON_TECH') => void;
  customDomains: CustomDomainConfig[];
  onChangeCustomDomains: (domains: CustomDomainConfig[]) => void;
}

export const TrackGrid: React.FC<TrackGridProps> = ({
  selectedTrack,
  onSelectTrack,
  selectedDifficulty,
  onSelectDifficulty,
  suggestedDifficulty,
  suggestedExperienceYears,
  isDifficultyOverridden,
  persona,
  onChangePersona,
  customDomains,
  onChangeCustomDomains
}) => {
  const visibleOptions = persona === 'NON_TECH'
    ? TRACK_OPTIONS.filter((item) => !item.isTechOnly)
    : TRACK_OPTIONS;

  return (
    <div className="space-y-4">
      {/* Top Header: Track Label, Persona Toggle, Difficulty Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="text-xs font-semibold text-text">Choose Evaluation Track</label>

          {/* Persona Toggle */}
          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => onChangePersona('TECH')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                persona === 'TECH'
                  ? 'bg-primary text-on-accent shadow-xs'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              Tech
            </button>
            <button
              type="button"
              onClick={() => onChangePersona('NON_TECH')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                persona === 'NON_TECH'
                  ? 'bg-primary text-on-accent shadow-xs'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              Non-tech
            </button>
          </div>
        </div>

        {/* Difficulty Pill Switcher */}
        <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border self-start sm:self-auto">
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

      {/* Grid of 6 Cards (or 2 Cards if Non-tech) */}
      <div className={`grid gap-3 ${persona === 'NON_TECH' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
        {visibleOptions.map((item) => {
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
                    {item.track === 'ALGORITHMS_DATA_STRUCTURES' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase">
                        Popular
                      </span>
                    )}
                    {item.track === 'CUSTOM' && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/20 text-primary border border-primary/30 uppercase">
                        Builder
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

      {/* Custom Plan Builder Component (renders when Custom is selected) */}
      {selectedTrack === 'CUSTOM' && (
        <CustomPlanBuilder
          customDomains={customDomains}
          onChangeCustomDomains={onChangeCustomDomains}
          persona={persona}
        />
      )}

      {/* Live Plan Preview Line */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-elevated/70 border border-border text-xs">
        <span className="text-text-3 text-[11px] font-medium">Plan preview:</span>
        <span className="font-semibold text-text text-[11px] font-mono">
          {selectedTrack === 'CUSTOM'
            ? formatCustomPlanPreview(customDomains)
            : getPlanPresetPreview(selectedTrack, selectedDifficulty)}
        </span>
      </div>
    </div>
  );
};
