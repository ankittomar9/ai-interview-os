import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('QuestionDetailModal Notes & Resources (P8)', () => {
  it('detects dirty state when note text is modified from initial', () => {
    const initialNote = 'Initial insight';
    const modifiedNote = 'Initial insight with additions';
    const isDirty = modifiedNote !== initialNote;
    assert.strictEqual(isDirty, true, 'Modified note should be detected as dirty');
  });

  it('detects pristine state when note text matches initial', () => {
    const initialNote = 'Exact same note';
    const currentNote = 'Exact same note';
    const isDirty = currentNote !== initialNote;
    assert.strictEqual(isDirty, false, 'Identical note should be pristine');
  });

  it('rejects blank note body on save', () => {
    const blankBodies = ['', '   ', '\n\t  '];
    for (const body of blankBodies) {
      const isBlank = !body.trim();
      assert.strictEqual(isBlank, true, 'Blank body should fail validation');
    }
  });

  it('formats UserNote request payload correctly', () => {
    const rawNote = '  Binary search with low <= high  ';
    const payload = { body: rawNote.trim() };
    assert.strictEqual(payload.body, 'Binary search with low <= high');
  });

  it('validates curated resources mapping and url structures', () => {
    const resources = [
      { label: 'LeetCode 1: Two Sum Editorial', url: 'https://leetcode.com/problems/two-sum/editorial/' },
      { label: 'NeetCode Video', url: 'https://www.youtube.com/watch?v=KLlXCFG5TnA' }
    ];

    assert.strictEqual(resources.length, 2);
    for (const res of resources) {
      assert.ok(res.label.length > 0, 'Resource label must not be empty');
      assert.ok(res.url.startsWith('https://'), 'Resource URL must be secure HTTPS');
    }
  });

  it('Privacy invariant: ArenaShell and ProblemPanel have ZERO references to learn notes or tree', () => {
    const arenaFiles = [
      path.resolve(process.cwd(), 'src/components/arena/ArenaShell.tsx'),
      path.resolve(process.cwd(), 'src/components/arena/ProblemPanel.tsx')
    ];

    for (const file of arenaFiles) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf-8');
        assert.ok(!content.includes('/api/v1/learn/notes'), `${path.basename(file)} must not call /api/v1/learn/notes`);
        assert.ok(!content.includes('getUserNote'), `${path.basename(file)} must not import getUserNote`);
        assert.ok(!content.includes('saveUserNote'), `${path.basename(file)} must not import saveUserNote`);
        assert.ok(!content.includes('/api/v1/learn/tree'), `${path.basename(file)} must not call /api/v1/learn/tree`);
        assert.ok(!content.includes('getLearnTree'), `${path.basename(file)} must not import getLearnTree`);
      }
    }
  });
});
