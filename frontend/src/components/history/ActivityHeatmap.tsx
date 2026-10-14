import React, { useMemo } from 'react';
import {
  buildCalendarGrid,
  monthLabels
} from '../../lib/history/calendarGrid';

interface ActivityHeatmapProps {
  solvedByDay: Record<string, number>;
  fromDay: string;
  toDay: string;
  selectedDay?: string;
  onSelectDay: (day: string) => void;
  todayStr?: string;
}

const LEVEL_CLASSES: Record<number, string> = {
  0: 'bg-surface/60 border border-border/40 hover:border-border',
  1: 'bg-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50',
  2: 'bg-emerald-500/50 border border-emerald-500/50 hover:border-emerald-500/70',
  3: 'bg-emerald-500/75 border border-emerald-500/70 hover:border-emerald-500/90',
  4: 'bg-emerald-500 border border-emerald-400 hover:brightness-110',
};

const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  solvedByDay,
  fromDay,
  toDay,
  selectedDay,
  onSelectDay,
  todayStr,
}) => {
  const cells = useMemo(
    () => buildCalendarGrid(solvedByDay, fromDay, toDay, todayStr),
    [solvedByDay, fromDay, toDay, todayStr]
  );

  const months = useMemo(() => monthLabels(cells), [cells]);
  const numCols = Math.ceil(cells.length / 7);

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text uppercase tracking-wider flex items-center gap-2">
          <span>Activity Calendar</span>
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-3">
          <span>Less</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-surface/60 border border-border/40" />
            <span className="w-3 h-3 rounded-sm bg-emerald-500/25 border border-emerald-500/30" />
            <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-500/50" />
            <span className="w-3 h-3 rounded-sm bg-emerald-500/75 border border-emerald-500/70" />
            <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="inline-block min-w-full">
          {/* Month labels row */}
          <div
            className="grid text-[10px] text-text-3 mb-1"
            style={{
              gridTemplateColumns: `28px repeat(${numCols}, minmax(13px, 1fr))`,
              gap: '3px',
            }}
          >
            <div />
            {Array.from({ length: numCols }).map((_, colIdx) => {
              const labelItem = months.find((m) => m.colIndex === colIdx);
              return (
                <div key={colIdx} className="h-4 truncate select-none">
                  {labelItem ? labelItem.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid: 7 rows of weekday cells */}
          <div className="flex gap-[3px]">
            {/* Weekday hints column */}
            <div className="grid grid-rows-7 gap-[3px] text-[10px] text-text-3 pr-1 select-none">
              {WEEKDAY_LABELS.map((w, idx) => (
                <div key={idx} className="h-[13px] flex items-center">
                  {w}
                </div>
              ))}
            </div>

            {/* Weeks columns */}
            <div
              className="grid grid-rows-7 grid-flow-col gap-[3px]"
              style={{
                gridTemplateColumns: `repeat(${numCols}, minmax(13px, 1fr))`,
              }}
            >
              {cells.map((cell, idx) => {
                if (cell.isPadding) {
                  return (
                    <div
                      key={`pad-${idx}`}
                      className="w-[13px] h-[13px] rounded-sm opacity-0 pointer-events-none"
                    />
                  );
                }

                const isToday = cell.day === todayStr;
                const isSelected = cell.day === selectedDay;
                const levelClass = LEVEL_CLASSES[cell.level] || LEVEL_CLASSES[0];

                return (
                  <button
                    key={cell.day}
                    type="button"
                    disabled={cell.disabled}
                    onClick={() => onSelectDay(cell.day)}
                    title={`${cell.count} solved — ${cell.day}`}
                    aria-label={`${cell.count} questions solved on ${cell.day}`}
                    className={`
                      w-[13px] h-[13px] rounded-sm transition-all
                      ${levelClass}
                      ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface' : ''}
                      ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-1 ring-offset-surface z-10 scale-110' : ''}
                      ${cell.disabled ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:scale-125 hover:z-20'}
                    `}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
