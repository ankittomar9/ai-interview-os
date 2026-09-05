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
  problemSlugs?: string[];
}

export function formatSectionTypeTitle(type: SectionType | string): string {
  switch (type) {
    case 'INTRODUCTION': return 'Introduction';
    case 'CORE_TECH': return 'Architecture & Foundations';
    case 'DSA': return 'Coding & DSA';
    case 'LLD': return 'Low-Level Design';
    case 'SYSTEM_DESIGN': return 'System Design (HLD)';
    case 'SQL': return 'Database & SQL';
    case 'BEHAVIORAL': return 'Behavioral STAR';
    case 'RESUME': return 'Resume Deep-Dive';
    default: return String(type);
  }
}

export function buildNavSections(
  sections?: PlannedSection[],
  fallbackTrack: InterviewTrack = 'ALGORITHMS_DATA_STRUCTURES'
): StageNavInfo[] {
  if (sections && sections.length > 0) {
    return sections.map((sec, idx) => {
      const count = sec.problemSlugs?.length ?? 0;
      const countSuffix = count > 0 ? ` ×${count}` : '';
      return {
        key: `${sec.sectionType}_${idx}`,
        stage: sec.sectionType as InterviewStage,
        label: `${idx + 1}. ${formatSectionTypeTitle(sec.sectionType)}${countSuffix}`,
        description: `${sec.softTimeBudgetMinutes} min · ${sec.note || sec.track}`,
        track: sec.track,
        sectionIndex: idx,
        sectionType: sec.sectionType,
        softTimeBudgetMinutes: sec.softTimeBudgetMinutes,
        note: sec.note,
        problemSlugs: sec.problemSlugs
      };
    });
  }

  return [
    { key: 'INTRODUCTION_0', stage: 'INTRODUCTION' as InterviewStage, label: '1. Introduction', description: 'Background & Role Fit', track: 'BEHAVIORAL_STAR', sectionIndex: 0, sectionType: 'INTRODUCTION', softTimeBudgetMinutes: 5, note: 'Candidate background' },
    { key: 'DSA_1', stage: 'DSA' as InterviewStage, label: '2. Coding & DSA', description: 'Problem Solving & Implementation', track: fallbackTrack, sectionIndex: 1, sectionType: 'DSA', softTimeBudgetMinutes: 30, note: 'Implementation' },
    { key: 'LLD_2', stage: 'LLD' as InterviewStage, label: '3. Low-Level Design', description: 'Object-Oriented Design', track: 'SPRING_LLD', sectionIndex: 2, sectionType: 'LLD', softTimeBudgetMinutes: 25, note: 'Design' },
    { key: 'SYSTEM_DESIGN_3', stage: 'SYSTEM_DESIGN' as InterviewStage, label: '4. System Design (HLD)', description: 'Architecture & Scalability', track: 'SYSTEM_DESIGN', sectionIndex: 3, sectionType: 'SYSTEM_DESIGN', softTimeBudgetMinutes: 20, note: 'Scalability' },
  ];
}
