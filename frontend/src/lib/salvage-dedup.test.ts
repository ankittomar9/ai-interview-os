import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSalvageText } from './salvage-dedup.ts';

test('A1: Deduplicates identical pending and interim fragments', () => {
  const result = mergeSalvageText('Quoted many applications.', 'Quoted many applications.');
  assert.equal(result, 'Quoted many applications.');
});

test('A1: Deduplicates identical pending and interim with casing differences', () => {
  const result = mergeSalvageText('quoted many applications', 'Quoted many applications');
  assert.equal(result, 'quoted many applications');
});

test('A1: Merges disjoint pending and interim fragments losslessly', () => {
  const result = mergeSalvageText('I managed pipelines', ' using TIBCO');
  assert.equal(result, 'I managed pipelines using TIBCO');
});

test('A1: Deduplicates overlapping boundary words', () => {
  const result = mergeSalvageText('I managed pipelines using', 'using TIBCO technology');
  assert.equal(result, 'I managed pipelines using TIBCO technology');
});

test('A1: Handles pending ending with interim', () => {
  const result = mergeSalvageText('Quoted many applications in production.', 'applications in production.');
  assert.equal(result, 'Quoted many applications in production.');
});

test('A1: Handles interim starting with pending', () => {
  const result = mergeSalvageText('I managed', 'I managed pipelines using TIBCO');
  assert.equal(result, 'I managed pipelines using TIBCO');
});

test('A1: Handles empty pending or interim', () => {
  assert.equal(mergeSalvageText('', 'using TIBCO'), 'using TIBCO');
  assert.equal(mergeSalvageText('I managed pipelines', ''), 'I managed pipelines');
  assert.equal(mergeSalvageText('', ''), '');
});
