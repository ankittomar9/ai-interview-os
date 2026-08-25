import React from 'react';
import { Shuffle, ListFilter } from 'lucide-react';

export type QuestionStatus = 'PASSED' | 'ATTEMPTED' | 'UNTOUCHED';

export interface QuestionRailItem {
  slug: string;
  title: string;
  difficulty?: string;
  status: QuestionStatus;
}

interface QuestionRailProps {
  items: QuestionRailItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onShuffle?: () => void;
  className?: string;
}

export const QuestionRail: React.FC<QuestionRailProps> = ({
  items,
  selectedIndex,
  onSelect,
  onShuffle,
  className = ''
}) => {
  const getStatusDotColor = (status: QuestionStatus) => {
    switch (status) {
      case 'PASSED':
        return 'bg-success';
      case 'ATTEMPTED':
        return 'bg-warning';
      case 'UNTOUCHED':
      default:
        return 'bg-text-3/40';
    }
  };

  return (
    <div
      className={`w-12 bg-elevated border-r border-border flex flex-col items-center py-2.5 justify-between shrink-0 select-none z-10 ${className}`}
    >
      {/* Top Question List */}
      <div className="flex flex-col items-center gap-1.5 w-full overflow-y-auto px-1">
        {/* All Pill */}
        <button
          type="button"
          title="All Questions"
          className="w-full py-1 text-[10px] font-bold text-text-3 hover:text-text rounded transition-colors text-center"
        >
          All
        </button>

        {/* Q1..Qn buttons */}
        {items.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.slug || idx}
              type="button"
              onClick={() => onSelect(idx)}
              title={`${idx + 1}. ${item.title} (${item.status})`}
              className={`relative w-9 h-8 rounded flex items-center justify-center text-xs font-mono font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-surface text-text border border-primary shadow-xs'
                  : 'text-text-3 hover:text-text hover:bg-surface/60 border border-transparent'
              }`}
            >
              <span>Q{idx + 1}</span>

              {/* Status Dot */}
              <span
                className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-surface ${getStatusDotColor(
                  item.status
                )}`}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom Tool Icons */}
      <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-border/50">
        {onShuffle && (
          <button
            type="button"
            onClick={onShuffle}
            title="Random / Next Untouched Question"
            className="w-8 h-8 rounded flex items-center justify-center text-text-3 hover:text-text hover:bg-surface transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          title="Question List View"
          className="w-8 h-8 rounded flex items-center justify-center text-text-3 hover:text-text hover:bg-surface transition-colors cursor-pointer"
        >
          <ListFilter className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
