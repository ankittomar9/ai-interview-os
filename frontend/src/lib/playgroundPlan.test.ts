import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNavSections } from './plan-navigation';
import { syntheticPlaygroundSection, syntheticPlaygroundPlan } from './playgroundPlan';

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
