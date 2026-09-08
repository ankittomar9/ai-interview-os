import React, { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  AlertTriangle,
  Zap,
  Code2,
  Radio
} from 'lucide-react';
import { getDashboardStats } from '../../services/api';
import {
  dashboardPollReducer,
  createInitialDashboardState,
  formatRate
} from '../../lib/dashboardAntiFreeze';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Button } from '../ui/Button';

interface DashboardViewProps {
  userId?: string;
  onBackToSetup: () => void;
  onNavigateToLearn?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userId = 'local',
  onBackToSetup,
  onNavigateToLearn
}) => {
  const [state, dispatch] = useReducer(dashboardPollReducer, createInitialDashboardState());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const sequenceRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async () => {
    // Cancel any previous in-flight request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const nextSeq = ++sequenceRef.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    dispatch({ type: 'POLL_START', sequenceId: nextSeq });

    const timeout = setTimeout(() => {
      controller.abort();
    }, 8000);

    try {
      const stats = await getDashboardStats(userId, controller.signal);
      clearTimeout(timeout);
      dispatch({
        type: 'POLL_SUCCESS',
        sequenceId: nextSeq,
        data: stats,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (err: any) {
      clearTimeout(timeout);
      if (err?.name === 'AbortError') {
        // Aborted turns or timeouts: mark failure without freezing
        dispatch({
          type: 'POLL_FAILURE',
          sequenceId: nextSeq,
          error: 'Poll timed out or cancelled',
          timestamp: new Date().toLocaleTimeString()
        });
      } else {
        dispatch({
          type: 'POLL_FAILURE',
          sequenceId: nextSeq,
          error: err?.message || 'Network error fetching stats',
          timestamp: new Date().toLocaleTimeString()
        });
      }
    }
  }, [userId]);

  useEffect(() => {
    void fetchStats();

    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void fetchStats();
    }, 10000);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats, autoRefresh]);

  const { data, isChecking, isStale, lastSuccessfulPollTime, errorMessage } = state;

  return (
    <div className="min-h-screen bg-bg text-text p-4 sm:p-6 lg:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl flex flex-col space-y-6 animate-fade-in">
        
        {/* TOP NAVIGATION & CONTROLS HEADER */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToSetup}
              className="p-2 rounded-xl bg-elevated hover:bg-elevated/80 text-text-2 hover:text-text border border-border transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Setup"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-text flex items-center gap-2">
                  Performance &amp; Mastery Dashboard
                  <span className="text-xs px-2 py-0.5 rounded-full bg-elevated border border-border text-text-3 font-mono">
                    {userId}
                  </span>
                </h1>
                <p className="text-xs text-text-3">Real-time aggregate telemetry across practice &amp; interview modes</p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 self-end sm:self-auto">
            {/* Status Pill / Freshness Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border bg-elevated border-border">
              {isChecking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="text-primary font-mono text-[11px]">Syncing…</span>
                </>
              ) : isStale ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                  <span className="text-warning font-mono text-[11px]">Stale ({lastSuccessfulPollTime || 'Offline'})</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-success font-mono text-[11px]">Live {lastSuccessfulPollTime ? `@ ${lastSuccessfulPollTime}` : ''}</span>
                </>
              )}
            </div>

            {/* Auto-Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-elevated text-text-3 border-border hover:text-text'
              }`}
              title="Toggle 10s auto-refresh"
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
              <span>Auto (10s)</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              onClick={() => void fetchStats()}
              disabled={isChecking}
              className="p-1.5 rounded-lg bg-elevated hover:bg-elevated/80 text-text border border-border transition-colors disabled:opacity-50"
              title="Refresh statistics"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-primary' : ''}`} />
            </button>

            {onNavigateToLearn && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onNavigateToLearn}
                className="text-xs flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Practice Center</span>
              </Button>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* ERROR NOTICE IF STALE */}
        {errorMessage && isStale && (
          <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Network update delayed: {errorMessage}. Preserving last verified metrics.</span>
            </div>
            <button
              onClick={() => void fetchStats()}
              className="underline hover:no-underline font-semibold ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* TOP 4 KEY AGGREGATE CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Solved */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">Total Conquered</span>
              <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/30 flex items-center justify-center text-success">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-text">
                {data?.overall.totalSolved ?? 0}
              </div>
              <p className="text-xs text-text-3 mt-1">
                {data?.practice.questionsSolved ?? 0} practice + {data?.interview.passedQuestions ?? 0} interview passes
              </p>
            </div>
          </div>

          {/* Card 2: Practice Accuracy */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">Practice Accuracy</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-text">
                {formatRate(data?.practice.successRate ?? 0)}
              </div>
              <p className="text-xs text-text-3 mt-1">
                {data?.practice.passedAttempts ?? 0} passed / {data?.practice.totalAttempts ?? 0} test attempts
              </p>
            </div>
          </div>

          {/* Card 3: Interview Success */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">Interview Pass Rate</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-extrabold text-text">
                {formatRate(data?.interview.successRate ?? 0)}
              </div>
              <p className="text-xs text-text-3 mt-1">
                {data?.interview.passedQuestions ?? 0} passed / {data?.interview.attemptedQuestions ?? 0} attempted questions
              </p>
            </div>
          </div>

          {/* Card 4: Pressure Gap */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-3 uppercase tracking-wider">Pressure Gap</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-base font-bold text-text truncate">
                {data?.overall.pressureGap || 'Practice ×0 · Interview 0/0'}
              </div>
              <p className="text-xs text-text-3 mt-1">
                Across {data?.interview.totalSessions ?? 0} simulated interviews
              </p>
            </div>
          </div>
        </div>

        {/* 2-COLUMN DETAIL LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT 5 COLS: PROGRESS BREAKDOWNS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* PRACTICE AGGREGATE CARD */}
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-text">Practice Center Progress</h2>
                </div>
                <span className="text-xs font-mono text-text-3">
                  {data?.practice.questionsSolved ?? 0} / {data?.practice.questionsAttempted ?? 0} solved
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Total Solved Questions:</span>
                  <span className="font-semibold text-text">{data?.practice.questionsSolved ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Total Distinct Attempted:</span>
                  <span className="font-semibold text-text">{data?.practice.questionsAttempted ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Total Code Submissions:</span>
                  <span className="font-semibold text-text">{data?.practice.totalAttempts ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Pass / Fail Ratio:</span>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-success font-bold">{data?.practice.passedAttempts ?? 0} ✓</span>
                    <span className="text-text-3">/</span>
                    <span className="text-danger font-bold">{data?.practice.failedAttempts ?? 0} ✕</span>
                  </div>
                </div>

                {/* Track Breakdown */}
                {data?.practice.trackBreakdown && Object.keys(data.practice.trackBreakdown).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <span className="text-[11px] font-bold text-text-3 uppercase tracking-wider">Submissions by Track</span>
                    <div className="space-y-2">
                      {Object.entries(data.practice.trackBreakdown).map(([trackName, count]) => (
                        <div key={trackName} className="flex items-center justify-between text-xs">
                          <span className="text-text-2 truncate max-w-[200px]">{trackName}</span>
                          <span className="font-mono text-text-3 bg-elevated px-2 py-0.5 rounded border border-border">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* INTERVIEW AGGREGATE CARD */}
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-bold text-text">Interview Performance</h2>
                </div>
                <span className="text-xs font-mono text-text-3">
                  {data?.interview.totalSessions ?? 0} sessions
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Completed Sessions:</span>
                  <span className="font-semibold text-text">{data?.interview.completedSessions ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Interview Questions Encountered:</span>
                  <span className="font-semibold text-text">{data?.interview.totalQuestions ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Passed Under Pressure:</span>
                  <span className="font-semibold text-success">{data?.interview.passedQuestions ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Failed Under Pressure:</span>
                  <span className="font-semibold text-danger">{data?.interview.failedQuestions ?? 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-2">Unattempted:</span>
                  <span className="font-semibold text-text-3">{data?.interview.unattemptedQuestions ?? 0}</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 7 COLS: RECENT ACTIVITY LEDGER */}
          <div className="lg:col-span-7">
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-text">Recent Activity Ledger</h2>
                </div>
                <span className="text-xs text-text-3 font-mono">
                  {data?.recentActivity?.length ?? 0} events recorded
                </span>
              </div>

              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-3">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-xs">No activity records found yet.</p>
                  <p className="text-[11px] text-text-3 mt-1">Solve problems in the Practice Center or complete an interview to build your ledger.</p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[500px] space-y-2.5 pr-1">
                  {data.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-elevated/60 border border-border hover:border-primary/40 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Source Chip */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 ${
                          item.source === 'INTERVIEW'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-primary/10 text-primary border border-primary/30'
                        }`}>
                          {item.source}
                        </span>

                        {/* Question & Details */}
                        <div className="min-w-0">
                          <div className="font-semibold text-text truncate">
                            {item.questionSlug}
                          </div>
                          <div className="text-[11px] text-text-3 truncate">
                            {item.details}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Verdict Pill */}
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1 ${
                          item.verdict === 'PASSED'
                            ? 'bg-success/15 text-success border border-success/30'
                            : item.verdict === 'FAILED'
                            ? 'bg-danger/15 text-danger border border-danger/30'
                            : 'bg-elevated text-text-3 border border-border'
                        }`}>
                          {item.verdict === 'PASSED' ? '✓ PASS' : item.verdict === 'FAILED' ? '✕ FAIL' : '— UNATTEMPTED'}
                        </span>

                        {/* Timestamp */}
                        <span className="text-[10px] text-text-3 font-mono hidden sm:inline-block">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
