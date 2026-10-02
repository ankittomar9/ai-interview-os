import type { DifficultyLevel, InterviewTrack, PlannedSection, SessionPlan } from '../types';
import { mapQuestionDifficultyToSeniority } from '../utils/difficulty';

export function syntheticPlaygroundSection(
  q: { track?: InterviewTrack; slug?: string; problemSlug?: string },
  slugs?: string[]
): PlannedSection {
  const actualSlug = q.slug || q.problemSlug || '';
  const problemSlugs = slugs && slugs.length > 0 ? slugs : (actualSlug ? [actualSlug] : []);
  return {
    sectionType: 'DSA',
    track: q.track || 'ALGORITHMS_DATA_STRUCTURES',
    itemCount: problemSlugs.length || 1,
    softTimeBudgetMinutes: 30,
    note: 'Playground practice',
    problemSlugs
  };
}

export function syntheticPlaygroundPlan(
  q: { track?: InterviewTrack; slug?: string; problemSlug?: string; difficulty?: any },
  level?: DifficultyLevel,
  slugs?: string[]
): SessionPlan {
  const diffLevel = level || mapQuestionDifficultyToSeniority(q.difficulty);
  return {
    source: 'SETUP_SELECTION',
    level: diffLevel,
    sections: [syntheticPlaygroundSection(q, slugs)],
    plannedTotalMinutes: 30
  };
}
