import type { DifficultyLevel, InterviewTrack, PlannedSection, SectionType, SessionPlan } from '../types';
import { mapQuestionDifficultyToSeniority } from '../utils/difficulty';

export function derivePlaygroundSectionType(track?: InterviewTrack): SectionType {
  switch (track) {
    case 'SQL':
      return 'SQL';
    case 'SPRING_LLD':
    case 'JAVA_SPRING_BOOT':
    case 'LLD_HLD':
    case 'AGENTIC_ENGINEERING':
      return 'LLD';
    case 'SYSTEM_DESIGN':
    case 'SYSTEM_TROUBLESHOOTING':
      return 'SYSTEM_DESIGN';
    case 'BEHAVIORAL_STAR':
      return 'BEHAVIORAL';
    case 'RESUME_BASED':
      return 'RESUME';
    case 'ALGORITHMS_DATA_STRUCTURES':
    case 'DSA_LLD':
    case 'DSA_LLD_HLD':
    default:
      return 'DSA';
  }
}

export function syntheticPlaygroundSection(
  q: { track?: InterviewTrack; slug?: string; problemSlug?: string },
  slugs?: string[]
): PlannedSection {
  const actualSlug = q.slug || q.problemSlug || '';
  const problemSlugs = slugs && slugs.length > 0 ? slugs : (actualSlug ? [actualSlug] : []);
  const targetTrack = q.track || 'ALGORITHMS_DATA_STRUCTURES';
  return {
    sectionType: derivePlaygroundSectionType(targetTrack),
    track: targetTrack,
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
