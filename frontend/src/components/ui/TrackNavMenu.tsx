import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  Layers,
  Binary,
  Database,
  Code2,
  Users2,
  Sparkles,
  Lock,
  CheckCircle2,
  CircleDot,
  Circle
} from 'lucide-react';
import { usePlaygroundProgress } from '../../hooks/usePlaygroundProgress';
import type { GenerateQuestionResponse } from '../../types';

interface TrackNavMenuProps {
  isPlayground: boolean;
  activeTrack: string;
  onSelectTrack: (trackKey: string) => void;
  catalogQuestions?: GenerateQuestionResponse[];
}

interface TrackItem {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
}

const TRACKS: TrackItem[] = [
  {
    key: 'ALL',
    label: 'All Practice Tracks',
    shortLabel: 'All Tracks',
    description: 'Browse complete multi-track problem bank',
    icon: <Layers className="w-4 h-4 text-primary" />
  },
  {
    key: 'ALGORITHMS_DATA_STRUCTURES',
    label: 'Algorithms & Data Structures (DSA)',
    shortLabel: 'DSA',
    description: 'Trees, Graphs, DP, HashMaps, Sliding Window',
    icon: <Binary className="w-4 h-4 text-cyan-500" />
  },
  {
    key: 'SQL',
    label: 'PostgreSQL & Database Queries (SQL)',
    shortLabel: 'SQL',
    description: 'Window functions, CTEs, Aggregates & Joins',
    icon: <Database className="w-4 h-4 text-emerald-500" />
  },
  {
    key: 'SPRING_LLD',
    label: 'Low-Level Design & Spring Boot (LLD)',
    shortLabel: 'Spring LLD',
    description: 'REST APIs, Services, JPA, Design Patterns',
    icon: <Code2 className="w-4 h-4 text-indigo-500" />
  },
  {
    key: 'SYSTEM_DESIGN',
    label: 'System Design & Architecture (HLD)',
    shortLabel: 'System Design',
    description: 'Distributed systems, Caching, Messaging',
    icon: <Layers className="w-4 h-4 text-purple-500" />
  },
  {
    key: 'BEHAVIORAL_STAR',
    label: 'Behavioral & Leadership (STAR)',
    shortLabel: 'Behavioral',
    description: 'STAR structured scenarios, Conflict & Delivery',
    icon: <Users2 className="w-4 h-4 text-amber-500" />
  },
  {
    key: 'RESUME_BASED',
    label: 'Resume-Grounded Experience',
    shortLabel: 'Resume-Based',
    description: 'Deep dive into projects and architectural decisions',
    icon: <Sparkles className="w-4 h-4 text-rose-500" />
  }
];

export const TrackNavMenu: React.FC<TrackNavMenuProps> = ({
  isPlayground,
  activeTrack,
  onSelectTrack,
  catalogQuestions = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { allProgress } = usePlaygroundProgress();

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  // Compute counts per track
  const getTrackStats = (trackKey: string) => {
    const matching = trackKey === 'ALL'
      ? catalogQuestions
      : catalogQuestions.filter((q) => q.track === trackKey);

    const count = matching.length;
    let solvedCount = 0;
    let attemptedCount = 0;

    matching.forEach((q) => {
      const slug = q.problemSlug || q.slug || '';
      const prog = allProgress[slug];
      if (prog?.status === 'solved') solvedCount++;
      else if (prog?.status === 'attempted') attemptedCount++;
    });

    return { count, solvedCount, attemptedCount };
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Track Navigation Menu"
        aria-expanded={isOpen}
        title={isPlayground ? 'Switch Practice Track (Hamburger Menu)' : 'Track Navigation (Locked in Interview Mode)'}
        className={`p-1.5 rounded-md border border-border text-text transition-colors cursor-pointer flex items-center justify-center ${
          isOpen ? 'bg-elevated text-primary border-primary/50' : 'bg-surface hover:bg-elevated'
        }`}
      >
        <Menu className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-surface border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-border-subtle flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-text flex items-center gap-1.5">
                <span>Practice Tracks</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isPlayground ? 'bg-primary/15 text-primary' : 'bg-danger/15 text-danger'
                }`}>
                  {isPlayground ? 'Playground' : 'Interview'}
                </span>
              </div>
              <p className="text-[11px] text-text-3">
                {isPlayground
                  ? 'Switch between technical tracks at any time'
                  : 'Track navigation is locked during proctored mode'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-text-3 hover:text-text hover:bg-elevated cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto py-1 px-1.5 space-y-0.5">
            {TRACKS.map((track) => {
              const isActive = activeTrack === track.key || (track.key === 'ALL' && !activeTrack);
              const stats = getTrackStats(track.key);

              return (
                <button
                  key={track.key}
                  type="button"
                  disabled={!isPlayground}
                  onClick={() => {
                    if (isPlayground) {
                      onSelectTrack(track.key);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all ${
                    !isPlayground
                      ? 'opacity-60 cursor-not-allowed bg-elevated/20'
                      : isActive
                      ? 'bg-primary/10 border border-primary/30 text-primary'
                      : 'hover:bg-elevated text-text cursor-pointer border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-elevated border border-border shrink-0">
                    {track.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-xs font-bold truncate ${isActive ? 'text-primary' : 'text-text'}`}>
                        {track.label}
                      </span>
                      {!isPlayground ? (
                        <Lock className="w-3.5 h-3.5 text-text-3 shrink-0" />
                      ) : stats.solvedCount > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] text-success font-medium shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{stats.solvedCount}</span>
                        </span>
                      ) : stats.attemptedCount > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] text-warning font-medium shrink-0">
                          <CircleDot className="w-3 h-3" />
                          <span>{stats.attemptedCount}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-text-3 font-medium shrink-0">
                          <Circle className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-3 truncate mt-0.5">
                      {track.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {!isPlayground && (
            <div className="px-4 py-2 border-t border-border-subtle bg-elevated/40 text-[11px] text-text-3 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-warning shrink-0" />
              <span>Proctored interview: Complete questions sequentially.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
