import type { PlannedSection, InterviewTrack, SectionType } from '../types';
import type { InterviewStage } from '../components/StageStepper';

export interface StageNavInfo {
  key: string;
  stage: InterviewStage;
  label: string;
  description: string;
  track: InterviewTrack;
  sectionIndex: number;
  sectionType: SectionType | string;
  softTimeBudgetMinutes: number;
  note?: string;
}

export function formatSectionTypeTitle(type: SectionType | string): string {
  switch (type) {
    case 'INTRODUCTION': return 'Introduction';
    case 'CORE_TECH': return 'Core Tech';
    case 'DSA': return 'Coding & DSA';
    case 'LLD': return 'Low-Level Design';
    case 'SYSTEM_DESIGN': return 'System Design';
    case 'SQL': return 'Database & SQL';
    case 'BEHAVIORAL': return 'Behavioral STAR';
    case 'RESUME': return 'Resume Deep-Dive';
    default: return String(type);
  }
}

export function mapSectionTypeToStage(type: SectionType | string): InterviewStage {
  switch (type) {
    case 'INTRODUCTION': return 'INTRODUCTION';
    case 'CORE_TECH':
    case 'LLD': return 'CORE_TECH';
    case 'DSA':
    case 'SQL': return 'CODING_DSA';
    case 'SYSTEM_DESIGN':
    case 'BEHAVIORAL':
    case 'RESUME': return 'SYSTEM_DESIGN';
    default: return 'INTRODUCTION';
  }
}

export function buildNavSections(
  sections?: PlannedSection[],
  fallbackTrack: InterviewTrack = 'ALGORITHMS_DATA_STRUCTURES'
): StageNavInfo[] {
  if (sections && sections.length > 0) {
    return sections.map((sec, idx) => ({
      key: `${sec.sectionType}_${idx}`,
      stage: mapSectionTypeToStage(sec.sectionType),
      label: `${idx + 1}. ${formatSectionTypeTitle(sec.sectionType)}`,
      description: `${sec.softTimeBudgetMinutes} min · ${sec.note || sec.track}`,
      track: sec.track,
      sectionIndex: idx,
      sectionType: sec.sectionType,
      softTimeBudgetMinutes: sec.softTimeBudgetMinutes,
      note: sec.note
    }));
  }

  return [
    { key: 'INTRODUCTION_0', stage: 'INTRODUCTION', label: '1. Introduction', description: 'Background & Role Fit', track: 'BEHAVIORAL_STAR', sectionIndex: 0, sectionType: 'INTRODUCTION', softTimeBudgetMinutes: 5, note: 'Candidate background' },
    { key: 'CORE_TECH_1', stage: 'CORE_TECH', label: '2. Core Tech', description: 'Deep Dive & Foundations', track: 'SPRING_LLD', sectionIndex: 1, sectionType: 'CORE_TECH', softTimeBudgetMinutes: 15, note: 'Foundations' },
    { key: 'CODING_DSA_2', stage: 'CODING_DSA', label: '3. Coding & DSA', description: 'Sandbox Implementation', track: fallbackTrack, sectionIndex: 2, sectionType: 'DSA', softTimeBudgetMinutes: 30, note: 'Implementation' },
    { key: 'SYSTEM_DESIGN_3', stage: 'SYSTEM_DESIGN', label: '4. System Design', description: 'Architecture & Scalability', track: 'SYSTEM_DESIGN', sectionIndex: 3, sectionType: 'SYSTEM_DESIGN', softTimeBudgetMinutes: 18, note: 'Scalability' },
  ];
}
