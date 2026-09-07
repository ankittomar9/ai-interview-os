import React from 'react';
import { Sliders, AlertTriangle } from 'lucide-react';
import type { InterviewTrack, CustomDomainConfig } from '../../types';
import {
  CUSTOM_AVAILABLE_DOMAINS,
  CUSTOM_PRESETS,
  calculateCustomTotal,
  formatCustomPlanPreview
} from '../../lib/plan-presets';

export interface CustomPlanBuilderProps {
  customDomains: CustomDomainConfig[];
  onChangeCustomDomains: (domains: CustomDomainConfig[]) => void;
  persona: 'TECH' | 'NON_TECH';
  disabled?: boolean;
}

export const CustomPlanBuilder: React.FC<CustomPlanBuilderProps> = ({
  customDomains,
  onChangeCustomDomains,
  persona,
  disabled = false
}) => {
  const totalMinutes = calculateCustomTotal(customDomains);
  const isOverLimit = totalMinutes > 120;
  const isNoneSelected = customDomains.length === 0;

  const isDomainSelected = (track: InterviewTrack): boolean => {
    return customDomains.some(d => d.domain === track);
  };

  const getDomainDuration = (track: InterviewTrack): number => {
    const found = customDomains.find(d => d.domain === track);
    return found ? found.durationMinutes : 20;
  };

  const handleToggleDomain = (track: InterviewTrack, defaultMinutes: number) => {
    if (disabled) return;
    if (isDomainSelected(track)) {
      onChangeCustomDomains(customDomains.filter(d => d.domain !== track));
    } else {
      onChangeCustomDomains([...customDomains, { domain: track, durationMinutes: defaultMinutes }]);
    }
  };

  const handleDurationChange = (track: InterviewTrack, newMinutes: number) => {
    if (disabled) return;
    const clamped = Math.max(10, Math.min(60, Math.round(newMinutes / 5) * 5));
    onChangeCustomDomains(
      customDomains.map(d => d.domain === track ? { ...d, durationMinutes: clamped } : d)
    );
  };

  const handleApplyPreset = (presetKey: 'ALL' | 'DSA_HLD' | 'DSA_LLD') => {
    if (disabled) return;
    const preset = CUSTOM_PRESETS[presetKey];
    if (persona === 'NON_TECH') {
      onChangeCustomDomains([{ domain: 'RESUME_BASED', durationMinutes: 30 }]);
    } else {
      onChangeCustomDomains(preset.map(item => ({ ...item })));
    }
  };

  return (
    <div className="p-4 rounded-xl bg-surface border border-primary/30 shadow-xs space-y-4">
      {/* Header and Preset Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-text">Custom Multi-Domain Builder</h4>
            <p className="text-[11px] text-text-3">Select domains and calibrate time budgets (10–60 min each, total &le; 120 min)</p>
          </div>
        </div>

        {persona === 'TECH' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-text-3 mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('ALL')}
              className="px-2 py-1 text-[10px] font-bold rounded-md bg-elevated hover:bg-elevated/80 border border-border text-text transition-colors cursor-pointer"
            >
              All (5 Domains)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('DSA_HLD')}
              className="px-2 py-1 text-[10px] font-bold rounded-md bg-elevated hover:bg-elevated/80 border border-border text-text transition-colors cursor-pointer"
            >
              DSA + HLD
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('DSA_LLD')}
              className="px-2 py-1 text-[10px] font-bold rounded-md bg-elevated hover:bg-elevated/80 border border-border text-text transition-colors cursor-pointer"
            >
              DSA + LLD
            </button>
          </div>
        )}
      </div>

      {/* Domain Selection List */}
      <div className="space-y-2.5">
        {CUSTOM_AVAILABLE_DOMAINS.map((item) => {
          const selected = isDomainSelected(item.domain);
          const duration = getDomainDuration(item.domain);
          const isDomainDisabled = persona === 'NON_TECH' && item.isTechOnly;

          return (
            <div
              key={item.domain}
              className={`p-2.5 rounded-lg border transition-all ${
                isDomainDisabled
                  ? 'opacity-40 bg-surface/40 border-border cursor-not-allowed'
                  : selected
                  ? 'bg-elevated/80 border-primary/40 shadow-xs'
                  : 'bg-surface border-border hover:border-border-2'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* Left: Checkbox + Title */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none min-w-0">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={isDomainDisabled || disabled}
                    onChange={() => handleToggleDomain(item.domain, item.defaultMinutes)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${selected ? 'text-text' : 'text-text-2'}`}>
                        {item.name}
                      </span>
                      {isDomainDisabled && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-elevated text-text-3 border border-border">
                          Tech only
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-3 truncate">{item.subtitle}</p>
                  </div>
                </label>

                {/* Right: Slider & Minutes Chip */}
                {selected && !isDomainDisabled && (
                  <div className="flex items-center gap-3 self-end sm:self-auto pl-6 sm:pl-0">
                    <input
                      type="range"
                      min={10}
                      max={60}
                      step={5}
                      value={duration}
                      disabled={disabled}
                      onChange={(e) => handleDurationChange(item.domain, Number(e.target.value))}
                      className="w-28 sm:w-36 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className="min-w-[56px] text-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/30">
                      {duration} min
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation Banner if > 120 or empty */}
      {isOverLimit && (
        <div className="p-3 rounded-lg bg-danger/10 border border-danger/40 flex items-start gap-2.5 text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold">Total duration exceeds maximum: </span>
            <span>Requested total is {totalMinutes} min, which exceeds the 120-minute ceiling. Please decrease slider durations.</span>
          </div>
        </div>
      )}

      {isNoneSelected && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-500">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="text-xs font-medium">
            Please select at least one domain to construct your custom interview loop.
          </div>
        </div>
      )}

      {/* Footer Status & Live Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-3 font-medium">Plan Preview:</span>
          <span className="text-[11px] font-mono font-semibold text-text">
            {formatCustomPlanPreview(customDomains)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-text-3">Total:</span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
            isOverLimit
              ? 'bg-danger/20 text-danger border border-danger/40'
              : 'bg-elevated text-text border border-border'
          }`}>
            {totalMinutes} / 120 min max
          </span>
        </div>
      </div>
    </div>
  );
};
