import test from 'node:test';
import assert from 'node:assert/strict';
import { getVerdictChipDescriptor } from './verdictChips';

test('F4/Gate VP-7: getVerdictChipDescriptor maps canonical verdict taxonomy', () => {
  // PASSED -> green PASSED
  const passed = getVerdictChipDescriptor('PASSED');
  assert.equal(passed.label, 'PASSED');
  assert.match(passed.className, /text-success/);

  // PARTIAL -> amber PARTIAL
  const partial = getVerdictChipDescriptor('PARTIAL');
  assert.equal(partial.label, 'PARTIAL');
  assert.match(partial.className, /text-amber-400/);

  // TIME_LIMIT_EXCEEDED -> amber TLE
  const tle = getVerdictChipDescriptor('TIME_LIMIT_EXCEEDED');
  assert.equal(tle.label, 'TLE');
  assert.match(tle.className, /text-amber-400/);

  // MEMORY_LIMIT_EXCEEDED -> amber MLE
  const mle = getVerdictChipDescriptor('MEMORY_LIMIT_EXCEEDED');
  assert.equal(mle.label, 'MLE');
  assert.match(mle.className, /text-amber-400/);

  // COMPILE_ERROR -> red COMPILE ERROR
  const compileError = getVerdictChipDescriptor('COMPILE_ERROR');
  assert.equal(compileError.label, 'COMPILE ERROR');
  assert.match(compileError.className, /text-danger/);

  // RUNTIME_ERROR -> red RUNTIME ERROR
  const runtimeError = getVerdictChipDescriptor('RUNTIME_ERROR');
  assert.equal(runtimeError.label, 'RUNTIME ERROR');
  assert.match(runtimeError.className, /text-danger/);

  // WRONG_ANSWER -> red WRONG ANSWER
  const wrongAnswer = getVerdictChipDescriptor('WRONG_ANSWER');
  assert.equal(wrongAnswer.label, 'WRONG ANSWER');
  assert.match(wrongAnswer.className, /text-danger/);

  // FAILED -> red FAILED
  const failed = getVerdictChipDescriptor('FAILED');
  assert.equal(failed.label, 'FAILED');
  assert.match(failed.className, /text-danger/);

  // UNATTEMPTED -> neutral UNATTEMPTED
  const unattempted = getVerdictChipDescriptor('UNATTEMPTED');
  assert.equal(unattempted.label, 'UNATTEMPTED');
  assert.match(unattempted.className, /text-text-3/);

  // Null/empty -> neutral em-dash
  const empty = getVerdictChipDescriptor(null);
  assert.equal(empty.label, '—');
  assert.match(empty.className, /text-text-3/);

  // Unknown string -> neutral with raw verbatim text
  const unknown = getVerdictChipDescriptor('CUSTOM_ENGINE_CRASH');
  assert.equal(unknown.label, 'CUSTOM_ENGINE_CRASH');
  assert.match(unknown.className, /text-text-3/);
  assert.match(unknown.className, /font-mono/);
});

test('F4/Gate VP-7: getVerdictChipDescriptor handles whitespace, lowercase and variations', () => {
  const passedLower = getVerdictChipDescriptor('  passed  ');
  assert.equal(passedLower.label, 'PASSED');
  assert.match(passedLower.className, /text-success/);

  const tleLower = getVerdictChipDescriptor('time_limit_exceeded');
  assert.equal(tleLower.label, 'TLE');
  assert.match(tleLower.className, /text-amber-400/);

  const emptyWhitespace = getVerdictChipDescriptor('   ');
  assert.equal(emptyWhitespace.label, '—');
});
