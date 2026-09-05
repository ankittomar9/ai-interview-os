import test from 'node:test';
import assert from 'node:assert/strict';

test('sectionQuestions isolates questions per round without cross-round bleed', () => {
  const dsaQ = { title: 'Two Sum', track: 'ALGORITHMS_DATA_STRUCTURES', difficulty: 'MID' };
  const lldQ = { title: 'Design Parking Lot', track: 'SPRING_LLD', difficulty: 'MID' };

  const sectionQuestions = [[dsaQ], [lldQ], []];

  // Round 0: DSA
  assert.equal(sectionQuestions[0][0].title, 'Two Sum');

  // Round 1: LLD
  assert.equal(sectionQuestions[1][0].title, 'Design Parking Lot');
  assert.notEqual(sectionQuestions[1][0].title, sectionQuestions[0][0].title);

  // Round 2: Empty section does not bleed from Round 0
  const round2Questions = sectionQuestions[2] || [];
  assert.equal(round2Questions.length, 0);
  assert.ok(!round2Questions.some((q) => q.title === 'Two Sum'));
});
