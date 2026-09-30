import type { DifficultyLevel } from '../types';

/**
 * Maps question catalog difficulty ('EASY' | 'MEDIUM' | 'HARD') to
 * session candidate seniority ('JUNIOR' | 'MID' | 'SENIOR' | 'STAFF').
 *
 * Aligns with the in-repo taxonomy bridge defined in QuestionMatchService.matchesDifficulty:
 *   EASY   -> JUNIOR
 *   MEDIUM -> MID
 *   HARD   -> SENIOR
 *
 * Fallback defaults to 'MID' for undefined, empty, or unrecognized values.
 */
export function mapQuestionDifficultyToSeniority(difficulty?: string | null): DifficultyLevel {
  if (!difficulty) {
    return 'MID';
  }

  const normalized = difficulty.trim().toUpperCase();

  switch (normalized) {
    case 'EASY':
    case 'JUNIOR':
      return 'JUNIOR';
    case 'MEDIUM':
    case 'MID':
      return 'MID';
    case 'HARD':
    case 'SENIOR':
      return 'SENIOR';
    case 'STAFF':
      return 'STAFF';
    default:
      return 'MID';
  }
}
