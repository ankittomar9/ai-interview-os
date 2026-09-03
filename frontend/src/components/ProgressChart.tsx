import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Award } from 'lucide-react';
import { Chip } from './ui/Chip';

interface ProgressLedgerEntry {
  id: number;
  candidateId: string;
  track: string;
  sessionId: number;
  sessionDate: string;
  rubricSchema: string;
  overallScore: number;
  algorithmicReasoningScore?: number;
  codeQualityScore?: number;
  executionEfficiencyScore?: number;
  communicationScore?: number;
  professionalismScore?: number;
}

interface ProgressAnalytics {
  scoreDelta: number;
  recentAverageScore: number;
  weakDimensions: string[];
  totalSessions: number;
}

interface ProgressChartProps {
  candidateId: string;
  track?: string;
  className?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  candidateId,
  track = 'ALGORITHMS_DATA_STRUCTURES',
  className = ''
}) => {
  const [history, setHistory] = useState<ProgressLedgerEntry[]>([]);
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      try {
        setLoading(true);
        const [progRes, analRes] = await Promise.all([
          fetch(`/api/v1/reports/candidate/${encodeURIComponent(candidateId)}/progress?track=${encodeURIComponent(track)}`),
          fetch(`/api/v1/reports/candidate/${encodeURIComponent(candidateId)}/analytics?track=${encodeURIComponent(track)}`)
        ]);

        if (progRes.ok && isMounted) {
          const data = await progRes.json();
          setHistory(Array.isArray(data) ? data : []);
        }
        if (analRes.ok && isMounted) {
          const data = await analRes.json();
          setAnalytics(data);
        }
      } catch {
        // graceful offline fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (candidateId) {
      loadProgress();
    }
    return () => { isMounted = false; };
  }, [candidateId, track]);

  if (loading) {
    return (
      <div className={`p-4 rounded-lg bg-surface border border-border text-xs text-text-3 ${className}`}>
        Loading historical trajectory data...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`p-4 rounded-lg bg-surface border border-border text-xs text-text-3 text-center ${className}`}>
        No previous practice attempts recorded yet for this track. Complete more sessions to unlock trajectory analytics.
      </div>
    );
  }

  return (
    <div className={`p-5 rounded-lg bg-surface border border-border space-y-4 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-text">Progress &amp; Trajectory Ledger</h3>
        </div>
        {analytics && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-3">Recent Avg:</span>
            <Chip variant="primary" size="sm">
              {analytics.recentAverageScore}/100
            </Chip>
            {analytics.scoreDelta !== 0 && (
              <Chip variant={analytics.scoreDelta > 0 ? 'success' : 'danger'} size="sm">
                <span className="flex items-center gap-1">
                  {analytics.scoreDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {analytics.scoreDelta > 0 ? `+${analytics.scoreDelta}` : analytics.scoreDelta} pts
                </span>
              </Chip>
            )}
          </div>
        )}
      </div>

      {/* Trajectory Bar Chart */}
      <div className="space-y-2 pt-2">
        <div className="h-28 flex items-end gap-3 px-2 border-b border-border pb-1">
          {history.map((entry, idx) => {
            const heightPercent = Math.max(8, Math.min(100, entry.overallScore));
            return (
              <div key={entry.id || idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                <div className="text-[10px] font-mono text-text-3 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                  {entry.overallScore}
                </div>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[36px] rounded-t transition-all ${
                    entry.overallScore >= 80
                      ? 'bg-emerald-500 hover:bg-emerald-400'
                      : entry.overallScore >= 60
                      ? 'bg-primary hover:bg-primary/80'
                      : 'bg-amber-500 hover:bg-amber-400'
                  }`}
                />
                <span className="text-[10px] font-mono text-text-3 truncate max-w-[48px]">
                  #{entry.sessionId}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-text-3 font-mono pt-1">
          <span>First Session ({history[0]?.sessionDate})</span>
          <span>Latest Session ({history[history.length - 1]?.sessionDate})</span>
        </div>
      </div>

      {/* Weak Dimensions Alert */}
      {analytics && analytics.weakDimensions.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Focus Areas Detected (&lt;70 across recent sessions):
            </span>
            <p className="text-text-2 mt-0.5">
              {analytics.weakDimensions.join(', ')}. Target these topics in your next practice interview.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
