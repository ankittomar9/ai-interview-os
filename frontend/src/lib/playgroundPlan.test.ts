import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNavSections } from './plan-navigation';
import { derivePlaygroundSectionType, syntheticPlaygroundSection, syntheticPlaygroundPlan } from './playgroundPlan';
import { resolveSectionType } from '../components/arena/ArenaShellTypes';

test('VP-1 / F-1: synthetic playground plan yields exactly one section with stage=DSA and no INTRODUCTION', () => {
  const dummyQuestion = {
    slug: 'reverse-a-string',
    track: 'ALGORITHMS_DATA_STRUCTURES' as const,
    difficulty: 'EASY'
  };

  const plan = syntheticPlaygroundPlan(dummyQuestion);
  assert.equal(plan.sections.length, 1);
  assert.equal(plan.sections[0].sectionType, 'DSA');
  assert.deepEqual(plan.sections[0].problemSlugs, ['reverse-a-string']);

  const navSections = buildNavSections(plan.sections, dummyQuestion.track);

  assert.equal(navSections.length, 1, 'Playground must have exactly 1 section');
  assert.equal(navSections[0].stage, 'DSA', 'Playground section stage must be DSA');
  assert.equal(navSections[0].sectionType, 'DSA');
  assert.match(navSections[0].label, /^1\.\s+Coding\s+&\s+DSA/);
  assert.match(navSections[0].description, /30\s+min\s+·\s+Playground\s+practice/);

  // Assert no INTRODUCTION key or stage is present anywhere
  const hasIntro = navSections.some(s => s.stage === 'INTRODUCTION' || s.key.includes('INTRODUCTION'));
  assert.equal(hasIntro, false, 'No INTRODUCTION key should exist in playground nav sections');
});

test('VP-1 / F-1: playlist synthetic plan correctly tracks all question slugs with single coding stage', () => {
  const firstQ = {
    slug: 'two-sum',
    track: 'ALGORITHMS_DATA_STRUCTURES' as const,
    difficulty: 'MEDIUM'
  };
  const slugs = ['two-sum', 'three-sum', 'four-sum'];

  const plan = syntheticPlaygroundPlan(firstQ, 'MID', slugs);
  assert.equal(plan.sections.length, 1);
  assert.equal(plan.sections[0].itemCount, 3);
  assert.deepEqual(plan.sections[0].problemSlugs, slugs);

  const navSections = buildNavSections(plan.sections, firstQ.track);
  assert.equal(navSections.length, 1);
  assert.equal(navSections[0].stage, 'DSA');
  assert.match(navSections[0].label, /1\.\s+Coding\s+&\s+DSA\s+×3/);
  assert.equal(navSections[0].key, 'DSA_0');
});

test('QB-51: derivePlaygroundSectionType routes tracks to appropriate section types without defaulting to DSA', () => {
  assert.equal(derivePlaygroundSectionType('AGENTIC_ENGINEERING'), 'LLD');
  assert.equal(derivePlaygroundSectionType('SPRING_LLD'), 'LLD');
  assert.equal(derivePlaygroundSectionType('JAVA_SPRING_BOOT'), 'LLD');
  assert.equal(derivePlaygroundSectionType('LLD_HLD'), 'LLD');
  assert.equal(derivePlaygroundSectionType('SQL'), 'SQL');
  assert.equal(derivePlaygroundSectionType('SYSTEM_DESIGN'), 'SYSTEM_DESIGN');
  assert.equal(derivePlaygroundSectionType('SYSTEM_TROUBLESHOOTING'), 'SYSTEM_DESIGN');
  assert.equal(derivePlaygroundSectionType('BEHAVIORAL_STAR'), 'BEHAVIORAL');
  assert.equal(derivePlaygroundSectionType('RESUME_BASED'), 'RESUME');
  assert.equal(derivePlaygroundSectionType('ALGORITHMS_DATA_STRUCTURES'), 'DSA');
  assert.equal(derivePlaygroundSectionType('DSA_LLD'), 'DSA');
  assert.equal(derivePlaygroundSectionType('DSA_LLD_HLD'), 'DSA');
  assert.equal(derivePlaygroundSectionType(undefined), 'DSA');
});

test('QB-51: syntheticPlaygroundSection derives sectionType and track from question, pinning LLD for AGENTIC_ENGINEERING', () => {
  const agenticQ = {
    slug: 'agentic-mcp-order-service',
    track: 'AGENTIC_ENGINEERING' as const
  };
  const section = syntheticPlaygroundSection(agenticQ);
  assert.equal(section.sectionType, 'LLD', 'Agentic questions must route to LLD sectionType');
  assert.notEqual(section.sectionType, 'DSA', 'Agentic questions must NEVER hardcode DSA');
  assert.equal(section.track, 'AGENTIC_ENGINEERING');

  const troubleshootingQ = {
    slug: 'sys-troubleshoot-db-pool',
    track: 'SYSTEM_TROUBLESHOOTING' as const
  };
  const sysSection = syntheticPlaygroundSection(troubleshootingQ);
  assert.equal(sysSection.sectionType, 'SYSTEM_DESIGN');
  assert.equal(sysSection.track, 'SYSTEM_TROUBLESHOOTING');

  const plan = syntheticPlaygroundPlan(agenticQ);
  const navSections = buildNavSections(plan.sections, agenticQ.track);
  assert.equal(navSections.length, 1);
  assert.equal(navSections[0].stage, 'LLD');

  assert.equal(resolveSectionType({ track: 'AGENTIC_ENGINEERING', isPlayground: true }), 'LLD');
});
