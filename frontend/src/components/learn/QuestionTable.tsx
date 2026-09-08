import React, { useMemo, useState } from 'react';
import {
  Search,
  CheckCircle2,
  Play,
  History,
  FileCode2,
  Video,
  ArrowUpDown
} from 'lucide-react';
import type { CatalogQuestionSummary, QuestionProgress } from '../../services/api';
import { Chip } from '../ui/Chip';

interface QuestionTableProps {
  questions: CatalogQuestionSummary[];
  progressMap: Record<string, QuestionProgress>;
  verdictMap?: Record<string, string>;
  loading: boolean;
  selectedTopic: string | null;
  onSolve: (slug: string) => void;
  onOpenDetail: (slug: string) => void;
  onOpenSubmissions: (slug: string, title: string) => void;
}

export const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  progressMap,
  verdictMap,
  loading,
  selectedTopic,
  onSolve,
  onOpenDetail,
  onOpenSubmissions
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SOLVED' | 'UNSOLVED'>('ALL');
  const [sortField, setSortField] = useState<'index' | 'title' | 'difficulty' | 'solved'>('index');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination state for smooth 60fps rendering
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredQuestions = useMemo(() => {
    let list = [...questions];

    // Filter by topic if selected
    if (selectedTopic) {
      list = list.filter((q) => q.topics && q.topics.includes(selectedTopic));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.slug.toLowerCase().includes(q) ||
          (item.topics && item.topics.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Filter by difficulty
    if (difficultyFilter !== 'ALL') {
      list = list.filter((item) => item.difficulty?.toUpperCase() === difficultyFilter);
    }

    // Filter by status (solved/unsolved)
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => {
        const prog = progressMap[item.slug];
        const isSolved = prog && prog.solveCount > 0;
        return statusFilter === 'SOLVED' ? isSolved : !isSolved;
      });
    }

    // Sort
    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'title') {
        valA = a.title;
        valB = b.title;
      } else if (sortField === 'difficulty') {
        const rank: Record<string, number> = { EASY: 1, MEDIUM: 2, HARD: 3 };
        valA = rank[a.difficulty?.toUpperCase()] || 0;
        valB = rank[b.difficulty?.toUpperCase()] || 0;
      } else if (sortField === 'solved') {
        valA = progressMap[a.slug]?.solveCount || 0;
        valB = progressMap[b.slug]?.solveCount || 0;
      } else {
        // default by original order/index
        return sortAsc ? 0 : -1;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [questions, selectedTopic, searchQuery, difficultyFilter, statusFilter, sortField, sortAsc, progressMap]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedTopic, searchQuery, difficultyFilter, statusFilter]);

  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    if (pageSize >= 1000) return filteredQuestions;
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  const getDifficultyBadge = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-success/10 text-success border border-success/20">
            EASY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            MEDIUM
          </span>
        );
      case 'HARD':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-danger/10 text-danger border border-danger/20">
            HARD
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-elevated text-text-3 border border-border">
            {diff || 'EASY'}
          </span>
        );
    }
  };

  const formatLastPracticed = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
          return `${diffMins}m ago`;
        }
        return `${diffHours}h ago`;
      }
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg">
      {/* Controls Bar */}
      <div className="p-4 border-b border-border bg-surface flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-3 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by title, slug, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-elevated border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-text-3 focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Difficulty dropdown */}
          <div className="flex items-center gap-1 bg-elevated p-1 rounded-lg border border-border">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficultyFilter(d)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  difficultyFilter === d
                    ? 'bg-surface text-text shadow-xs'
                    : 'text-text-3 hover:text-text'
                }`}
              >
                {d === 'ALL' ? 'All Diff' : d}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-elevated p-1 rounded-lg border border-border">
            {(['ALL', 'UNSOLVED', 'SOLVED'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-surface text-text shadow-xs'
                    : 'text-text-3 hover:text-text'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s === 'SOLVED' ? 'Solved' : 'Unsolved'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead className="bg-surface border-b border-border sticky top-0 z-10 select-none text-[11px] font-mono text-text-3 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4 hidden md:table-cell">Topics</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-text"
                onClick={() => {
                  setSortField('difficulty');
                  setSortAsc(!sortAsc);
                }}
              >
                <span className="flex items-center gap-1">
                  Difficulty
                  <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-text"
                onClick={() => {
                  setSortField('solved');
                  setSortAsc(!sortAsc);
                }}
              >
                <span className="flex items-center gap-1">
                  Status
                  <ArrowUpDown className="w-3 h-3" />
                </span>
              </th>
              <th className="py-3 px-4 text-center">Attempts</th>
              <th className="py-3 px-4 hidden lg:table-cell">Last Run</th>
              <th className="py-3 px-4 text-right pr-6">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border/60 text-xs">
            {paginatedQuestions.map((q, idx) => {
              const globalIndex = (currentPage - 1) * pageSize + idx + 1;
              const progress = progressMap[q.slug];
              const isSolved = progress && progress.solveCount > 0;
              const attemptCount = progress?.attemptCount || 0;

              return (
                <tr
                  key={q.slug}
                  className="hover:bg-elevated/40 transition-colors group cursor-default"
                >
                  {/* # */}
                  <td className="py-3.5 px-4 text-center font-mono text-text-3 text-[11px]">
                    {globalIndex}
                  </td>

                  {/* Title */}
                  <td className="py-3.5 px-4 font-medium text-text">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(q.slug)}
                        className="text-left font-semibold hover:text-primary transition-colors cursor-pointer group-hover:text-primary truncate max-w-xs sm:max-w-sm md:max-w-md"
                      >
                        {q.title}
                      </button>
                      {q.solutionVideoUrl && (
                        <span title="Includes video walkthrough">
                          <Video className="w-3.5 h-3.5 text-primary shrink-0 opacity-70 group-hover:opacity-100" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Topics Chips */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    <div className="flex items-center gap-1 flex-wrap">
                      {q.topics?.slice(0, 3).map((t) => (
                        <Chip key={t} size="sm" variant="default" className="text-[10px] py-0">
                          {t}
                        </Chip>
                      ))}
                      {q.topics && q.topics.length > 3 && (
                        <span className="text-[10px] text-text-3 font-mono">
                          +{q.topics.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Difficulty */}
                  <td className="py-3.5 px-4 font-mono">
                    {getDifficultyBadge(q.difficulty)}
                  </td>

                  {/* Solved / Verdict Status Pill */}
                  <td className="py-3.5 px-4">
                    {verdictMap && verdictMap[q.slug] ? (
                      (() => {
                        const v = verdictMap[q.slug];
                        if (v === 'PASSED') {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              PASSED {progress && progress.solveCount > 1 ? `×${progress.solveCount}` : ''}
                            </span>
                          );
                        }
                        if (v === 'FAILED') {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              FAILED
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-elevated/40 text-text-3 border border-border">
                            UNATTEMPTED
                          </span>
                        );
                      })()
                    ) : isSolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Solved {progress.solveCount > 1 ? `×${progress.solveCount}` : ''}
                      </span>
                    ) : attemptCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Attempted
                      </span>
                    ) : (
                      <span className="text-text-3 text-[11px] font-mono pl-1">
                        —
                      </span>
                    )}
                  </td>

                  {/* Attempts (Clickable Drawer Trigger) */}
                  <td className="py-3.5 px-4 text-center">
                    {attemptCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => onOpenSubmissions(q.slug, q.title)}
                        className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline cursor-pointer px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                        title="View past submission runs"
                      >
                        <History className="w-3 h-3 text-primary" />
                        <span>{attemptCount}</span>
                      </button>
                    ) : (
                      <span className="text-text-3 font-mono text-[11px]">0</span>
                    )}
                  </td>

                  {/* Last Practiced */}
                  <td className="py-3.5 px-4 hidden lg:table-cell text-text-3 font-mono text-[11px]">
                    {formatLastPracticed(progress?.lastAttemptedAt)}
                  </td>

                  {/* Action [Solve] */}
                  <td className="py-3.5 px-4 text-right pr-6">
                    <button
                      type="button"
                      onClick={() => onSolve(q.slug)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary-2 cursor-pointer shadow-xs transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Solve</span>
                    </button>
                  </td>
                </tr>
              );
            })}

            {paginatedQuestions.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="py-16 text-center text-text-3 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center mx-auto text-text-3">
                    <FileCode2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-text-2">No Problems Found</p>
                  <p className="text-xs">
                    Try clearing your search query or loosening difficulty/status filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Footer Info Bar */}
      <div className="p-3 border-t border-border bg-surface flex items-center justify-between text-xs text-text-3 shrink-0 select-none">
        <div>
          Showing{' '}
          <strong className="text-text">
            {filteredQuestions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </strong>{' '}
          to{' '}
          <strong className="text-text">
            {Math.min(currentPage * pageSize, filteredQuestions.length)}
          </strong>{' '}
          of <strong className="text-text">{filteredQuestions.length}</strong> problems
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded bg-elevated border border-border text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-elevated/80 cursor-pointer font-medium"
          >
            Prev
          </button>
          <span className="font-mono text-[11px]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded bg-elevated border border-border text-text disabled:opacity-40 disabled:cursor-not-allowed hover:bg-elevated/80 cursor-pointer font-medium"
          >
            Next
          </button>

          {/* Page size dropdown */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="ml-2 bg-elevated border border-border rounded px-2 py-1 text-xs text-text focus:outline-none"
          >
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
            <option value={500}>All (364)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
