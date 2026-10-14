import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import type { HistoryDayItem } from '../../services/api';
import { resolveTitles, prettifySlug } from '../../lib/history/titles';
import { listQuestions } from '../../services/api';

interface DayDetailProps {
  day: string;
  items: HistoryDayItem[];
  solvedCount: number;
  attemptCount: number;
  truncated?: boolean;
  onSelectPractice?: (slug: string) => void;
  onNavigateToReport?: (sessionId: number) => void;
}

export const DayDetail: React.FC<DayDetailProps> = ({
  day,
  items,
  solvedCount,
  attemptCount,
  truncated = false,
  onSelectPractice,
  onNavigateToReport,
}) => {
  const [titles, setTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const slugs = items.map((i) => i.questionId).filter(Boolean);

    resolveTitles(slugs, async (batch) => {
      try {
        const questions = await listQuestions({ slugs: batch });
        const map: Record<string, string> = {};
        for (const q of questions) {
          if (q.slug && q.title) {
            map[q.slug] = q.title;
          }
        }
        return map;
      } catch (err) {
        console.warn('[DayDetail] Question catalog title lookup failed, using fallback', err);
        return {};
      }
    }).then((resolved) => {
      if (active) {
        setTitles(resolved);
      }
    });

    return () => {
      active = false;
    };
  }, [items]);

  const formattedDate = React.useMemo(() => {
    if (!day) return '';
    try {
      const [y, m, d] = day.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      return new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    } catch (_) {
      return day;
    }
  }, [day]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
    } catch (_) {
      return '--:--';
    }
  };

  const getVerdictBadge = (verdict: string) => {
    const v = (verdict || '').toUpperCase();
    if (v === 'PASSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          PASSED
        </span>
      );
    }
    if (v === 'FAILED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
          <XCircle className="w-3 h-3" />
          FAILED
        </span>
      );
    }
    if (v === 'PARTIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <AlertCircle className="w-3 h-3" />
          PARTIAL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-surface text-text-3 border border-border">
        {v || 'ATTEMPTED'}
      </span>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-text">{formattedDate || day}</h3>
          <p className="text-xs text-text-3 mt-0.5">Drill-down history ledger</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {solvedCount} solved
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-surface text-text-2 border border-border">
            {attemptCount} attempts
          </span>
          {truncated && (
            <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Truncated (200 cap)
            </span>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-12 text-center text-text-3 text-sm">
          No activity recorded on this day.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const resolvedTitle = titles[item.questionId] || prettifySlug(item.questionId);
            const isInterview = item.source === 'INTERVIEW';
            const isPractice = item.source === 'PRACTICE';

            const handleItemClick = (e: React.MouseEvent) => {
              e.preventDefault();
              if (isInterview && item.link?.sessionId && onNavigateToReport) {
                onNavigateToReport(item.link.sessionId);
              } else if (isPractice && item.link?.slug && onSelectPractice) {
                onSelectPractice(item.link.slug);
              }
            };

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface/50 border border-border/60 hover:border-border transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-text-3 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.at)}
                    </span>
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        isInterview
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {item.source}
                    </span>
                    <span className="text-[11px] font-medium text-text-3 bg-surface px-1.5 py-0.5 rounded border border-border/80">
                      {item.track}
                    </span>
                    {getVerdictBadge(item.verdict)}
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    {item.link ? (
                      <button
                        type="button"
                        onClick={handleItemClick}
                        className="text-sm font-medium text-text hover:text-primary transition-colors text-left flex items-center gap-1.5 group"
                      >
                        <span className="group-hover:underline truncate">{resolvedTitle}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-text-3 group-hover:text-primary shrink-0 opacity-70 group-hover:opacity-100" />
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-text truncate">
                        {resolvedTitle}
                      </span>
                    )}
                  </div>

                  {item.detail && (
                    <div className="text-xs text-text-3 truncate font-mono">
                      {item.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
