import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mapQuestionDifficultyToSeniority } from './difficulty';

describe('Hotfix 1: Difficulty Taxonomy Mapping Utility', () => {
  it('maps question catalog difficulties to candidate seniority levels', () => {
    assert.equal(mapQuestionDifficultyToSeniority('EASY'), 'JUNIOR');
    assert.equal(mapQuestionDifficultyToSeniority('MEDIUM'), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority('HARD'), 'SENIOR');
  });

  it('handles lowercase, mixed case, and surrounding whitespace', () => {
    assert.equal(mapQuestionDifficultyToSeniority('easy'), 'JUNIOR');
    assert.equal(mapQuestionDifficultyToSeniority('  Easy  '), 'JUNIOR');
    assert.equal(mapQuestionDifficultyToSeniority('medium'), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority('  Medium '), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority('hard'), 'SENIOR');
    assert.equal(mapQuestionDifficultyToSeniority(' HARD '), 'SENIOR');
  });

  it('preserves existing candidate seniority levels', () => {
    assert.equal(mapQuestionDifficultyToSeniority('JUNIOR'), 'JUNIOR');
    assert.equal(mapQuestionDifficultyToSeniority('MID'), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority('SENIOR'), 'SENIOR');
    assert.equal(mapQuestionDifficultyToSeniority('STAFF'), 'STAFF');
  });

  it('safely defaults to MID for undefined, null, empty, or unknown strings', () => {
    assert.equal(mapQuestionDifficultyToSeniority(undefined), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority(null), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority(''), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority('   '), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority('UNKNOWN_LEVEL'), 'MID');
    assert.equal(mapQuestionDifficultyToSeniority('EXTREME'), 'MID');
  });
});
