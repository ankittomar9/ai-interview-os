import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Flame,
  Trophy,
  CheckCircle2,
  RefreshCw,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ActivityHeatmap } from './ActivityHeatmap';
import { DayDetail } from './DayDetail';
import {
  getHistoryCalendar,
  getHistoryDay,
  type HistoryCalendarResponse,
  type HistoryDayResponse,
} from '../../services/api';

interface HistoryViewProps {
  userId?: string;
  initialDay?: string;
  onBackToSetup: () => void;
  onSelectPractice?: (slug: string) => void;
  onNavigateToReport?: (sessionId: number) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  userId = 'local',
  initialDay,
  onBackToSetup,
  onSelectPractice,
  onNavigateToReport,
}) => {
  const [calendar, setCalendar] = useState<HistoryCalendarResponse | null>(null);
  const [dayData, setDayData] = useState<HistoryDayResponse | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(initialDay || '');
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const dayAbortRef = useRef<AbortController | null>(null);

  const tz = React.useMemo(() => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  }, []);

  const fetchCalendar = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const data = await getHistoryCalendar({ userId, tz }, controller.signal);
      clearTimeout(timeout);
      setCalendar(data);
      if (!selectedDay) {
        setSelectedDay(data.toDay);
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load calendar data');
      }
    } finally {
      setLoading(false);
    }
  }, [userId, tz, selectedDay]);

  const fetchDayDetail = useCallback(
    async (dayToFetch: string) => {
      if (!dayToFetch) return;

      if (dayAbortRef.current) {
        dayAbortRef.current.abort();
      }
      const controller = new AbortController();
      dayAbortRef.current = controller;

      setDayLoading(true);

      const timeout = setTimeout(() => {
        controller.abort();
      }, 8000);

      try {
        const data = await getHistoryDay(
          { userId, tz, day: dayToFetch },
          controller.signal
        );
        clearTimeout(timeout);
        setDayData(data);
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name !== 'AbortError') {
          console.warn('[HistoryView] Failed to fetch day detail', err);
        }
      } finally {
        setDayLoading(false);
      }
    },
    [userId, tz]
  );

  useEffect(() => {
    fetchCalendar();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (dayAbortRef.current) dayAbortRef.current.abort();
    };
  }, [fetchCalendar]);

  useEffect(() => {
    if (selectedDay) {
      fetchDayDetail(selectedDay);
    }
  }, [selectedDay, fetchDayDetail]);

  const handleSelectDay = (day: string) => {
    setSelectedDay(day);
    window.history.pushState(null, '', `/history?day=${encodeURIComponent(day)}`);
  };

  const solvedByDayMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    if (calendar?.days) {
      for (const d of calendar.days) {
        map[d.day] = d.solvedCount;
      }
    }
    return map;
  }, [calendar]);

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBackToSetup}
            className="text-text-3 hover:text-text hover:bg-surface"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <h1 className="text-lg font-bold text-text flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            History & Streak
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {calendar?.streak && (
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 fill-current" />
                {calendar.streak.currentStreak} day streak
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                <Trophy className="w-3.5 h-3.5" />
                Best {calendar.streak.longestStreak}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {calendar.streak.totalSolved} solved
              </span>
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={fetchCalendar}
            disabled={loading}
            className="text-text-3 hover:text-text"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Heatmap Card */}
        {calendar ? (
          <ActivityHeatmap
            solvedByDay={solvedByDayMap}
            fromDay={calendar.fromDay}
            toDay={calendar.toDay}
            selectedDay={selectedDay}
            onSelectDay={handleSelectDay}
            todayStr={calendar.toDay}
          />
        ) : (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-3">
            {loading ? 'Loading activity calendar...' : 'No calendar data available.'}
          </div>
        )}

        {/* Day Detail Card */}
        {dayLoading && !dayData ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-center text-text-3">
            Loading day detail...
          </div>
        ) : (
          <DayDetail
            day={selectedDay || calendar?.toDay || ''}
            items={dayData?.items || []}
            solvedCount={dayData?.solvedCount || 0}
            attemptCount={dayData?.attemptCount || 0}
            truncated={dayData?.truncated || false}
            onSelectPractice={onSelectPractice}
            onNavigateToReport={onNavigateToReport}
          />
        )}
      </main>
    </div>
  );
};
