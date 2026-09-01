import React from 'react';

interface ProblemScratchpadTabProps {
  scratchpadText: string;
  onNotesChange: (text: string) => void;
}

export const ProblemScratchpadTab: React.FC<ProblemScratchpadTabProps> = ({
  scratchpadText,
  onNotesChange
}) => {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-bold text-text">Personal Problem Scratchpad</h4>
        <p className="text-xs text-text-3">Notes are auto-saved to localStorage for this challenge.</p>
      </div>
      <textarea
        value={scratchpadText}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Jot down time complexity equations, edge cases, invariants, or pseudocode notes..."
        rows={14}
        className="w-full bg-elevated border border-border rounded-xl p-4 text-xs font-mono text-text placeholder:text-text-3 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y leading-relaxed"
      />
    </div>
  );
};
