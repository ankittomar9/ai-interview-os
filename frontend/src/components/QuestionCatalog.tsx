import React, { useState, useEffect, useMemo } from 'react';
import { listQuestions } from '../services/api';
import type { GenerateQuestionResponse } from '../types';
import { usePlaygroundProgress } from '../hooks/usePlaygroundProgress';
import {
  Search,
  CheckCircle2,
  Eye,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Layers,
  Code2,
  Database,
  Binary,
  Users2,
  X,
  Play
} from 'lucide-react';
import { Chip } from './ui/Chip';

interface Props {
  onSelectQuestions: (questions: GenerateQuestionResponse[]) => void;
  onClose: () => void;
}

const TRACK_ICONS: Record<string, React.ReactNode> = {
  ALGORITHMS_DATA_STRUCTURES: <Binary className="w-4 h-4" />,
  SQL: <Database className="w-4 h-4" />,
  SPRING_LLD: <Code2 className="w-4 h-4" />,
  SYSTEM_DESIGN: <Layers className="w-4 h-4" />,
  BEHAVIORAL_STAR: <Users2 className="w-4 h-4" />,
  RESUME_BASED: <Sparkles className="w-4 h-4" />
};

export const QuestionCatalog: React.FC<Props> = ({ onSelectQuestions, onClose }) => {
  const [questions, setQuestions] = useState<GenerateQuestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());

  const { allProgress } = usePlaygroundProgress();

  useEffect(() => {
    listQuestions({})
      .then((data) => {
        setQuestions(data || []);
      })
      .catch((err) => {
        console.error('Failed to load question catalog:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchTrack = selectedTrack === 'ALL' || q.track === selectedTrack;
      const matchDifficulty = selectedDifficulty === 'ALL' || q.difficulty === selectedDifficulty;
      const matchSearch =
        !searchQuery.trim() ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.problemSlug || q.slug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((q.tags as string[]) || []).some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchTrack && matchDifficulty && matchSearch;
    });
  }, [questions, selectedTrack, selectedDifficulty, searchQuery]);

  const toggleSelect = (slug: string) => {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const handlePracticeSelected = () => {
    const matched = questions.filter((q) => selectedSlugs.has(q.problemSlug || q.slug || ''));
    if (matched.length > 0) {
      onSelectQuestions(matched);
    }
  };

  const handlePracticeRandom = () => {
    if (filteredQuestions.length === 0) return;
    const untouched = filteredQuestions.filter((q) => {
      const prog = allProgress[q.problemSlug || q.slug || ''];
      return !prog || prog.status === 'untouched';
    });
    const pool = untouched.length > 0 ? untouched : filteredQuestions;
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    onSelectQuestions([randomPick]);
  };

  const handlePracticeAll = () => {
    if (filteredQuestions.length > 0) {
      onSelectQuestions(filteredQuestions.slice(0, 5));
    }
  };

  const handleDirectPracticeSingle = (q: GenerateQuestionResponse) => {
    onSelectQuestions([q]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8 select-text">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Playground · Question Catalog
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse, filter, and practice curated challenges with full solution & hint reveals.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close catalog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, tag, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="h-10 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Assessment Tracks</option>
              <option value="ALGORITHMS_DATA_STRUCTURES">Algorithms & Data Structures</option>
              <option value="SQL">SQL & Database Eng</option>
              <option value="SPRING_LLD">Spring Boot LLD</option>
              <option value="SYSTEM_DESIGN">High-Level System Design</option>
              <option value="BEHAVIORAL_STAR">Behavioral & Leadership</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="h-10 px-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="ALL">All Difficulties</option>
              <option value="JUNIOR">Junior (0-2 YOE)</option>
              <option value="MID">Mid-Level (3-5 YOE)</option>
              <option value="SENIOR">Senior (5-8 YOE)</option>
              <option value="STAFF">Staff / Lead (8+ YOE)</option>
            </select>
          </div>
        </div>

        {/* Question Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 dark:bg-slate-950/50">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading Question Bank catalog...
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No questions found matching the selected filters.
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const slug = q.problemSlug || q.slug || '';
              const progress = allProgress[slug] || { status: 'untouched', attempts: 0, solutionViewed: false };
              const isChecked = selectedSlugs.has(slug);

              return (
                <div
                  key={slug}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 bg-white dark:bg-slate-900 ${
                    isChecked
                      ? 'border-indigo-600 ring-2 ring-indigo-500/10 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(slug)}
                      className="w-4 h-4 rounded mt-1 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-slate-500 dark:text-slate-400">
                          {TRACK_ICONS[q.track] || <Binary className="w-4 h-4" />}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {q.title}
                        </h4>
                        <Chip variant="neutral" size="sm">
                          {q.difficulty}
                        </Chip>
                        {progress.status === 'solved' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Solved
                          </span>
                        )}
                        {progress.status === 'assisted' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                            <Eye className="w-3 h-3" /> Assisted
                          </span>
                        )}
                        {progress.status === 'attempted' && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            <HelpCircle className="w-3 h-3" /> Attempted
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {((q.tags as string[]) || []).map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                        {progress.bestTimeMs !== undefined && (
                          <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                            Best: {progress.bestTimeMs.toFixed(0)}ms
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDirectPracticeSingle(q)}
                    className="px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <span>Practice</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {selectedSlugs.size > 0 ? (
              <span className="font-bold text-indigo-600">{selectedSlugs.size} questions selected</span>
            ) : (
              <span>Showing {filteredQuestions.length} challenges</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePracticeRandom}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Practice Random
            </button>
            <button
              type="button"
              onClick={handlePracticeAll}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              Practice All Filtered
            </button>
            <button
              type="button"
              disabled={selectedSlugs.size === 0}
              onClick={handlePracticeSelected}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Practice Selected ({selectedSlugs.size})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
