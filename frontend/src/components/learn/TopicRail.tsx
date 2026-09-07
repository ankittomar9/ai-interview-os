import React, { useState } from 'react';
import { Layers, Search, ChevronRight, Hash } from 'lucide-react';
import type { CatalogTopicSummary } from '../../services/api';

interface TopicRailProps {
  topics: CatalogTopicSummary[];
  selectedTopic: string | null;
  onSelectTopic: (topic: string | null) => void;
  totalQuestions: number;
  totalSolved: number;
}

export const TopicRail: React.FC<TopicRailProps> = ({
  topics,
  selectedTopic,
  onSelectTopic,
  totalQuestions,
  totalSolved
}) => {
  const [search, setSearch] = useState('');

  const filteredTopics = topics.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.topic.toLowerCase().includes(q) ||
      (t.displayName && t.displayName.toLowerCase().includes(q))
    );
  });

  return (
    <aside className="w-64 sm:w-72 bg-surface border-r border-border flex flex-col h-full shrink-0 select-none">
      {/* Rail Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text">
              Topic Modules
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-3">
            {topics.length} topics
          </span>
        </div>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-text-3 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-elevated/60 border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* "All Topics" Top Item */}
        <button
          type="button"
          onClick={() => onSelectTopic(null)}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
            selectedTopic === null
              ? 'bg-primary text-on-accent font-bold shadow-sm'
              : 'text-text-2 hover:text-text hover:bg-elevated'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Hash className={`w-4 h-4 shrink-0 ${selectedTopic === null ? 'text-on-accent' : 'text-text-3'}`} />
            <span className="text-xs font-semibold truncate">All Topics</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
            <span className={selectedTopic === null ? 'text-on-accent/90' : 'text-text-3'}>
              {totalQuestions}
            </span>
            {totalSolved > 0 && (
              <span
                className={`flex items-center gap-0.5 text-[11px] ${
                  selectedTopic === null ? 'text-on-accent' : 'text-success font-semibold'
                }`}
              >
                · {totalSolved} ✓
              </span>
            )}
          </div>
        </button>

        <div className="h-px bg-border/60 my-1 mx-2" />

        {/* Filtered Topic Items */}
        {filteredTopics.map((item) => {
          const isSelected = selectedTopic === item.topic;
          const hasSolved = item.solved > 0;
          const isFullySolved = item.total > 0 && item.solved >= item.total;

          return (
            <button
              key={item.topic}
              type="button"
              onClick={() => onSelectTopic(item.topic)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                isSelected
                  ? 'bg-primary text-on-accent font-bold shadow-sm'
                  : 'text-text-2 hover:text-text hover:bg-elevated'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isFullySolved
                      ? isSelected
                        ? 'bg-on-accent'
                        : 'bg-success'
                      : hasSolved
                      ? isSelected
                        ? 'bg-on-accent/80'
                        : 'bg-primary'
                      : 'bg-border'
                  }`}
                />
                <span className="text-xs truncate">
                  {item.displayName || item.topic.replace(/-/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono">
                <span className={isSelected ? 'text-on-accent/80' : 'text-text-3'}>
                  {item.total}
                </span>
                {hasSolved && (
                  <span
                    className={`flex items-center gap-0.5 text-[11px] ${
                      isSelected
                        ? 'text-on-accent'
                        : isFullySolved
                        ? 'text-success font-bold'
                        : 'text-success font-semibold'
                    }`}
                  >
                    · {item.solved} ✓
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isSelected
                      ? 'text-on-accent translate-x-0.5'
                      : 'text-text-3 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </div>
            </button>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="py-8 text-center text-xs text-text-3">
            No topics match "{search}"
          </div>
        )}
      </div>
    </aside>
  );
};
