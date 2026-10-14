import React, { useEffect, useState } from 'react';
import { Flame, Trophy, CheckCircle2, ChevronRight } from 'lucide-react';
import { getHistoryStreak, type HistoryStreakResponse } from '../../services/api';

interface StreakStripProps {
  userId?: string;
  onNavigateToHistory?: () => void;
}

export const StreakStrip: React.FC<StreakStripProps> = ({
  userId = 'local',
  onNavigateToHistory,
}) => {
  const [streak, setStreak] = useState<HistoryStreakResponse | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

    getHistoryStreak({ userId, tz }, controller.signal)
      .then((data) => {
        clearTimeout(timeout);
        setStreak(data);
      })
      .catch((_) => {
        // Failure renders nothing per SPEC-017 §5.2
        clearTimeout(timeout);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [userId]);

  if (!streak) {
    return null;
  }

  return (
    <div
      onClick={onNavigateToHistory}
      role={onNavigateToHistory ? 'button' : undefined}
      tabIndex={onNavigateToHistory ? 0 : undefined}
      className={`
        bg-surface/80 border border-border rounded-xl p-3.5 shadow-sm
        flex flex-wrap items-center justify-between gap-4 transition-colors
        ${onNavigateToHistory ? 'cursor-pointer hover:border-primary/50 group' : ''}
      `}
    >
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded-lg ${
              streak.activeToday
                ? 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30'
                : 'bg-surface text-text-3 border border-border'
            }`}
          >
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">
              Current Streak
            </div>
            <div className="text-sm font-bold text-text flex items-center gap-1.5">
              <span>{streak.currentStreak} days</span>
              {streak.activeToday && (
                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  Active
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-7 w-px bg-border/60 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">
              Longest Run
            </div>
            <div className="text-sm font-bold text-text">{streak.longestStreak} days</div>
          </div>
        </div>

        <div className="h-7 w-px bg-border/60 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-text-3 uppercase tracking-wider">
              Total Solved
            </div>
            <div className="text-sm font-bold text-text">{streak.totalSolved}</div>
          </div>
        </div>
      </div>

      {onNavigateToHistory && (
        <div className="flex items-center gap-1 text-xs font-medium text-text-3 group-hover:text-primary transition-colors">
          <span>View calendar</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
