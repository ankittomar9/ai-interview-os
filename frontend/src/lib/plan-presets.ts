import type { DifficultyLevel, InterviewTrack, SectionType } from '../types';

export interface PlanPresetSection {
  sectionType: SectionType;
  track: InterviewTrack;
  itemCount: number;
  softTimeBudgetMinutes: number;
  note: string;
}

export interface PlanPreset {
  track: InterviewTrack;
  difficulty: DifficultyLevel;
  sections: PlanPresetSection[];
  plannedTotalMinutes: number;
  preview: string;
}

export const getPlanPreset = (track: InterviewTrack, difficulty: DifficultyLevel): PlanPreset => {
  if (track === 'FULL_LOOP') {
    switch (difficulty) {
      case 'JUNIOR':
        return {
          track,
          difficulty,
          plannedTotalMinutes: 52,
          preview: 'Intro · DSA ×2 · LLD ×1 · ≈52 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate background & warm-up' },
            { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: 2, softTimeBudgetMinutes: 30, note: 'Core algorithms & data structures' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 1, softTimeBudgetMinutes: 15, note: 'Object-oriented component design' }
          ]
        };
      case 'MID':
        return {
          track,
          difficulty,
          plannedTotalMinutes: 58,
          preview: 'Intro · DSA ×2 · LLD ×2 · ≈58 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate background & warm-up' },
            { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: 2, softTimeBudgetMinutes: 30, note: 'Algorithmic problem solving' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 2, softTimeBudgetMinutes: 20, note: 'Low-level design & rapid-fire implementation' }
          ]
        };
      case 'SENIOR':
        return {
          track,
          difficulty,
          plannedTotalMinutes: 55,
          preview: 'Intro · DSA ×1 · LLD ×1 · System Design ×1 · ≈55 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate background & warm-up' },
            { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: 1, softTimeBudgetMinutes: 15, note: 'Algorithmic problem solving' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 1, softTimeBudgetMinutes: 15, note: 'Modular component design' },
            { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: 1, softTimeBudgetMinutes: 18, note: 'High-level distributed architecture' }
          ]
        };
      case 'STAFF':
        return {
          track,
          difficulty,
          plannedTotalMinutes: 52,
          preview: 'Intro · LLD ×1 · System Design ×1 · Resume ×1 · ≈52 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate background & warm-up' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 1, softTimeBudgetMinutes: 15, note: 'Enterprise low-level architecture' },
            { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: 1, softTimeBudgetMinutes: 18, note: 'Large-scale system architecture' },
            { sectionType: 'RESUME', track: 'RESUME_BASED', itemCount: 1, softTimeBudgetMinutes: 12, note: 'Deep-dive into past architectural impact' }
          ]
        };
    }
  }

  if (track === 'DSA_LLD') {
    const dsaItems = (difficulty === 'JUNIOR' || difficulty === 'MID') ? 2 : 1;
    const dsaMinutes = (difficulty === 'JUNIOR' || difficulty === 'MID') ? 30 : 15;
    const lldItems = difficulty === 'MID' ? 2 : 1;
    const lldMinutes = difficulty === 'MID' ? 20 : 15;
    const totalMinutes = 5 + dsaMinutes + lldMinutes;
    return {
      track,
      difficulty,
      plannedTotalMinutes: totalMinutes,
      preview: `Intro · DSA ×${dsaItems} · LLD ×${lldItems} · ≈${totalMinutes} min`,
      sections: [
        { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate background & warm-up' },
        { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: dsaItems, softTimeBudgetMinutes: dsaMinutes, note: 'Core algorithms & data structures' },
        { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: lldItems, softTimeBudgetMinutes: lldMinutes, note: 'Object-oriented component design' }
      ]
    };
  }

  if (track === 'LLD_HLD') {
    const lldItems = difficulty === 'MID' ? 2 : 1;
    const lldMinutes = difficulty === 'MID' ? 20 : 15;
    const hldItems = 1;
    const hldMinutes = 18;
    const totalMinutes = 5 + lldMinutes + hldMinutes;
    return {
      track,
      difficulty,
      plannedTotalMinutes: totalMinutes,
      preview: `Intro · LLD ×${lldItems} · System Design ×${hldItems} · ≈${totalMinutes} min`,
      sections: [
        { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate background & warm-up' },
        { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: lldItems, softTimeBudgetMinutes: lldMinutes, note: 'Modular component & low-level design' },
        { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: hldItems, softTimeBudgetMinutes: hldMinutes, note: 'High-level distributed architecture' }
      ]
    };
  }

  if (track === 'DSA_LLD_HLD') {
    const dsaItems = (difficulty === 'JUNIOR' || difficulty === 'MID') ? 2 : 1;
    const dsaMinutes = (difficulty === 'JUNIOR' || difficulty === 'MID') ? 30 : 15;
    const lldItems = difficulty === 'MID' ? 2 : 1;
    const lldMinutes = difficulty === 'MID' ? 20 : 15;
    const hldItems = 1;
    const hldMinutes = 18;
    const totalMinutes = 5 + dsaMinutes + lldMinutes + hldMinutes;
    return {
      track,
      difficulty,
      plannedTotalMinutes: totalMinutes,
      preview: `Intro · DSA ×${dsaItems} · LLD ×${lldItems} · System Design ×${hldItems} · ≈${totalMinutes} min`,
      sections: [
        { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate background & warm-up' },
        { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: dsaItems, softTimeBudgetMinutes: dsaMinutes, note: 'Core algorithms & data structures' },
        { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: lldItems, softTimeBudgetMinutes: lldMinutes, note: 'Modular component design' },
        { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: hldItems, softTimeBudgetMinutes: hldMinutes, note: 'High-level distributed architecture' }
      ]
    };
  }

  // Focused tracks
  switch (track) {
    case 'ALGORITHMS_DATA_STRUCTURES': {
      const isJuniorOrMid = difficulty === 'JUNIOR' || difficulty === 'MID';
      const items = isJuniorOrMid ? 2 : 1;
      const totalMinutes = 5 + items * 15;
      return {
        track,
        difficulty,
        plannedTotalMinutes: totalMinutes,
        preview: `DSA ×${items} · ≈${totalMinutes} min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate introduction & warm-up' },
          { sectionType: 'DSA', track, itemCount: items, softTimeBudgetMinutes: items * 15, note: 'Algorithms and data structures' }
        ]
      };
    }
    case 'SQL': {
      const isJuniorOrMid = difficulty === 'JUNIOR' || difficulty === 'MID';
      const items = isJuniorOrMid ? 2 : 1;
      const totalMinutes = 5 + items * 12;
      return {
        track,
        difficulty,
        plannedTotalMinutes: totalMinutes,
        preview: `SQL ×${items} · ≈${totalMinutes} min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate introduction & warm-up' },
          { sectionType: 'SQL', track, itemCount: items, softTimeBudgetMinutes: items * 12, note: 'SQL queries and database schema design' }
        ]
      };
    }
    case 'SPRING_LLD':
    case 'JAVA_SPRING_BOOT': {
      const items = difficulty === 'MID' ? 2 : 1;
      const totalMinutes = 5 + items * 15;
      return {
        track,
        difficulty,
        plannedTotalMinutes: totalMinutes,
        preview: `LLD ×${items} · ≈${totalMinutes} min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate introduction & warm-up' },
          { sectionType: 'LLD', track, itemCount: items, softTimeBudgetMinutes: items * 15, note: 'Object-oriented & Spring Boot low-level design' }
        ]
      };
    }
    case 'SYSTEM_DESIGN': {
      const isSeniorOrStaff = difficulty === 'SENIOR' || difficulty === 'STAFF';
      const items = isSeniorOrStaff ? 2 : 1;
      const totalMinutes = 5 + items * 18;
      return {
        track,
        difficulty,
        plannedTotalMinutes: totalMinutes,
        preview: `System Design ×${items} · ≈${totalMinutes} min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate introduction & warm-up' },
          { sectionType: 'SYSTEM_DESIGN', track, itemCount: items, softTimeBudgetMinutes: items * 18, note: 'High-level distributed architecture' }
        ]
      };
    }
    case 'BEHAVIORAL_STAR': {
      const items = 2;
      const totalMinutes = 5 + items * 8;
      return {
        track,
        difficulty,
        plannedTotalMinutes: totalMinutes,
        preview: `Behavioral ×${items} · ≈${totalMinutes} min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate introduction & warm-up' },
          { sectionType: 'BEHAVIORAL', track, itemCount: items, softTimeBudgetMinutes: items * 8, note: 'STAR behavioral evaluation' }
        ]
      };
    }
    case 'RESUME_BASED':
    default: {
      const items = 2;
      const totalMinutes = 5 + items * 10;
      return {
        track,
        difficulty,
        plannedTotalMinutes: totalMinutes,
        preview: `Resume Deep-Dive ×${items} · ≈${totalMinutes} min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 5, note: 'Candidate introduction & warm-up' },
          { sectionType: 'RESUME', track, itemCount: items, softTimeBudgetMinutes: items * 10, note: 'Past projects and architecture deep-dive' }
        ]
      };
    }
  }
};

export const getPlanPresetPreview = (track: InterviewTrack, difficulty: DifficultyLevel): string => {
  return getPlanPreset(track, difficulty).preview;
};
