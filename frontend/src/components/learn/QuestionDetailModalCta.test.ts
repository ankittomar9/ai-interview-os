import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('SPEC-009 VP-2: QuestionDetailModal CTA Deduplication', () => {
  const modalPath = path.resolve(process.cwd(), 'src/components/learn/QuestionDetailModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf-8');

  it('contains exactly two onSolve(slug) call sites (footer and locked-state)', () => {
    const matches = content.match(/onSolve\(slug\)/g);
    assert.ok(matches, 'onSolve(slug) must be present in QuestionDetailModal');
    assert.strictEqual(
      matches.length,
      2,
      `Expected exactly 2 onSolve(slug) call sites, found ${matches.length}`
    );
  });

  it('does NOT contain header Solve button', () => {
    // Header section before Navigation Tabs must not contain a Solve button
    const headerSlice = content.substring(0, content.indexOf('Navigation Tabs'));
    assert.strictEqual(
      headerSlice.includes('onSolve(slug)'),
      false,
      'Header must not contain onSolve(slug) call site'
    );
    assert.strictEqual(
      headerSlice.includes('>Solve<'),
      false,
      'Header must not render a Solve button text'
    );
  });

  it('retains footer Solve in Playground CTA', () => {
    const footerSlice = content.substring(content.lastIndexOf('Footer'));
    assert.ok(
      footerSlice.includes('onSolve(slug)'),
      'Footer must contain onSolve(slug) call site'
    );
    assert.ok(
      footerSlice.includes('Solve in Playground'),
      'Footer must display "Solve in Playground" label'
    );
  });

  it('retains locked-state solution gating CTA', () => {
    assert.ok(
      content.includes('Solve in Playground First'),
      'Locked solution state must retain "Solve in Playground First" CTA'
    );
  });
});
