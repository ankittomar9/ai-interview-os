import type { DifficultyLevel, InterviewTrack, SectionType, CustomDomainConfig } from '../types';

export interface CustomDomainItem {
  domain: InterviewTrack;
  name: string;
  subtitle: string;
  defaultMinutes: number;
  isTechOnly: boolean;
}

export const CUSTOM_AVAILABLE_DOMAINS: CustomDomainItem[] = [
  { domain: 'ALGORITHMS_DATA_STRUCTURES', name: 'DSA', subtitle: 'Algorithms & sandbox coding', defaultMinutes: 30, isTechOnly: true },
  { domain: 'SPRING_LLD', name: 'LLD', subtitle: 'Object-oriented low-level design', defaultMinutes: 20, isTechOnly: true },
  { domain: 'SYSTEM_DESIGN', name: 'HLD', subtitle: 'System architecture & trade-offs', defaultMinutes: 30, isTechOnly: true },
  { domain: 'SQL', name: 'SQL', subtitle: 'Window functions, joins & database sandbox', defaultMinutes: 20, isTechOnly: true },
  { domain: 'RESUME_BASED', name: 'Others', subtitle: 'Resume-grounded AI-led interview', defaultMinutes: 20, isTechOnly: false },
];

export const CUSTOM_PRESETS: Record<'ALL' | 'DSA_HLD' | 'DSA_LLD', CustomDomainConfig[]> = {
  ALL: [
    { domain: 'ALGORITHMS_DATA_STRUCTURES', durationMinutes: 20 },
    { domain: 'SPRING_LLD', durationMinutes: 20 },
    { domain: 'SYSTEM_DESIGN', durationMinutes: 20 },
    { domain: 'SQL', durationMinutes: 20 },
    { domain: 'RESUME_BASED', durationMinutes: 20 }
  ],
  DSA_HLD: [
    { domain: 'ALGORITHMS_DATA_STRUCTURES', durationMinutes: 30 },
    { domain: 'SYSTEM_DESIGN', durationMinutes: 30 }
  ],
  DSA_LLD: [
    { domain: 'ALGORITHMS_DATA_STRUCTURES', durationMinutes: 30 },
    { domain: 'SPRING_LLD', durationMinutes: 30 }
  ]
};

export function formatCustomPlanPreview(customDomains: CustomDomainConfig[]): string {
  if (!customDomains || customDomains.length === 0) return 'Select at least one domain';
  const parts = customDomains.map(d => {
    const label = d.domain === 'ALGORITHMS_DATA_STRUCTURES' ? 'DSA'
      : d.domain === 'SPRING_LLD' ? 'LLD'
      : d.domain === 'SYSTEM_DESIGN' ? 'HLD'
      : d.domain === 'SQL' ? 'SQL'
      : d.domain === 'RESUME_BASED' ? 'Others'
      : d.domain;
    return `${label} (${d.durationMinutes}m)`;
  });
  const total = customDomains.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  return `${parts.join(' · ')} · ≈${total} min`;
}

export function calculateCustomTotal(customDomains: CustomDomainConfig[]): number {
  return customDomains.reduce((acc, curr) => acc + curr.durationMinutes, 0);
}

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
          plannedTotalMinutes: 43,
          preview: 'Intro · DSA ×2 · LLD ×1 · ≈43 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate background & warm-up' },
            { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: 2, softTimeBudgetMinutes: 20, note: 'Core algorithms & data structures' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 1, softTimeBudgetMinutes: 15, note: 'Object-oriented component design' }
          ]
        };
      case 'MID':
        return {
          track,
          difficulty,
          plannedTotalMinutes: 43,
          preview: 'Intro · DSA ×2 · LLD ×2 · ≈43 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate background & warm-up' },
            { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: 2, softTimeBudgetMinutes: 20, note: 'Algorithmic problem solving' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 2, softTimeBudgetMinutes: 15, note: 'Low-level design & rapid-fire implementation' }
          ]
        };
      case 'SENIOR':
        return {
          track,
          difficulty,
          plannedTotalMinutes: 61,
          preview: 'Intro · DSA ×1 · LLD ×1 · System Design ×1 · ≈61 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate background & warm-up' },
            { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: 1, softTimeBudgetMinutes: 20, note: 'Algorithmic problem solving' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 1, softTimeBudgetMinutes: 15, note: 'Modular component design' },
            { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: 1, softTimeBudgetMinutes: 18, note: 'High-level distributed architecture' }
          ]
        };
      case 'STAFF':
        return {
          track,
          difficulty,
          plannedTotalMinutes: 53,
          preview: 'Intro · LLD ×1 · System Design ×1 · Resume ×1 · ≈53 min',
          sections: [
            { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate background & warm-up' },
            { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: 1, softTimeBudgetMinutes: 15, note: 'Enterprise low-level architecture' },
            { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: 1, softTimeBudgetMinutes: 18, note: 'Large-scale system architecture' },
            { sectionType: 'RESUME', track: 'RESUME_BASED', itemCount: 1, softTimeBudgetMinutes: 12, note: 'Deep-dive into past architectural impact' }
          ]
        };
    }
  }

  if (track === 'DSA_LLD') {
    const dsaItems = (difficulty === 'JUNIOR' || difficulty === 'MID') ? 2 : 1;
    const lldItems = difficulty === 'MID' ? 2 : 1;
    return {
      track,
      difficulty,
      plannedTotalMinutes: 43,
      preview: `Intro · DSA ×${dsaItems} · LLD ×${lldItems} · ≈43 min`,
      sections: [
        { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate background & warm-up' },
        { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: dsaItems, softTimeBudgetMinutes: 20, note: 'Core algorithms & data structures' },
        { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: lldItems, softTimeBudgetMinutes: 15, note: 'Object-oriented component design' }
      ]
    };
  }

  if (track === 'LLD_HLD') {
    const lldItems = difficulty === 'MID' ? 2 : 1;
    const hldItems = 1;
    return {
      track,
      difficulty,
      plannedTotalMinutes: 41,
      preview: `Intro · LLD ×${lldItems} · System Design ×${hldItems} · ≈41 min`,
      sections: [
        { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate background & warm-up' },
        { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: lldItems, softTimeBudgetMinutes: 15, note: 'Modular component & low-level design' },
        { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: hldItems, softTimeBudgetMinutes: 18, note: 'High-level distributed architecture' }
      ]
    };
  }

  if (track === 'DSA_LLD_HLD') {
    const dsaItems = (difficulty === 'JUNIOR' || difficulty === 'MID') ? 2 : 1;
    const lldItems = difficulty === 'MID' ? 2 : 1;
    const hldItems = 1;
    return {
      track,
      difficulty,
      plannedTotalMinutes: 61,
      preview: `Intro · DSA ×${dsaItems} · LLD ×${lldItems} · System Design ×${hldItems} · ≈61 min`,
      sections: [
        { sectionType: 'INTRODUCTION', track: 'BEHAVIORAL_STAR', itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate background & warm-up' },
        { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: dsaItems, softTimeBudgetMinutes: 20, note: 'Core algorithms & data structures' },
        { sectionType: 'LLD', track: 'SPRING_LLD', itemCount: lldItems, softTimeBudgetMinutes: 15, note: 'Modular component design' },
        { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: hldItems, softTimeBudgetMinutes: 18, note: 'High-level distributed architecture' }
      ]
    };
  }

  // Focused tracks
  switch (track) {
    case 'ALGORITHMS_DATA_STRUCTURES': {
      const isJuniorOrMid = difficulty === 'JUNIOR' || difficulty === 'MID';
      const items = isJuniorOrMid ? 2 : 1;
      return {
        track,
        difficulty,
        plannedTotalMinutes: 28,
        preview: `Intro · DSA ×${items} · ≈28 min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate introduction & warm-up' },
          { sectionType: 'DSA', track, itemCount: items, softTimeBudgetMinutes: 20, note: 'Algorithms and data structures' }
        ]
      };
    }
    case 'SQL': {
      const isJuniorOrMid = difficulty === 'JUNIOR' || difficulty === 'MID';
      const items = isJuniorOrMid ? 2 : 1;
      const sqlMinutes = difficulty === 'MID' ? 24 : 12;
      const totalMinutes = 8 + sqlMinutes;
      return {
        track,
        difficulty,
        plannedTotalMinutes: totalMinutes,
        preview: `Intro · SQL ×${items} · ≈${totalMinutes} min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate introduction & warm-up' },
          { sectionType: 'SQL', track, itemCount: items, softTimeBudgetMinutes: sqlMinutes, note: 'SQL queries and database schema design' }
        ]
      };
    }
    case 'SPRING_LLD':
    case 'JAVA_SPRING_BOOT': {
      const items = difficulty === 'MID' ? 2 : 1;
      return {
        track,
        difficulty,
        plannedTotalMinutes: 23,
        preview: `Intro · LLD ×${items} · ≈23 min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate introduction & warm-up' },
          { sectionType: 'LLD', track, itemCount: items, softTimeBudgetMinutes: 15, note: 'Object-oriented & Spring Boot low-level design' }
        ]
      };
    }
    case 'SYSTEM_DESIGN': {
      const isSeniorOrStaff = difficulty === 'SENIOR' || difficulty === 'STAFF';
      const items = isSeniorOrStaff ? 2 : 1;
      return {
        track,
        difficulty,
        plannedTotalMinutes: 26,
        preview: `Intro · System Design ×${items} · ≈26 min`,
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate introduction & warm-up' },
          { sectionType: 'SYSTEM_DESIGN', track, itemCount: items, softTimeBudgetMinutes: 18, note: 'High-level distributed architecture' }
        ]
      };
    }
    case 'BEHAVIORAL_STAR': {
      return {
        track,
        difficulty,
        plannedTotalMinutes: 18,
        preview: 'Intro · Behavioral STAR · ≈18 min',
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate introduction & warm-up' },
          { sectionType: 'BEHAVIORAL', track, itemCount: 1, softTimeBudgetMinutes: 10, note: 'STAR behavioral evaluation' }
        ]
      };
    }
    case 'CUSTOM': {
      return {
        track,
        difficulty,
        plannedTotalMinutes: 60,
        preview: 'DSA (30m) · HLD (30m) · ≈60 min',
        sections: [
          { sectionType: 'DSA', track: 'ALGORITHMS_DATA_STRUCTURES', itemCount: 2, softTimeBudgetMinutes: 30, note: 'Algorithms and problem solving' },
          { sectionType: 'SYSTEM_DESIGN', track: 'SYSTEM_DESIGN', itemCount: 1, softTimeBudgetMinutes: 30, note: 'System architecture' }
        ]
      };
    }
    case 'RESUME_BASED':
    default: {
      return {
        track,
        difficulty,
        plannedTotalMinutes: 20,
        preview: 'Intro · Resume Deep-Dive · ≈20 min',
        sections: [
          { sectionType: 'INTRODUCTION', track, itemCount: 1, softTimeBudgetMinutes: 8, note: 'Candidate introduction & warm-up' },
          { sectionType: 'RESUME', track, itemCount: 1, softTimeBudgetMinutes: 12, note: 'Past projects and architecture deep-dive' }
        ]
      };
    }
  }
};

export const getPlanPresetPreview = (track: InterviewTrack, difficulty: DifficultyLevel): string => {
  return getPlanPreset(track, difficulty).preview;
};
